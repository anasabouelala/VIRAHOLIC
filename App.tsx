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
import { saveAudit, getProjects, createProject, updateProject, deleteProject, getUserUsage, incrementAuditUsage, incrementSimulationUsage } from './services/supabaseService';
import AuthModal from './components/AuthModal';
import PlanSelection from './components/PlanSelection';
import PaywallOverlay from './components/PaywallOverlay';

import StaticPage from './components/StaticPage';
import Sidebar from './components/Sidebar';
import SupportModal from './components/SupportModal';
import NewProjectModal from './components/NewProjectModal';

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
  const [totalAudits, setTotalAudits] = useState(0);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [auditCache, setAuditCache] = useState<Record<string, { result: AnalysisResult, businessName: string }>>({});
  const [isRestoringProject, setIsRestoringProject] = useState(false);

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
        // Redirect authenticated users straight to their dashboard
        if (window.location.pathname === '/' || window.location.pathname === '') {
          navigate('/dashboard');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        fetchProfile(session.user.id);
        loadProjects(session.user.id);

        // Check if user is unpaid, and immediately prompt plan selection if so
        if (event === 'SIGNED_IN' && data && !data.geo_score) {
             setShowPlanSelection(true);
        }

        // On sign-in or sign-up events, always go to dashboard
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          navigate('/dashboard');
        }
      } else {
        setProjects([]);
        setCurrentProject(null);
        setUserProfile(null);
        navigate('/');
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
    const usage = await getUserUsage(userId);
    if (data) {
        setUserProfile({ 
            ...data, 
            audits_consumed: usage.audits_used, 
            simulations_consumed: usage.simulations_used,
            subscription_started_at: usage.started_at
        });
    }
  };

  const loadProjects = async (userId: string, allowAutoCreate: boolean = true) => {
    let data = await getProjects(userId);
    
    // Auto-migrate landing page audits to the user's account by building a default project for them
    // ONLY if we're allowed to and it's not a deletion cleanup
    if (allowAutoCreate && data.length === 0 && latestResult.current && latestBusinessName.current) {
      const { data: newProject, success } = await createProject(userId, latestBusinessName.current, latestBusinessName.current);
      if (success && newProject) {
          console.log("Persistence: Auto-migrating guest audit to new project...");
          await saveAudit(userId, latestBusinessName.current, latestResult.current.overallScore || 0, latestResult.current, newProject.id);
          data = [newProject];
          // Update cache immediately
          setAuditCache(prev => ({ ...prev, [newProject.id]: { result: latestResult.current, businessName: latestBusinessName.current } }));
      }
    }

    setProjects(data);
    
    // 3. Inform usage
    const usage = await getUserUsage(userId);
    setTotalAudits(usage.audits_used);
    if (userProfile) {
        setUserProfile({ ...userProfile, audits_consumed: usage.audits_used, simulations_consumed: usage.simulations_used });
    }

    // 4. Persistence: Restore the last worked-on project if it exists
    const lastProjectId = localStorage.getItem('aeoholic_last_project_id');
    const restoredProject = data.find(p => p.id === lastProjectId);
    
    if (restoredProject) {
        setCurrentProject(restoredProject);
    } else if (data.length > 0 && !currentProject) {
        setCurrentProject(data[0]);
        localStorage.setItem('aeoholic_last_project_id', data[0].id);
    }
  };

  useEffect(() => {
    const fetchLatestAudit = async () => {
      // 1. PROJECT GUARD: If we are already ANALYZING (loading is true), 
      // do NOT let a background project-switch check interrupt the scan.
      if (state.loading && !state.result) {
          console.log("Persistence: Scan in progress, skipping background sync.");
          return;
      }

      // 2. Basic safety checks - Ensure we have both project and user
      if (!currentProject?.id || !session?.user?.id) {
          console.log("Persistence: Missing Project ID or User Session, skipping fetch.");
          return;
      }
      
      console.log(`Persistence: Loading project [${currentProject.id}]...`);

      // 2. Performance Check: Memory Cache (Instant Transition)
      if (auditCache[currentProject.id]) {
        const cached = auditCache[currentProject.id];
        setState({ loading: false, error: null, result: cached.result });
        setBusinessName(cached.businessName);
        console.log(`Persistence: Cache HIT for [${currentProject.id}]`);
      } else {
        // Only show loading if we don't have it in cache
        setIsRestoringProject(true);
      }

      try {
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('project_id', currentProject.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); 
          
        if (error) {
            console.error(`Persistence DB Error:`, error);
            throw error;
        }

        if (data && data.report_data) {
          console.log(`Persistence: Data FOUND for [${currentProject.id}]`);
          const freshResult = { result: data.report_data, businessName: data.business_name };
          setState({ loading: false, error: null, result: data.report_data });
          setBusinessName(data.business_name);
          setAuditCache(prev => ({ ...prev, [currentProject.id]: freshResult }));
        } else {
          console.log(`Persistence: NO audit recorded for [${currentProject.id}]`);
          
          if (auditCache[currentProject.id]) {
            const cached = auditCache[currentProject.id];
            setState({ loading: false, error: null, result: cached.result });
          } else {
              // CRITICAL: ONLY reset loading to false if we weren't ALREADY in the middle of a scan
              // This prevents the background fetch from 'stealing' the loading state from runAnalysis
              setState(prev => {
                  if (prev.loading && !prev.result) return prev; // Keep loading if a scan is active
                  return { ...prev, loading: false, result: null };
              });
          }

          const defaultInfo: BusinessInfo = {
            name: currentProject.business_name || currentProject.name,
            location: '',
            category: '',
            website: '',
            keywords: '',
            language: 'English'
          };
          setBusinessName(defaultInfo.name);
          setFormInfo(defaultInfo);
        }
      } catch (err: any) {
        console.error("Persistence Critical Failure:", err);
        if (!auditCache[currentProject.id]) {
            setState({ loading: false, error: "Cloud sync failed. Showing fresh scan form.", result: null });
        }
      } finally {
        setIsRestoringProject(false);
      }
    };
    
    fetchLatestAudit();
  }, [currentProject?.id, session?.user?.id]);

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('localpulse_gemini_key');
    if (storedGeminiKey) setGeminiKey(storedGeminiKey);
  }, []);

  // Teaser Logic: Trigger paywall after 6 seconds if not subscribed (Exclude Demo)
  useEffect(() => {
    const isDemo = businessName?.includes('(DEMO)');
    if (state.result && !state.loading && !isDemo && (!session || !userProfile?.geo_score)) {
      const timer = setTimeout(() => {
        if (!session || !userProfile?.geo_score) {
          setShowPaywall(true);
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [state.result, state.loading, session, userProfile, businessName]);

  const saveSettings = () => {
    localStorage.setItem('localpulse_gemini_key', geminiKey);
    setShowSettings(false);
  };

  const runAnalysis = async (info: BusinessInfo, overrideProjectId?: string) => {
    const finalProjectId = overrideProjectId || currentProject?.id;
    
    if (!finalProjectId) {
      console.error("Critical: runAnalysis called without any projectId.");
      setState({ loading: false, error: "Please select or create a project first.", result: null });
      return;
    }

    try {
      setState({ loading: true, error: null, result: null });
      setBusinessName(info.name);

      const result = await analyzeBusinessVisibility(info, geminiKey || undefined);
      setState({ loading: false, error: null, result });
      
      // If user is logged in, save the audit to the current project
      if (session?.user?.id) {
        const finalProjectId = overrideProjectId || currentProject?.id;
        if (finalProjectId) {
            setAuditCache(prev => ({ ...prev, [finalProjectId]: { result, businessName: info.name } }));
        }
        
        console.log("Saving audit to project:", finalProjectId, "for business:", info.name);
        
        // 1. Guard against missing ID during the call
        if (!session?.user?.id || !finalProjectId) {
            console.error("Critical: Missing ID before saving record. User:", session?.user?.id, "Project:", finalProjectId);
            setState(prev => ({ ...prev, error: "The audit finished but we lost the project ID. Saving to memory only." }));
            return;
        }

        const saveResult = await saveAudit(
          session.user.id,
          info.name,
          result.overallScore || 0,
          result,
          finalProjectId
        );
        
        if (!saveResult.success) {
            console.error("DATABASE SAVE FAILED:", saveResult.error);
            setState(prev => ({ ...prev, error: `Critical Save Error: ${saveResult.error?.message || "Check Console"}` }));
        } else {
            console.log("Audit saved successfully.");
            // 2. Force Sync: Mark it in cache and then immediately refetch to be 100% sure
            setAuditCache(prev => ({ ...prev, [finalProjectId]: { result, businessName: info.name } }));
            // Refresh counts and profile data
            await loadProjects(session.user.id);
        }
        // Increment usage count
        await incrementAuditUsage(session.user.id);
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
    
    // Clear the specific project from cache so the form shows up fresh
    if (currentProject?.id) {
        setAuditCache(prev => {
            const { [currentProject.id]: _, ...rest } = prev;
            return rest;
        });
    }

    // Reset business name to the project's default for the new scan
    if (currentProject) {
        const defaultInfo: BusinessInfo = {
            name: currentProject.business_name || currentProject.name,
            location: '',
            category: '',
            website: '',
            keywords: '',
            language: 'English'
        };
        setBusinessName(defaultInfo.name);
        setFormInfo(defaultInfo);
    } else {
        setBusinessName('');
    }
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
    // 1. Capture current state for rollback
    const originalProjects = projects;
    const isDeletingCurrent = currentProject?.id === projectId;

    // 2. Clear state and optimistically remove from UI
    if (isDeletingCurrent) {
        setCurrentProject(null);
        setState({ loading: false, error: null, result: null });
        setBusinessName('');
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));

    // 3. Inform database
    const { success } = await deleteProject(projectId);
    
    if (success) {
      if (session) {
        // Refresh with auto-creation disabled (already configured in loadProjects)
        await loadProjects(session.user.id, false);
      }
    } else {
      // 4. Rollback on failure
      setProjects(originalProjects);
      if (isDeletingCurrent) {
          // Re-fetch project to restore if we cleared it
          await loadProjects(session.user.id, false);
      }
      console.error('Failed to delete project from database. Rolling back UI.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
        <Routes>
            <Route path="/dashboard" element={
                !session ? <Navigate to="/" replace /> : (
                    <div className="flex bg-background min-h-screen text-zinc-100 relative w-full">
                        <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>
                        
                        <Sidebar 
                          projectName={currentProject?.name || 'My Project'}
                          brandName={currentProject?.brand_name}
                          userEmail={session?.user?.email}
                          planName={userProfile?.plan_name}
                          auditsUsed={userProfile?.audits_consumed || 0}
                          promptsUsed={userProfile?.simulations_consumed || 0}
                          onAddProject={() => setShowNewProjectModal(true)}
                          onSettings={() => setShowProjectSettingsModal(true)}
                          onUpgrade={() => setShowPlanSelection(true)}
                          onRenameProject={handleRenameProject}
                          onDeleteProject={handleDeleteProject}
                          onLogout={async () => {
                              await supabase.auth.signOut();
                              localStorage.removeItem('aeoholic_last_project_id');
                              navigate('/', { replace: true });
                          }}
                          projects={projects}
                          onSelectProject={(proj) => {
                              setCurrentProject(proj);
                              if (proj?.id) localStorage.setItem('aeoholic_last_project_id', proj.id);
                          }}
                          currentProjectId={currentProject?.id}
                        />

                        <main className="flex-grow p-8 overflow-y-auto relative z-10 h-screen">
                          <div className="max-w-7xl mx-auto pb-20">
                            {isRestoringProject ? (
                                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Restoring Environment</h3>
                                    <p className="text-zinc-500 text-sm">Loading your saved AI audit data...</p>
                                </div>
                            ) : state.loading ? (
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
                                          onIncrementSimulation={async () => {
                                              if (session?.user?.id) {
                                                  await incrementSimulationUsage(session.user.id);
                                                  const usage = await getUserUsage(session.user.id);
                                                  setUserProfile(prev => ({ ...prev, simulations_consumed: usage.simulations_used }));
                                              }
                                          }}
                                        />
                                    </div>
                                </div>
                              </ErrorBoundary>
                            ) : !currentProject && projects.length === 0 ? (
                                <div className="text-center py-20 px-4 animate-fade-in">
                                    <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(16,185,129,0.15)] group hover:scale-105 transition-all duration-500">
                                        <SparklesIcon className="w-12 h-12 text-emerald-500 group-hover:rotate-12 transition-transform" />
                                    </div>
                                    <h2 className="text-5xl font-display font-bold text-white mb-6 tracking-tight">Ready for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">first deep-agent audit?</span></h2>
                                    <p className="text-zinc-400 max-w-xl mx-auto text-xl mb-12 leading-relaxed">Your project suite is currently empty. Create your first diagnostic environment to start mapping AI visibility for any local business.</p>
                                    
                                    <button 
                                      onClick={() => setShowNewProjectModal(true)}
                                      className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95"
                                    >
                                        Create Your First Project
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up">
                                    {state.error && (
                                        <div className="w-full max-w-2xl bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 text-center animate-fade-in shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <AlertCircleIcon className="w-5 h-5 text-rose-500" />
                                                <h3 className="text-rose-500 font-bold uppercase tracking-widest text-sm">Audit System Error</h3>
                                            </div>
                                            <p className="text-zinc-400 text-sm font-medium">{state.error}</p>
                                        </div>
                                    )}
                                    <div className="text-center mb-12">
                                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                            <SparklesIcon className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Active Project: {currentProject?.name}</h2>
                                        <p className="text-zinc-500 max-w-md mx-auto text-lg">Your diagnostic environment is ready. Initialize the 12-agent research pipeline for <span className="text-white font-bold">{currentProject?.business_name || 'this business'}</span> to see local performance.</p>
                                    </div>
                                    
                                    <div className="w-full max-w-xl">
                                      <BusinessForm 
                                          onSubmit={(info) => {
                                              if (currentProject?.id) {
                                                  runAnalysis(info, currentProject.id);
                                                  navigate('/dashboard');
                                              } else {
                                                  setState({ loading: false, error: "Please select a project before starting an audit.", result: null });
                                              }
                                          }} 
                                          onDemo={handleDemoRequest} 
                                          isLoading={state.loading} 
                                          initialInfo={formInfo}
                                          onInfoChange={setFormInfo}
                                      />
                                    </div>
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
                                localStorage.setItem('aeoholic_last_project_id', data.id);
                                setCurrentProject(data);
                                loadProjects(session.user.id);
                                runAnalysis(info, data.id);
                            }
                          }}
                          isLoading={state.loading}
                        />

                        <SupportModal 
                            isOpen={showProjectSettingsModal}
                            onClose={() => setShowProjectSettingsModal(false)}
                            userEmail={session?.user?.email || 'contact@aeoholic.com'}
                            userId={session?.user?.id}
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
                                onAction={() => session ? setShowPlanSelection(true) : setShowAuthModal(true)}
                                isLoggedIn={!!session}
                            />
                        )}
                    </div>
                )
            } />
            <Route path="*" element={
                <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
                    {/* Background Grid */}
                    <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>

                    {/* Subtle ambient light */}
                    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white opacity-[0.03] blur-[120px] pointer-events-none z-0"></div>

                    {/* Navigation */}
                    <nav aria-label="Main navigation" className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40" itemScope itemType="https://schema.org/Organization">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between h-16">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { handleReset(); navigate('/'); }} role="button" aria-label="AEOHOLIC Home">
                                    <span itemProp="name" className="font-display font-bold text-lg tracking-tight text-white">AEOHOLIC</span>
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

                    <main role="main" className="flex-grow py-8 px-4 sm:px-6 lg:px-8 relative z-10">
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
                                <Route path="/privacy" element={<StaticPage title="Privacy Policy" onBack={() => navigate('/')}><hgroup><h3 className="text-white text-lg font-bold italic tracking-tight uppercase">1. Data Sovereignty</h3></hgroup><p>We believe your audit data should remain yours...</p></StaticPage>} />
                                <Route path="/terms" element={<StaticPage title="Terms of Service" onBack={() => navigate('/')}><hgroup><h3 className="text-white text-lg font-bold italic tracking-tight uppercase">1. Intent and Usage</h3></hgroup><p>AEOHOLIC is a diagnostic suite for SMEs...</p></StaticPage>} />
                                <Route path="/" element={
                                    state.loading ? <LoadingScreen /> : !state.result ? (
                                        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
                                            <header className="text-center mb-10 max-w-5xl px-4 mx-auto">
                                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-8 sm:mb-12 tracking-[-0.02em] leading-[1.1] py-2 px-6">The most complete <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500">AEO/GEO audits</span> <br className="hidden sm:block" />for Local Businesses.</h1>
                                                <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium tracking-tight opacity-90 px-2 sm:px-0">Scale with <span className="text-white font-black underline decoration-emerald-500/30">12 AI Agents</span> built for specialists.</p>
                                            </header>
                                            <section aria-label="Business Selection Form">
                                                <BusinessForm 
                                                    onSubmit={(info) => {
                                                        if (currentProject?.id) {
                                                            runAnalysis(info, currentProject.id);
                                                            navigate('/dashboard');
                                                        } else {
                                                            setState({ loading: false, error: "Please select a project before starting an audit.", result: null });
                                                        }
                                                    }} 
                                                    onDemo={handleDemoRequest} 
                                                    isLoading={state.loading} 
                                                    initialInfo={formInfo}
                                                    onInfoChange={setFormInfo}
                                                />
                                            </section>
                                            <div className="w-full mt-4 pt-8 border-t border-border/10"><FeaturesSection /></div>
                                            <div className="w-full"><ComparisonSection /></div>
                                            <div className="w-full"><PricingSection onSelectPlan={() => session ? setShowPlanSelection(true) : setShowAuthModal(true)} /></div>
                                            <div className="w-full"><FAQSection /></div>
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

                    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {
                        setShowAuthModal(false);
                        if (userProfile?.geo_score) {
                            setShowPaywall(false);
                        } else {
                            setShowPlanSelection(true);
                        }
                        navigate('/dashboard');
                    }} />
                    
                    {showPlanSelection && (
                        <PlanSelection 
                            userId={session?.user?.id} 
                            onClose={() => setShowPlanSelection(false)} 
                            onSuccess={async () => { await fetchProfile(session.user.id); setShowPlanSelection(false); setShowPaywall(false); }} 
                        />
                    )}

                    <footer aria-label="Site footer" className="border-t border-border mt-auto relative z-10 bg-background py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                            <span className="font-display font-black text-2xl tracking-tighter text-emerald-500">AEOHOLIC<span className="text-white">.com</span></span>
                             <div className="flex flex-wrap justify-center gap-10 text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">
                                <a href="mailto:contact@aeoholic.com" className="hover:text-emerald-400 decoration-emerald-500/20 hover:underline underline-offset-4">contact@aeoholic.com</a>
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
