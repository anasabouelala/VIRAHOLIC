import React from 'react';
import { CheckCircleIcon, TargetIcon, TrendingUpIcon, ActivityIcon, GlobeIcon } from './Icons';

const plans = [
    {
        name: "Business",
        price: "39",
        desc: "Designed for business owners and freelancers to dominate local AI search.",
        features: [
            "12 Active Projects (12 Full Audits)",
            "20 Prompt Simulations",
            "20 Vocal Simulations",
            "Full diagnostic suite"
        ],
        button: "Start Now",
        highlight: true,
        icon: <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
    },
    {
        name: "Specialists",
        price: "99",
        desc: "Elite choice for consultants and marketers.",
        features: [
            "50 Active Projects",
            "Unlimited Simulations",
            "Unlimited Vocal",
            "Premium Support"
        ],
        button: "Start Now",
        highlight: false,
        icon: <TargetIcon className="w-5 h-5 text-zinc-400" />
    },
    {
        name: "Agency",
        price: "199",
        desc: "Scaling solution for companies.",
        features: [
            "120 Active Projects",
            "Unlimited Simulations",
            "Unlimited Vocal",
            "Strategy Manager"
        ],
        button: "Start Now",
        highlight: false,
        icon: <GlobeIcon className="w-5 h-5 text-indigo-500" />
    }
];

interface PricingSectionProps {
    onSelectPlan: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
    return (
        <section className="py-12 border-t border-white/5 animate-fade-in relative overflow-hidden bg-black/40 rounded-[60px] my-4 mx-4 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            
            <div className="text-center mb-12 relative z-10 px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4 block">Pricing Tiers</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight uppercase leading-tight">INVEST IN YOUR VISIBILITY</h2>
                <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full mt-4 blur-[1px]"></div>
                <p className="text-zinc-500 text-sm max-w-xl mx-auto font-medium mt-6 leading-relaxed opacity-80 uppercase tracking-tight">
                    Master the Answer Engine era and <span className="text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-500/20">dominate your local market.</span>
                </p>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 pt-4">
                {plans.map((plan, i) => (
                    <div 
                        key={i} 
                        className={`group relative p-10 rounded-[48px] border transition-all duration-500 flex flex-col h-full shadow-2xl backdrop-blur-xl
                        ${plan.highlight ? 'bg-white/[0.04] border-emerald-500/20 scale-105 z-10 shadow-[0_0_50px_rgba(16,185,129,0.05)]' : 'bg-black/20 border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.02]'}`}
                    >
                        {/* Interactive Corner Glow */}
                        {plan.highlight && (
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/20 rounded-full blur-[40px] animate-pulse"></div>
                        )}
                        
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg animate-fade-in z-30 whitespace-nowrap">
                                Most Popular Choice
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-10">
                            <div className={`w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500
                            ${plan.highlight ? 'border-emerald-500/30' : ''}`}>
                                {plan.icon}
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors uppercase">{plan.name}</span>
                        </div>
 
                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-5xl font-display font-black tracking-tighter transition-colors duration-500 ${plan.highlight ? 'text-white' : 'text-zinc-100'}`}>${plan.price}</span>
                                <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">/mo</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-5 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors uppercase">{plan.desc}</p>
                        </div>
 
                        <div className="space-y-4 mb-12 flex-grow">
                            {plan.features.map((feature, j) => (
                                <div key={j} className="flex items-center gap-4">
                                    <CheckCircleIcon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-500
                                    ${plan.highlight ? 'text-emerald-400' : 'text-zinc-700'}`} />
                                    <span className={`text-[11px] font-bold tracking-tight transition-colors duration-500
                                    ${plan.highlight ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{feature}</span>
                                </div>
                            ))}
                        </div>
 
                        <button 
                            onClick={onSelectPlan}
                            className={`w-full py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border backdrop-blur-md active:scale-95
                            ${plan.highlight 
                                ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:border-emerald-500/30 hover:text-white hover:bg-white/10'}`}
                        >
                            {plan.button}
                        </button>


                        {/* Hover Decorative Line */}
                        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-700 opacity-60
                        ${plan.highlight ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
                    </div>
                ))}
            </div>
            
            <p className="text-center mt-12 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] max-w-md mx-auto px-4 opacity-50 italic">
                All prices in USD. Billed monthly. <br />
                Need a custom plan? <span className="text-emerald-400 font-black cursor-pointer hover:underline underline-offset-4 decoration-emerald-500/20">Chat with us.</span>
            </p>
        </section>
    );
};

export default PricingSection;
