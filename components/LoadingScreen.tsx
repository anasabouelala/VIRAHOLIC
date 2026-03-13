import React, { useState, useEffect } from 'react';
import { TargetIcon, ActivityIcon, SparklesIcon, CheckCircleIcon, MapPinIcon, GlobeIcon, AlertCircleIcon, SearchIcon } from './Icons';

const loadingSteps = [
    { 
        title: "Locating Business", 
        desc: "Scanning Google Maps & Google Business Profile", 
        icon: <SearchIcon className="w-5 h-5" /> 
    },
    { 
        title: "Analyzing Competitors", 
        desc: "Mapping local radius and ranking competitors", 
        icon: <TargetIcon className="w-5 h-5" /> 
    },
    { 
        title: "Checking Citations", 
        desc: "Verifying niche-specific directories", 
        icon: <GlobeIcon className="w-5 h-5" /> 
    },
    { 
        title: "Testing AI Models", 
        desc: "Querying ChatGPT, Gemini & Perplexity", 
        icon: <ActivityIcon className="w-5 h-5" /> 
    },
    { 
        title: "Visual Processing", 
        desc: "Running Deep Vision Engine on images", 
        icon: <SparklesIcon className="w-5 h-5" /> 
    },
    { 
        title: "Scoring & Strategy", 
        desc: "Generating AEO scores & daily missions", 
        icon: <ActivityIcon className="w-5 h-5" /> 
    },
    { 
        title: "Fact-Checking", 
        desc: "Running zero-hallucination data verification", 
        icon: <AlertCircleIcon className="w-5 h-5" /> 
    }
];

const LoadingScreen: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Assume the total loading time is roughly 25-30 seconds.
        const totalDuration = 28000;
        const intervalTime = 100; // Update every 100ms for smooth progress
        const stepsCount = loadingSteps.length;
        
        const timer = setInterval(() => {
            setProgress(prev => {
                const stepAmount = 100 / (totalDuration / intervalTime);
                const newProgress = prev + stepAmount;
                
                if (newProgress >= 99) {
                    clearInterval(timer);
                    return 99; // Hang at 99% until data actually returns
                }
                
                // Calculate which step we should display based on progress %
                const calculatedStep = Math.min(
                    Math.floor((newProgress / 100) * stepsCount),
                    stepsCount - 1
                );
                
                if (calculatedStep !== currentStep) {
                    setCurrentStep(calculatedStep);
                }
                
                return newProgress;
            });
        }, intervalTime);
        
        return () => clearInterval(timer);
    }, [currentStep]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in w-full max-w-3xl mx-auto px-4 py-8">
            {/* Visualizer Ring */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-10 flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
                
                {/* Progress Circle SVGs */}
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle 
                        cx="50%" cy="50%" r="45%" 
                        stroke="currentColor" strokeWidth="3" fill="transparent" 
                        className="text-zinc-800"
                    />
                    <circle 
                        cx="50%" cy="50%" r="45%" 
                        stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 90} // Approximating radius based on viewBox mapping
                        style={{
                            strokeDasharray: '283', // 2 * pi * 45 (~282.7) if viewBox was 100
                            strokeDashoffset: `${283 - (progress / 100) * 283}`
                        }}
                        className="text-indigo-500 transition-all duration-100 ease-linear"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Inner Elements */}
                 <div className="absolute inset-6 sm:inset-8 border border-emerald-500/20 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '8s' }}></div>
                 <div className="absolute inset-10 sm:inset-12 border border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
                
                {/* Center Content */}
                <div className="flex flex-col items-center justify-center z-10">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-widest">{Math.floor(progress)}%</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-mono mt-1 text-center">Auditing</span>
                </div>
            </div>

            {/* Checklist Container */}
            <div className="w-full bg-surface border border-zinc-800/60 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                
                <h2 className="text-xl sm:text-2xl font-black text-white mb-2 text-center tracking-tight">
                    Generating Forensic Report
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm text-center mb-8 max-w-sm mx-auto leading-relaxed">
                    Our AI agents are securely crawling search engines, directores, and LLM behavior to map your visibility.
                </p>

                <div className="space-y-4 sm:space-y-5">
                    {loadingSteps.map((step, index) => {
                        const isPast = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isFuture = index > currentStep;

                        return (
                            <div 
                                key={index} 
                                className={`flex items-start gap-4 transition-all duration-500
                                ${isCurrent ? 'transform translate-x-1 sm:translate-x-3' : ''}
                                ${isPast ? 'opacity-50' : ''}
                                ${isFuture ? 'opacity-20 translate-y-2' : 'translate-y-0'}`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mt-0.5 transition-colors duration-500
                                    ${isPast ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : ''}
                                    ${isCurrent ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse' : ''}
                                    ${isFuture ? 'bg-zinc-800 text-zinc-600' : ''}`}
                                >
                                    {isPast ? <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
                                </div>
                                
                                <div className="flex flex-col">
                                    <h4 className={`text-sm sm:text-base font-bold transition-colors duration-500
                                        ${isPast ? 'text-zinc-300' : ''}
                                        ${isCurrent ? 'text-white' : ''}
                                        ${isFuture ? 'text-zinc-500' : ''}`}
                                    >
                                        {step.title}
                                    </h4>
                                    <p className={`text-[10px] sm:text-xs font-mono mt-0.5 sm:mt-1 transition-colors duration-500
                                        ${isPast ? 'text-zinc-500' : ''}
                                        ${isCurrent ? 'text-indigo-300' : ''}
                                        ${isFuture ? 'text-zinc-600' : ''}`}
                                    >
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <p className="mt-8 text-[10px] sm:text-xs text-zinc-500 font-mono tracking-widest text-center animate-pulse">
                PLEASE DO NOT REFRESH THIS PAGE
            </p>
        </div>
    );
};

export default LoadingScreen;
