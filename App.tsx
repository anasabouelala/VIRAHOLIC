import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, AnalysisState, BusinessInfo } from './types';
import BusinessForm from './components/BusinessForm';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { analyzeBusinessVisibility } from './services/geminiService';
import { SparklesIcon, GearIcon, AlertCircleIcon } from './components/Icons';
import FeaturesSection from './components/FeaturesSection';
import ComparisonSection from './components/ComparisonSection';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import { DEMO_DATA } from './demoData';
import { supabase } from './services/supabase';
import { saveAudit } from './services/supabaseService';
import AuthModal from './components/AuthModal';
import PlanSelection from './components/PlanSelection';
import PaywallOverlay from './components/PaywallOverlay';

import StaticPage from './components/StaticPage';
import Sidebar from './components/Sidebar';
import ProjectSettings from './components/ProjectSettings';
import NewProjectModal from './components/NewProjectModal';

import { getProjects, createProject, updateProject, deleteProject } from './services/supabaseService';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const [view, setView] = useState<'audit' | 'privacy' | 'terms'>('audit');
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });

  const [businessName, setBusinessName] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  
  // Auth & Paywall State
  const [session, setSession] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);

  const [formInfo, setFormInfo] = useState<BusinessInfo>({
    name: '',
    location: '',
    category: '',
    website: '',
    keywords: '',
    language: 'English'
  });

  const [modalFormInfo, setModalFormInfo] = useState<BusinessInfo>({
    name: '',
    location: '',
    category: '',
    website: '',
    keywords: '',
    language: 'English'
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  // Sync view state with URL
  useEffect(() => {
    if (location.pathname === '/privacy') setView('privacy');
    else if (location.pathname === '/terms') setView('terms');
    else setView('audit');
  }, [location.pathname]);

  const setViewWithUrl = (newView: 'audit' | 'privacy' | 'terms') => {
    if (newView === 'audit') navigate('/');
    else if (newView === 'privacy') navigate('/privacy');
    else if (newView === 'terms') navigate('/terms');
  };

  useEffect(() => {
    // Listen for auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        loadProjects(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        loadProjects(session.user.id);
      } else {
        setProjects([]);
        setCurrentProject(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const latestResult = useRef(state.result);
  const latestBusinessName = useRef(businessName);

  useEffect(() => {
    latestResult.current = state.result;
    latestBusinessName.current = businessName;
  }, [state.result, businessName]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
  };

  const loadProjects = async (userId: string) => {
    let data = await getProjects(userId);
    
    // Auto-migrate landing page audits to the user's account by building a default project for them
    if (data.length === 0 && latestResult.current && latestBusinessName.current) {
      const { data: newProject, success } = await createProject(userId, latestBusinessName.current, latestBusinessName.current);
      if (success && newProject) {
          data = [newProject];
      }
    }

    setProjects(data);
    if (data.length > 0 && !currentProject) {
      setCurrentProject(data[0]);
    }
  };

  useEffect(() => {
    const fetchLatestAudit = async () => {
      // Don't fetch and overwrite if we are currently running an audit
      if (!currentProject || !session || state.loading) return;
      
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
        
      if (data) {
        setState({ loading: false, error: null, result: data.report_data });
        setBusinessName(data.business_name);
      } else {
        // If we have no data in DB for this project, BUT we have an in-memory result (maybe just generated during sign-up), 
        // we should attempt to save it to THIS project before clearing anything.
        if (state.result && !state.loading && session && currentProject) {
           await saveAudit(
              session.user.id,
              businessName,
              state.result.overallScore || 0,
              state.result,
              currentProject.id
           );
           // Don't clear, we've now saved. Let the next fetch hit it.
           return;
        }

        // Only clear if we really don't have an in-memory result or we just switched projects
        setState(prev => {
          if (prev.result) return prev; 
          return { ...prev, loading: false, error: null, result: null };
        });
        setBusinessName(prev => {
          if (prev) return prev;
          return currentProject.name;
        });
      }
    };
    
    fetchLatestAudit();
  }, [currentProject?.id, session?.user?.id, state.loading]); 

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('localpulse_gemini_key');
    if (storedGeminiKey) setGeminiKey(storedGeminiKey);
  }, []);

  // Teaser Logic: Trigger paywall after 3 seconds if not subscribed
  useEffect(() => {
    if (state.result && !state.loading && (!session || !userProfile?.geo_score)) {
      const timer = setTimeout(() => {
        if (!session || !userProfile?.geo_score) {
          setShowPaywall(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.result, state.loading, session, userProfile]);

  const saveSettings = () => {
    localStorage.setItem('localpulse_gemini_key', geminiKey);
    setShowSettings(false);
  };

  const runAnalysis = async (info: BusinessInfo, overrideProjectId?: string) => {
    setState({ loading: true, error: null, result: null });
    setBusinessName(info.name);

    try {
      const result = await analyzeBusinessVisibility(info, geminiKey || undefined);
      setState({ loading: false, error: null, result });
      
      // If user is logged in, save the audit to the current project
      if (session && userProfile) {
        await saveAudit(
          session.user.id,
          info.name,
          result.overallScore || 0,
          result,
          overrideProjectId || currentProject?.id
        );
        // Refresh projects to update audit counts etc
        await loadProjects(session.user.id);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
      setState({ loading: false, error: errorMessage, result: null });
    }
  };

  const handleAnalysisRequest = async (info: BusinessInfo) => {
    // Auth check disabled
    runAnalysis(info);
  };

  const handleDemoRequest = () => {
    setBusinessName("Blue Bottle Coffee (DEMO)");
    setState({ loading: true, error: null, result: null });
    
    // Simulate a shorter but realistic 3-second scan for the demo
    setTimeout(() => {
      setState({ loading: false, error: null, result: DEMO_DATA });
    }, 3000);
  };

  const handleReset = () => {
    setState({ loading: false, error: null, result: null });
    setBusinessName('');
  };

  // Generate a dynamic social proof number based on the date
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const dynamicFoundersCount = (dayOfYear % 5) + 5; // Ranges from 5 to 9 for a boutique social proof feel

  // App UI Layout Determination
  const isAppMode = !!session;

  const handleRenameProject = async (newName: string) => {
    if (!currentProject) return;
    
    // Optimistic local update for instant UI feedback
    const originalProject = { ...currentProject };
    const originalProjects = [...projects];
    setCurrentProject({ ...currentProject, name: newName });
    setProjects(projects.map(p => p.id === currentProject.id ? { ...p, name: newName } : p));

    try {
      const { data, success } = await updateProject(currentProject.id, { name: newName });
      if (success && data) {
        setCurrentProject(data); // Sync with actual server data
        if (session) {
          await loadProjects(session.user.id);
        }
      } else {
        // Rollback on failure
        setCurrentProject(originalProject);
        setProjects(originalProjects);
        console.error('Rename failed - rolling back');
      }
    } catch (error) {
      setCurrentProject(originalProject);
      setProjects(originalProjects);
      console.error('Rename error:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const { success } = await deleteProject(projectId);
    if (success) {
      if (session) {
        await loadProjects(session.user.id);
      }
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setState({ loading: false, error: null, result: null });
        setBusinessName('');
      }
    } else {
      console.error('Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
        <Routes>
            <Route path="/dashboard" element={
                session ? (
                    <div className="flex bg-background min-h-screen text-zinc-100 relative w-full">
                        <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>
                        
                        {/* Sidebar */}
                        <Sidebar 
                          projectName={currentProject?.name || 'My Project'}
                          brandName={currentProject?.brand_name}
                          userEmail={session?.user?.email}
                          planName={userProfile?.plan_name}
                          auditsUsed={projects.length}
                          promptsUsed={0}
                          onAddProject={() => setShowNewProjectModal(true)}
                          onSettings={() => setShowProjectSettingsModal(true)}
                          onUpgrade={() => setShowPlanSelection(true)}
                          onRenameProject={handleRenameProject}
                          onDeleteProject={handleDeleteProject}
                          onLogout={() => {
                              supabase.auth.signOut();
                              navigate('/');
                          }}
                          projects={projects}
                          onSelectProject={setCurrentProject}
                          currentProjectId={currentProject?.id}
                        />

                        {/* Dashboard Content */}
                        <main className="flex-grow p-8 overflow-y-auto relative z-10 h-screen">
                          <div className="max-w-7xl mx-auto pb-20">
                            {state.loading ? (
                                <LoadingScreen />
                            ) : state.result ? (
                              <ErrorBoundary>
                                <div className="relative">
                                    <div className={`${showPaywall ? 'blur-xl select-none pointer-events-none' : ''} transition-all duration-1000`}>
                                        <Dashboard
                                          data={state.result}
                                          businessName={businessName}
                                          onReset={handleReset}
                                          geminiApiKey={geminiKey}
                                        />
                                    </div>
                                </div>
                              </ErrorBoundary>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up">
                                    {state.error && (
                                        <div className="w-full max-w-2xl bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 text-center animate-fade-in shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <AlertCircleIcon className="w-5 h-5 text-rose-500" />
                                                <h3 className="text-rose-500 font-bold uppercase tracking-widest text-sm">Audit Initialization Failed</h3>
                                            </div>
                                            <p className="text-zinc-400 text-sm font-medium">{state.error}</p>
                                        </div>
                                    )}
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <SparklesIcon className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Initialize your environment</h2>
                                        <p className="text-zinc-500 max-w-md mx-auto">Select a business to run your first 12-agent diagnostic audit and unlock the dashboard.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowNewProjectModal(true)}
                                        className="px-10 py-5 bg-emerald-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95"
                                    >
                                        Create Your First Project
                                    </button>
                                </div>
                            )}
                          </div>
                        </main>

                        <NewProjectModal 
                          isOpen={showNewProjectModal}
                          onClose={() => setShowNewProjectModal(false)}
                          initialInfo={modalFormInfo}
                          onInfoChange={setModalFormInfo}
                          onSubmit={async (info) => {
                            setShowNewProjectModal(false);
                            const { data, success } = await createProject(session.user.id, info.name);
                            if (success) {
                                setCurrentProject(data);
                                loadProjects(session.user.id);
                                runAnalysis(info, data.id); // Pass the new ID directly to avoid stale state closure
                            }
                          }}
                          isLoading={state.loading}
                        />

                        <ProjectSettings 
                            isOpen={showProjectSettingsModal}
                            onClose={() => setShowProjectSettingsModal(false)}
                            project={currentProject}
                            userEmail={session?.user?.email}
                            onUpdate={() => session && loadProjects(session.user.id)}
                        />

                        {showPlanSelection && (
                          <PlanSelection 
                            userId={session?.user?.id} 
                            onClose={() => setShowPlanSelection(false)}
                            onSuccess={async () => {
                              await fetchProfile(session.user.id);
                              setShowPlanSelection(false);
                              setShowPaywall(false);
                            }} 
                          />
                        )}

                        {showPaywall && (
                            <PaywallOverlay 
                                businessName={businessName}
                                onAction={() => setShowPlanSelection(true)}
                                isLoggedIn={!!session}
                            />
                        )}
                    </div>
                ) : <Navigate to="/" replace />
            } />
            <Route path="*" element={
                <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
                    {/* Background Grid */}
                    <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>

                    {/* Subtle ambient light */}
                    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white opacity-[0.03] blur-[120px] pointer-events-none z-0"></div>

                    {/* Navigation */}
                    <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between h-16">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { handleReset(); navigate('/'); }} role="button">
                                    <span className="font-display font-bold text-lg tracking-tight text-white">AEOHOLIC</span>
                                </div>
                                <div className="hidden md:flex items-center gap-8">
                                    {['features', 'comparison', 'pricing', 'faq'].map((item) => (
                                        <a key={item} href={`#${item}`} onClick={() => navigate('/')} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95">{item}</a>
                                    ))}
                                </div>
                                <div className="flex items-center gap-6">
                                    {session ? (
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer" onClick={() => navigate('/dashboard')}>{session.user.email}</span>
                                            <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black text-zinc-500 hover:text-rose-400 uppercase tracking-[0.3em] transition-all">Logout</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.3em] transition-all">Log In</button>
                                            <button onClick={() => setShowAuthModal(true)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-[0.2em] transition-all shadow-xl backdrop-blur-md">Sign Up</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </nav>

                    <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="max-w-7xl mx-auto">
                            {state.error && (
                                <div className="mb-8 bg-red-950/30 border border-red-900/50 p-4 rounded-lg max-w-2xl mx-auto backdrop-blur-sm animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <p className="text-sm text-red-200 font-mono">ERROR: {state.error}</p>
                                    </div>
                                </div>
                            )}

                            <Routes>
                                <Route path="/privacy" element={<StaticPage title="Privacy Policy" onBack={() => navigate('/')}><h3 className="text-white text-lg font-bold italic tracking-tight uppercase">1. Data Sovereignty</h3><p>We believe your audit data should remain yours...</p></StaticPage>} />
                                <Route path="/terms" element={<StaticPage title="Terms of Service" onBack={() => navigate('/')}><h3 className="text-white text-lg font-bold italic tracking-tight uppercase">1. Intent and Usage</h3><p>AEOHOLIC is a diagnostic suite for SMEs...</p></StaticPage>} />
                                <Route path="/" element={
                                    state.loading ? <LoadingScreen /> : !state.result ? (
                                        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
                                            <div className="text-center mb-10 max-w-5xl px-4 mx-auto">
                                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-8 sm:mb-12 tracking-[-0.02em] leading-[1.1] py-2 px-6">The most complete <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500">AEO/GEO audits</span> <br className="hidden sm:block" />for SMEs.</h1>
                                                <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium tracking-tight opacity-90 px-2 sm:px-0">Scale with <span className="text-white font-black underline decoration-emerald-500/30">12 AI Agents</span> build for especialistas.</p>
                                            </div>
                                            <BusinessForm 
                                                onSubmit={handleAnalysisRequest} 
                                                onDemo={handleDemoRequest} 
                                                isLoading={state.loading} 
                                                initialInfo={formInfo}
                                                onInfoChange={setFormInfo}
                                            />
                                            <div id="features" className="w-full mt-4 pt-8 border-t border-border/10"><FeaturesSection /></div>
                                            <div id="comparison" className="w-full"><ComparisonSection /></div>
                                            <div id="pricing" className="w-full"><PricingSection onSelectPlan={() => session ? setShowPlanSelection(true) : setShowAuthModal(true)} /></div>
                                            <div id="faq" className="w-full"><FAQSection /></div>
                                        </div>
                                    ) : (session && businessName !== "Blue Bottle Coffee (DEMO)") ? (
                                        <Navigate to="/dashboard" replace />
                                    ) : (
                                        <ErrorBoundary>
                                            <div className="relative">
                                                <div className={`${showPaywall ? 'blur-xl select-none pointer-events-none' : ''} transition-all duration-1000`}>
                                                    <Dashboard data={state.result} businessName={businessName} onReset={handleReset} geminiApiKey={geminiKey} />
                                                </div>
                                                {showPaywall && (
                                                    <PaywallOverlay 
                                                        businessName={businessName} 
                                                        onAction={() => session ? setShowPlanSelection(true) : setShowAuthModal(true)} 
                                                        isLoggedIn={!!session}
                                                    />
                                                )}
                                            </div>
                                        </ErrorBoundary>
                                    )
                                } />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </main>

                    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); if (userProfile?.geo_score) setShowPaywall(false); navigate('/dashboard'); }} />
                    
                    {showPlanSelection && (
                        <PlanSelection 
                            userId={session?.user?.id} 
                            onClose={() => setShowPlanSelection(false)} 
                            onSuccess={async () => { await fetchProfile(session.user.id); setShowPlanSelection(false); setShowPaywall(false); }} 
                        />
                    )}

                    <footer className="border-t border-border mt-auto relative z-10 bg-background py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                            <span className="font-display font-black text-2xl tracking-tighter text-emerald-500">AEOHOLIC<span className="text-white">.com</span></span>
                            <div className="flex flex-wrap justify-center gap-10 text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">
                                <button onClick={() => navigate('/privacy')} className="hover:text-emerald-400">Privacy Policy</button>
                                <button onClick={() => navigate('/terms')} className="hover:text-emerald-400">Terms of Service</button>
                                <span>© {new Date().getFullYear()} AEOHOLIC</span>
                            </div>
                        </div>
                    </footer>
                </div>
            } />
        </Routes>
    </div>
  );
};

export default App;
