import React from 'react';
import { TargetIcon, ActivityIcon, SparklesIcon, GlobeIcon, FlameIcon, ZapIcon } from './Icons';

const features = [
    {
        title: "Local Geo-Visibility Map",
        desc: "See exactly how AI models rank you within your specific neighborhood. We map your 'Local Radius' to ensure you're the top recommendation for nearby customers.",
        icon: <GlobeIcon className="w-5 h-5 text-indigo-500" />
    },
    {
        title: "Local Competitor Heist",
        desc: "We analyze the coffee shop, law firm, or studio down the street. See the exact prompts they're winning and intercept their local foot traffic.",
        icon: <TargetIcon className="w-5 h-5 text-rose-500" />
    },
    {
        title: "SME-Grade Hallucination Guard",
        desc: "AI often gets local addresses, hours, or services wrong. We find these 'Trust Gaps' and help you fix them so customers actually find your front door.",
        icon: <ActivityIcon className="w-5 h-5 text-emerald-500" />
    },
    {
        title: "High-ROI Daily Missions",
        desc: "SME owners are busy. Get 3 simple tasks daily designed to increase local rankings in under 5 minutes. Real growth, zero fluff.",
        icon: <FlameIcon className="w-5 h-5 text-orange-500" />
    },
    {
        title: "Local AEO Content Studio",
        desc: "Generate neighborhood-specific content that feeds LLMs the local context they need to recommend you for 'Near Me' queries.",
        icon: <ZapIcon className="w-5 h-5 text-amber-500" />
    },
    {
        title: "Physical Trust Audit",
        desc: "We use computer vision to analyze your storefront and interior photos. We ensure AI 'sees' a credible, high-quality physical business.",
        icon: <SparklesIcon className="w-5 h-5 text-indigo-400" />
    }
];

const FeaturesSection: React.FC = () => {
    return (
        <section className="py-20 animate-fade-in">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-display font-bold text-primary mb-4">The #1 AEO Engine for Local Business.</h2>
                <p className="text-secondary text-sm max-w-lg mx-auto font-medium">Built specifically to help SMEs dominate neighborhood searches and drive real-world foot traffic through AI.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <div key={i} className="group bg-white border border-border p-6 rounded-[32px] hover:border-indigo-200 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            {f.icon}
                        </div>
                        <h3 className="text-sm font-bold text-primary mb-3">{f.title}</h3>
                        <p className="text-[11px] text-secondary leading-relaxed font-medium">
                            {f.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeaturesSection;
