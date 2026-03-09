
import React, { useState, useEffect } from 'react';
import { AnalysisResult, AnalysisState, BusinessInfo } from './types';
import BusinessForm from './components/BusinessForm';
import Dashboard from './components/Dashboard';
import { analyzeBusinessVisibility } from './services/geminiService';
import { SparklesIcon, GearIcon } from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });

  const [businessName, setBusinessName] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
      const storedOpenaiKey = localStorage.getItem('localpulse_openai_key');
      if (storedOpenaiKey) setOpenaiKey(storedOpenaiKey);

      const storedGeminiKey = localStorage.getItem('localpulse_gemini_key');
      if (storedGeminiKey) setGeminiKey(storedGeminiKey);
  }, []);

  const saveSettings = () => {
      localStorage.setItem('localpulse_openai_key', openaiKey);
      localStorage.setItem('localpulse_gemini_key', geminiKey);
      setShowSettings(false);
  };

  const runAnalysis = async (info: BusinessInfo) => {
    setState({ loading: true, error: null, result: null });
    setBusinessName(info.name);
    
    try {
      // Pass the OpenAI key and Gemini Key if available
      const result = await analyzeBusinessVisibility(info, openaiKey || undefined, geminiKey || undefined);
      setState({ loading: false, error: null, result });
    } catch (err: any) {
      const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
      setState({ loading: false, error: errorMessage, result: null });
    }
  };

  const handleAnalysisRequest = async (info: BusinessInfo) => {
    // Auth check disabled
    runAnalysis(info);
  };

  const handleReset = () => {
    setState({ loading: false, error: null, result: null });
    setBusinessName('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-zinc-100 relative overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>
      
      {/* Subtle ambient light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white opacity-[0.03] blur-[120px] pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset} role="button">
              <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
                 <SparklesIcon className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">LocalPulse</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors relative"
              >
                <GearIcon className="w-5 h-5" />
                {(openaiKey || geminiKey) && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-black"></span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-surface border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <GearIcon className="w-5 h-5 text-indigo-400" />
                      Analysis Settings
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Gemini API Key (Required for Hosting)</label>
                          <input 
                            type="password" 
                            placeholder="AIzaSy..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                              Required if you are hosting this app yourself. 
                              Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>.
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">OpenAI API Key (Optional)</label>
                          <input 
                            type="password" 
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                              Paste your key here to enable <strong>Real-Time ChatGPT Verification</strong>. 
                              The app will make a live call to OpenAI during the audit to get actual ranking data instead of using a simulation.
                              <br/><br/>
                              <span className="text-emerald-500">Note: Your key is stored locally in your browser and never sent to our servers.</span>
                          </p>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                      >
                          CANCEL
                      </button>
                      <button 
                        onClick={saveSettings}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                      >
                          SAVE SETTINGS
                      </button>
                  </div>
              </div>
          </div>
      )}

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
