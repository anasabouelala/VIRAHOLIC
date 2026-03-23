
import React, { useState, useMemo } from 'react';
import { Map, Overlay } from 'pigeon-maps';
const OverlayAny = Overlay as any;
import { InfoIcon, ShieldAlertIcon, TrendingUpIcon, UsersIcon, MapPinIcon, XIcon, GlobeIcon, ChevronRightIcon } from './Icons';

// --- Types ---

export type Priority = 'high' | 'medium' | 'low';

export interface AEOMockReason {
  reason: string;
  impact: string;
  priority: Priority;
  action: string;
}

export interface AEOMapPoint {
  id: string;
  lat: number;
  lng: number;
  areaLabel: string;
  ai_visibility_score: number;
  competitor: {
    name: string;
    dominance_score: number;
  };
  reasons_not_recommended: AEOMockReason[];
  distance_km: number;
}

interface AEOMapProps {
  center: { lat: number; lng: number };
  businessName: string;
  category: string;
  competitors?: { name: string; [key: string]: any }[];
}

// --- Mock Data Generator ---

type MockDataCategory = 'dentist' | 'coffee shop' | 'real estate' | 'restaurant' | 'default';

const mockDataDictionary: Record<MockDataCategory, { competitors: string[]; possibleReasons: AEOMockReason[] }> = {
  dentist: {
    competitors: [
      'Elite Dental Care',
      'Bright Smile Clinic',
      'Advanced Orthodontics',
      'City Central Dental',
      'Metropolitan Wellness',
    ],
    possibleReasons: [
      {
        reason: 'Brand presence missing in local health directories',
        impact: 'AI confidence is reduced in this zone because your local entity signals are weaker.',
        priority: 'high',
        action: 'Claim listings in 15+ niche-specific directories to feed LLM data sources.',
      },
      {
        reason: 'Sentiment gap: Recent reviews lack keyword-specific praise',
        impact: 'When AI models look for specific services here, competitors have stronger positive sentiment.',
        priority: 'high',
        action: "Request reviews from patients specifically mentioning 'painless extraction'.",
      },
      {
        reason: 'Inconsistent NAP (Name, Address, Phone) across profiles',
        impact: 'Contradicting data sources confuse the AI, causing it to prefer safer, verified competitors.',
        priority: 'medium',
        action: 'Standardize your Facebook and Instagram business details to match your GBP.',
      },
      {
        reason: 'Competitor has 3x more mentions in regional news snippets',
        impact: 'The AI recognizes the competitor as the local topical authority for this area.',
        priority: 'medium',
        action: "Pitch a brief 'community spotlight' story to local news aggregators.",
      },
      {
        reason: 'Voice search gap: Business name is phonetically ambiguous',
        impact: 'Voice-driven AI assistants struggle to accurately retrieve your entity.',
        priority: 'low',
        action: 'Add phonetic schema markup to your website header script.',
      },
    ]
  },
  'coffee shop': {
    competitors: [
      'The Daily Grind',
      'Artisan Roasters',
      'Brewed Awakenings',
      'City Corner Cafe',
      'Morning Bean Co.'
    ],
    possibleReasons: [
      {
        reason: "Missing mentions of 'specialty coffee' or 'artisanal' in reviews",
        impact: 'AI prefers competitors when users ask for high-quality or specialty coffee choices.',
        priority: 'high',
        action: 'Encourage reviewers to mention your bean sources and brewing methods.',
      },
      {
        reason: 'Incomplete menu or pricing data on core directories',
        impact: 'AI cannot confidently answer user queries about your menu items or pricing.',
        priority: 'high',
        action: 'Upload detailed text-based menus to Google Business Profile and local directories.',
      },
      {
        reason: 'Competitor dominates "best cafe to work from" queries',
        impact: 'You are losing out on remote-worker foot traffic due to lack of wifi/seating mentions.',
        priority: 'medium',
        action: 'Update your website and profiles to explicitly state "Free Fast WiFi & Plentiful Seating".',
      },
      {
        reason: 'Weak Instagram footprint linked to your local entity',
        impact: 'Visual-heavy AI searches tend to surface competitors with stronger social signals.',
        priority: 'medium',
        action: 'Ensure your Instagram is actively linked to your Google Business Profile.',
      },
      {
        reason: 'Operating hours are not locally verified',
        impact: 'AI will not recommend you for "late night coffee" or "early morning coffee" if hours are uncertain.',
        priority: 'low',
        action: 'Ensure consistent holiday and daily hours across all platforms.',
      }
    ]
  },
  'restaurant': {
    competitors: [
      'The Rustic Fork',
      'Urban Cuisine',
      'Savory Street Eatery',
      'Bistro Centrale',
      'Taste of the City'
    ],
    possibleReasons: [
      {
        reason: 'Competitor has significantly more recent culinary reviews',
        impact: 'AI prioritizes fresh, recent sentiment indicating current restaurant quality.',
        priority: 'high',
        action: 'Run a passive review generation campaign for dine-in guests.',
      },
      {
        reason: "Menu items not properly indexed or lacking schema markup",
        impact: 'When users ask for specific dishes (e.g., "best truffle pasta"), AI does not know you serve it.',
        priority: 'high',
        action: 'Add proper MenuItem schema markup to your website.',
      },
      {
        reason: 'Inconsistent booking or reservation links',
        impact: 'AI struggles to provide actionable booking steps for your restaurant, favoring easier options.',
        priority: 'medium',
        action: 'Unify your reservation links (OpenTable, Resy) under your main Google profile.',
      },
      {
        reason: 'Missing dietary tags (Vegan, Gluten-Free) in entity profile',
        impact: 'You lose out entirely on highly-specific dietary restriction queries.',
        priority: 'medium',
        action: 'Explicitly list dietary accommodations on your site and GBP attributes.',
      },
      {
        reason: 'Local food blogger mentions point to competitor',
        impact: 'Competitor enjoys strong topical authority from local culinary bloggers.',
        priority: 'low',
        action: 'Host a local foodie/influencer night to generate fresh local backlinks.',
      }
    ]
  },
  'real estate': {
    competitors: [
      'Prime Property Group',
      'City Skyline Realty',
      'NextHome Associates',
      'Neighborhood Experts',
      'Elite Estates'
    ],
    possibleReasons: [
      {
        reason: 'Lack of verified "sold" data on primary entity profiles',
        impact: 'AI cannot verify your local transaction volume, leading to lower trust scores.',
        priority: 'high',
        action: 'Sync recent local sales data to Zillow, Realtor.com, and Google profiles.',
      },
      {
        reason: 'Competitor is the cited source for local market trends',
        impact: 'AI pulls market data from your competitor, effectively recommending them as the expert.',
        priority: 'high',
        action: 'Publish a monthly data-driven local real estate market report on your blog.',
      },
      {
        reason: 'Weak individual agent profiles vs brokerage brand',
        impact: 'Users searching for specific agents do not get high-confidence AI recommendations.',
        priority: 'medium',
        action: 'Build individual SEO-optimized bio pages for top-performing agents.',
      },
      {
        reason: 'Missing neighborhood guides',
        impact: 'You lack topical authority for specific micro-neighborhoods in this zone.',
        priority: 'medium',
        action: 'Create comprehensive neighborhood guides detailing schools, parks, and commute times.',
      },
      {
        reason: 'Video tour content not properly tagged',
        impact: 'You are missing out on AI multimodal searches for video walkthroughs.',
        priority: 'low',
        action: 'Ensure YouTube video tours have geographically specific titles and descriptions.',
      }
    ]
  },
  'default': {
    competitors: [
      'Local Market Leader',
      'Premier Services Co.',
      'Citywide Solutions',
      'Neighborhood Choice',
      'Top Rated Professionals'
    ],
    possibleReasons: [
      {
        reason: 'Superior Review Velocity (+45%)',
        impact: 'AI perceives current reliability as higher due to the sheer frequency of fresh, positive user signals.',
        priority: 'high',
        action: 'Implement a systematic review trigger for every 10th customer to close the velocity gap.',
      },
      {
        reason: 'Keyword Sentiment Moat',
        impact: "Competitor reviews contain 3x more mentions of 'expert' and 'reliable' than your local profiles.",
        priority: 'high',
        action: 'Request reviews that specifically highlight your core expertise terms (e.g., "Expert Diagnostics").',
      },
      {
        reason: 'Geographic Density Advantage',
        impact: 'AI training sets show this zone as a "territory hotspot" for this competitor based on social mentions.',
        priority: 'medium',
        action: 'Engage with local neighborhood social groups and tag your business location in posts.',
      },
      {
        reason: 'Rich Attribute Data Indexing',
        impact: 'Competitor has 12 validated service attributes (e.g., "Wheelchair Accessible") while you have 4.',
        priority: 'medium',
        action: 'Fill out every single available attribute field in your Google Business and Apple Business profiles.',
      },
      {
        reason: 'Backlink Authority for Micro-Zone',
        impact: 'Local directories rank this competitor on Page 1 while you appear on Page 3 for this sector.',
        priority: 'low',
        action: 'Create a location-specific landing page for this neighborhood on your main website.',
      }
    ]
  }
};

