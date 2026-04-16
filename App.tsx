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
import MobileDashboard from './components/MobileDashboard';

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
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalAudits, setTotalAudits] = useState(0);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [auditCache, setAuditCache] = useState<Record<string, { result: AnalysisResult, businessName: string }>>({});
  const [auditProjectIds, setAuditProjectIds] = useState<string[]>([]);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        loadProjects(session.user.id);
        // On sign-in or sign-up events, always go to dashboard
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          navigate('/dashboard');
        }
      } else {
        setProjects([]);
        setCurrentProject(null);
        setUserProfile(null);
        setAuditProjectIds([]);
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
        // Update cache and status dots immediately
        setAuditCache(prev => ({ ...prev, [newProject.id]: { result: latestResult.current, businessName: latestBusinessName.current } }));
        setAuditProjectIds([newProject.id]);
      }
    }

    setProjects(data);

    // SMARTER PROJECT AUDIT MAPPING (Non-Hidden)
    // We fetch which projects have audits to show the status dots in Sidebar
    if (data.length > 0) {
      const { data: auditsFound } = await supabase.from('audits')
        .select('project_id')
        .in('project_id', data.map(p => p.id));

      if (auditsFound) {
        setAuditProjectIds(auditsFound.map(a => a.project_id));
      }

      // Standard Selection: Restore last or default to first
      if (!currentProject) {
        const lastUsedId = localStorage.getItem('aeoholic_last_project_id');
        const lastProj = data.find(p => p.id === lastUsedId);
        setCurrentProject(lastProj || data[0]);
      }
    }
  };

  useEffect(() => {
    let pollTimer: any;

    const fetchLatestAudit = async () => {
      // 1. PROJECT GUARD: Basic safety checks
      if (!currentProject?.id || !session?.user?.id) return;

      console.log(`Persistence: Syncing project status [${currentProject.name}]...`);

      // 2. Memory Cache (Instant Transition for completed audits)
      if (auditCache[currentProject.id]) {
        const cached = auditCache[currentProject.id];
        setState({ loading: false, error: null, result: cached.result });
        setBusinessName(cached.businessName);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('project_id', currentProject.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (data.status === 'completed' && data.report_data) {
            // FINISHED: Show results
            const freshResult = { result: data.report_data, businessName: data.business_name };
            setState({ loading: false, error: null, result: data.report_data });
            setBusinessName(data.business_name);
            setAuditCache(prev => ({ ...prev, [currentProject.id]: freshResult }));
          } else if (data.status === 'running' || data.status === 'pending') {
            // IN PROGRESS: Keep polling every 2 seconds
            setState({ loading: true, error: null, result: null });
            setBusinessName(data.business_name);
            pollTimer = setTimeout(fetchLatestAudit, 2000);
          } else if (data.status === 'failed') {
            // FAILED: Show error
            setState({ loading: false, error: data.error_message || "Audit failed on server.", result: null });
          }
        } else {
          // EMPTY: Show form
          setState(prev => ({ ...prev, loading: false, result: null }));
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
        console.error("Persistence Sync Failure:", err);
        setState({ loading: false, error: "Sync failed.", result: null });
      }
    };

    fetchLatestAudit();
    return () => { if (pollTimer) clearTimeout(pollTimer); };
  }, [currentProject?.id, session?.user?.id]);

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('localpulse_gemini_key');
    if (storedGeminiKey) setGeminiKey(storedGeminiKey);
  }, []);

  // Teaser Logic: 6 Seconds for Guests -> Blur + Auth
  useEffect(() => {
    const isDemo = businessName?.includes('(DEMO)');
    if (state.result && !state.loading && !isDemo) {
      if (!session) {
        // Guest Teaser Flow: 6 Seconds then Blur and show Auth
        const timer = setTimeout(() => {
          setShowPaywall(true); // Triggers Blur
          setShowAuthModal(true); // Forces Login
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.result, state.loading, session, businessName]);

  // Dashboard Auto-Pricing Pop-up (Every time if no plan)
  useEffect(() => {
    if (session && location.pathname === '/dashboard' && userProfile && !userProfile.geo_score) {
      setShowPaywall(true);
      setShowPlanSelection(true);
    }
  }, [session, location.pathname, userProfile]);

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

      const finalProjectId = overrideProjectId || currentProject?.id;

      if (!session?.access_token) {
        throw new Error("User must be logged in for background audits.");
      }

      // 1. PROJECT GUARD: Mark as pending immediately for background tracking
      if (finalProjectId) {
        console.log("Persistence: Initializing background scan for project:", finalProjectId);
        await saveAudit(session.user.id, info.name, 0, {} as any, finalProjectId, 'pending');

        // 2. TRIGGER SERVER-SIDE CLOUD SCAN (The 12 Agents move to the server)
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-audit`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            projectId: finalProjectId,
            businessInfo: info,
            userId: session.user.id
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Edge Function failed to start.");
        }

        // 3. DONE: The client can now just wait and poll! 
        // fetchLatestAudit (which is polling) will take over automatically.
        console.log("Cloud scan triggered successfully. Polling is active.");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
      setState({ loading: false, error: errorMessage, result: null });
    }
  };

  const runGuestAnalysis = async (info: BusinessInfo) => {
    try {
      setState({ loading: true, error: null, result: null });
      setBusinessName(info.name);

      const result = await analyzeBusinessVisibility(info, geminiKey || undefined);
      setState({ loading: false, error: null, result });

    } catch (err: any) {
      setState({ loading: false, error: err.message, result: null });
    }
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
            <MobileDashboard
              session={session}
              currentProject={currentProject}
              projects={projects}
              userProfile={userProfile}
              auditProjectIds={auditProjectIds}
              state={state}
              businessName={businessName}
              showPaywall={showPaywall}
              showPlanSelection={showPlanSelection}
              showNewProjectModal={showNewProjectModal}
              showProjectSettingsModal={showProjectSettingsModal}
              geminiKey={geminiKey}
              formInfo={formInfo}
              modalFormInfo={modalFormInfo}
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
              onSelectProject={(proj: any) => {
                setCurrentProject(proj);
                if (proj?.id) localStorage.setItem('aeoholic_last_project_id', proj.id);
              }}
              onClosePlanSelection={() => setShowPlanSelection(false)}
              onPlanSuccess={async () => {
                await fetchProfile(session.user.id);
                setShowPlanSelection(false);
                setShowPaywall(false);
              }}
              onCloseNewProject={() => setShowNewProjectModal(false)}
              onSubmitNewProject={async (info: any) => {
                setShowNewProjectModal(false);
                const { data, success } = await createProject(session.user.id, info.name);
                if (success) {
                  setCurrentProject(data);
                  loadProjects(session.user.id);
                  runAnalysis(info, data.id);
                }
              }}
              onCloseSettings={() => setShowProjectSettingsModal(false)}
              onFormInfoChange={setFormInfo}
              onModalFormInfoChange={setModalFormInfo}
              onReset={handleReset}
              onRunAnalysis={runAnalysis}
              onDemo={handleDemoRequest}
              onIncrementSimulation={async () => {
                if (session?.user?.id) {
                  await incrementSimulationUsage(session.user.id);
                  const usage = await getUserUsage(session.user.id);
                  setUserProfile((prev: any) => ({ ...prev, simulations_consumed: usage.simulations_used }));
                }
              }}
              auditCache={auditCache}
              setState={setState}
            />
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
                          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-8 sm:mb-12 tracking-[-0.02em] leading-[1.1] py-2 px-6">The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-shadow-glow">AEO & GEO Diagnostic Tool</span> for Local Search Specialists.</h1>
                          <h2 className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto leading-relaxed font-medium tracking-tight opacity-90 px-4 mb-12">
                            Help your clients dominate <span className="text-white font-bold">Siri, ChatGPT and Gemini</span> with 9-agent workflows, daily prompt tracking and daily vocal simulations.
                          </h2>
                        </header>
                        <section aria-label="Business Selection Form" className="relative">
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full text-center">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Run Your First Client Audit Free</span>
                          </div>                                                <BusinessForm
                            onSubmit={(info) => {
                              if (session) {
                                if (currentProject?.id) {
                                  runAnalysis(info, currentProject.id);
                                  navigate('/dashboard');
                                } else {
                                  setState({ loading: false, error: "Please select a project before starting an audit.", result: null });
                                }
                              } else {
                                runGuestAnalysis(info);
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

            <AuthModal
              isOpen={showAuthModal}
              onClose={() => { setShowAuthModal(false); setPendingCheckoutUrl(null); }}
              onSuccess={async () => {
                setShowAuthModal(false);

                // Check if new user & clicked a pricing table plan
                if (pendingCheckoutUrl) {
                  const { data: { session: newSession } } = await supabase.auth.getSession();
                  if (newSession && newSession.user) {
                    const signupTime = new Date(newSession.user.created_at).getTime();
                    const now = Date.now();
                    if (now - signupTime < 6000) { // New user (<6s old)
                      const url = new URL(pendingCheckoutUrl);
                      url.searchParams.set('checkout[custom][user_id]', newSession.user.id);
                      const win = window as any;
                      if (win.LemonSqueezy) {
                        win.LemonSqueezy.Url.Open(url.toString());
                      } else {
                        window.location.href = url.toString();
                      }
                      setPendingCheckoutUrl(null);
                      return;
                    }
                  }
                  setPendingCheckoutUrl(null);
                }
                navigate('/dashboard');
              }}
            />

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
