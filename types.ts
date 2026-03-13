
export interface BusinessInfo {
  name: string;
  location: string;
  category: string;
  website?: string;
  keywords?: string;
  images?: string[]; // Array of Base64 strings
}

export interface Simulation {
  query: string;
  aiResponse: string;
  rank: 'Top Recommendation' | 'Mentioned' | 'Not Found';
}

export enum ImpactLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Recommendation {
  title: string;
  description: string;
  impact: ImpactLevel;
  actionItem: string;
}

export interface Competitor {
  name: string;
  strengths: string[];
}

export interface PersonaSimulation {
  personaName: string;
  userIntent: string;
  simulatedQuery: string;
  aiResponseSummary: string;
  brandMentioned: boolean;
}

export interface ContentGap {
  missingElement: string;
  importance: ImpactLevel;
  fix: string;
}

export interface PlatformPerformance {
  platform: 'Chat Interfaces' | 'Voice Search' | 'Traditional Search';
  score: number;
  status: 'Optimized' | 'Needs Work' | 'Invisible';
}

// New Types
export interface LLMPerformance {
  model: 'ChatGPT' | 'Gemini' | 'Perplexity';
  status: 'Top Choice' | 'Option' | 'Hidden';
  details: string;
  score: number; // 0-100 visibility score
}

export interface CitationOpportunity {
  siteName: string;
  domain: string;
  type: 'Directory' | 'Social' | 'Forum' | 'Health/Niche' | 'LLM Data Source';
  priority: ImpactLevel;
  reason: string;
  isListed: boolean;
  feedsModels: string[]; // e.g. ["Gemini", "ChatGPT"]
}

export interface LocalCompetitorLocation {
  name: string;
  rank: number;
  distance: string; // e.g., "0.5 miles"
  lat: number;
  lng: number;
  address?: string; // Verified address
  sourceUrl: string; // REQUIRED: Where this competitor was found (Must be valid URL)
  rating?: number; // e.g., 4.8
  reviewCount?: number; // e.g., 150
  profileCompleteness?: number; // 0-100 percentage based on GBP features
}

// Feature 3: Keyword Heist
export interface LLMPromptVolume {
  gemini: number;
  chatgpt: number;
  claude: number;
  perplexity: number;
}

export interface KeywordGap {
  term: string;
  owner: 'Competitor' | 'You' | 'Shared';
  intent: 'Navigational' | 'Commercial' | 'Deep Research';
  llmPromptVolumes: LLMPromptVolume; // Per-LLM estimated monthly prompt volume
  opportunityScore: number; // 0-100
}

// Feature 5: Sentiment Audit
export interface NegativeEntity {
  term: string; // e.g. "Rude", "Slow", "Expensive"
  frequency: string; // e.g. "14% of reviews"
  impact: 'Critical' | 'Moderate' | 'Low';
}

// New Rich Attribute Interface for clearer KPIs
export interface AttributeDetail {
  score: number;
  label: string; // e.g. "Excellent", "Needs Work"
  explanation: string; // Simple English explanation
  action: string; // Immediate next step
}

// Recurring Usage Feature: Daily Missions
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xp: number; // Gamification points 10-50
  category: 'Content' | 'Review' | 'Social';
  estimatedTime: string; // e.g. "2 mins"
}

// New Feature: AI Content Studio
export interface SocialPostIdea {
  platform: 'Instagram' | 'LinkedIn' | 'GMB';
  focusKeyword: string;
  caption: string;
  hashtags: string[];
  imageIdea: string;
  whyThisWorks: string; // Connects back to the audit gap
}

// New Feature: Voice Simulator
export interface VoiceSimulation {
  query: string;
  script: string; // What the AI "Says"
  voiceParams: {
    pitch: number;
    rate: number;
  };
}

// Feature: Visual GEO Audit
export interface VisualAnalysis {
  overallVibe: string;
  score: number;
  detectedTags: string[];
  missingCrucialEntities: string[];
  intentScores: { intent: string; score: number }[];
  extractedText: string[];
  qualityWarning?: string;
  improvements: string;
  source: 'Upload' | 'GMB_Scan' | 'Not_Found';
}

// Feature: Hallucination Monitor
export interface FactCheckItem {
  question: string; // e.g., "Is there parking?"
  aiAnswer: string; // "Yes, free parking available."
  confidence: string; // "High" | "Low"
  sourceUrl: string; // REQUIRED: URL verifying this fact
}

// Feature: Hallucination Wall
export interface HallucinationWallResult {
  status: 'Verified' | 'Hallucinated' | 'Unverifiable';
  claim: string;
  truth: string;
  sourceUrl?: string; // Where the reality check comes from
}

// Feature: PAA Hijacker
export interface VoiceQAPair {
  question: string; // "Who has the best gluten free pizza?"
  answer: string; // The perfect 40-word answer to paste
  intent: string; // "Discovery" or "Transactional"
}

// Feature: Market Intelligence (New)
export interface MarketOverview {
  marketVibe: string; // e.g. "Oversaturated with low-quality options"
  competitionLevel: 'Cut-throat' | 'Moderate' | 'Low' | 'Blue Ocean';
  popularPrompts: string[]; // Actual prompts users type for this category
  opportunityNiche: string; // The "Gap" in the market
  hiddenRankingFactor: string; // Specific secret for this area
}

export interface AnalysisResult {
  reasoningChain: {
    layer1_DataIngestion: string;
    layer2_VisibilityMath: string;
    layer3_SimulationAlignment: string;
  };
  overallScore: number;
  summary: string;
  attributes: {
    authority: AttributeDetail;
    consistency: AttributeDetail;
    sentiment: AttributeDetail;
    relevance: AttributeDetail;
    citations: AttributeDetail;
  };
  simulations: Simulation[];
  personas: PersonaSimulation[];
  contentGaps: ContentGap[];
  platformPerformance: PlatformPerformance[];

  // New Fields
  llmPerformance: LLMPerformance[];
  citationOpportunities: CitationOpportunity[];
  localCompetitors: LocalCompetitorLocation[];
  businessCoordinates: { lat: number; lng: number };

  // High Value Features
  keywordHeist: KeywordGap[];
  sentimentAudit: {
    toxicityScore: number; // 0-100 (0 is clean, 100 is toxic)
    negativeEntities: NegativeEntity[];
    summary: string;
  };

  // Recurring Usage
  dailyMissions: DailyMission[];

  // SaaS Value Features
  contentStrategy: SocialPostIdea[];
  voiceSimulation: VoiceSimulation;

  // Latest Features
  visualAudit?: VisualAnalysis;
  factCheck?: FactCheckItem[];
  hallucinationWall?: HallucinationWallResult[];
  voiceSearchQA?: VoiceQAPair[];
  marketOverview?: MarketOverview;

  competitors: Competitor[];
  recommendations: Recommendation[];
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}
