import React from 'react';
import { SparklesIcon, AlertCircleIcon } from './Icons';

interface PaywallOverlayProps {
    businessName: string;
    onAction: () => void;
    isLoggedIn?: boolean;
}

const PaywallOverlay: React.FC<PaywallOverlayProps> = ({ businessName, onAction, isLoggedIn }) => {
    return (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-6 animate-fade-in pointer-events-auto">
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-xl">
                        <SparklesIcon className="w-8 h-8 text-emerald-400 animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight uppercase">
                        {isLoggedIn ? 'Upgrade Premium' : 'Sign Up to Continue'}
                    </h2>
                    <div className="text-zinc-300 text-sm mb-8 leading-relaxed">
                        Your audit is ready. <br/>
                        {isLoggedIn ? 'Choose a plan to unlock the full 12-agent diagnostic report.' : 'Sign up (or sign in) and choose a plan to visualize it.'}
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={onAction}
                            className="w-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce-subtle"
                        >
                            {isLoggedIn ? 'Upgrade Plan' : 'Sign Up to Continue'}
                        </button>
                        {!isLoggedIn && (
                            <button
                                onClick={onAction}
                                className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Sign In to Access Existing Project
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaywallOverlay;
