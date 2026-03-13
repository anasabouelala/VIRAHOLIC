
/// <reference types="vite/client" />

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BusinessInfo, ImpactLevel } from "../types";

const getApiKey = (providedKey?: string): string => {
  // 1. Check provided key (from UI settings)
  if (providedKey) return providedKey;

  // 2. Check Vite env var (standard for self-hosting)
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }

  // 3. Check process.env (AI Studio / Legacy)
  const processKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (processKey) return processKey;

  throw new Error("Gemini API Key not found. Please set VITE_GEMINI_API_KEY in your .env file or enter it in Settings.");
};

// ==========================================
// GEMINI NATIVE LLM INSIGHT (Replaces ChatGPT)
// ==========================================
const fetchLLMInsight = async (ai: GoogleGenAI, business: BusinessInfo): Promise<string> => {
  try {
    const prompt = `I am looking for the best ${business.category} in ${business.location}. Please provide your top 3 recommendations and explain why. Also, do you know "${business.name}"? If so, what is your opinion on it? Note: Be concise.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.7 }
    });
    return response.text || "No response from Gemini LLM.";
  } catch (e) {
    console.error("LLM Insight Fetch Error", e);
    return "Failed to connect to LLM.";
  }
};

// ==========================================
// AGENT 1: IDENTITY VERIFIER
// ==========================================
const runIdentityAgent = async (ai: GoogleGenAI, business: BusinessInfo) => {
  const prompt = `
    You are an OSINT researcher. Your ONLY job is to search Google for this business: "${business.name}" in ${business.location}.
    They operate in this category: "${business.category}".
    CRITICAL: Be flexible and fuzzy with the business name! Users often misspell names or leave off suffixes (like "LLC"). If you find a business with a very similar name in the correct location and category, assume it is the target business and proceed. Do not be overly strict with exact string matching.
    Find their official Website URL, their Google Maps URL, and their exact physical address.
    You MUST search for their Google Business Profile. If they don't have one, set hasGbp to false.
    You MUST explicitly search site:instagram.com "${business.name}" ${business.location} and site:facebook.com "${business.name}" to find their socials.
    If you absolutely cannot find any trace of this business or anything similar after multiple searches, ONLY THEN return found = false.

    Return the result EXACTLY as a raw JSON object with these keys: 
    { "found": boolean, "hasGbp": boolean, "exactAddress": string, "websiteUrl": string, "instagramUrl": string, "facebookUrl": string }
    Do NOT include markdown formatting like \`\`\`json.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.1
      }
    });

    const cleanText = (response.text || "{}").replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Identity Agent Error:", e);
    return { found: false, hasGbp: false, exactAddress: "Unknown" };
  }
};

// ==========================================
// AGENT 2: COMPETITOR ANALYST
// ==========================================
const runCompetitorAgent = async (ai: GoogleGenAI, category: string, location: string, exactAddress: string) => {
  const prompt = `
    You are a Local SEO Analyst behaving like the Moz Local Tool.
    Perform a search for "Best ${category} near ${exactAddress || location}".
    Return a strict JSON list of the top 5 competitors that appear on Google Maps. 
    For each, calculate their estimated distance, real verified address, and verified website or maps URL.
    CRITICALLY: From the search snippets, extract their actual Google Rating (e.g. 4.8) and Review Count (e.g. 215).
    Also, estimate a "profileCompleteness" score (0-100) based on how rich their listing appears in the snippet (e.g., presence of detailed address, ratings, hours).
    If they do not have a verified URL, SKIP THEM. Do not guess coordinates; infer them accurately from the address.
    
    Return EXACTLY a raw JSON object with a single "competitors" array. Each competitor MUST have "name", "rank", "distance", "lat", "lng", "address", "sourceUrl", "rating", "reviewCount", "profileCompleteness".
    Do NOT include markdown formatting like \`\`\`json.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.1
      }
    });

    const cleanText = (response.text || "{}").replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(cleanText).competitors || [];
  } catch (e) {
    console.error("Competitor Agent Error:", e);
    return [];
  }
};

// ==========================================
// GEMINI CITATION SCANNER (Replaces Serper API)
// ==========================================
const runCitationAgent = async (ai: GoogleGenAI, businessName: string, location: string, category: string) => {
  const prompt = `
    You are an OSINT researcher looking for the absolute most impactful directory citations and LLM data sources for a business in the "${category}" niche, located in "${location}".
    First, identify the top 5 most critical citation directories explicitly for this niche (e.g. if it's a restaurant, Yelp & TripAdvisor; if it's home services, Houzz & Angi; if medical, Healthgrades; otherwise generic like BBB, Foursquare).
    Then, attempt searches to check if "${businessName}" is listed on those 5 specific domains.
    Return a strict JSON list of these top 5 platforms. For each platform, indicate whether the business is found (isListed: true) or not (isListed: false).
    Return the result EXACTLY as a raw JSON object with a single "citations" array. Each citation should have "siteName", "domain", "reason" (why this site matters to LLMs for this niche), and "isListed" (boolean).
    Do NOT include markdown formatting like \`\`\`json.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.1
      }
    });

    const cleanText = (response.text || "{}").replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(cleanText).citations || [];
  } catch (e) {
    console.error("Citation Agent Error:", e);
    return [];
  }
};

// ==========================================
// AGENT X: SENTIMENT MINER
// ==========================================
const runSentimentAgent = async (ai: GoogleGenAI, businessName: string, location: string) => {
  const prompt = `
    You are a Reputation Analyst. Search Google for reviews of "${businessName}" in "${location}".
    Look closely for their Google Business Profile rating, Yelp rating, or Tripadvisor rating within the search snippets.
    Read through any review snippets visible in the search results and identify common negative themes or complaints.
    If you find any review data, return a JSON object with: 
    { "hasReviews": true, "rating": number, "reviewCount": number, "negativeThemes": ["array", "of", "strings"] }
    If you cannot find any reviews at all, return { "hasReviews": false }.
    Return the result EXACTLY as a raw JSON object. Do NOT include markdown formatting like \`\`\`json.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.1
      }
    });

    const cleanText = (response.text || "{}").replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Sentiment Agent Error:", e);
    return { hasReviews: false };
  }
};

// ==========================================
// AGENT 5: HALLUCINATION WALL
// ==========================================
const runHallucinationWall = async (ai: GoogleGenAI, draftReport: AnalysisResult, identityData: any, competitorData: any, citationData: any): Promise<any[]> => {
  const prompt = `
    You are the "Hallucination Wall" Verifier. Your job is to meticulously cross-reference major claims from the drafted analysis report and verify them using Google Search.
    
    Business: ${identityData.name || "Unknown"}
    Address: ${identityData.exactAddress || "Unknown"}
    
    I want you to verify 3 critical pieces of information about this business (e.g., verifying their phone number, main services, or general public sentiment).
    Use Google Search to verify them. Wait, just pick 3 claims and verify if they are true or not.

    Return EXACTLY a raw JSON array of objects, where each object has:
    { "status": "Verified" | "Hallucinated" | "Unverifiable", "claim": "The claim...", "truth": "What you actually found via search", "sourceUrl": "URL if available" }
    
    Do NOT include markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.1,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Verified", "Hallucinated", "Unverifiable"] },
              claim: { type: Type.STRING },
              truth: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["status", "claim", "truth"]
          }
        }
      }
    });

    const cleanText = (response.text || "[]").replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Hallucination Wall Error:", e);
    return [];
  }
};

