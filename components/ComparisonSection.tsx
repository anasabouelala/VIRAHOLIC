import React from 'react';
import { CheckCircleIcon, SparklesIcon } from './Icons';

const COMPARISON_DATA = [
  {
    feature: "Live Voice Assistant Simulation",
    antigravity: "Supported (Siri/Alexa/Google)",
    semrush: "None",
    yext: "Partial (Data Aggregation)",
    brightlocal: "None"
  },
  {
    feature: "LLM Geo-Intent Mapping",
    antigravity: "Advanced Heatmap (Local Radius)",
    semrush: "Basic Map Ranking",
    yext: "Standard Heatmap (Google Only)",
    brightlocal: "Standard (Google Only)"
  },
  {
    feature: "AI Answer Interception",
    antigravity: "Real-time (ChatGPT/Gemini)",
    semrush: "None",
    yext: "None",
    brightlocal: "None"
  },
  {
    feature: "Hallucination Wall (Fact Checking)",
    antigravity: "Included",
    semrush: "None",
    yext: "None",
    brightlocal: "None"
  },
  {
    feature: "AI Review Sentiment Injector",
    antigravity: "Included",
    semrush: "Basic AI Responder",
    yext: "None",
    brightlocal: "Template Based"
  }
];

const ComparisonSection: React.FC = () => {
    return (
        <section className="py-12 border-t border-white/5 animate-fade-in relative overflow-hidden backdrop-blur-3xl bg-black/40 rounded-[60px] my-8 mx-4 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            
            <div className="text-center mb-10 relative z-10 px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-4 block">Competitor Index</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">SPECIALIST AEO VS. LEGACY SEO</h2>
                <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full mt-4 blur-[1.5px]"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-10 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar pb-6 rounded-[30px] border border-white/5">
                    <table className="w-full text-left border-collapse bg-zinc-950/20 backdrop-blur-xl overflow-hidden">
                        <thead>
                            <tr className="bg-white/[0.03]">
                                <th className="py-8 px-8 text-[11px] font-bold text-zinc-500 border-b border-white/5 uppercase tracking-widest w-1/3">Core Capability</th>
                                <th className="py-8 px-8 text-[11px] font-black text-indigo-400 border-b border-white/10 uppercase tracking-widest bg-indigo-500/10 backdrop-blur-md text-center">AEOHOLIC</th>
                                <th className="py-8 px-8 text-[11px] font-bold text-zinc-600 border-b border-white/5 uppercase tracking-widest text-center">SEMrush</th>
                                <th className="py-8 px-8 text-[11px] font-bold text-zinc-600 border-b border-white/5 uppercase tracking-widest text-center">Yext</th>
                                <th className="py-8 px-8 text-[11px] font-bold text-zinc-600 border-b border-white/5 uppercase tracking-widest text-center">BrightLocal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {COMPARISON_DATA.map((row, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-6 px-8 text-sm font-bold text-zinc-300 tracking-tight border-r border-white/5">
                                        {row.feature}
                                    </td>
                                    <td className="py-6 px-8 bg-indigo-500/[0.03] border-r border-white/10 group-hover:bg-indigo-500/[0.06] transition-colors text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">{row.antigravity}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 border-r border-white/5 text-center">
                                        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">{row.semrush}</span>
                                    </td>
                                    <td className="py-6 px-8 border-r border-white/5 text-center">
                                        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">{row.yext}</span>
                                    </td>
                                    <td className="py-6 px-8 text-center">
                                        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">{row.brightlocal}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-12 text-center group">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-3 group-hover:text-zinc-400 transition-colors">
                        <SparklesIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
                        Traditional SEO is dying. AEO is how you survive the shift.
                    </p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </section>
    );
};

export default ComparisonSection;