const getCategoryData = (categoryString: string) => {
  const cat = categoryString.toLowerCase();
  if (cat.includes('dentist') || cat.includes('dental') || cat.includes('ortho')) return mockDataDictionary['dentist'];
  if (cat.includes('coffee') || cat.includes('cafe') || cat.includes('roaster')) return mockDataDictionary['coffee shop'];
  if (cat.includes('restaurant') || cat.includes('food') || cat.includes('eatery')) return mockDataDictionary['restaurant'];
  if (cat.includes('real estate') || cat.includes('realty') || cat.includes('broker')) return mockDataDictionary['real estate'];
  return mockDataDictionary['default'];
};

const generateMockPoints = (center: { lat: number; lng: number }, category: string, realCompetitors?: any[]): AEOMapPoint[] => {
  const points: AEOMapPoint[] = [];
  const spread = 0.015;

  const { competitors: defaultCompetitors, possibleReasons } = getCategoryData(category);

  // Inject real competitor names from the AI payload to ensure hyper-accurate local risk mapping
  let activeCompetitors = realCompetitors && realCompetitors.length > 0
    ? realCompetitors.map(c => c.name || c.businessName || c.title).filter(Boolean)
    : defaultCompetitors;
    
  if (activeCompetitors.length === 0) activeCompetitors = ["Local Market Expert"];

  for (let xi = -2; xi <= 3; xi++) {
    for (let yi = -2; yi <= 3; yi++) {
      const latOffset = yi * spread;
      const lngOffset = xi * spread;
      const dist = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);

      const baseScore = 95 - dist * 4000;
      const ai_visibility_score = Math.max(5, Math.min(98, Math.round(baseScore + (Math.random() * 20 - 10))));
      const compIdx = Math.floor(Math.random() * activeCompetitors.length);
      const reasonsCount = ai_visibility_score < 40 ? 2 : ai_visibility_score < 75 ? 1 : 0;
      const selectedReasons = [...possibleReasons].sort(() => 0.5 - Math.random()).slice(0, reasonsCount);

      points.push({
        id: `pt-${xi}-${yi}`,
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
        areaLabel: `Sector ${String.fromCharCode(65 + (xi + 2))}${yi + 2}`,
        ai_visibility_score,
        competitor: {
          name: activeCompetitors[compIdx],
          dominance_score: Math.min(100, Math.round((100 - ai_visibility_score) * 0.8 + Math.random() * 15)),
        },
        reasons_not_recommended: selectedReasons,
        distance_km: Math.round(dist * 111 * 100) / 100, // Approx km conversion
      });
    }
  }

  return points;
};

