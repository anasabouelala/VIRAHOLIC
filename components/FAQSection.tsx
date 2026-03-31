import React, { useState } from 'react';
import { PlusIcon, MinusIcon } from './Icons';

const faqs = [
    {
        question: "What exactly is AEOHOLIC about?",
        answer: "AEOHOLIC is the first specialized diagnostic suite for Answer Engine Optimization (AEO). It uses 12 specialized AI agents to analyze how LLMs like ChatGPT and Gemini perceive and recommend your business in real-time."
    },
    {
        question: "What makes AEOHOLIC different from other AEO tools?",
        answer: "Most AEO tools only track overall brand visibility. AEOHOLIC is the only platform specifically built for Local Business AEO/GEO. We feature original diagnostics found nowhere else, including Live Vocal Search Simulation and LLM Geo-Intent Mapping."
    },
    {
        question: "How is AEO different from traditional Local SEO?",
        answer: "Local SEO focuses on Google Maps and search rankings. AEO goes deeper, analyzing the 'Invisible Index'—the training data LLMs use to form opinions about your brand. We ensure AI doesn't just see your address, but understands your quality, sentiment, and unique value."
    },
    {
        question: "Who is this tool for?",
        answer: "It is built for the entire search ecosystem: SEO/AEO freelancers, digital agencies, local business owners, and SME founders. The interface is simple enough for a beginner to understand, while the data is deep enough for an enterprise specialist."
    },
    {
        question: "Does it provide clear steps to improve my rankings?",
        answer: "Absolutely. Every forensic audit generates a step-by-step roadmap adapted to your skill level—Beginner, Intermediate, or Advanced. We guide you through the exact missions needed to improve your AEO and GEO visibility."
    },
    {
        question: "Why do I need a 12-agent AI audit?",
        answer: "A single AI check isn't enough. Our 12 specialized agents act like a digital 'Board of Directors,' each analyzing a specific vector: Geo-Intent, Voice Syntax, Hallucination Risk, Sentiment Contamination, etc., to give you a $2000-grade audit in 60 seconds."
    },
    {
        question: "Is this compatible with my current SEO agency?",
        answer: "Yes. AEO complements traditional SEO. Think of it this way: SEO brings the traffic, AEO ensures that when someone asks an AI assistant for a recommendation, your business is the one it speaks out loud."
    },
    {
        question: "How long until I see results in AI answers?",
        answer: "LLMs update their knowledge at different rates. While some changes are seen in real-time (via RAG), others take 2-4 weeks to propagate through the retrieval layers. Our 'Daily Missions' are designed to accelerate this indexing process."
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 border-t border-white/5 animate-fade-in relative overflow-hidden bg-black/20 rounded-[60px] my-6 mx-4 shadow-xl">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    
                    {/* Left Side: Founder's Story */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4 block">The Mission</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight uppercase leading-tight">
                                Bridging the gap in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Local Visibility</span>
                            </h2>
                        </div>

                        <div className="relative p-1 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent">
                            <div className="bg-zinc-900/90 backdrop-blur-3xl rounded-[38px] p-8 sm:p-10 relative overflow-hidden shadow-2xl border border-white/5">
                                {/* Subtle Quote Icon Overlay */}
                                <div className="absolute top-6 right-8 opacity-5">
                                    <svg width="80" height="60" viewBox="0 0 80 60" fill="white">
                                        <path d="M20 0C8.954 0 0 8.954 0 20v40h30V20H10c0-5.523 4.477-10 10-10V0zm50 0c-11.046 0-20 8.954-20 20v40h30V20H60c0-5.523 4.477-10 10-10V0z" />
                                    </svg>
                                </div>

                                <div className="flex flex-col gap-8">
                                    <div className="flex items-center gap-5">
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                            <img 
                                                src="/public/anas.jpg" 
                                                alt="Anas - Founder" 
                                                className="relative w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-lg grayscale hover:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white tracking-tight">Anas</h4>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-0.5">Founder & Architect</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-base sm:text-lg text-white leading-relaxed font-black tracking-tight italic">
                                            "AEOHOLIC was born from a simple realization: Most tools track brands, but what about local businesses?"
                                        </p>
                                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                                            Traditional AEO suites focus on global reach and massive websites. I built this specifically for SMEs who rely on Google Business Profiles and social media. With voice search on Siri and Alexa exploding, I wanted to provide the forensic factors no other tool proposes—so local stores never miss an AI recommendation.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Built for the new search era</span>
                                        <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: FAQ Accordions */}
                    <div className="lg:col-span-7 pt-4 lg:pt-14 overflow-hidden">
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div 
                                    key={i} 
                                    className={`group border border-white/5 rounded-3xl transition-all duration-300 overflow-hidden
                                    ${openIndex === i ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'hover:bg-white/[0.01]'}`}
                                >
                                    <button 
                                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                        className="w-full py-6 px-8 flex items-center justify-between text-left focus:outline-none"
                                    >
                                        <span className={`text-sm font-bold tracking-tight transition-colors duration-300
                                        ${openIndex === i ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                            {faq.question}
                                        </span>
                                        <div className={`flex-shrink-0 ml-4 transition-transform duration-500 ${openIndex === i ? 'rotate-180' : ''}`}>
                                            {openIndex === i ? (
                                                <MinusIcon className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <PlusIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                                            )}
                                        </div>
                                    </button>
                                    
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out
                                    ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-8 pb-8 text-sm text-zinc-500 leading-relaxed font-medium max-w-2xl border-t border-white/5 mt-2 pt-4">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQSection;