// ==========================================
// AGENT 4: COMPILER (SEARCH DISABLED)
// ==========================================
export const analyzeBusinessVisibility = async (business: BusinessInfo, geminiKey?: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey(geminiKey) });

  // 1. Fetch Real Context via Gemini
  const realLLMData = await fetchLLMInsight(ai, business);

  // 2. Run Identity Agent
  const identityData = await runIdentityAgent(ai, business);

  // 3. Parallel run (Always run citations so the AI knows where a Ghost SHOULD be)
  const citationPromise = runCitationAgent(ai, business.name, business.location, business.category);
  const sentimentPromise = runSentimentAgent(ai, business.name, business.location);
  let competitorPromise: Promise<any[]> = Promise.resolve([]);

  if (identityData.found || identityData.exactAddress !== "Unknown") {
    competitorPromise = runCompetitorAgent(ai, business.category, business.location, identityData.exactAddress);
  }

  const [competitorData, citationData, sentimentData] = await Promise.all([
    competitorPromise,
    citationPromise,
    sentimentPromise
  ]);

  // 4. Compile Master Prompt
  const promptText = `
    You are a ** Forensic SEO Auditor ** specializing in "Generative Engine Optimization"(GEO).
    Your job is to compile the final analysis report. 
    YOU DO NOT HAVE SEARCH CAPABILITIES.
    You MUST strictly use the verified data provided below gathered by your research team.

    ** VERIFIED DATA FROM RESEARCH TEAM:**
    Business Status: ${identityData.found ? 'Found' : 'Not Found'}
    Has Google Business Profile: ${identityData.hasGbp ? 'Yes' : 'No'}
  Address: ${identityData.exactAddress || 'Unknown'}
  Website: ${identityData.websiteUrl || 'None'}
  Instagram: ${identityData.instagramUrl || 'None'}
  Facebook: ${identityData.facebookUrl || 'None'}

    ** Verified Local Competitors:**
    ${JSON.stringify(competitorData)}

    ** Verified Citation Ecosystem:**
    ${JSON.stringify(citationData)}

    ** Verified Reputation & Sentiment:**
    ${JSON.stringify(sentimentData)}

    ** LAYERED PROMPTING (CHAIN OF THOUGHT) REASONING (CRITICAL): **
    Before you calculate any scores or arrays, you MUST execute a 3-layer reasoning chain in the \`reasoningChain\` object:
    - \`layer1_DataIngestion\`: Acknowledge the raw verified data. (e.g. "Brand has Yelp but no GBP. Gemini Live says X.")
    - \`layer2_VisibilityMath\`: Deduce the mathematical ceilings based on the data. (e.g. "Because GBP is missing, Overall GEO Score is capped at 15. LLMs cannot recommend a ghost, so Gemini/ChatGPT must be 'Hidden' and score < 15.")
    - \`layer3_SimulationAlignment\`: State how the creative properties (Simulations, Personas) will reflect the math. (e.g. "AI simulations will respond with confusion or recommend competitors. Missions will focus heavily on creating a GBP.")

    ** ANTI-HALLUCINATION & STRICT DATA PROVENANCE RULES: **
    You are a deterministic evaluator. You MUST NOT hallucinate data, metrics, or positive outcomes that are not explicitly proven by the "VERIFIED DATA" above. 
    
    1. ATTRIBUTES & OVERALL SCORE: Base all scores (0-100) strictly on the payload. If the business has NO Google Business Profile and NO Website, it is a "Digital Ghost". Its Authority, Consistency, and Relevance scores MUST be severely crushed (< 15), and the Overall Score must follow your Layer 2 Math. Explain exactly WHY they lost points in the explanation strings based ONLY on the proven missing data.
    
    2. LLM PERFORMANCE: Use the "LIVE GEMINI FEEDBACK" to directly dictate the Gemini model's status and score. If the feedback states the business is unknown or not in the top recommendations, Gemini's score MUST be < 15 and status MUST be "Hidden". For ChatGPT and Perplexity, if the business lacks directory citations (Yelp, Tripadvisor) or a GBP, they cannot rank locally. Score them < 15 ("Hidden"). Do NOT artificially inflate LLM scores if the overall GEO score is terrible.
    
    3. SENTIMENT AUDIT: Use the "Verified Reputation & Sentiment" payload. If "hasReviews" is true, analyze their rating (e.g., lower than 4.0 means trouble), review volume, and explicitly map the "negativeThemes" into the negativeEntities array to calculate a toxicityScore (0-100, where 0 is perfect/clean and higher means severe toxicity or frequent complaints). If "hasReviews" is false, set toxicityScore to 0, negativeEntities to an empty array [], and summary to "No verifiable review data available in this scan."
    
    4. KEYWORD HEIST: Deduce 4-6 logical broad keywords based on their Category. Classify each keyword's intent as "Navigational", "Commercial", or "Deep Research". For each keyword, estimate the monthly prompt volume for each major LLM using this methodology:
       - Start with a realistic base monthly AI prompt volume for this category/location (e.g., 800 for a niche local service, 5000 for a popular restaurant).
       - Then split it across LLMs using their approximate real-world market share weights **for this intent type**:
         * Gemini: higher share for "Navigational" (mobile/voice heavy) — commercial~25%, navigational~35%, deep_research~20%
         * ChatGPT: dominant for "Commercial" and "Deep Research" — commercial~45%, navigational~30%, deep_research~40%
         * Claude: growing for research-heavy tasks — commercial~15%, navigational~10%, deep_research~25%
         * Perplexity: dominant for "Deep Research" — commercial~15%, navigational~25%, deep_research~15%
       CRITICAL: You must define 'owner' logically based on the business's visibility. If the business is a "Digital Ghost" (poor scores), assign ALL keywords to "Competitor". If the business HAS a website and GBP, assign at least 1 or 2 niche keywords to "You" or "Shared" and the bigger harder keywords to "Competitor".
    
    5. SIMULATIONS & PERSONAS: If the business has a terrible visibility score, the \`aiResponse\` and \`aiResponseSummary\` in your simulations MUST reflect failure (e.g., "The AI recommended competitors instead", "The AI could not find information on this business"). Do not write optimistic fake AI responses.
    
    6. FACT CHECK: Only list facts you can absolutely verify from the limited data provided (e.g., address, website presence). Do not invent facts about parking, pricing, or hours. If no facts can be verified, return an empty array.
    
    7. DAILY MISSIONS & STRATEGY: Base all recommendations linearly on their biggest failures. If they have no GBP, the only mission that matters is creating one.

    Calculate scores and return the final massive JSON report exactly matching the schema.
    For localCompetitors array in the JSON, map directly from the Verified Local Competitors. 
    For citationOpportunities array, map directly from the Verified Citation Ecosystem, adding priorities and models.
    For factCheck array, verify facts based solely on the data provided or leave empty if no data exists.
    For visualAudit object, if no images are provided in the payload, you MUST set source to 'Not_Found', score to 0, overallVibe to 'No images provided', improvements to 'Upload images to improve your visual trust score.', and provide empty arrays for detectedTags, missingCrucialEntities, intentScores, and extractedText. DO NOT omit the visualAudit object.
    If I HAVE explicitly provided inline images via the data payload attachment, you MUST thoroughly analyze them! Set source to 'Upload', give it an accurate trust score (0-100), define the visual vibe, and meticulously populate all visual arrays (detectedTags, missingCrucialEntities, intentScores, extractedText).
    IMPORTANT: Do NOT invent missing data. If it is not in the verified data payload above, mark it as 'Not Found', mark the score poorly, or exclude it (except for visualAudit which must adhere to the rule above).
  `;

  const parts: any[] = [{ text: promptText }];

  // Add images to the payload if they exist
  if (business.images && business.images.length > 0) {
    business.images.forEach(base64Str => {
      // Find MIME type from Data URL (e.g. "data:image/png;base64,...")
      const mimeMatch = base64Str.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
      let mimeType = 'image/jpeg';
      let cleanData = base64Str;

      if (mimeMatch) {
        mimeType = mimeMatch[1];
        cleanData = mimeMatch[2];
      } else if (base64Str.includes(',')) {
        cleanData = base64Str.split(',')[1];
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanData
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts: parts },
      config: {
        // NOTE: search tool is EXPLICITLY DISABLED for the compiler

        // STABILITY SETTINGS: Low temperature for consistent scoring
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoningChain: {
              type: Type.OBJECT,
              properties: {
                layer1_DataIngestion: { type: Type.STRING },
                layer2_VisibilityMath: { type: Type.STRING },
                layer3_SimulationAlignment: { type: Type.STRING }
              },
              required: ["layer1_DataIngestion", "layer2_VisibilityMath", "layer3_SimulationAlignment"]
            },
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            businessCoordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              },
              required: ["lat", "lng"]
            },
            marketOverview: {
              type: Type.OBJECT,
              properties: {
                marketVibe: { type: Type.STRING },
                competitionLevel: { type: Type.STRING, enum: ['Cut-throat', 'Moderate', 'Low', 'Blue Ocean'] },
                popularPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunityNiche: { type: Type.STRING },
                hiddenRankingFactor: { type: Type.STRING }
              },
              required: ['marketVibe', 'competitionLevel', 'popularPrompts', 'opportunityNiche', 'hiddenRankingFactor']
            },
            attributes: {
              type: Type.OBJECT,
              properties: {
                authority: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["score", "label", "explanation", "action"]
                },
                consistency: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["score", "label", "explanation", "action"]
                },
                sentiment: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["score", "label", "explanation", "action"]
                },
                relevance: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["score", "label", "explanation", "action"]
                },
                citations: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["score", "label", "explanation", "action"]
                },
              },
              required: ["authority", "consistency", "sentiment", "relevance", "citations"]
            },
            simulations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING },
                  aiResponse: { type: Type.STRING },
                  rank: { type: Type.STRING, enum: ["Top Recommendation", "Mentioned", "Not Found"] }
                }
              }
            },
            personas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  personaName: { type: Type.STRING },
                  userIntent: { type: Type.STRING },
                  simulatedQuery: { type: Type.STRING },
                  aiResponseSummary: { type: Type.STRING },
                  brandMentioned: { type: Type.BOOLEAN }
                }
              }
            },
            contentGaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  missingElement: { type: Type.STRING },
                  importance: { type: Type.STRING, enum: [ImpactLevel.HIGH, ImpactLevel.MEDIUM, ImpactLevel.LOW] },
                  fix: { type: Type.STRING }
                }
              }
            },
            platformPerformance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING, enum: ["Chat Interfaces", "Voice Search", "Traditional Search"] },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ["Optimized", "Needs Work", "Invisible"] }
                },
                required: ["platform", "score", "status"]
              }
            },
            llmPerformance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  model: { type: Type.STRING, enum: ["ChatGPT", "Gemini", "Perplexity"] },
                  status: { type: Type.STRING, enum: ["Top Choice", "Option", "Hidden"] },
                  details: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                },
                required: ["model", "status", "score", "details"]
              }
            },
            localCompetitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  rank: { type: Type.NUMBER },
                  distance: { type: Type.STRING },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER },
                  address: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING }
                },
                required: ["name", "sourceUrl"]
              }
            },
            citationOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  siteName: { type: Type.STRING },
                  domain: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Directory", "Social", "Forum", "Health/Niche", "LLM Data Source"] },
                  priority: { type: Type.STRING, enum: [ImpactLevel.HIGH, ImpactLevel.MEDIUM, ImpactLevel.LOW] },
                  reason: { type: Type.STRING },
                  isListed: { type: Type.BOOLEAN },
                  feedsModels: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["siteName", "domain", "isListed"]
              }
            },
            keywordHeist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  owner: { type: Type.STRING, enum: ['Competitor', 'You', 'Shared'] },
                  intent: { type: Type.STRING, enum: ['Navigational', 'Commercial', 'Deep Research'] },
                  llmPromptVolumes: {
                    type: Type.OBJECT,
                    properties: {
                      gemini: { type: Type.NUMBER },
                      chatgpt: { type: Type.NUMBER },
                      claude: { type: Type.NUMBER },
                      perplexity: { type: Type.NUMBER }
                    },
                    required: ['gemini', 'chatgpt', 'claude', 'perplexity']
                  },
                  opportunityScore: { type: Type.NUMBER }
                },
                required: ["term", "owner", "intent", "llmPromptVolumes", "opportunityScore"]
              }
            },
            sentimentAudit: {
              type: Type.OBJECT,
              properties: {
                toxicityScore: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                negativeEntities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      frequency: { type: Type.STRING },
                      impact: { type: Type.STRING, enum: ['Critical', 'Moderate', 'Low'] }
                    },
                    required: ["term", "frequency", "impact"]
                  }
                }
              },
              required: ['toxicityScore', 'summary', 'negativeEntities']
            },
            dailyMissions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  xp: { type: Type.NUMBER },
                  category: { type: Type.STRING, enum: ['Content', 'Review', 'Social'] },
                  estimatedTime: { type: Type.STRING }
                }
              }
            },
            contentStrategy: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING, enum: ['Instagram', 'LinkedIn', 'GMB'] },
                  focusKeyword: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  imageIdea: { type: Type.STRING },
                  whyThisWorks: { type: Type.STRING }
                }
              }
            },
            voiceSimulation: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING },
                script: { type: Type.STRING },
                voiceParams: {
                  type: Type.OBJECT,
                  properties: {
                    pitch: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER }
                  }
                }
              },
              required: ['query', 'script']
            },
            visualAudit: {
              type: Type.OBJECT,
              properties: {
                overallVibe: { type: Type.STRING },
                score: { type: Type.NUMBER },
                detectedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingCrucialEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
                intentScores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      intent: { type: Type.STRING },
                      score: { type: Type.NUMBER }
                    },
                    required: ['intent', 'score']
                  }
                },
                extractedText: { type: Type.ARRAY, items: { type: Type.STRING } },
                qualityWarning: { type: Type.STRING },
                improvements: { type: Type.STRING },
                source: { type: Type.STRING, enum: ["Upload", "GMB_Scan", "Not_Found"] }
              },
              required: ['overallVibe', 'score', 'detectedTags', 'missingCrucialEntities', 'intentScores', 'extractedText', 'improvements', 'source']
            },
            factCheck: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  aiAnswer: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING }
                },
                required: ["question", "aiAnswer", "sourceUrl"]
              }
            },
            voiceSearchQA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  intent: { type: Type.STRING }
                }
              }
            },
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: [ImpactLevel.HIGH, ImpactLevel.MEDIUM, ImpactLevel.LOW] },
                  actionItem: { type: Type.STRING }
                }
              }
            }
          },
          required: ["reasoningChain", "overallScore", "summary", "businessCoordinates", "marketOverview", "attributes", "simulations", "personas", "contentGaps", "platformPerformance", "llmPerformance", "localCompetitors", "citationOpportunities", "keywordHeist", "sentimentAudit", "dailyMissions", "contentStrategy", "voiceSimulation", "competitors", "recommendations", "visualAudit"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as AnalysisResult;

    // ZERO HALLUCINATION FILTERING: Programmatic Data Sanitization
    // Drop any simulated items that do not possess a required URL/Domain
    if (data.localCompetitors) {
      data.localCompetitors = data.localCompetitors.filter(c => c.sourceUrl && c.sourceUrl.includes('.'));
    }
    if (data.citationOpportunities) {
      data.citationOpportunities = data.citationOpportunities.filter(c => c.domain && c.domain.includes('.'));
    }
    if (data.factCheck) {
      data.factCheck = data.factCheck.filter(f => f.sourceUrl && f.sourceUrl.includes('.'));
    }

    // Generate simple IDs for missions if not present
    if (data.dailyMissions) {
      data.dailyMissions = data.dailyMissions.map((m, i) => ({
        ...m,
        id: m.id || `mission - ${i} `
      }));
    }

    // 5. Run Hallucination Wall Validation
    const hallucinationReport = await runHallucinationWall(ai, data, identityData, competitorData, citationData);
    data.hallucinationWall = hallucinationReport;

    return data;

  } catch (error) {
    console.error("Error analyzing business:", error);
    throw error;
  }
};
