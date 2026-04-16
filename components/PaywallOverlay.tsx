import React from 'react';
import { SparklesIcon } from './Icons';
import { useNavigate } from 'react-router-dom';

interface PaywallOverlayProps {
    businessName: string;
    onAction: () => void;
    isLoggedIn?: boolean;
    onClose?: () => void;
}

const PaywallOverlay: React.FC<PaywallOverlayProps> = ({ businessName, onAction, isLoggedIn, onClose }) => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        if (onClose) onClose();
        navigate('/');
    };

    return (
        <div className="fixed inset-0 z-[55] overflow-y-auto animate-fade-in pointer-events-auto">
            {/* Top escape bar — always visible */}
            <div className="sticky top-0 z-[60] flex items-center justify-between px-4 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
                <button
                    onClick={handleGoHome}
                    className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                    <span>←</span> Home
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-[10px] font-black text-zinc-600 hover:text-zinc-300 uppercase tracking-widest transition-colors"
                    >
                        ✕ Dismiss
                    </button>
                )}
            </div>

            <div className="min-h-[calc(100%-52px)] flex items-center justify-center p-4">
                <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 sm:mb-6 shadow-xl">
                        <SparklesIcon className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 animate-pulse" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 tracking-tight uppercase">
                        {isLoggedIn ? 'Upgrade Premium' : 'Sign Up to Continue'}
                    </h2>
                    <div className="text-zinc-300 text-sm mb-6 sm:mb-8 leading-relaxed">
                        Your audit is ready. <br/>
                        {isLoggedIn ? 'Choose a plan to unlock the full 12-agent diagnostic report.' : 'Sign up (or sign in) and choose a plan to visualize it.'}
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                        <button
                            onClick={onAction}
                            className="w-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce-subtle"
                        >
                            {isLoggedIn ? 'Upgrade Plan' : 'Sign Up to Continue'}
                        </button>
                        {!isLoggedIn && (
                            <button
                                onClick={onAction}
                                className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors py-2"
                            >
                                Sign In to Access Existing Project
                            </button>
                        )}
                        <button
                            onClick={handleGoHome}
                            className="text-[10px] font-black text-zinc-700 hover:text-zinc-500 uppercase tracking-widest transition-colors py-1"
                        >
                            ← Back to Homepage
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default PaywallOverlay;
