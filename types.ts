
export interface BusinessInfo {
  name: string;
  location: string;
  category: string;
  website?: string;
  keywords?: string;
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
  type: 'Directory' | 'Social' | 'Forum' | 'Health/Niche';
  priority: ImpactLevel;
  reason: string;
}

export interface LocalCompetitorLocation {
  name: string;
  rank: number;
  distance: string; // e.g., "0.5 miles"
  x: number; // Relative coordinate for map visualization (-10 to 10)
  y: number; // Relative coordinate for map visualization (-10 to 10)
}

// Feature 3: Keyword Heist
export interface KeywordGap {
  term: string;
  owner: 'Competitor' | 'You' | 'Shared';
  searchVolume: 'High' | 'Medium' | 'Low';
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

export interface AnalysisResult {
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
  
  competitors: Competitor[];
  recommendations: Recommendation[];
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}
