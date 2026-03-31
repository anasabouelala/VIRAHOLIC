import React from 'react';

interface Props {
    title: string;
    children: React.ReactNode;
    onBack: () => void;
}

const StaticPage: React.FC<Props> = ({ title, children, onBack }) => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in animate-slide-up">
            <button 
                onClick={onBack}
                className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-[0.3em] mb-12 flex items-center gap-2 group transition-colors"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Audit
            </button>
            
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-8 tracking-tighter uppercase leading-none italic">
                {title}
            </h1>
            <div className="w-24 h-1 bg-emerald-500 mb-12 rounded-full opacity-50"></div>

            <div className="prose prose-invert max-w-none space-y-8 text-zinc-400 font-medium text-sm leading-relaxed antialiased">
                {children}
            </div>
            
            <div className="mt-24 pt-12 border-t border-white/5 border-dashed">
                <p className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
                    Last Updated: March 2026 • © AEOHOLIC
                </p>
            </div>
        </div>
    );
};

export default StaticPage;
