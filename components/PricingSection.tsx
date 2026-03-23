import React from 'react';
import { CheckCircleIcon, SparklesIcon, ZapIcon, GlobeIcon } from './Icons';

const plans = [
    {
        name: "Starter",
        price: "49",
        desc: "Perfect for single-location SMEs just starting their AEO journey.",
        features: [
            "1 Monthly Deep Audit",
            "Local Radius Mapping (3 miles)",
            "Basic AI Mention Tracking",
            "5 AI Daily Missions",
            "Standard Support"
        ],
        button: "Start Free Audit",
        highlight: false,
        icon: <ZapIcon className="w-5 h-5 text-amber-500" />
    },
    {
        name: "Growth",
        price: "149",
        desc: "The 'Hormozi' choice. Dominate your neighborhood and steal market share.",
        features: [
            "Unlimited Live Audits",
            "Extended Radius (15 miles)",
            "Competitor Keyword Heist",
            "Visual Brand Pulse Audit",
            "Priority AI Retrieval Fixes",
            "24/7 Premium Support"
        ],
        button: "Get Started Now",
        highlight: true,
        icon: <SparklesIcon className="w-5 h-5 text-indigo-600" />
    },
    {
        name: "Multi-Location",
        price: "499",
        desc: "Enterprise-grade local dominance across multiple regions.",
        features: [
            "Everything in Growth",
            "Up to 10 Locations",
            "Custom API Access",
            "White-label Reports",
            "Dedicated Account Strategist"
        ],
        button: "Contact Sales",
        highlight: false,
        icon: <GlobeIcon className="w-5 h-5 text-indigo-500" />
    }
];

const PricingSection: React.FC = () => {
    return (
        <section className="py-24 animate-fade-in border-t border-border/50 bg-background/50">
            <div className="text-center mb-20 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Pricing Plans</span>
                </div>
                <h2 className="text-4xl font-display font-bold text-primary mb-4">Invest in your Visibility.</h2>
                <p className="text-secondary text-sm max-w-lg mx-auto font-medium">Clear pricing designed to deliver 10x ROI for local business owners.</p>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, i) => (
                    <div 
                        key={i} 
                        className={`relative p-8 rounded-[40px] border transition-all duration-300 flex flex-col h-full
                        ${plan.highlight ? 'bg-white border-indigo-200 shadow-2xl scale-105 z-10' : 'bg-white/50 border-border hover:border-indigo-100 hover:bg-white'}`}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                Most Popular
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-background flex items-center justify-center">
                                {plan.icon}
                            </div>
                            <span className="text-xs font-bold text-secondary uppercase tracking-tight">{plan.name}</span>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-display font-bold text-primary">${plan.price}</span>
                                <span className="text-sm text-secondary font-medium">/mo</span>
                            </div>
                            <p className="text-[11px] text-secondary mt-3 leading-relaxed font-medium">{plan.desc}</p>
                        </div>

                        <div className="space-y-4 mb-10 flex-grow">
                            {plan.features.map((feature, j) => (
                                <div key={j} className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] font-medium text-primary/80">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            className={`w-full py-4 rounded-full text-xs font-bold transition-all active:scale-95
                            ${plan.highlight 
                                ? 'bg-primary text-white hover:bg-black shadow-lg shadow-indigo-200' 
                                : 'bg-white border border-border text-secondary hover:border-primary hover:text-primary'}`}
                        >
                            {plan.button}
                        </button>
                    </div>
                ))}
            </div>
            
            <p className="text-center mt-16 text-[10px] text-secondary font-medium max-w-md mx-auto px-4">
                All prices in USD. Billed monthly. Cancel anytime. <br />
                Need a custom plan? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Chat with us.</span>
            </p>
        </section>
    );
};

export default PricingSection;
