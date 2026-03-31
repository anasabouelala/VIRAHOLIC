import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircleIcon } from './Icons'; // Adjust import if needed

export interface AIVoiceIntentGraphProps {
    businessName: string;
    category?: string;
    competitors?: any[];
    score: number;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, stroke } = props;
  
  if (dataKey === 'userBrand' && payload.dropoff && payload.userBrand < 40) {
     return (
        <svg x={cx - 16} y={cy - 16} width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
           <circle cx="16" cy="16" r="12" fill="#ef4444" className="animate-ping origin-center opacity-20" />
           <circle cx="16" cy="16" r="6" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
        </svg>
     );
  }
  
  return <circle cx={cx} cy={cy} r={4} fill={stroke} stroke="#09090b" strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dropoffProp = payload.find((p: any) => p.payload.dropoff);
        const userBrandVal = payload.find((p: any) => p.dataKey === 'userBrand')?.value || 0;
        
        // Custom warning tooltip strictly for the dropoff turn if score is low
        if (dropoffProp && dropoffProp.payload.turn === 3 && userBrandVal < 40) {
             return (
                 <div className="bg-zinc-950 border border-rose-500/40 p-5 rounded-xl shadow-2xl max-w-sm z-50 relative overflow-hidden backdrop-blur-xl">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-700" />
                     <h4 className="text-rose-400 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <AlertCircleIcon className="w-4 h-4" />
                        Probability Collapse
                     </h4>
                     <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                        As user intent temperature reached 'High', AI eliminated your brand due to missing semantic authority. Competitors captured your share entirely.
                     </p>
                     <button className="text-[10px] uppercase tracking-widest bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 px-3 py-1.5 rounded transition-colors border border-rose-500/20">
                        Fix Visibility &rarr;
                     </button>
                 </div>
             );
        }

        // Standard tooltip
        return (
            <div className="bg-zinc-950/90 backdrop-blur border border-zinc-800 p-4 rounded-xl shadow-xl">
                 <p className="text-zinc-400 text-[10px] mb-3 font-bold uppercase tracking-widest">{label}</p>
                 <div className="space-y-2">
                     {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-6">
                              <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {entry.name}
                              </span>
                              <span className="text-sm font-mono font-bold" style={{ color: entry.color }}>
                                  {Math.round(entry.value)}%
                              </span>
                          </div>
                     ))}
                 </div>
            </div>
        );
    }
    return null;
};

const AIVoiceIntentGraph: React.FC<AIVoiceIntentGraphProps> = ({ businessName, category, competitors, score }) => {
  const compAMock = Array.isArray(competitors) && competitors.length > 0 ? competitors[0].name : "Competitor A";
  const compBMock = Array.isArray(competitors) && competitors.length > 1 ? competitors[1].name : "Competitor B";

  const data = React.useMemo(() => {
    const s = score || 50;
    // Survival curve: High scores stay high, low scores collapse
    const t3 = s > 70 ? s - 10 : s > 40 ? s / 2 : 5;
    const t4 = s > 70 ? s - 5 : s > 40 ? s / 4 : 2;

    return [
        { turn: 1, prompt: "Broad Discovery", userBrand: s, competitorA: 70, competitorB: 90, intent: "Cold" },
        { turn: 2, prompt: "Feature Filtering", userBrand: Math.max(0, s - 5), competitorA: 85, competitorB: 40, intent: "Warm" },
        { turn: 3, prompt: "High-Intent Niche", userBrand: Math.max(0, t3), competitorA: 95, competitorB: 20, intent: "Hot", dropoff: s < 70 },
        { turn: 4, prompt: "Transactional", userBrand: Math.max(0, t4), competitorA: 98, competitorB: 10, intent: "Action" },
    ];
  }, [score]);

  return (
    <div className="w-full relative rounded-xl border border-zinc-800/60 bg-zinc-950 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-zinc-800/60 z-20 bg-zinc-950 rounded-t-xl">
            <div className="flex items-center gap-2">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">AI Share of Voice & Intent</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Conversational Search Survival</p>
                </div>
                <div className="group/tooltip relative flex items-center justify-center ml-2">
                    <AlertCircleIcon className="w-4 h-4 text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 shadow-2xl backdrop-blur-md hidden sm:block">
                        <strong className="text-white block mb-1">Survival Analysis</strong>
                        This simulates a 4-stage conversational search. Users start with <strong>Broad Discovery</strong> (e.g. "coffee shop in SF") and move towards <strong>Hot Intent</strong> (e.g. "quiet place with reliable Wi-Fi and outlets"). Your brand's survival depends on how well you match specific semantic intents.
                    </div>
                </div>
            </div>
        </div>

        {/* Graph Area */}
        <div className="relative w-full h-[360px] overflow-hidden rounded-b-xl pb-4">
            {/* The Intent Temperature Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-rose-500/10 pointer-events-none z-0" />
            
            {/* Legend */}
            <div className="absolute top-4 right-6 z-10 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Your Brand</span>
                    <div className="w-4 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">{compAMock} (Winner)</span>
                    <div className="w-4 h-0.5 bg-zinc-400 border-t border-dashed border-zinc-400"></div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-right">{compBMock} (Lost)</span>
                    <div className="w-4 h-[1px] bg-zinc-600"></div>
                </div>
            </div>

            <div className="w-full h-full pt-16 pr-6 z-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                            dataKey="prompt" 
                            stroke="#52525b" 
                            tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            stroke="#52525b" 
                            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line 
                            type="monotone" 
                            dataKey="competitorB" 
                            name={compBMock}
                            stroke="#52525b" 
                            strokeWidth={1.5} 
                            dot={false}
                            activeDot={{ r: 4, fill: '#52525b', stroke: '#18181b', strokeWidth: 2 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="competitorA" 
                            name={compAMock}
                            stroke="#9ca3af" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 4, fill: '#9ca3af', stroke: '#18181b', strokeWidth: 2 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="userBrand" 
                            name={businessName}
                            stroke="#22d3ee" 
                            strokeWidth={4}
                            filter="url(#glow)"
                            dot={<CustomDot />}
                            activeDot={<CustomDot />}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {/* Intent Temperature Label */}
            <div className="absolute bottom-3 right-6 z-10 flex items-center gap-2 pointer-events-none opacity-60">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Intent Temp:</span>
                <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Hot</span>
            </div>
        </div>
    </div>
  );
};

export default AIVoiceIntentGraph;
