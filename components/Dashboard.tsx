
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, ImpactLevel, AttributeDetail } from '../types';
import AEOMap from './AEOMap';
import AIVoiceIntentGraph from './AIVoiceIntentGraph';
import { GoogleGenAI } from "@google/genai";
import { runLiveVoiceSimulation, getApiKey } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { SearchIcon, AlertCircleIcon, TrendingUpIcon, RefreshCwIcon, MapPinIcon, GlobeIcon, SparklesIcon, TargetIcon, ActivityIcon, CheckCircleIcon, LightbulbIcon, InfoIcon, FlameIcon, CalendarIcon, ZapIcon, CopyIcon, PenToolIcon, MicIcon, PlayIcon, StopIcon, InstagramIcon, EyeOffIcon, PlusIcon, MinusIcon, UsersIcon, ListIcon, ChevronRightIcon, XCircleIcon } from './Icons';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

// Cast Marker to any to avoid TS error with 'key' prop
const MarkerAny = Marker as any;
const OverlayAny = Overlay as any;

interface Props {
    data: AnalysisResult;
    businessName: string;
    onReset: () => void;
    geminiApiKey?: string;
}

const AttributeCard = ({ title, detail, icon }: { title: string, detail: AttributeDetail, icon: React.ReactNode }) => {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg flex flex-col h-full hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="text-zinc-400">{icon}</div>
                    <h4 className="font-bold text-zinc-200 text-sm">{title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border
                        ${detail.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : detail.score >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                        {detail.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-500">{detail.score}/100</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-4 overflow-hidden">
                <div
                    className={`h-full rounded-full ${detail.score >= 70 ? 'bg-emerald-500' : detail.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${detail.score}%` }}
                ></div>
            </div>

            <div className="mb-4 flex-grow">
                <div className="flex gap-2 items-start">
                    <InfoIcon className="w-3 h-3 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-400 leading-relaxed">{detail.explanation}</p>
                </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded mt-auto">
                <div className="flex gap-2 items-start">
                    <LightbulbIcon className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Quick Fix</p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{detail.action}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Dashboard: React.FC<Props> = ({ data, businessName, onReset, geminiApiKey }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'llms' | 'citations' | 'deepdive' | 'missions' | 'studio' | 'visual' | 'voice'>('map');
    const [completedMissions, setCompletedMissions] = useState<string[]>([]);
    const [reviewInput, setReviewInput] = useState('');
    const [reviewResponse, setReviewResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [expandedSchema, setExpandedSchema] = useState<number | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
    const synthRef = useRef<SpeechSynthesis| null>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Map state
    const [hoveredCompetitor, setHoveredCompetitor] = useState<any | null>(null);
    const [zoom, setZoom] = useState(13);
    const [activeKeyword, setActiveKeyword] = useState<string>('General Search');
    const [searchQuery, setSearchQuery] = useState<string>('General Search');
    const [isAuditing, setIsAuditing] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'general' | 'opportunity'>('general');

    // LLM Enrichment State
    const [enrichmentPrompt, setEnrichmentPrompt] = useState<string>('');
    const [isEnrichingLLM, setIsEnrichingLLM] = useState<boolean>(false);
    const [localLlms, setLocalLlms] = useState<any[]>(Array.isArray(data.llmPerformance) ? data.llmPerformance : []);

    useEffect(() => {
        setLocalLlms(Array.isArray(data.llmPerformance) ? data.llmPerformance : []);
    }, [data.llmPerformance]);

    const handleEnrichLLM = () => {
        if (!enrichmentPrompt.trim()) return;
        setIsEnrichingLLM(true);
        
        // Simulate LLM Processing Delay
        setTimeout(() => {
            const competitors = Array.isArray(data.localCompetitors) && data.localCompetitors.length > 0 
                ? [data.localCompetitors[0].name] 
                : ["Competitor"];
            
            const updatedLlms = localLlms.map(llm => {
                const appears = Math.random() > 0.5;
                const newPrompt = {
                    text: enrichmentPrompt,
                    intent: "Custom Enrichment",
                    appears: appears,
                    competitorsShown: appears ? [] : competitors
                };
                return {
                    ...llm,
                    promptsTested: (llm.promptsTested || 0) + 1,
                    promptsAppeared: (llm.promptsAppeared || 0) + (appears ? 1 : 0),
                    testedPrompts: [newPrompt, ...(llm.testedPrompts || [])]
                };
            });
            
            setLocalLlms(updatedLlms);
            setEnrichmentPrompt('');
            setIsEnrichingLLM(false);
        }, 1200);
    };

    // Voice Enrichment State
    const [voicePrompt, setVoicePrompt] = useState<string>('');
    const [voiceAssistant, setVoiceAssistant] = useState<string>('Siri');
    const [voiceDevice, setVoiceDevice] = useState<string>('Smartphone');
    const [isVoiceSimulating, setIsVoiceSimulating] = useState<boolean>(false);
    const [localVoiceAnswers, setLocalVoiceAnswers] = useState<any[]>(Array.isArray(data.vocalSearch?.simulatedVoiceAnswers) ? data.vocalSearch.simulatedVoiceAnswers : []);

    useEffect(() => {
        setLocalVoiceAnswers(Array.isArray(data.vocalSearch?.simulatedVoiceAnswers) ? data.vocalSearch.simulatedVoiceAnswers : []);
    }, [data.vocalSearch]);

    const handleVoiceSimulate = async () => {
        if (!voicePrompt.trim()) return;
        setIsVoiceSimulating(true);
        
        try {
            // Use the shared getApiKey logic to find the key in settings or .env
            const finalKey = getApiKey(geminiApiKey);
            const ai = new GoogleGenAI({ apiKey: finalKey });
            
            // Add a small artificial delay to simulate "Scanning Neighborhood ecosystem"
            await new Promise(r => setTimeout(r, 2000));

            const result = await runLiveVoiceSimulation(ai, {
                query: voicePrompt,
                assistant: voiceAssistant,
                device: voiceDevice,
                businessName: businessName,
                businessCategory: data.attributes?.relevance?.label || data.attributes?.main_category || "Local Business",
                businessAddress: data.marketOverview?.marketVibe?.toLowerCase().includes('london') ? 'London, UK' : 'Local Area',
                voiceScore: data.vocalSearch?.overallVoiceScore || 50,
                competitors: data.localCompetitors || []
            });

            const newSim = {
                assistant: voiceAssistant,
                query: `[${voiceDevice}] ${voicePrompt}`,
                response: result.response,
                verdict: result.verdict,
                distance: result.distance,
                location: result.location
            };
            
            setLocalVoiceAnswers([newSim, ...localVoiceAnswers]);
            setVoicePrompt('');
        } catch (error) {
            console.error("Simulation failed:", error);
            const fallback = {
                assistant: voiceAssistant,
                query: `[${voiceDevice}] ${voicePrompt}`,
                response: `I'm having trouble connecting to the network right now. Please check your API key and try again.`,
                verdict: "No Answer",
                distance: "0 mi",
                location: "Error"
            };
            // @ts-ignore
            setLocalVoiceAnswers([fallback, ...localVoiceAnswers]);
        } finally {
            setIsVoiceSimulating(false);
        }
    };

    const handleDeleteVoiceSim = (idx: number) => {
        setLocalVoiceAnswers(prev => prev.filter((_, i) => i !== idx));
    };

    const handleAudit = (queryOverride?: string) => {
        setIsAuditing(true);
        const finalQuery = queryOverride || searchQuery;
        if (queryOverride) setSearchQuery(queryOverride);
        
        setTimeout(() => {
            setActiveKeyword(finalQuery);
            setIsAuditing(false);
        }, 800);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const toggleMission = (id: string) => {
        if (completedMissions.includes(id)) {
            setCompletedMissions(prev => prev.filter(m => m !== id));
        } else {
            setCompletedMissions(prev => [...prev, id]);
        }
    };

    const handleSpeak = (text: string) => {
        if (!synthRef.current) return;

        if (isSpeaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a good voice
        const voices = synthRef.current.getVoices();
        // Prefer Samantha or Google US English
        const preferredVoice = voices.find(v => v.name.includes('Samantha')) || voices.find(v => v.name.includes('Google US English'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => setIsSpeaking(false);

        setIsSpeaking(true);
        synthRef.current.speak(utterance);
    };

    const generateResponse = () => {
        if (!reviewInput) return;
        
        let keywords = (Array.from(selectedKeywords) as any[]).map(kw => kw.toLowerCase());
        
        // Fallback if none selected
        if (keywords.length === 0) {
            keywords = ((Array.isArray(data.keywordHeist) ? data.keywordHeist : []) as any[])
                .filter(k => k.owner === 'Competitor' || k.owner === 'Shared')
                .slice(0, 2)
                .map(k => k.term.toLowerCase());
        }

        const template = `Hi! Thank you for the feedback. At ${businessName}, we're committed to being ${keywords[0] || 'a local leader'} and providing ${keywords[1] || 'a top-tier'} service. We appreciate you mentioning us!`;
        setReviewResponse(template);
    };

    const downloadPDF = async () => {
        if (!dashboardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#050505',
                logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // If the content is longer than one page, jsPDF addImage will just let it run off. 
            // For a simple single long image PDF:
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${businessName.replace(/\s+/g, '_')}_AEO_Audit.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Check console for details.');
        } finally {
            setIsDownloading(false);
        }
    };

    const attributeData = [
        { subject: 'Authority', A: data.attributes?.authority?.score ?? 0, fullMark: 100 },
        { subject: 'Consistency', A: data.attributes?.consistency?.score ?? 0, fullMark: 100 },
        { subject: 'Sentiment', A: data.attributes?.sentiment?.score ?? 0, fullMark: 100 },
        { subject: 'Relevance', A: data.attributes?.relevance?.score ?? 0, fullMark: 100 },
        { subject: 'Citations', A: data.attributes?.citations?.score ?? 0, fullMark: 100 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]';
        if (score >= 60) return 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]';
        return 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50 rounded-xl pointer-events-none"></div>

                    <div className="flex items-center gap-2 mb-4 z-20 relative">
                        <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-widest cursor-default">Geo Score</h3>
                        <div className="group/tooltip relative flex items-center justify-center">
                            <AlertCircleIcon className="w-3.5 h-3.5 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                            <div className="absolute top-full mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl hidden sm:block">
                                <strong className="text-white block mb-1">What is this?</strong>
                                Your Generative Engine Optimization (GEO) Score measures how confidently AI models (like ChatGPT and Gemini) will recommend your business based on data consistency, citations, visual trust, and sentiment.
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-2">
                        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="64" stroke="#27272a" strokeWidth="8" fill="transparent" />
                            <circle
                                cx="80" cy="80" r="64"
                                stroke="url(#scoreGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                fill="transparent"
                                strokeDasharray={402}
                                strokeDashoffset={402 - (402 * data.overallScore) / 100}
                                className="transition-all duration-1000 ease-out filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#c084fc" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className={`text-5xl font-bold tracking-tighter ${getScoreColor(data.overallScore)}`}>{data.overallScore}</span>
                        </div>
                    </div>

                    <div className="text-center mt-6 z-10">
                        <p className="text-zinc-500 text-[10px] font-mono mb-2 uppercase tracking-[0.2em]">AI Ranking Potential</p>
                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border inline-block
                            ${data.overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                data.overallScore >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                    'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                            {data.overallScore >= 80 ? 'Highly Visible' : data.overallScore >= 50 ? 'Moderate Visibility' : 'AI Ghost (Invisible)'}
                        </span>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="md:col-span-2 bg-surface border border-zinc-800 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2 cursor-default">
                            <SparklesIcon className="w-5 h-5 text-indigo-400" />
                            Executive Summary
                        </h3>
                        <div className="group/tooltip relative flex items-center justify-center ml-2">
                            <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl hidden sm:block">
                                <strong className="text-white block mb-1">Executive Summary</strong>
                                A high-level overview generated by the AI detailing your brand's current posture in the generative search landscape.
                            </div>
                        </div>
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-sm md:text-base font-light relative z-10">
                        {data.summary || "No summary available for this audit."}
                    </p>
                </div>
            </div>

            {/* NEW: Market Intelligence Section */}
            {data.marketOverview && (
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 cursor-default">
                            <GlobeIcon className="w-4 h-4 text-emerald-500" />
                            Market Intelligence (Ecosystem View)
                        </h3>
                        <div className="group/tooltip relative flex items-center justify-center ml-2">
                            <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-emerald-400 transition-colors" />
                            <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl hidden sm:block">
                                <strong className="text-white block mb-1">Market Intelligence</strong>
                                See how saturated your local category is, discover the exact prompts users are asking AI, and find the "Blue Ocean" gaps your competitors are ignoring.
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {/* Market Vibe */}
                        <div className="col-span-1 md:col-span-1 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Category Saturation</p>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`text-lg font-bold ${data.marketOverview?.competitionLevel === 'Blue Ocean' || data.marketOverview?.competitionLevel === 'Low' ? 'text-emerald-400' : data.marketOverview?.competitionLevel === 'Moderate' ? 'text-amber-400' : 'text-rose-500'}`}>
                                    {data.marketOverview?.competitionLevel || 'Moderate'}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                {data.marketOverview?.marketVibe || 'Market data unavailable.'}
                            </p>
                        </div>

                        {/* Popular Prompts (Chat Stream) */}
                        <div className="col-span-1 md:col-span-1 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 flex flex-col">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Top User Prompts (Locally)</p>
                            <div className="space-y-2 flex-grow">
                                {(Array.isArray(data.marketOverview?.popularPrompts) ? data.marketOverview?.popularPrompts : []).map((prompt, i) => (
                                    <div key={i} className="bg-zinc-800 rounded-lg rounded-tl-none p-2 text-xs text-zinc-300 border border-zinc-700/50 inline-block w-full">
                                        "{prompt}"
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opportunity & Secret */}
                        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <TargetIcon className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Blue Ocean Opportunity</span>
                                </div>
                                <p className="text-xs text-zinc-300">{data.marketOverview?.opportunityNiche || 'N/A'}</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <ZapIcon className="w-3 h-3 text-amber-400" />
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Hidden Ranking Factor</span>
                                </div>
                                <p className="text-xs text-zinc-300">{data.marketOverview?.hiddenRankingFactor || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Chart (Visual Shape) */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 relative shadow-lg flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide cursor-default">Performance Shape</h3>
                        <div className="group/tooltip relative flex items-center justify-center">
                            <AlertCircleIcon className="w-3.5 h-3.5 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                            <div className="absolute top-full -left-1/2 transform translate-x-1/2 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                <strong className="text-white block mb-1">Radar Chart</strong>
                                A visual breakdown of where your brand over-indexes (spikes) and under-indexes (dips) across core AEO metrics.
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4 text-center">Visual representation of your brand's strengths.</p>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={attributeData}>
                                <PolarGrid stroke="#3f3f46" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Business"
                                    dataKey="A"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fill="#6366f1"
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Attribute Breakdown (The Solution) */}
                <div className="lg:col-span-2 bg-surface border border-zinc-800 rounded-xl p-6 relative shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2 cursor-default">
                            <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
                            Business Health Scorecard
                        </h3>
                        <div className="group/tooltip relative flex items-center justify-center ml-2">
                            <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-emerald-400 transition-colors" />
                            <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                <strong className="text-white block mb-1">Health Scorecard</strong>
                                Drill down into the distinct technical pillars (Authority, Consistency, Sentiment, Citations) that form your overall ranking score.
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AttributeCard
                            title="Authority"
                            detail={data.attributes.authority}
                            icon={<TargetIcon className="w-4 h-4" />}
                        />
                        <AttributeCard
                            title="Consistency"
                            detail={data.attributes.consistency}
                            icon={<RefreshCwIcon className="w-4 h-4" />}
                        />
                        <AttributeCard
                            title="Sentiment"
                            detail={data.attributes.sentiment}
                            icon={<ActivityIcon className="w-4 h-4" />}
                        />
                        <AttributeCard
                            title="Citations"
                            detail={data.attributes.citations}
                            icon={<GlobeIcon className="w-4 h-4" />}
                        />
                    </div>
                </div>
            </div>

            {/* Action Plan */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wide cursor-default">
                        <AlertCircleIcon className="w-4 h-4 text-rose-400" />
                        Top Priorities (Do This First)
                    </h3>
                    <div className="group/tooltip relative flex items-center justify-center ml-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-zinc-500 font-bold border border-zinc-500 cursor-help hover:text-rose-400 hover:border-rose-400 transition-colors">?</div>
                        <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                            <strong className="text-white block mb-1">Action Plan</strong>
                            The most critical fixes identified by the AI to immediately improve your visibility across all major LLMs.
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(data.recommendations) ? data.recommendations : []).map((rec, idx) => (
                        <div key={idx} className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-all hover:bg-zinc-800 group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">{rec.title}</h4>
                                <span className={`text-[10px] font-mono border px-2 py-0.5 rounded uppercase ${rec.impact === ImpactLevel.HIGH ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-zinc-700 text-zinc-500'}`}>
                                    {rec.impact}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{rec.description}</p>
                            <div className="mt-2 pt-3 border-t border-zinc-800">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <LightbulbIcon className="w-3 h-3" />
                                    Recommended Action
                                </p>
                                <p className="text-xs text-zinc-300 font-mono">{rec.actionItem}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVisual = () => {
        const visualData = data.visualAudit && data.visualAudit.source ? data.visualAudit : {
            source: 'Not_Found' as const,
            overallVibe: 'No visual data could be automatically located for this business on Google Maps.',
            score: 0,
            detectedTags: [],
            missingCrucialEntities: [],
            intentScores: [],
            extractedText: [],
            improvements: 'Publish photos to your Google Business Profile so AI models can locate and evaluate your visual brand.',
            imageUrls: [],
        };
        const isNotFound = visualData.source === 'Not_Found';
        const imageUrls: string[] = Array.isArray((visualData as any).imageUrls) ? (visualData as any).imageUrls : [];

        return (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-surface border border-zinc-800 rounded-xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <SparklesIcon className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Computer Vision Analysis</span>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border 
                                  ${isNotFound ? 'bg-zinc-800 border-zinc-700' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                    <span className={`text-xs font-bold uppercase tracking-wide ${isNotFound ? 'text-zinc-500' : 'text-emerald-400'}`}>
                                        {isNotFound ? 'No Visual Data Found' : 'GMB Auto-Scan'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-white cursor-default">Visual Brand "Vibe"</h3>
                                <div className="group/tooltip relative flex items-center justify-center ml-2">
                                    <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-emerald-400 transition-colors" />
                                    <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                        <strong className="text-white block mb-1">Auto Vision Audit</strong>
                                        Gemini automatically finds and analyzes your public Google Maps photos using a 3-layer AI chain. Each image goes through literal observation, then strategic scoring.
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-400 leading-relaxed mb-6">
                                {isNotFound
                                    ? 'We searched Google Maps but could not locate any public photos for this business. AI models treat businesses without photos as low-trust entities.'
                                    : 'Gemini auto-scanned your public Google Maps photos using a 3-layer vision chain: image discovery → literal inventory → strategic scoring.'}
                            </p>

                            {/* Image Thumbnails */}
                            {imageUrls.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Analyzed Images ({imageUrls.length})</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {imageUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-colors group/img">
                                                <img src={url} alt={`Business photo ${i + 1}`} className="w-full h-20 object-cover group-hover/img:opacity-90 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isNotFound && (
                                <div className="space-y-4 mb-6">
                                    <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                            Images scanning attributes
                                        </h4>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(Array.isArray(visualData.detectedTags) ? visualData.detectedTags : []).map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">{tag}</span>
                                            ))}
                                        </div>

                                        {visualData.missingCrucialEntities && visualData.missingCrucialEntities.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Missing Crucial Entities (Visual Gap)</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(visualData.missingCrucialEntities) ? visualData.missingCrucialEntities : []).map((entity, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-[10px] text-rose-400 font-mono">Missing: {entity}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {visualData.intentScores && visualData.intentScores.length > 0 && (
                                        <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Vibe & Intent Match Scores</h4>
                                            <div className="space-y-3">
                                                {(Array.isArray(visualData.intentScores) ? visualData.intentScores : []).map((intent, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs text-zinc-300">{intent.intent}</span>
                                                            <span className="text-[10px] font-mono text-zinc-500">{intent.score}%</span>
                                                        </div>
                                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${intent.score >= 80 ? 'bg-emerald-500' : intent.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${intent.score}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                                <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                    <LightbulbIcon className="w-4 h-4" />
                                    Optimization Strategy
                                </h4>
                                <p className="text-sm text-zinc-300">{visualData.improvements}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            {isNotFound ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800 relative">
                                        <div className="absolute inset-0 bg-zinc-800/50 rounded-full animate-pulse"></div>
                                        <EyeOffIcon className="w-10 h-10 text-zinc-600 relative z-10" />
                                    </div>
                                    <span className="text-2xl font-bold text-zinc-600 mb-1">Visual Ghost</span>
                                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">No Images Located</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                            <circle cx="80" cy="80" r="70" stroke="#18181b" strokeWidth="10" fill="transparent" />
                                            <circle cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="10" strokeLinecap="round" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (visualData.score || 0)) / 100} className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-bold text-white">{visualData.score}</span>
                                            <span className="text-xs text-zinc-500 uppercase font-bold mt-1">Visual Score</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-zinc-500 text-xs mt-4 max-w-xs italic">
                                        "{visualData.overallVibe}"
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderVoiceSearch = () => {
        const voice = data.vocalSearch;
        if (!voice) {
            return (
                <div className="flex items-center justify-center min-h-[400px] text-zinc-500 text-sm">
                    No vocal search data available for this audit.
                </div>
            );
        }
        const scoreColor = voice.overallVoiceScore >= 70 ? 'text-emerald-400' : voice.overallVoiceScore >= 40 ? 'text-amber-400' : 'text-rose-500';
        const strokeColor = voice.overallVoiceScore >= 70 ? '#10b981' : voice.overallVoiceScore >= 40 ? '#f59e0b' : '#f43f5e';
        const labelColor = voice.voiceReadinessLabel === 'Voice Ready' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : voice.voiceReadinessLabel === 'Partially Optimized' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400';
        const assistantIcon: Record<string, string> = { 'Google Assistant': '🟦', 'Siri': '⚫', 'Alexa': '🔵' };
        const verdictStyle = (v: string) => v === 'Mentions Business' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : v === 'Recommends Competitor' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400';
        const severityStyle = (s: string) => s === 'Critical' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : s === 'High' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-zinc-400 border-zinc-700 bg-zinc-800';

        const copyText = (text: string, idx: number) => {
            navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        };

        return (
            <div className="space-y-6 animate-slide-up">

                {/* Section 1 — Voice Score Ring */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-36 h-36 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="70" stroke="#18181b" strokeWidth="10" fill="transparent" />
                                <circle cx="80" cy="80" r="70" stroke={strokeColor} strokeWidth="10" strokeLinecap="round" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * voice.overallVoiceScore) / 100} className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-bold ${scoreColor}`}>{voice.overallVoiceScore}</span>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase">Voice Score</span>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-white">Voice Search Readiness</h3>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${labelColor}`}>{voice.voiceReadinessLabel}</span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">This score measures how well your business would perform when customers use voice assistants like Google Assistant, Siri, or Alexa. It is derived from your GBP status, schema markup, review presence, and directory citations.</p>
                        </div>
                    </div>
                </div>

                {/* Section 1.5 — Voice Intent Graph */}
                <div className="animate-slide-up" style={{animationDelay: '100ms'}}>
                    <AIVoiceIntentGraph 
                        businessName={businessName} 
                        category={data.attributes?.main_category} 
                        competitors={data.localCompetitors} 
                        score={voice.overallVoiceScore}
                    />
                </div>

                {/* Section 2 — Voice Simulator */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-6">
                        <MicIcon className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Voice Assistant Simulator</h3>
                        <div className="group/tooltip relative flex items-center justify-center ml-1">
                            <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-indigo-400" />
                            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">What each voice assistant would actually say to a customer asking about this type of business in your location.</div>
                        </div>
                    </div>
                    
                    {/* Voice Test Input Panel */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Simulated Voice Query</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 'Hey Siri, find a coffee shop to study at'"
                                    value={voicePrompt}
                                    onChange={(e) => setVoicePrompt(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleVoiceSimulate(); }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Select Assistant</label>
                                <select 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={voiceAssistant}
                                    onChange={e => setVoiceAssistant(e.target.value)}
                                >
                                    <option value="Siri">Siri (Apple)</option>
                                    <option value="Google Assistant">Google Assistant</option>
                                    <option value="Alexa">Alexa (Amazon)</option>
                                    <option value="Bixby">Bixby (Samsung)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-grow w-full sm:w-auto">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Context / Device Parameter</label>
                                <select 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={voiceDevice}
                                    onChange={e => setVoiceDevice(e.target.value)}
                                >
                                    <option value="Smartphone">Smartphone (On-the-go)</option>
                                    <option value="Smart Speaker">Smart Speaker / HomePod (At Home)</option>
                                    <option value="In-Car Navigation">In-Car Navigation (CarPlay/Android Auto)</option>
                                </select>
                            </div>
                            <button
                                onClick={handleVoiceSimulate}
                                disabled={isVoiceSimulating || !voicePrompt.trim()}
                                className={`flex items-center justify-center gap-2 px-6 py-2 h-9 text-xs font-bold tracking-wide rounded border transition-all ${isVoiceSimulating || !voicePrompt.trim() ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'}`}
                            >
                                {isVoiceSimulating ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></span>
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <MicIcon className="w-4 h-4" />
                                        Test Prompt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {localVoiceAnswers.map((sim, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group/card shadow-lg hover:border-zinc-700 transition-all">
                                {/* Actions & Badges */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    <button 
                                        onClick={() => handleDeleteVoiceSim(i)}
                                        className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors"
                                        title="Remove Simulation"
                                    >
                                        <XCircleIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{assistantIcon[sim.assistant] || '🤖'}</span>
                                        <div>
                                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{sim.assistant}</span>
                                            {/* Distance moved here to prevent overlap */}
                                            <div className="flex items-center gap-1 text-[8px] font-bold text-indigo-400 uppercase mt-0.5">
                                                <MapPinIcon className="w-2.5 h-2.5" />
                                                {sim.distance || '1.0 mi'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${verdictStyle(sim.verdict)}`}>{sim.verdict}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 italic border-b border-zinc-800 pb-2">Query: "{sim.query}"</p>
                                    {sim.location && <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Found via: {sim.location}</p>}
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed font-mono bg-black/40 rounded p-3 border border-zinc-800/50 italic">
                                    "{sim.response}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>


            </div>
        );
    };


    const renderMissions = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wide cursor-default">
                        <TargetIcon className="w-4 h-4 text-emerald-500" />
                        AEO Action Plan
                    </h3>
                    <div className="group/tooltip relative flex items-center justify-center ml-2">
                        <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-emerald-400 transition-colors" />
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl hidden sm:block">
                            <strong className="text-white block mb-1">Growth Roadmap</strong>
                            Specific, bite-sized tasks generated by AI to gradually improve your AEO score without overwhelming your schedule.
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    {(Array.isArray(data.dailyMissions) ? data.dailyMissions : []).map((mission) => {
                        const categoryColors: Record<string, string> = {
                            'Presence': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                            'Citations': 'text-violet-400 border-violet-500/30 bg-violet-500/10',
                            'Reputation': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                            'Content': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                            'AEO Tech': 'text-rose-400 border-rose-500/30 bg-rose-500/10',
                            'Review': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                            'Social': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                        };
                        const catColor = categoryColors[mission.category] || 'text-zinc-500 border-zinc-700 bg-zinc-800';
                        return (
                        <div
                            key={mission.id}
                            onClick={() => toggleMission(mission.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all group relative overflow-hidden
                        ${completedMissions.includes(mission.id)
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5
                                ${completedMissions.includes(mission.id) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                                    {completedMissions.includes(mission.id) && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold transition-all ${completedMissions.includes(mission?.id) ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                            {mission?.title || 'Action Task'}
                                        </h4>
                                    </div>
                                    <p className={`text-xs mt-1 transition-all ${completedMissions.includes(mission?.id) ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                        {mission?.description || 'Optimization task steps.'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {mission.estimatedTime}
                                        </span>
                                        <span className={`text-[10px] font-bold font-mono border px-1.5 rounded uppercase tracking-wider ${catColor}`}>
                                            {mission.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )

    const renderCitations = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="bg-surface border border-zinc-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide cursor-default">LLM Core Citations <span className="text-indigo-400 font-normal normal-case">(Niche specific data sources)</span></h3>
                    <div className="group/tooltip relative flex items-center justify-center ml-2">
                        <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                        <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                            <strong className="text-white block mb-1">Missing Opportunities</strong>
                            If your audit said 'Zero Citations Found', the websites below are exactly where you need to go create a profile immediately to fix that.
                        </div>
                    </div>
                </div>
                <p className="text-zinc-500 text-sm mb-6 max-w-2xl font-light relative z-10">
                    AI models don't just guess; they read the top search results for your city.
                    <span className="text-zinc-400"> These specific directories rank on Page 1 of Google.</span> If you aren't listed here, you are invisible to the AI.
                </p>

                {(!data.citationOpportunities || data.citationOpportunities.length === 0) ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-8 text-center relative z-10">
                        <EyeOffIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <h4 className="text-zinc-400 font-bold mb-1">No Verified Data Found</h4>
                        <p className="text-zinc-500 text-xs max-w-md mx-auto">The AI could not confidently verify any high-impact citation sources for this entity. Creating a Google Business Profile is mandatory to establish baseline visibility.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 relative z-10">
                        {(Array.isArray(data.citationOpportunities) ? data.citationOpportunities : []).sort((a,b) => Number(a.isListed) - Number(b.isListed)).map((cit, idx) => (
                            <div key={idx} className={`bg-zinc-900/50 rounded-lg border p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all group ${cit.isListed ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-zinc-800 hover:border-rose-500/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${cit.isListed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:bg-rose-500/10 group-hover:text-rose-400'}`}>
                                        <GlobeIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-200 text-sm">{cit.siteName}</h4>
                                        <a href={`https://${cit.domain}`} target="_blank" rel="noreferrer" className="text-zinc-500 text-xs hover:text-white transition-colors font-mono">{cit.domain}</a>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1">
                                    <div className="flex gap-1 mb-1 items-center">
                                        {cit.isListed ? (
                                            <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                                                <CheckCircleIcon className="w-2.5 h-2.5" /> Listed
                                            </div>
                                        ) : (
                                            <div className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[8px] font-bold text-rose-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                                                <AlertCircleIcon className="w-2.5 h-2.5" /> Missing
                                            </div>
                                        )}
                                        
                                        {cit.feedsModels?.map((model, i) => (
                                            <span key={i} className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border 
                                        ${model.includes('Gemini') ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                    model.includes('ChatGPT') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                        'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                                                {model}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${cit.priority === ImpactLevel.HIGH ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-zinc-800 text-zinc-500'}`}>
                                        {cit.priority} Priority
                                    </span>
                                    <p className="text-xs text-zinc-600 max-w-xs text-right sm:text-right font-mono mt-1">{cit.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderDeepDive = () => {
        return (
            <div className="space-y-6 animate-slide-up">


                {/* Feature: Hallucination Monitor (Fact Check) */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 cursor-default">
                                <CheckCircleIcon className="w-4 h-4 text-teal-500" />
                                Hallucination Monitor (Fact Check)
                            </h3>
                            <div className="group/tooltip relative flex items-center justify-center ml-2">
                                <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-teal-400 transition-colors" />
                                <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                    <strong className="text-white block mb-1">Hallucination Monitor</strong>
                                    Are the AI's answers about your business actually correct? If it fails this test, you need to update your main website so the AI learns the truth.
                                </div>
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm">
                            We asked the AI specific factual questions about your business. Verify if these answers are correct. If not, the AI is "hallucinating" and you need to update your GMB/Website.
                        </p>
                    </div>
                    <div className="space-y-2">
                        {(!data.factCheck || !Array.isArray(data.factCheck) || data.factCheck.length === 0) ? (
                            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-lg p-6 text-center">
                                <EyeOffIcon className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                                <p className="text-zinc-500 text-xs">No verified factual data found. The AI cannot answer specific questions about this business without hallucinating.</p>
                            </div>
                        ) : (
                            data.factCheck.map((fact, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-grow">
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Question</p>
                                        <p className="text-sm font-medium text-white mb-2">{fact?.question || 'Unknown Question'}</p>
                                        {fact?.sourceUrl && (
                                            <a href={fact.sourceUrl.startsWith('http') ? fact.sourceUrl : `https://${fact.sourceUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-teal-500 hover:text-teal-400 flex items-center gap-1 font-mono">
                                                <GlobeIcon className="w-3 h-3" /> Verify Source
                                            </a>
                                        )}
                                    </div>
                                    <div className="bg-black/30 p-3 rounded w-full sm:w-1/2 border border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 flex justify-between">
                                            AI Answer
                                            {fact?.confidence && (
                                                <span className={`px-1.5 py-0.5 rounded border ${fact.confidence.toLowerCase() === 'high' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                        fact.confidence.toLowerCase() === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                                            'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                    }`}>
                                                    {fact.confidence} Confidence
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm font-mono text-zinc-300">"{fact?.aiAnswer || 'No answer provided by AI.'}"</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Feature: Hallucination Wall (Reality Check) */}
                {data.hallucinationWall && data.hallucinationWall.length > 0 && (
                    <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 cursor-default">
                                    <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                                    Hallucination Wall
                                </h3>
                                <div className="group/tooltip relative flex items-center justify-center ml-2">
                                    <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-blue-400 transition-colors" />
                                    <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                        <strong className="text-white block mb-1">Reality Check</strong>
                                        Automated agent verified the claims made in this report against real-time Google Search data to guarantee accuracy.
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-sm">
                                The AI cross-referenced its own generative output via Google Search to flag hallucinated info.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {(Array.isArray(data.hallucinationWall) ? data.hallucinationWall : []).map((item, idx) => (
                                <div key={idx} className={`bg-zinc-900/50 border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${item.status === 'Hallucinated' ? 'border-rose-900/50 hover:border-rose-700/50' : item.status === 'Verified' ? 'border-emerald-900/50 hover:border-emerald-700/50' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                    <div className="flex-grow w-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                                                ${item.status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                    item.status === 'Hallucinated' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                                        'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                                                {item.status}
                                            </span>
                                            {item.sourceUrl && (
                                                <a href={item.sourceUrl.startsWith('http') ? item.sourceUrl : `https://${item.sourceUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono transition-colors">
                                                    <GlobeIcon className="w-3 h-3" /> Source
                                                </a>
                                            )}
                                        </div>
                                        <div className="space-y-2 mt-3">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5 w-16 flex-shrink-0">Claim:</span>
                                                <p className="text-sm font-medium text-white">{item?.claim || 'N/A'}</p>
                                            </div>
                                            <div className="flex gap-2 bg-black/20 p-2 rounded">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5 w-16 flex-shrink-0">Reality:</span>
                                                <p className="text-sm text-zinc-300 font-mono">"{item?.truth || 'Verifying...'}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feature 5: Review Sentiment Training Data Audit */}
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-rose-900"></div>
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 cursor-default">
                                    <ActivityIcon className="w-4 h-4 text-rose-500" />
                                    Training Data Toxicity Audit
                                </h3>
                                <div className="group/tooltip relative flex items-center justify-center ml-2">
                                    <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-rose-400 transition-colors" />
                                    <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl hidden sm:block">
                                        <strong className="text-white block mb-1">Toxicity Audit</strong>
                                        Flags negative keywords ("Rude", "Slow", etc.) associated with your brand that actively hurt your chances of being recommended by AI.
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-sm max-w-2xl">
                                LLMs train on your reviews. Recurring negative entities become permanent brand associations.
                                <span className="text-rose-400 ml-1">High toxicity scores reduce ranking visibility.</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">{data.sentimentAudit?.toxicityScore}%</div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase">Toxicity Score</div>
                        </div>
                    </div>

                    <div className="w-full bg-zinc-900 h-2 rounded-full mb-8 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${data.sentimentAudit?.toxicityScore > 50 ? 'bg-rose-600' : data.sentimentAudit?.toxicityScore > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${data.sentimentAudit?.toxicityScore}%` }}
                        ></div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Detected Negative Entities (Contaminants)</h4>
                        {(Array.isArray(data.sentimentAudit?.negativeEntities) ? data.sentimentAudit.negativeEntities : []).map((entity, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded hover:border-rose-900/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-sm font-bold text-zinc-200">"{entity.term}"</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-zinc-500">{entity.frequency}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border
                                     ${entity.impact === 'Critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                            entity.impact === 'Moderate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                                'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                                        {entity.impact} Impact
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!data.sentimentAudit?.negativeEntities || data.sentimentAudit.negativeEntities.length === 0) && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-emerald-400">Clean bill of health. No recurring negative entities found in simulated training data.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const renderStudio = () => (
        <div className="space-y-6 animate-slide-up">
            {/* Tool: Smart Review Responder */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2 cursor-default">
                        <SparklesIcon className="w-4 h-4 text-indigo-400" />
                        AI Review Response Assistant
                    </h3>
                    <div className="group/tooltip relative flex items-center justify-center ml-2">
                        <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                        <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl hidden sm:block">
                            <strong className="text-white block mb-1">GEO Optimization</strong>
                            Generates replies that naturally inject keywords your business is missing to establish semantic authority in AI training sets.
                        </div>
                    </div>
                </div>
                
                <p className="text-xs text-zinc-500 mb-6 relative z-10">Paste a customer review and select AEO keywords to inject into the optimized response.</p>

                {/* AEO Keyword Selection Grid */}
                <div className="mb-8 relative z-10">
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                        <TargetIcon className="w-3 h-3 text-indigo-400" />
                        Select AEO Keywords to Inject:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(data.keywordHeist) ? data.keywordHeist : []).slice(0, 8).map((k, i) => {
                            const isSelected = selectedKeywords.has(k.term);
                            return (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        const next = new Set(selectedKeywords);
                                        if (next.has(k.term)) next.delete(k.term);
                                        else next.add(k.term);
                                        setSelectedKeywords(next);
                                    }}
                                    className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5
                                        ${isSelected 
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' 
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                                >
                                    {isSelected ? <CheckCircleIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3 text-zinc-600" />}
                                    {k.term}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-10">
                    <textarea
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 mb-4 h-40 resize-none shadow-inner"
                        placeholder="Paste customer review here..."
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                    />

                    <button
                        onClick={generateResponse}
                        disabled={!reviewInput}
                        className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all mb-8 shadow-lg
                    ${!reviewInput ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/20'}`}
                    >
                        {selectedKeywords.size > 0 ? `Inject ${selectedKeywords.size} Keywords & Generate` : 'Generate GEO-Optimized Reply'}
                    </button>
                </div>

                {reviewResponse && (
                    <div className="mt-auto bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 relative animate-fade-in shadow-xl">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Optimized AI Response</span>
                            <div className="flex gap-2">
                                <button 
                                    className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest px-3 flex items-center gap-2 mr-2"
                                    onClick={() => setReviewResponse('')}
                                >
                                    Clear
                                </button>
                                <button 
                                    className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all" 
                                    onClick={() => navigator.clipboard.writeText(reviewResponse)}
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-white leading-relaxed font-mono italic">
                            "{reviewResponse}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderLLMs = () => {
        const globalInsight = data.globalLLMInsight;
        const llms = localLlms;

        return (
            <div className="space-y-6 animate-slide-up">
                {/* Custom Enrichment Box */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-xl p-5 shadow-inner">
                    <h3 className="text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" />
                        Prompt Enrichment
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 max-w-2xl">
                        Enter a custom query a customer might ask about your business. We'll run a rapid simulation against the models and add the results to your diagnostic panel below.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                placeholder="e.g. 'Quietest coffee shop for studying in SF'"
                                value={enrichmentPrompt}
                                onChange={(e) => setEnrichmentPrompt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEnrichLLM(); }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                        <button
                            onClick={handleEnrichLLM}
                            disabled={isEnrichingLLM || !enrichmentPrompt.trim()}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold tracking-wide rounded border transition-all ${isEnrichingLLM || !enrichmentPrompt.trim() ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}
                        >
                            {isEnrichingLLM ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></span>
                                    Enriching...
                                </>
                            ) : (
                                <>
                                    <ActivityIcon className="w-4 h-4" />
                                    Test Prompt
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Global Insight Banner */}
                {globalInsight && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-lg">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                                    <GlobeIcon className="w-4 h-4 text-indigo-400" />
                                    Global cross-LLM Insight
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl mb-4">
                                    {globalInsight.summary}
                                </p>
                                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800/60">
                                    <p className="text-[11px] font-bold uppercase text-zinc-500 mb-1">Visibility Potential</p>
                                    <p className="text-[13px] text-zinc-300">{globalInsight.visibilityPotential}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-72 space-y-5">
                                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/60 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center bg-indigo-500/10">
                                        <span className="text-lg font-bold text-indigo-400">{globalInsight.entityConfidenceScore}%</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Entity Confidence</h4>
                                        <div className="space-y-1">
                                            {globalInsight.entitySignals.map((signal, i) => (
                                                <p key={i} className="text-[10px] text-zinc-500 leading-tight flex items-start gap-1">
                                                    <span className="text-rose-400 mt-[-1px]">•</span> {signal}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Visibility by Intent</h4>
                                    <div className="space-y-2.5">
                                        {globalInsight.visibilityByIntent.map((intent, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-300">{intent.intent}</span>
                                                    <span className="text-zinc-500 font-mono">{intent.appeared} / {intent.total}</span>
                                                </div>
                                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(intent.appeared / intent.total) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {llms.map((llm, idx) => {
                        const coveragePercent = llm.promptsAppeared !== undefined && llm.promptsTested ? Math.round((llm.promptsAppeared / llm.promptsTested) * 100) : 0;
                        return (
                            <div key={idx} className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg group hover:border-zinc-700 transition-all">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left Column: LLM Identity & Coverage */}
                                    <div className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/60 pb-6 lg:pb-0 lg:pr-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border 
                                            ${llm.model === 'ChatGPT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    llm.model === 'Gemini' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                        llm.model === 'Claude' ? 'bg-amber-600/10 border-amber-600/20 text-amber-500' :
                                                            'bg-violet-500/10 border-violet-500/20 text-violet-500'}`}>
                                                {llm.model ? llm.model[0] : '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-white">{llm.model}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-block mt-1
                                                ${llm.status === 'Top Choice' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                        llm.status === 'Option' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                            'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'}`}>
                                                    {llm.status}
                                                </span>
                                            </div>
                                        </div>

                                        {llm.promptsTested !== undefined && (
                                            <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800/40">
                                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">Prompt Coverage</p>
                                                <div className="flex items-end gap-2 mb-2">
                                                    <span className="text-2xl font-bold text-white leading-none">{llm.promptsAppeared}</span>
                                                    <span className="text-sm text-zinc-500 font-mono mb-0.5">/ {llm.promptsTested}</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 mb-3">Appears in {coveragePercent}% of tested user prompts.</p>
                                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${coveragePercent}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle Column: Competitors & Insights */}
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Competitor Replacement */}
                                            {llm.competitorReplacements && llm.competitorReplacements.length > 0 && (
                                                <div>
                                                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                        <UsersIcon className="w-3.5 h-3.5" />
                                                        Top Recommended Instead of You
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {llm.competitorReplacements.map((comp, i) => (
                                                            <div key={i} className="bg-zinc-900/40 p-3 rounded border border-zinc-800/40">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-sm font-bold text-zinc-200">{comp.name}</span>
                                                                    <span className="text-xs text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded">{comp.appearancePercentage}%</span>
                                                                </div>
                                                                {comp.examplePrompts && comp.examplePrompts.length > 0 && (
                                                                    <p className="text-[10px] text-zinc-500 truncate" title={comp.examplePrompts.join(', ')}>
                                                                        e.g., "{comp.examplePrompts[0]}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Behavior Insight */}
                                            {llm.behaviorInsight && (
                                                <div>
                                                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                        <SearchIcon className="w-3.5 h-3.5" />
                                                        LLM Behavior Insight
                                                    </h5>
                                                    <div className="bg-indigo-500/5 p-4 rounded border border-indigo-500/10 h-full">
                                                        <p className="text-sm text-indigo-200/80 leading-relaxed">
                                                            "{llm.behaviorInsight}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expandable Evidence Table */}
                                        {llm.testedPrompts && llm.testedPrompts.length > 0 && (
                                            <details className="group/details border border-zinc-800/60 rounded-lg bg-zinc-950 overflow-hidden">
                                                <summary className="flex items-center justify-between p-3 cursor-pointer select-none bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                                                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                                        <ListIcon className="w-3.5 h-3.5" />
                                                        View Prompt Evidence
                                                    </span>
                                                    <ChevronRightIcon className="w-4 h-4 text-zinc-500 group-open/details:rotate-90 transition-transform" />
                                                </summary>
                                                <div className="p-0 border-t border-zinc-800/60 max-h-64 overflow-y-auto custom-scrollbar">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-zinc-900/30">
                                                                <th className="py-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono border-b border-zinc-800/60 w-1/2">Prompt Output</th>
                                                                <th className="py-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono border-b border-zinc-800/60 w-1/4">Appears?</th>
                                                                <th className="py-2 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono border-b border-zinc-800/60 w-1/4">Competitors</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-zinc-800/40">
                                                            {llm.testedPrompts.map((tp, i) => (
                                                                <tr key={i} className="hover:bg-zinc-900/20 transition-colors group/row">
                                                                    <td className="py-2.5 px-4 text-[13px] text-zinc-300 group-hover/row:text-white transition-colors">
                                                                        "{tp.text}"
                                                                        <span className="block text-[9px] text-zinc-600 mt-1 uppercase tracking-wider">{tp.intent}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-4">
                                                                        {tp.appears ? (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                                                <CheckCircleIcon className="w-3 h-3" /> Yes
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                                                                                <XCircleIcon className="w-3 h-3" /> No
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-4">
                                                                        {tp.competitorsShown && tp.competitorsShown.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {tp.competitorsShown.map((compName, idx) => (
                                                                                    <span key={idx} className="text-[10px] bg-zinc-800/60 text-zinc-400 px-1.5 py-0.5 rounded whitespace-nowrap border border-zinc-700/60">
                                                                                        {compName}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[10px] text-zinc-600 italic">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderMap = () => (
        <div className="space-y-6 animate-slide-up h-[750px] flex flex-col">
            <AEOMap 
                center={data.businessCoordinates} 
                businessName={businessName}
                category={data.attributes?.relevance?.label || data.attributes?.main_category || "Local Business"}
                competitors={data.localCompetitors}
            />
        </div>
    );

    return (
        <div className="space-y-8 pb-12" ref={dashboardRef}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{businessName}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-wide">Analysis Complete</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={downloadPDF}
                        disabled={isDownloading}
                        data-html2canvas-ignore="true"
                        className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide rounded border transition-all
                            ${isDownloading
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'}`}
                    >
                        {isDownloading ? (
                            <>
                                <span className="w-3 h-3 border-2 border-zinc-500 border-t-zinc-800 rounded-full animate-spin"></span>
                                GENERATING...
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                EXPORT PDF
                            </>
                        )}
                    </button>
                    <button
                        onClick={onReset}
                        data-html2canvas-ignore="true"
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide text-zinc-900 bg-white rounded hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        <RefreshCwIcon className="w-3 h-3" />
                        NEW AUDIT
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-800">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'studio', label: 'Creator Studio', icon: <PenToolIcon className="w-4 h-4 text-indigo-400" /> },
                        { id: 'missions', label: 'Action Plan', icon: <TargetIcon className="w-4 h-4 text-emerald-500" /> },
                        { id: 'visual', label: 'Visual', icon: <SparklesIcon className="w-4 h-4 text-emerald-500" /> },
                        { id: 'voice', label: 'Voice', icon: <MicIcon className="w-4 h-4 text-violet-400" /> },
                        { id: 'deepdive', label: 'Deep Dive' },
                        { id: 'llms', label: 'Models' },
                        { id: 'map', label: 'Map' },
                        { id: 'citations', label: 'Citations' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`${activeTab === tab.id
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors uppercase tracking-wider flex items-center gap-2`}
                        >
                             {tab.icon}
                            {tab.label}
                            {tab.id === 'studio' && <span className="text-[9px] bg-indigo-500 text-white px-1 rounded ml-1">NEW</span>}
                            {tab.id === 'visual' && <span className="text-[9px] bg-emerald-500 text-white px-1 rounded ml-1">NEW</span>}
                            {tab.id === 'voice' && <span className="text-[9px] bg-violet-500 text-white px-1 rounded ml-1">NEW</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="mt-8 min-h-[500px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'studio' && renderStudio()}
                {activeTab === 'missions' && renderMissions()}
                {activeTab === 'visual' && renderVisual()}
                {activeTab === 'voice' && renderVoiceSearch()}
                {activeTab === 'deepdive' && renderDeepDive()}
                {activeTab === 'llms' && renderLLMs()}
                {activeTab === 'map' && renderMap()}
                {activeTab === 'citations' && renderCitations()}
            </div>

        </div>
    );
};

export default Dashboard;
