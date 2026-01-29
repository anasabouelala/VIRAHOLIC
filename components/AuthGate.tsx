import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { SparklesIcon, CheckCircleIcon, AlertCircleIcon } from './Icons';

interface Props {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AuthGate: React.FC<Props> = ({ onLoginSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      onLoginSuccess();
    } catch (error: any) {
      console.error("Login failed", error);
      
      // User-friendly error mapping
      let message = "An unexpected error occurred.";
      if (error.code === 'auth/popup-closed-by-user') {
        message = "Login popup was closed before completion.";
      } else if (error.code === 'auth/configuration-not-found') {
        message = "Firebase Auth is not enabled in the console.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized in Firebase Console.";
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* Modal */}
      <div className="relative bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Decorative background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 text-center">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/10">
                <SparklesIcon className="w-6 h-6 text-indigo-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Unlock Your AI Audit</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Create a free account to access your detailed GEO analysis and uncover how AI models see your business.
            </p>

            <div className="space-y-4 mb-8 text-left bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>View Competitor Keyword Heist</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Access AI Content Studio & Strategy</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>See Toxicity & Sentiment Scores</span>
                </div>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3 text-left animate-fade-in">
                <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-200">{errorMsg}</p>
              </div>
            )}

            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                    </>
                )}
            </button>
            
            <button onClick={onCancel} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300">
                Cancel and go back
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;