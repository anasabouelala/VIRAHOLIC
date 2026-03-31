import React from 'react';
import { TargetIcon, ActivityIcon, SparklesIcon, GlobeIcon, FlameIcon, ZapIcon, PenToolIcon } from './Icons';

const features = [
    {
        title: "LLM Geo-Visibility Map (NEW)",
        desc: "See exactly how AI models rank you within your specific neighborhood. We map your 'Local Radius' to ensure you're the top recommendation for nearby customers.",
        icon: <GlobeIcon className="w-5 h-5 text-indigo-500" />
    },
    {
        title: "Voice Assistant Simulator (NEW)",
        desc: "Real-time simulation of Siri, Alexa, and Google Assistant. See exactly how your brand is vocalized and recommended in hands-free search.",
        icon: <ZapIcon className="w-5 h-5 text-violet-500" />
    },
    {
        title: "Local Competitor Keyword Heist",
        desc: "We analyze the coffee shop, law firm, or studio down the street. See the exact prompts they're winning and intercept their local foot traffic.",
        icon: <TargetIcon className="w-5 h-5 text-rose-500" />
    },
    {
        title: "SME Hallucination Guard",
        desc: "AI often gets local addresses, hours, or services wrong. We find these 'Trust Gaps' and help you fix them before customers get lost.",
        icon: <ActivityIcon className="w-5 h-5 text-emerald-500" />
    },
    {
        title: "High-ROI Daily Missions",
        desc: "SME owners are busy. Get 3 simple tasks daily designed to increase local rankings in under 5 minutes. Real growth, zero fluff.",
        icon: <FlameIcon className="w-5 h-5 text-orange-500" />
    },
    {
        title: "AI Review Sentiment Injector",
        desc: "Craft AI-optimized review responses that strategically inject missing keywords into the local training sets of major LLMs.",
        icon: <PenToolIcon className="w-5 h-5 text-indigo-400" />
    }
];

const FeaturesSection: React.FC = () => {
    return (
        <section className="py-12 animate-fade-in relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-[0.2em] uppercase opacity-90 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Features
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 mx-auto mt-6 rounded-full blur-[1px]"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <div key={i} className="group relative bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] hover:bg-white/[0.04] transition-all duration-500 hover:border-white/10 hover:-translate-y-2 overflow-hidden shadow-2xl">
                        {/* Interactive Corner Glow */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        
                        <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-500">
                            {f.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 tracking-tight">{f.title}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">
                            {f.desc}
                        </p>

                        {/* Hover Decorative Line */}
                        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent group-hover:w-full transition-all duration-700 opacity-60"></div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .bg-gradient-radial {
                    background: radial-gradient(circle at center, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
                }
            `}</style>
        </section>
    );
};

export default FeaturesSection;
