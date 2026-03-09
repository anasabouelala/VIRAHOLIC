
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, ImpactLevel, AttributeDetail } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { AlertCircleIcon, TrendingUpIcon, RefreshCwIcon, MapPinIcon, GlobeIcon, SparklesIcon, TargetIcon, ActivityIcon, CheckCircleIcon, LightbulbIcon, InfoIcon, FlameIcon, CalendarIcon, ZapIcon, CopyIcon, PenToolIcon, MicIcon, PlayIcon, StopIcon, InstagramIcon, EyeOffIcon } from './Icons';

// Cast Marker to any to avoid TS error with 'key' prop
const MarkerAny = Marker as any;

interface Props {
  data: AnalysisResult;
  businessName: string;
  onReset: () => void;
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

const Dashboard: React.FC<Props> = ({ data, businessName, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'llms' | 'citations' | 'deepdive' | 'missions' | 'studio' | 'visual'>('overview');
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [reviewInput, setReviewInput] = useState('');
  const [reviewResponse, setReviewResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Map state
  const [hoveredCompetitor, setHoveredCompetitor] = useState<any | null>(null);

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
    const keywords = data.keywordHeist
        .filter(k => k.owner === 'Competitor' || k.owner === 'Shared')
        .slice(0, 3)
        .map(k => k.term.toLowerCase());
    
    // Simple template logic for demo purposes
    const template = `Hi there! Thanks so much for the review. We're glad you stopped by ${businessName}. We always strive to be ${keywords[0] || 'excellent'} and provide a ${keywords[1] || 'great'} experience. Hope to see you again soon for more ${keywords[2] || 'good times'}!`;
    setReviewResponse(template);
  };
  
  const attributeData = [
    { subject: 'Authority', A: data.attributes.authority.score, fullMark: 100 },
    { subject: 'Consistency', A: data.attributes.consistency.score, fullMark: 100 },
    { subject: 'Sentiment', A: data.attributes.sentiment.score, fullMark: 100 },
    { subject: 'Relevance', A: data.attributes.relevance.score, fullMark: 100 },
    { subject: 'Citations', A: data.attributes.citations.score, fullMark: 100 },
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
        <div className="bg-surface border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50"></div>
            <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-4 z-10">Geo Score</h3>
            <div className="relative z-10">
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
            <p className="text-zinc-500 text-xs mt-4 font-mono z-10">RANKING POTENTIAL</p>
        </div>

        {/* Summary Card */}
        <div className="md:col-span-2 bg-surface border border-zinc-800 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden shadow-lg">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
              <SparklesIcon className="w-5 h-5 text-indigo-400" />
              Executive Summary
            </h3>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base font-light relative z-10">
                {data.summary}
            </p>
        </div>
      </div>

      {/* NEW: Market Intelligence Section */}
      {data.marketOverview && (
          <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 to-transparent pointer-events-none"></div>
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wide flex items-center gap-2 relative z-10">
                  <GlobeIcon className="w-4 h-4 text-emerald-500" />
                  Market Intelligence (Ecosystem View)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {/* Market Vibe */}
                  <div className="col-span-1 md:col-span-1 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Category Saturation</p>
                      <div className="flex items-center gap-2 mb-3">
                          <div className={`text-lg font-bold ${data.marketOverview.competitionLevel === 'Blue Ocean' || data.marketOverview.competitionLevel === 'Low' ? 'text-emerald-400' : data.marketOverview.competitionLevel === 'Moderate' ? 'text-amber-400' : 'text-rose-500'}`}>
                              {data.marketOverview.competitionLevel}
                          </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                          {data.marketOverview.marketVibe}
                      </p>
                  </div>

                  {/* Popular Prompts (Chat Stream) */}
                  <div className="col-span-1 md:col-span-1 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 flex flex-col">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Top User Prompts (Locally)</p>
                      <div className="space-y-2 flex-grow">
                          {data.marketOverview.popularPrompts.map((prompt, i) => (
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
                          <p className="text-xs text-zinc-300">{data.marketOverview.opportunityNiche}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex-grow">
                           <div className="flex items-center gap-2 mb-2">
                               <ZapIcon className="w-3 h-3 text-amber-400" />
                               <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Hidden Ranking Factor</span>
                          </div>
                          <p className="text-xs text-zinc-300">{data.marketOverview.hiddenRankingFactor}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart (Visual Shape) */}
        <div className="bg-surface border border-zinc-800 rounded-xl p-6 relative shadow-lg flex flex-col items-center justify-center">
             <h3 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide">Performance Shape</h3>
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
            <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
                Business Health Scorecard
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AttributeCard 
                    title="Authority" 
                    detail={data.attributes.authority} 
                    icon={<TargetIcon className="w-4 h-4"/>} 
                />
                <AttributeCard 
                    title="Consistency" 
                    detail={data.attributes.consistency} 
                    icon={<RefreshCwIcon className="w-4 h-4"/>} 
                />
                <AttributeCard 
                    title="Sentiment" 
                    detail={data.attributes.sentiment} 
                    icon={<ActivityIcon className="w-4 h-4"/>} 
                />
                <AttributeCard 
                    title="Citations" 
                    detail={data.attributes.citations} 
                    icon={<GlobeIcon className="w-4 h-4"/>} 
                />
            </div>
         </div>
      </div>

      {/* Action Plan */}
      <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2 uppercase tracking-wide">
            <AlertCircleIcon className="w-4 h-4 text-rose-400" />
            Top Priorities (Do This First)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.map((rec, idx) => (
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
      const isNotFound = data.visualAudit?.source === 'Not_Found';
      return (
        <div className="space-y-6 animate-slide-up">
          {data.visualAudit && (
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
                                  ${isNotFound ? 'bg-zinc-800 border-zinc-700' : 
                                    data.visualAudit.source === 'Upload' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                  <span className={`text-xs font-bold uppercase tracking-wide ${isNotFound ? 'text-zinc-500' : data.visualAudit.source === 'Upload' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                      Source: {isNotFound ? 'No Visual Data' : data.visualAudit.source === 'Upload' ? 'Manual Upload' : 'Google Maps Scan'}
                                  </span>
                              </div>
                          </div>
  
                          <h3 className="text-2xl font-bold text-white mb-2">Visual Brand "Vibe"</h3>
                          <p className="text-zinc-400 leading-relaxed mb-6">
                              {isNotFound 
                                  ? 'We could not find any public photos for this business on Google Maps. AI models treat businesses without photos as "low trust" entities.'
                                  : data.visualAudit.source === 'Upload' 
                                      ? 'We used Gemini Vision to analyze your uploaded photos. This is how the AI "sees" your establishment.'
                                      : 'We scanned your public Google Maps presence. This represents how AI models perceive your visual identity from public data.'
                              }
                          </p>
                          
                          {!isNotFound && (
                              <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800 mb-6">
                                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Detected Attributes</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {data.visualAudit.detectedTags.map((tag, i) => (
                                          <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          )}
  
                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                              <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                  <LightbulbIcon className="w-4 h-4" />
                                  Optimization Strategy
                              </h4>
                              <p className="text-sm text-zinc-300">{data.visualAudit.improvements}</p>
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
                                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">No Data Found</span>
                               </div>
                           ) : (
                               <>
                                  <div className="relative w-48 h-48 flex items-center justify-center">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                          <circle cx="80" cy="80" r="70" stroke="#18181b" strokeWidth="10" fill="transparent" />
                                          <circle 
                                              cx="80" cy="80" r="70" 
                                              stroke="#10b981" 
                                              strokeWidth="10" 
                                              strokeLinecap="round"
                                              fill="transparent" 
                                              strokeDasharray={440} 
                                              strokeDashoffset={440 - (440 * (data.visualAudit.score || 0)) / 100} 
                                              className="transition-all duration-1000 ease-out" 
                                          />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                          <span className="text-5xl font-bold text-white">{data.visualAudit.score}</span>
                                          <span className="text-xs text-zinc-500 uppercase font-bold mt-1">Visual Score</span>
                                      </div>
                                  </div>
                                  <p className="text-center text-zinc-500 text-xs mt-4 max-w-xs italic">
                                      "{data.visualAudit.overallVibe}"
                                  </p>
                               </>
                           )}
                      </div>
                  </div>
              </div>
          )}
        </div>
      );
  }

  const renderMissions = () => (
    <div className="space-y-6 animate-slide-up">
        {/* Gamification Header */}
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <FlameIcon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-white">12 Days</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Current Streak</div>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-white">{completedMissions.length}/{data.dailyMissions?.length || 4}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Today's Tasks</div>
                </div>
            </div>
             <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <ZapIcon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-white">850 XP</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Level 3 Founder</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mission List */}
            <div className="lg:col-span-2 bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <TargetIcon className="w-4 h-4 text-emerald-500" />
                    Your Daily Missions
                </h3>
                <div className="space-y-3">
                    {data.dailyMissions?.map((mission) => (
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
                                        <h4 className={`text-sm font-bold transition-all ${completedMissions.includes(mission.id) ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                            {mission.title}
                                        </h4>
                                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">+{mission.xp} XP</span>
                                    </div>
                                    <p className={`text-xs mt-1 transition-all ${completedMissions.includes(mission.id) ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                        {mission.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {mission.estimatedTime}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1.5 rounded uppercase">
                                            {mission.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tool: Smart Review Responder */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <h3 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-indigo-400" />
                    Review Response Assistant
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Paste a customer review below. We'll generate a reply using your high-value keywords to boost your SEO score.</p>
                
                <textarea 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 mb-4 h-32 resize-none"
                    placeholder="Paste customer review here..."
                    value={reviewInput}
                    onChange={(e) => setReviewInput(e.target.value)}
                />

                <button 
                    onClick={generateResponse}
                    disabled={!reviewInput}
                    className={`w-full py-2 rounded font-bold text-xs uppercase tracking-wide transition-all mb-6
                    ${!reviewInput ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
                >
                    Generate Optimized Reply
                </button>

                {reviewResponse && (
                    <div className="mt-auto bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 relative animate-fade-in">
                        <p className="text-xs text-indigo-200 leading-relaxed font-mono">
                            "{reviewResponse}"
                        </p>
                        <button className="absolute top-2 right-2 text-indigo-400 hover:text-white" onClick={() => navigator.clipboard.writeText(reviewResponse)}>
                            <CopyIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {!reviewResponse && (
                    <div className="mt-auto pt-4 border-t border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Keywords we will inject:</p>
                        <div className="flex flex-wrap gap-2">
                            {data.keywordHeist?.slice(0, 3).map((k, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    {k.term}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  )

  const renderCitations = () => (
    <div className="space-y-6 animate-slide-up">
        <div className="bg-surface border border-zinc-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide relative z-10">Knowledge Graph Feeders (RAG Sources)</h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-2xl font-light relative z-10">
                AI models don't just guess; they read the top search results for your city. 
                <span className="text-zinc-400"> These specific directories rank on Page 1 of Google for your category.</span> listing here directly feeds the AI's answer engine.
            </p>

            <div className="grid grid-cols-1 gap-3 relative z-10">
                {data.citationOpportunities?.map((cit, idx) => (
                    <div key={idx} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                <GlobeIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-200 text-sm group-hover:text-indigo-300 transition-colors">{cit.siteName}</h4>
                                <a href={`https://${cit.domain}`} target="_blank" rel="noreferrer" className="text-zinc-500 text-xs hover:text-white transition-colors font-mono">{cit.domain}</a>
                            </div>
                        </div>
                        
                        <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1">
                            <div className="flex gap-1 mb-1">
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
        </div>
    </div>
  );

  const renderDeepDive = () => {
     return (
        <div className="space-y-6 animate-slide-up">
            
            {/* Feature 3: Competitor Keyword Heist */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                        <TargetIcon className="w-4 h-4 text-amber-500" />
                        Competitor Keyword Heist
                    </h3>
                    <p className="text-zinc-500 text-sm">
                        Semantic gap analysis. Identify adjectives the AI assigns to your competitors that are missing from your brand profile.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* The Gap */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Opportunity Gap (Stolen by Competitors)</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.keywordHeist?.filter(k => k.owner === 'Competitor').map((k, idx) => (
                                <span key={idx} className="px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-2">
                                    {k.term}
                                    <span className="opacity-50 text-[10px]">{k.opportunityScore}%</span>
                                </span>
                            ))}
                        </div>
                        {data.keywordHeist?.filter(k => k.owner === 'Competitor').length === 0 && (
                             <p className="text-zinc-600 text-xs italic">No clear semantic gaps found.</p>
                        )}
                    </div>

                     {/* Your Defense */}
                     <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Your Semantic Territory (What you own)</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.keywordHeist?.filter(k => k.owner === 'You' || k.owner === 'Shared').map((k, idx) => (
                                <span key={idx} className={`px-3 py-1.5 rounded border text-xs font-mono font-bold flex items-center gap-2
                                    ${k.owner === 'Shared' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
                                    {k.term}
                                    {k.owner === 'Shared' && <span className="opacity-50 text-[10px] ml-1">(SHARED)</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature: Hallucination Monitor (Fact Check) */}
            {data.factCheck && data.factCheck.length > 0 && (
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-teal-500" />
                            Hallucination Monitor (Fact Check)
                        </h3>
                        <p className="text-zinc-500 text-sm">
                            We asked the AI specific factual questions about your business. Verify if these answers are correct. If not, the AI is "hallucinating" and you need to update your GMB/Website.
                        </p>
                    </div>
                    <div className="space-y-2">
                        {data.factCheck.map((fact, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Question</p>
                                    <p className="text-sm font-medium text-white">{fact.question}</p>
                                </div>
                                <div className="bg-black/30 p-3 rounded w-full sm:w-1/2 border border-zinc-800/50">
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">AI's Answer</p>
                                    <p className="text-sm text-zinc-300 italic">"{fact.aiAnswer}"</p>
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
                        <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4 text-rose-500" />
                            Training Data Toxicity Audit
                        </h3>
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
                    {data.sentimentAudit?.negativeEntities.map((entity, idx) => (
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
                    {data.sentimentAudit?.negativeEntities.length === 0 && (
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
       <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide flex items-center gap-2 relative z-10">
                <PenToolIcon className="w-4 h-4 text-indigo-400" />
                AI Content Studio
            </h3>
            <p className="text-zinc-500 text-sm mb-6 relative z-10">
                Auto-generated social content optimized for Generative Engine Optimization (GEO).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {data.contentStrategy?.map((post, idx) => (
                    <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 hover:border-indigo-500/30 transition-all flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border 
                                ${post.platform === 'Instagram' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 
                                  post.platform === 'LinkedIn' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                                  'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                {post.platform}
                            </span>
                            <button className="text-zinc-500 hover:text-white" onClick={() => navigator.clipboard.writeText(post.caption)}>
                                <CopyIcon className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="mb-4 flex-grow">
                            <p className="text-xs font-mono text-zinc-500 mb-2">Focus Keyword: <span className="text-zinc-300">{post.focusKeyword}</span></p>
                            <div className="bg-black/30 p-3 rounded border border-zinc-800/50 text-xs text-zinc-300 italic mb-3">
                                "{post.caption}"
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {post.hashtags.map((tag, i) => (
                                    <span key={i} className="text-[10px] text-indigo-400">#{tag}</span>
                                ))}
                            </div>
                        </div>

                         <div className="mt-auto pt-3 border-t border-zinc-800">
                             <div className="flex items-start gap-2 mb-2">
                                 <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <SparklesIcon className="w-3 h-3 text-zinc-400" />
                                 </div>
                                 <p className="text-[10px] text-zinc-400 leading-tight">
                                     <span className="font-bold text-zinc-300 block mb-0.5">Visual Idea:</span>
                                     {post.imageIdea}
                                 </p>
                             </div>
                             <p className="text-[10px] text-zinc-500 italic">
                                 Why: {post.whyThisWorks}
                             </p>
                         </div>
                    </div>
                ))}
            </div>
       </div>
    </div>
  );

  const renderLLMs = () => (
    <div className="space-y-6 animate-slide-up">
        <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-zinc-300 mb-6 uppercase tracking-wide flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                Large Language Model (LLM) Visibility
            </h3>
            <div className="space-y-4">
                {data.llmPerformance?.map((llm, idx) => (
                    <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-zinc-700 transition-all">
                        <div className="flex-shrink-0">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border 
                                ${llm.model === 'ChatGPT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                  llm.model === 'Gemini' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
                                  'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                {llm.model[0]}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold text-white">{llm.model}</h4>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border
                                    ${llm.status === 'Top Choice' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                      llm.status === 'Option' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                                      'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                    {llm.status}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">Score: {llm.score}/100</span>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                                {llm.details}
                            </p>
                             <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${llm.score >= 80 ? 'bg-emerald-500' : llm.score >= 50 ? 'bg-blue-500' : 'bg-rose-500'}`}
                                    style={{ width: `${llm.score}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderMap = () => (
      <div className="space-y-6 animate-slide-up">
           <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-lg relative overflow-hidden h-[600px] flex flex-col">
               <div className="mb-4 flex justify-between items-end">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-emerald-500" />
                            Competitor Landscape
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">Geospatial analysis of top 15 competitors.</p>
                    </div>
               </div>
               
               <div className="flex-grow rounded-lg overflow-hidden border border-zinc-700 relative">
                   <Map 
                       defaultCenter={[data.businessCoordinates.lat, data.businessCoordinates.lng]} 
                       defaultZoom={13}
                       provider={(x, y, z, dpr) => {
                         return `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`
                       }}
                    >
                        {/* Business Marker */}
                        <Marker 
                            width={50} 
                            anchor={[data.businessCoordinates.lat, data.businessCoordinates.lng]} 
                            color="#10b981" 
                        />
                         <Overlay anchor={[data.businessCoordinates.lat, data.businessCoordinates.lng]} offset={[0, 40]}>
                            <div className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                YOU
                            </div>
                        </Overlay>

                        {/* Competitors */}
                        {data.localCompetitors?.map((comp, i) => (
                             <MarkerAny 
                                key={i}
                                width={30} 
                                anchor={[comp.lat, comp.lng]} 
                                color="#6366f1"
                                onClick={() => setHoveredCompetitor(comp)}
                            />
                        ))}
                   </Map>

                   {/* Hover Card Overlay */}
                   {hoveredCompetitor && (
                       <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-700 p-4 rounded-lg shadow-xl w-64 animate-fade-in z-[1000]">
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="font-bold text-white text-sm">{hoveredCompetitor.name}</h4>
                               <button onClick={() => setHoveredCompetitor(null)} className="text-zinc-500 hover:text-white">
                                   <StopIcon className="w-3 h-3" />
                               </button>
                           </div>
                           <div className="space-y-1">
                                <p className="text-xs text-zinc-400">Rank: <span className="text-indigo-400 font-bold">#{hoveredCompetitor.rank}</span></p>
                                <p className="text-xs text-zinc-400">Distance: <span className="text-zinc-300">{hoveredCompetitor.distance}</span></p>
                                {hoveredCompetitor.address && (
                                     <p className="text-[10px] text-zinc-500 border-t border-zinc-800 pt-1 mt-1">
                                        <span className="font-bold text-zinc-400">Verified Address:</span><br/>
                                        {hoveredCompetitor.address}
                                     </p>
                                )}
                           </div>
                       </div>
                   )}
               </div>
           </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">{businessName}</h2>
           <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wide">Analysis Complete</p>
           </div>
        </div>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide text-zinc-900 bg-white rounded hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <RefreshCwIcon className="w-3 h-3" />
          NEW AUDIT
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'studio', label: 'Creator Studio', icon: <PenToolIcon className="w-4 h-4 text-indigo-400" /> },
            { id: 'missions', label: 'Missions', icon: <FlameIcon className="w-4 h-4 text-orange-500" /> },
            { id: 'visual', label: 'Visual', icon: <SparklesIcon className="w-4 h-4 text-emerald-500" /> },
            { id: 'deepdive', label: 'Deep Dive' },
            { id: 'llms', label: 'Models' },
            { id: 'map', label: 'Map' },
            { id: 'citations', label: 'Citations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors uppercase tracking-wider flex items-center gap-2`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'missions' && completedMissions.length === 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
              {tab.id === 'studio' && <span className="text-[9px] bg-indigo-500 text-white px-1 rounded ml-1">NEW</span>}
              {tab.id === 'visual' && <span className="text-[9px] bg-emerald-500 text-white px-1 rounded ml-1">NEW</span>}
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
        {activeTab === 'deepdive' && renderDeepDive()}
        {activeTab === 'llms' && renderLLMs()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'citations' && renderCitations()}
      </div>

    </div>
  );
};

export default Dashboard;