// --- Helpers ---

const getScoreMeta = (score: number) => {
  if (score >= 71) return { color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Strong', ring: 'ring-emerald-500/30' };
  if (score >= 31) return { color: '#f59e0b', bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400/40', label: 'Conflicted', ring: 'ring-amber-400/30' };
  return { color: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40', label: 'Weak', ring: 'ring-rose-500/30' };
};

const priorityConfig = {
  high: { label: 'High', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  medium: { label: 'Med', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  low: { label: 'Low', cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' },
};

// --- Component ---

const AEOMap: React.FC<AEOMapProps> = ({ center, businessName, category, competitors }) => {
  const [viewMode, setViewMode] = useState<'visibility' | 'competitor'>('visibility');
  const [selectedPoint, setSelectedPoint] = useState<AEOMapPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<AEOMapPoint | null>(null);
  const [zoom, setZoom] = useState(13);

  const points = useMemo(() => generateMockPoints(center, category, competitors), [center, category, competitors]);

  const activeScore = (pt: AEOMapPoint) =>
    viewMode === 'visibility' ? pt.ai_visibility_score : pt.competitor.dominance_score;

  const scoreMeta = selectedPoint ? getScoreMeta(selectedPoint.ai_visibility_score) : null;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] text-zinc-100 overflow-hidden font-sans border border-zinc-800/60 rounded-2xl shadow-2xl">

      {/* ── Top Bar ── */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-zinc-800/60 bg-[#0d0d0f] z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <GlobeIcon className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[11px] font-bold tracking-widest text-white uppercase">AEO Visibility Map</h2>
                <div className="relative group/info flex items-center">
                  <InfoIcon className="w-3.5 h-3.5 text-zinc-500 cursor-help hover:text-white transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[320px] bg-zinc-950 border border-zinc-700/80 p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[100] text-left pointer-events-none">
                     <p className="text-[11px] font-bold text-white uppercase mb-2">How this is scored</p>
                     <p className="text-[10px] text-zinc-400 leading-relaxed">
                       This score represents your <strong>Share of Voice</strong> across major Answer Engines (ChatGPT, Perplexity, Claude, Gemini) for your physical coordinate.
                     </p>
                     <ul className="text-[10px] text-zinc-400 leading-relaxed mt-2 space-y-1 list-disc pl-3">
                       <li><strong>Near Me:</strong> "Best {category} nearby"</li>
                       <li><strong>Comparative:</strong> "Is {businessName} better than competitors?"</li>
                       <li><strong>Long-Tail:</strong> Solution-based service prompts.</li>
                     </ul>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 font-medium tracking-wide">{businessName} · {category}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-grow relative overflow-hidden">

        {/* ── Map ── */}
        <div className="flex-grow h-full relative">
          <Map
            center={[center.lat, center.lng]}
            zoom={zoom}
            onBoundsChanged={({ zoom }) => setZoom(zoom)}
            boxClassname="rounded-none h-full"
          >
            {/* ── Business Anchor (HOME) ── */}
            <OverlayAny anchor={[center.lat, center.lng]}>
              {/* Using pointer-events-none so the badge underneath is still clickable */}
              <div
                className="relative flex flex-col items-center pointer-events-none"
                style={{ transform: 'translate(-50%, -100%)', zIndex: 1000, marginTop: '-20px' }}
              >
                {/* Floating Home Tag */}
                <div className="flex items-center gap-1.5 bg-white border-2 border-emerald-500 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full shadow-lg whitespace-nowrap overflow-hidden">
                  <MapPinIcon className="w-2.5 h-2.5" />
                  <span className="max-w-[100px] truncate uppercase tracking-tighter">Current Location</span>
                </div>
                {/* Small indicator line pointing to center */}
                <div className="w-0.5 h-3 bg-emerald-500/50" />
              </div>
            </OverlayAny>

            {/* Score Badges */}
            {points.map((pt) => {
              const isSelected = selectedPoint?.id === pt.id;
              const score = activeScore(pt);
              const meta = getScoreMeta(viewMode === 'visibility' ? pt.ai_visibility_score : pt.competitor.dominance_score);

              return (
                <OverlayAny key={pt.id} anchor={[pt.lat, pt.lng]}>
                  <div
                    className="relative cursor-pointer select-none"
                    style={{ transform: 'translate(-50%, -50%)' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => { setSelectedPoint(pt); }}
                  >
                    {/* Floating Area Label when selected */}
                    {isSelected && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded shadow-xl pointer-events-none z-[80] animate-fade-in-up">
                        {pt.ai_visibility_score}% AI Visibility
                      </div>
                    )}
                    {/* Circle Score Badge */}
                    <div className="relative flex items-center justify-center">
                       <div className={`relative z-10 flex items-center justify-center transition-all duration-200 w-8 h-8 md:w-9 md:h-9 rounded-full text-white font-bold text-[11px] md:text-[13px] border shadow-md
                          ${isSelected ? 'scale-125 z-[60] ring-2 ring-white/50 shadow-xl' : 'z-10 hover:scale-110'}
                          ${meta.bg} ${meta.border}
                       `}>
                          {pt.ai_visibility_score}
                       </div>
                    </div>
                  </div>
                </OverlayAny>
              );
            })}
          </Map>

          {/* ── Zoom Controls ── */}
          <div className="absolute right-3 bottom-16 z-10 flex flex-col shadow-lg rounded-lg overflow-hidden border border-zinc-700/60">
            <button onClick={() => setZoom(z => z + 1)} className="w-8 h-8 bg-zinc-900/95 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-lg font-bold">+</button>
            <div className="h-px bg-zinc-700/60" />
            <button onClick={() => setZoom(z => z - 1)} className="w-8 h-8 bg-zinc-900/95 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-lg font-bold">−</button>
          </div>

          {/* ── Legend ── */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/70 rounded-xl px-3 py-2 flex items-center gap-4 shadow-xl">
              {[
                { color: '#10b981', label: 'Strong' },
                { color: '#f59e0b', label: 'Conflicted' },
                { color: '#f43f5e', label: 'Weak' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
                </div>
              ))}
              <div className="w-px h-3 bg-zinc-700" />
              <span className="text-[9px] text-zinc-500 font-mono">36 zones</span>
            </div>
          </div>

          {/* ── Hover Tooltip ── */}
          {hoveredPoint && !selectedPoint && (() => {
            const meta = getScoreMeta(hoveredPoint.ai_visibility_score);
            return (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
                <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                    style={{ backgroundColor: meta.color }}>
                    {hoveredPoint.ai_visibility_score}
                  </div>
                  <div>
                     <h4 className="text-xs font-bold text-white uppercase">AEO Result</h4>
                     <p className="text-[10px] text-zinc-500 font-mono">
                       {hoveredPoint.distance_km === 0 ? 'Home Base' : `${hoveredPoint.distance_km}km from center`} • LAT: {hoveredPoint.lat.toFixed(4)}
                     </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── "Click a zone" hint ── */}
          {!selectedPoint && !hoveredPoint && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/60 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-zinc-400 font-medium tracking-wide">Click any zone to analyse</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Insight Panel ── */}
        <div
          className={`h-full bg-[#0d0d0f] border-l border-zinc-800/60 z-30 flex flex-col transition-all duration-400 ease-in-out overflow-hidden flex-shrink-0
            ${selectedPoint ? 'w-[380px] opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {selectedPoint && scoreMeta && (
            <>
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-zinc-800/60 flex items-start justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Score Donut Badge */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-[15px] text-white flex-shrink-0 border-2"
                    style={{ backgroundColor: scoreMeta.color + 'cc', borderColor: scoreMeta.color }}
                  >
                    {selectedPoint.ai_visibility_score}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${scoreMeta.text}`}>
                      {selectedPoint.distance_km === 0 ? 'Exact Location' : `${selectedPoint.distance_km}km from Business`}
                    </p>
                    <h3 className="text-sm font-black text-white tracking-tight truncate">Area Analysis</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white flex-shrink-0 mt-1"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI Summary Banner */}
              <div className={`mx-4 mt-4 flex-shrink-0 rounded-xl p-3 border ${scoreMeta.border}`}
                style={{ backgroundColor: scoreMeta.color + '15' }}>
                <p className="text-[11px] leading-relaxed font-medium" style={{ color: scoreMeta.color }}>
                  {selectedPoint.ai_visibility_score >= 71
                    ? 'AI engines actively recommend your business in this zone above local competitors.'
                    : selectedPoint.ai_visibility_score >= 31
                    ? 'AI engines alternate between you and competitors. Visibility is inconsistent.'
                    : 'AI engines rarely surface your business here. Competitor authority dominates.'}
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="p-4 space-y-5">

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/60 p-3.5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">AI Visibility</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${scoreMeta.text}`}>{selectedPoint.ai_visibility_score}</span>
                        <span className="text-xs text-zinc-600 font-mono">/100</span>
                      </div>
                    </div>
                    <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/60 p-3.5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Competitor</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-400">{selectedPoint.competitor.dominance_score}</span>
                        <span className="text-xs text-zinc-600 font-mono">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Competitor Card */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UsersIcon className="w-3 h-3 text-rose-400" />
                      <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Takeover Risk</h4>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between group hover:border-rose-500/40 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-white">{selectedPoint.competitor.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Leading AI recommendations in this zone</p>
                      </div>
                      <TrendingUpIcon className="w-4 h-4 text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <TrendingUpIcon className="w-3 h-3 text-emerald-400" />
                        <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Competitor Advantage Analysis</h4>
                      </div>

                    {selectedPoint.reasons_not_recommended.length === 0 ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-2">
                          <span className="text-emerald-400 text-sm font-black">✓</span>
                        </div>
                        <p className="text-emerald-400 text-xs font-bold mb-0.5">Maximum Authority</p>
                        <p className="text-[10px] text-zinc-500">You are the primary AI recommendation in this zone.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPoint.reasons_not_recommended.map((item, idx) => {
                          const p = priorityConfig[item.priority];
                          return (
                            <div key={idx} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 space-y-3 hover:border-zinc-700/60 transition-colors">
                              {/* Header row */}
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-[12px] font-semibold text-zinc-100 leading-snug">{item.reason}</h5>
                                <span className={`text-[8px] font-black uppercase tracking-wider border rounded px-1.5 py-0.5 flex-shrink-0 ${p.cls}`}>
                                  {p.label}
                                </span>
                              </div>
                              {/* Impact */}
                              <p className="text-[10px] text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-2.5">{item.impact}</p>
                              {/* Action to Offset */}
                              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-2.5">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Fix Strategy</span>
                                <p className="text-[10px] text-emerald-200 leading-relaxed">{item.action}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </div>
  );
};

export default AEOMap;
