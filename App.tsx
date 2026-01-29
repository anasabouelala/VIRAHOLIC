
import React, { useState, useEffect } from 'react';
import { AnalysisResult, AnalysisState, BusinessInfo } from './types';
import BusinessForm from './components/BusinessForm';
import Dashboard from './components/Dashboard';
import AuthGate from './components/AuthGate';
import { analyzeBusinessVisibility } from './services/geminiService';
import { SparklesIcon } from './components/Icons';
import { auth, onAuthStateChanged, logOut, User } from './services/firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });

  const [businessName, setBusinessName] = useState<string>('');
  const [pendingAnalysis, setPendingAnalysis] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const runAnalysis = async (info: BusinessInfo) => {
    setState({ loading: true, error: null, result: null });
    setBusinessName(info.name);
    
    try {
      const result = await analyzeBusinessVisibility(info);
      setState({ loading: false, error: null, result });
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
      setState({ loading: false, error: errorMessage, result: null });
    }
  };

  const handleAnalysisRequest = async (info: BusinessInfo) => {
    if (!user) {
      setPendingAnalysis(info);
      setShowAuthModal(true);
    } else {
      runAnalysis(info);
    }
  };

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    if (pendingAnalysis) {
      runAnalysis(pendingAnalysis);
      setPendingAnalysis(null);
    }
  };

  const handleReset = () => {
    setState({ loading: false, error: null, result: null });
    setBusinessName('');
  };

  const handleLogout = async () => {
    await logOut();
    handleReset();
  };

  if (!authInitialized) {
      return (
          <div className="min-h-screen bg-background flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>
      
      {/* Subtle ambient light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white opacity-[0.03] blur-[120px] pointer-events-none z-0"></div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthGate 
            onLoginSuccess={handleLoginSuccess} 
            onCancel={() => setShowAuthModal(false)} 
        />
      )}

      {/* Navigation */}
      <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3" onClick={handleReset} role="button">
              <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
                 <SparklesIcon className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">LocalPulse</span>
            </div>
            <div className="flex items-center gap-4">
               {user ? (
                   <div className="flex items-center gap-3">
                       <div className="hidden sm:flex flex-col items-end">
                           <span className="text-xs font-bold text-zinc-200">{user.displayName}</span>
                           <span className="text-[10px] text-zinc-500 font-mono">PRO MEMBER</span>
                       </div>
                       <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-zinc-700" />
                       <button 
                            onClick={handleLogout}
                            className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-white transition-colors ml-2"
                        >
                            Log Out
                       </button>
                   </div>
               ) : (
                   <button 
                        onClick={() => setShowAuthModal(true)}
                        className="text-xs font-bold text-zinc-300 hover:text-white transition-colors border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 rounded"
                    >
                        LOGIN
                   </button>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Error Message */}
          {state.error && (
            <div className="mb-8 bg-red-950/30 border border-red-900/50 p-4 rounded-lg max-w-2xl mx-auto backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <p className="text-sm text-red-200 font-mono">
                  ERROR: {state.error}
                </p>
              </div>
            </div>
          )}

          {/* Views */}
          {!state.result ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
               <div className="text-center mb-12 max-w-3xl">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-zinc-400 font-medium tracking-wide">AI VISIBILITY ENGINE</span>
                 </div>
                 <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
                   Master your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-white">AI footprint.</span>
                 </h1>
                 <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed font-light">
                   The new SEO is GEO (Generative Engine Optimization). <br/>
                   Analyze how ChatGPT, Gemini, and Perplexity perceive your business.
                 </p>
               </div>
               <BusinessForm onSubmit={handleAnalysisRequest} isLoading={state.loading} />
            </div>
          ) : (
            <Dashboard 
              data={state.result} 
              businessName={businessName} 
              onReset={handleReset} 
            />
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto relative z-10 bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-xs font-mono">
             LOCALPULSE AI © {new Date().getFullYear()}
          </p>
          <div className="flex gap-6 text-xs text-zinc-600">
             <span>POWERED BY GEMINI PRO</span>
             <span>PRIVACY</span>
             <span>TERMS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
