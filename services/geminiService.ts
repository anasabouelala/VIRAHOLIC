
/// <reference types="vite/client" />

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BusinessInfo, ImpactLevel } from "../types";

export const getApiKey = (providedKey?: string): string => {
  // 1. Check provided key (from UI settings)
  if (providedKey) return providedKey;

  // 2. Check Vite env var (standard for self-hosting)
  try {
    if (import.meta.env?.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    // import.meta.env might be unavailable in pure Node
  }

  // 3. Check process.env (AI Studio / Legacy / Node Testing)
  const processKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (processKey) return processKey;

  throw new Error("Gemini API Key not found. Please set VITE_GEMINI_API_KEY in your .env file or enter it in Settings.");
};

// ==========================================
// GEMINI NATIVE LLM INSIGHT (Replaces ChatGPT)
// ==========================================
const fetchLLMInsight = async (ai: GoogleGenAI, business: BusinessInfo): Promise<string> => {
  try {
    const prompt = `You are a search user in ${business.location} searching in ${business.language || 'English'}.
    I am looking for the best ${business.category} in ${business.location}. 
    Please provide your top 3 recommendations and explain why. 
    Also, do you know "${business.name}"? If so, what is your opinion on it? Note: Be concise.`;
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
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
    The user is performing this search in ${business.language || 'English'}.
    They operate in this category: "${business.category}".
    CRITICAL: Be flexible and fuzzy with the business name! Users often misspell names or leave off suffixes (like "LLC"). If you find a business with a very similar name in the correct location and category, assume it is the target business and proceed. Do not be overly strict with exact string matching.
    Find their official Website URL, their Google Maps URL, and their exact physical address.
    You MUST search for their Google Business Profile. If they don't have one, set hasGbp to false.
    You MUST explicitly search site:instagram.com "${business.name}" ${business.location} and site:facebook.com "${business.name}" to find their socials.
    If you absolutely cannot find any trace of this business or anything similar after multiple searches, ONLY THEN return found = false.

    Return the result EXACTLY as a raw JSON object with these keys: 
    { "found": boolean, "hasGbp": boolean, "exactAddress": string, "websiteUrl": string, "googleMapsUrl": string, "instagramUrl": string, "facebookUrl": string }
    Do NOT include markdown formatting like \`\`\`json.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
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
      model: "models/gemini-2.5-flash",
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
      model: "models/gemini-2.5-flash",
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
      model: "models/gemini-2.5-flash",
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
// AGENT A: VISUAL ANALYST (3-Layer Chain)
// ==========================================
const runVisualAgent = async (ai: GoogleGenAI, business: BusinessInfo, identityData: any): Promise<any> => {
  const fallback = { source: 'Not_Found', score: 0, overallVibe: 'AI was unable to locate public photos on Google Maps CDN. Verify photos are uploaded and public.', improvements: 'Upload photos to your Google Business Profile to build visual trust with AI models.', detectedTags: [], missingCrucialEntities: [], intentScores: [], extractedText: [], imageUrls: [] };
  
  try {
    // LAYER 1: Deep Search & URL Extraction
    console.log("[Visual Agent] Layer 1: Navigating to Google Maps Photo Hub...");
    const l1Prompt = `You are an OSINT Image Investigator. Your goal is to find the exact CDN image links (lh3.googleusercontent.com or lh5.googleusercontent.com) for the business: "${business.name}" in "${business.location}".
Relevant Data: 
- Address: ${identityData.exactAddress || "Search for it"}
- Google Maps URL (if known): ${identityData.googleMapsUrl || "Find the listing first"}

SEARCH STRATEGY:
1. Use Google Search to find the official Google Maps listing for "${business.name}" in "${business.location}".
2. Look for the "photos" or "images" section of the results. 
3. Try to extract at least 3 direct "lh3.googleusercontent.com/p/..." links.
4. Also, identify 5-10 literal visual elements described in the reviews or search snippets (e.g. "modern interior", "wooden tables", "warm lighting", "large sign", "brick wall").

Return EXACTLY raw JSON: 
{ 
  "imageUrls": ["url1", "url2", "url3"], 
  "found": boolean, 
  "metadataVibe": { 
     "observedFromSnippets": ["item1", "item2"], 
     "atmosphere": "e.g. Professional and clean",
     "detectedKeywords": ["array", "of", "tags"]
  } 
}
No markdown.`;

    const l1Res = await ai.models.generateContent({ 
      model: "models/gemini-2.5-flash", 
      contents: { parts: [{ text: l1Prompt }] }, 
      config: { tools: [{ googleSearch: {} }], temperature: 0.0 } 
    });
    
    const l1Text = (l1Res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let l1Data: any = {};
    try { l1Data = JSON.parse(l1Text); } catch { l1Data = { imageUrls: [], found: false }; }
    
    const imageUrls: string[] = Array.isArray(l1Data.imageUrls) ? l1Data.imageUrls.filter((u: string) => typeof u === 'string' && u.startsWith('http')) : [];
    
    // LAYER 2: Dual-Mode Vision Processing (Image Data OR Textual Mirroring)
    console.log("[Visual Agent] Layer 2: Starting visual processing...");
    let inventory: any[] = [];
    
    if (imageUrls.length > 0) {
      const fetchedImages: any[] = [];
      for (let i = 0; i < Math.min(imageUrls.length, 3); i++) {
        try {
          const resp = await fetch(imageUrls[i], { mode: 'no-cors' }); // Attempt no-cors for basic check
          const buf = await fetch(imageUrls[i]).then(r => r.arrayBuffer()); // Real fetch for Base64 (might fail CORS)
          const bytes = new Uint8Array(buf);
          let bin = '';
          for (let j = 0; j < bytes.byteLength; j++) bin += String.fromCharCode(bytes[j]);
          fetchedImages.push({ idx: i, base64: btoa(bin), mimeType: 'image/jpeg' });
        } catch { 
           // Potentially CORS restricted
        }
      }

      if (fetchedImages.length > 0) {
        // Option A: Literal Computer Vision Analysis (Best)
        const l2Parts: any[] = [{ text: `You are a literal visual observer. For each provided image, describe ONLY what you factually see.
Return raw JSON: { "inventory": [{ "observed": ["item1"], "textVisible": ["text"], "atmosphere": ["keyword"], "notablyAbsent": ["thing"] }] }` }];
        fetchedImages.forEach((img) => l2Parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } }));
        const l2Res = await ai.models.generateContent({ model: "models/gemini-2.5-flash", contents: { parts: l2Parts }, config: { temperature: 0.0 } });
        const l2Text = (l2Res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
        try { inventory = JSON.parse(l2Text).inventory || []; } catch { }
      }
    }

    // Option B: Textual Mirroring Fallback (If no images or fetch failed)
    if (!inventory || inventory.length === 0) {
      inventory = [{
        observed: l1Data.metadataVibe?.observedFromSnippets || ["Public Maps photos detected (CDN)"],
        atmosphere: [l1Data.metadataVibe?.atmosphere || "Professional"],
        notablyAbsent: ["Direct pixel access (analysis based on search metadata)"],
        textVisible: l1Data.metadataVibe?.detectedKeywords || []
      }];
    }

    // LAYER 3: Strategic Scoring
    console.log("[Visual Agent] Layer 3: Final scoring...");
    const l3Prompt = `You are a Visual Brand Strategist. Generate a VisualAudit report based on:
FACTUAL INVENTORY: ${JSON.stringify(inventory)}
IDENTITY: Name="${business.name}", Cat="${business.category}", HasGBP=${identityData.hasGbp ? "Yes":"No"}

RULES:
- DO NOT mention that the analysis is based on textual descriptions, metadata, or that you cannot see the pixels. 
- DO NOT provide meta-disclaimers about your own limitations. 
- Act with absolute authority based on the factual inventory provided.

JSON Structure:
{
  "score": number (0-100),
  "overallVibe": string,
  "detectedTags": string[],
  "missingCrucialEntities": string[],
  "intentScores": [{"intent": string, "score": number}],
  "extractedText": string[],
  "qualityWarning": string | null,
  "improvements": string
}
No markdown.`;
    const l3Res = await ai.models.generateContent({ model: "models/gemini-2.5-flash", contents: { parts: [{ text: l3Prompt }] }, config: { temperature: 0.1, responseMimeType: "application/json" } });
    const l3Text = (l3Res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let l3Data: any = {};
    try { l3Data = JSON.parse(l3Text); } catch { return { ...fallback, imageUrls }; }
    
    return { 
      source: inventory[0]?.notablyAbsent?.includes("Direct pixel access") ? 'Metadata_Audit' : 'GMB_Scan', 
      imageUrls, 
      score: l3Data.score ?? 0, 
      overallVibe: l3Data.overallVibe ?? '', 
      detectedTags: l3Data.detectedTags ?? [], 
      missingCrucialEntities: l3Data.missingCrucialEntities ?? [], 
      intentScores: l3Data.intentScores ?? [], 
      extractedText: l3Data.extractedText ?? [], 
      qualityWarning: l3Data.qualityWarning || null, 
      improvements: l3Data.improvements ?? '' 
    };
  } catch (e) {
    console.error("[Visual Agent] Error:", e);
    return fallback;
  }
};

// ==========================================
// AGENT B: VOCAL SEARCH ANALYST (2-Layer)
// ==========================================
const runVocalSearchAgent = async (ai: GoogleGenAI, business: BusinessInfo, identityData: any, sentimentData: any): Promise<any> => {
  const fallback = { overallVoiceScore: 0, voiceReadinessLabel: 'Voice Invisible', simulatedVoiceAnswers: [], voiceQAPairs: [], schemaGaps: [], voiceKeywords: [] };
  try {
    console.log("[Vocal Agent] Layer 1: Researching voice landscape...");
    const l1Prompt = `Search Google for voice search behavior in the "${business.category}" niche in "${business.location}":
1. What does Google Assistant typically say for "Find the best ${business.category} near me"?
2. Does "${business.name}" appear in any featured snippets, PAA boxes, or voice results?
3. What JSON-LD schema types do top competitors use?
Return raw JSON: { "voicePresenceFound": boolean, "topVoiceQueries": ["q1","q2","q3","q4"], "competitorSchemas": ["FAQPage","LocalBusiness"], "businessMentionedInVoice": boolean }
No markdown.`;
    const l1Res = await ai.models.generateContent({ model: "models/gemini-2.5-flash", contents: { parts: [{ text: l1Prompt }] }, config: { tools: [{ googleSearch: {} }], temperature: 0.0 } });
    const l1Text = (l1Res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let l1Data: any = {};
    try { l1Data = JSON.parse(l1Text); } catch { l1Data = {}; }

    console.log("[Vocal Agent] Layer 2: Generating full vocal analysis...");
    const l2Prompt = `You are a Voice Search Optimization expert. Generate a complete VocalSearchAnalysis.
RESEARCH: ${JSON.stringify(l1Data)}
BUSINESS: Name="${business.name}", Category="${business.category}", Location="${business.location}", Has GBP=${identityData.hasGbp ? 'YES' : 'NO'}, Has Website=${identityData.websiteUrl ? 'YES' : 'NO'}, Has Reviews=${sentimentData.hasReviews ? 'YES, Rating: ' + sentimentData.rating : 'NO'}

RULES:
- If hasGbp=false → all voice assistant verdicts = "No Answer" or "Recommends Competitor"
- voiceScore < 20 if hasGbp=false AND hasWebsite=false
- CRITICAL: If any 'Critical' severity Schema Gaps are identified, the overallVoiceScore MUST be capped at 65.
- voiceQAPairs answers ≤ 40 words, start with "${business.name}"
- schemaGaps must have real JSON-LD snippets with actual business name/category embedded
- voiceKeywords must be realistic spoken queries

Return raw JSON:
{
  "overallVoiceScore": number (Calculate this strictly: 40% GMB/GBP completeness, 30% Website Schema accuracy, 20% Review Volume/Sentiment, 10% Social Footprint),
  "voiceReadinessLabel": "Voice Ready"|"Partially Optimized"|"Voice Invisible",
  "simulatedVoiceAnswers": [
    {"assistant":"Google Assistant","query":string,"response":string,"verdict":"Mentions Business"|"Recommends Competitor"|"No Answer", "distance": string, "location": string},
    {"assistant":"Siri","query":string,"response":string,"verdict":"Mentions Business"|"Recommends Competitor"|"No Answer", "distance": string, "location": string},
    {"assistant":"Alexa","query":string,"response":string,"verdict":"Mentions Business"|"Recommends Competitor"|"No Answer", "distance": string, "location": string}
  ],
  "voiceQAPairs": [
    {"question":string,"optimizedAnswer":string,"intent":"Discovery"|"Transactional"|"Navigational","schemaType":"FAQPage"|"HowTo"|"LocalBusiness"}
  ],
  "schemaGaps": [
    {"type":string,"severity":"Critical"|"High"|"Low","reasoning":string,"snippet":string}
  ],
  "voiceKeywords": [
    {"phrase":string,"monthlyVoiceSearches":number,"currentlyRanking":boolean}
  ]
}
Include 4+ voiceQAPairs, 3+ schemaGaps, 5+ voiceKeywords. No markdown.`;
    const l2Res = await ai.models.generateContent({ model: "models/gemini-2.5-flash", contents: { parts: [{ text: l2Prompt }] }, config: { temperature: 0.1, responseMimeType: "application/json" } });
    const l2Text = (l2Res.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let l2Data: any = {};
    try { 
      l2Data = JSON.parse(l2Text); 
    } catch { 
      console.warn("[Vocal Agent] Layer 2 JSON Parse Failed.");
      return fallback; 
    }
    console.log("[Vocal Agent] Analysis complete.");
    return { overallVoiceScore: l2Data.overallVoiceScore ?? 0, voiceReadinessLabel: l2Data.voiceReadinessLabel ?? 'Voice Invisible', simulatedVoiceAnswers: Array.isArray(l2Data.simulatedVoiceAnswers) ? l2Data.simulatedVoiceAnswers : [], voiceQAPairs: Array.isArray(l2Data.voiceQAPairs) ? l2Data.voiceQAPairs : [], schemaGaps: Array.isArray(l2Data.schemaGaps) ? l2Data.schemaGaps : [], voiceKeywords: Array.isArray(l2Data.voiceKeywords) ? l2Data.voiceKeywords : [] };
  } catch (e) {
    console.error("[Vocal Agent] Unexpected error:", e);
    return fallback;
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
      model: "models/gemini-2.5-flash",
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
// AGENT: CHATGPT VISIBILITY AGENT
// Simulates what ChatGPT actually finds via Bing-indexed sources
// Runs 7 real web searches the way ChatGPT browses the internet
// ==========================================
const runChatGPTVisibilityAgent = async (ai: GoogleGenAI, business: BusinessInfo, identityData: any): Promise<any> => {
  const { name, location, category } = business;
  const prompt = `
You are simulating how ChatGPT (GPT-4o with browsing) would respond to queries about a local business.
ChatGPT uses the Bing search index — it does NOT use Google. It sources from: Bing Places, business websites, 
Yelp, TripAdvisor (for hospitality only), industry-specific directories, social media indexed by Bing, 
local media articles, and Reddit.

Business: "${name}" | Location: "${location}" | Category: "${category}"

YOUR TASK: Use Google Search to simulate Bing search behavior.
Run searches for these 7 real user query types a customer would ask ChatGPT:
1. DISCOVERY: "[business category] in [location]" — generic category search
2. LOCAL: "best [category] near [location]" — local recommendation
3. NAVIGATIONAL: "[business name] [location]" — brand-name search
4. COMPARISON: "[category] vs alternatives in [location]" — comparing options
5. TRANSACTIONAL: "book [category] [location]" or "prices [business name]" — intent to act
6. DEEP RESEARCH: "reviews for [business name] [location]" — research mode
7. VOICE/NATURAL: "who is the best [category] around [location]" — conversational

For EACH query, use Google Search to check if the business appears in the top results.
Consider: websites, directories, social profiles, review platforms relevant to this SPECIFIC CATEGORY.
For a plumber: check Angi, HomeAdvisor, Thumbtack, BBB — NOT TripAdvisor.
For a restaurant: check Yelp, TripAdvisor, Zomato, OpenTable — NOT Houzz.
For a lawyer: check Avvo, FindLaw, Justia, LinkedIn — NOT Yelp.
For a barbershop: check Yelp, StyleSeat, Booksy, Google Maps — NOT TripAdvisor.
For a b2b service: check LinkedIn, G2, Clutch, company website — NOT Yelp.

Return ONLY raw JSON (no markdown):
{
  "model": "ChatGPT",
  "score": 0-100,
  "status": "Top Choice" | "Option" | "Hidden",
  "promptsTested": 7,
  "promptsAppeared": 0-7,
  "details": "One sentence describing ChatGPT visibility for this specific business",
  "behaviorInsight": "2-3 sentences explaining WHY ChatGPT finds or doesn't find this business, referencing Bing, specific directories, and category-specific signals actually found via search",
  "testedPrompts": [
    { "text": "exact query tested", "intent": "Discovery|Local|Navigational|Comparison|Transactional|Deep Research|Voice", "appears": true|false, "competitorsShown": ["name1"] }
  ],
  "competitorReplacements": [
    { "name": "competitor name", "appearancePercentage": 40-80, "examplePrompts": ["query where they appear"] }
  ],
  "topPromptsAppeared": ["query1", "query2"],
  "topPromptsMissed": ["query1", "query2"]
}
  `;
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    const raw = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error("[ChatGPT Visibility Agent] Error:", e);
    return { model: "ChatGPT", score: 10, status: "Hidden", promptsTested: 7, promptsAppeared: 1, details: "Could not determine ChatGPT visibility.", behaviorInsight: "Search agent encountered an error.", testedPrompts: [], competitorReplacements: [], topPromptsAppeared: [], topPromptsMissed: [] };
  }
};

// ==========================================
// AGENT: PERPLEXITY VISIBILITY AGENT
// Simulates what Perplexity actually surfaces via multi-engine + citations
// Perplexity is citation-first: it cites sources, loves authoritative lists, Reddit
// ==========================================
const runPerplexityVisibilityAgent = async (ai: GoogleGenAI, business: BusinessInfo, identityData: any): Promise<any> => {
  const { name, location, category } = business;
  const prompt = `
You are simulating how Perplexity AI would respond to queries about a local business.
Perplexity aggregates Bing, Google, DuckDuckGo, Reddit, YouTube, Wikipedia, and niche directories.
It CITES sources in its answers. A business appears in Perplexity if it appears in ANY of these sources.
Perplexity especially values: "best of" editorial lists, Reddit discussions, authoritative directories, 
news mentions, and consistent data across multiple sources (NAP = Name, Address, Phone).

Business: "${name}" | Location: "${location}" | Category: "${category}"

YOUR TASK: Use Google Search to simulate Perplexity's multi-source aggregation.
Search for this business from multiple angles:
1. Reddit mentions: site:reddit.com "${name}" OR "best ${category} ${location}" site:reddit.com
2. Editorial/list mentions: "best ${category} in ${location}" including any list that mentions "${name}"
3. Category-native platforms: Search the RELEVANT platform for this category. 
   - Restaurants → TripAdvisor, Yelp, food blogs
   - Home services → Angi, HomeAdvisor, Reddit r/homeimprovement
   - Lawyers → Avvo, FindLaw, legal blogs
   - Barbershop → Yelp, StyleSeat, Booksy, "best barbershop [city]" articles
   - B2B → G2, Clutch, LinkedIn, tech publications
4. News/press: "${name}" site:news.*.local OR any news publication
5. Direct search: "${name}" "${location}" — does it appear with citations at all?
6. Comparison search: "${category} recommendations ${location}" — are they listed?
7. Natural language: "where can I find a good ${category} in ${location}" — Reddit/Quora answers

For each query determine if this SPECIFIC business (not just the category) appears.
Check if it's mentioned, cited, linked, listed, or recommended.

Return ONLY raw JSON (no markdown):
{
  "model": "Perplexity",
  "score": 0-100,
  "status": "Top Choice" | "Option" | "Hidden",
  "promptsTested": 7,
  "promptsAppeared": 0-7,
  "details": "One sentence describing Perplexity visibility for this specific business",
  "behaviorInsight": "2-3 sentences explaining Perplexity's findings: which sources cited this business, whether it's on Reddit, in 'best of' lists, or in category-native directories. Reference actual sources found.",
  "testedPrompts": [
    { "text": "exact query tested", "intent": "Reddit|Editorial|Directory|News|Direct|Comparison|Natural", "appears": true|false, "competitorsShown": ["name1"] }
  ],
  "competitorReplacements": [
    { "name": "competitor name seen in results instead", "appearancePercentage": 40-80, "examplePrompts": ["query"] }
  ],
  "topPromptsAppeared": ["query1", "query2"],
  "topPromptsMissed": ["query1", "query2"]
}
  `;
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    const raw = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error("[Perplexity Visibility Agent] Error:", e);
    return { model: "Perplexity", score: 10, status: "Hidden", promptsTested: 7, promptsAppeared: 1, details: "Could not determine Perplexity visibility.", behaviorInsight: "Search agent encountered an error.", testedPrompts: [], competitorReplacements: [], topPromptsAppeared: [], topPromptsMissed: [] };
  }
};

// ==========================================
// AGENT: CLAUDE VISIBILITY AGENT
// Simulates Claude's knowledge: training data signals, schema, authority, entity recognition
// Claude 3.x has web search but defaults to training data — we evaluate both
// ==========================================
const runClaudeVisibilityAgent = async (ai: GoogleGenAI, business: BusinessInfo, identityData: any): Promise<any> => {
  const { name, location, category } = business;
  const prompt = `
You are simulating how Claude (Anthropic) would respond to queries about a local business.
Claude 3.x uses a combination of training data (knowledge cutoff) AND can use web search on claude.ai.
Claude prioritizes: factual, structured, verifiable content. It avoids unverifiable claims.
Claude relies on: websites with clear structured data (schema.org), Wikipedia, authoritative press mentions,
high-quality content, well-known brands, and verifiable entity data.
Claude is skeptical of unknown local SMEs without training data signals.
For local business queries without web search, Claude often says "I don't have specific information."

Business: "${name}" | Location: "${location}" | Category: "${category}"

YOUR TASK: Use Google Search to assess Claude's likely training data coverage of this business.
Search for:
1. ENTITY STRENGTH: Is this a known entity? Search "${name}" Wikipedia OR "${name}" Wikidata OR "${name}" Crunchbase
2. STRUCTURED DATA: Does the website have schema markup? Search "${name}" site:${identityData.websiteUrl || location} OR look for structured data indicators
3. AUTHORITY SIGNALS: Is the business mentioned in authoritative press? "${name}" site:*.com/news OR major publications
4. BRAND RECOGNITION: Is this a regional/national chain or truly local? Search "${name}" brand OR franchise OR chain
5. CATEGORY KNOWLEDGE: Does Claude's category have strong training data? Evaluate based on how common/documented ${category} businesses are in AI training corpora
6. FACTUAL VERIFIABILITY: Can Claude verify the core facts? Search for the business address, phone, services — are they consistently listed?
7. CONVERSATIONAL QUERY: "Who is ${name} in ${location}?" — would any authoritative source answer this?

Important distinctions:
- A Coca-Cola or McDonald's = very high Claude score (globally known brand, massive training data)
- A famous local institution (e.g., "L'Ambroisie" Paris) = medium-high Claude score 
- A typical neighborhood barbershop with no press = low Claude score (below training data threshold)
- A Pilates studio posted on Instagram only = very low Claude score
- A tech startup with Crunchbase profile + press = medium Claude score

Return ONLY raw JSON (no markdown):
{
  "model": "Claude",
  "score": 0-100,
  "status": "Top Choice" | "Option" | "Hidden",
  "promptsTested": 7,
  "promptsAppeared": 0-7,
  "details": "One sentence about Claude's coverage of this specific business",
  "behaviorInsight": "2-3 sentences: Does Claude know this business from training data? What authority signals exist? Would Claude confidently recommend it or say 'I don't have information about this specific business'?",
  "testedPrompts": [
    { "text": "exact query tested", "intent": "Entity|Schema|Authority|Brand|Category|Factual|Conversational", "appears": true|false, "competitorsShown": ["well-known competitor name"] }
  ],
  "competitorReplacements": [
    { "name": "well-known competitor Claude would name instead", "appearancePercentage": 50-90, "examplePrompts": ["query"] }
  ],
  "topPromptsAppeared": ["query1"],
  "topPromptsMissed": ["query1", "query2", "query3"]
}
  `;
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    const raw = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error("[Claude Visibility Agent] Error:", e);
    return { model: "Claude", score: 5, status: "Hidden", promptsTested: 7, promptsAppeared: 0, details: "Could not determine Claude visibility.", behaviorInsight: "Search agent encountered an error.", testedPrompts: [], competitorReplacements: [], topPromptsAppeared: [], topPromptsMissed: [] };
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

  // 3b. Run Visual, Vocal, AND the 3 LLM Visibility Agents in parallel
  console.log("[Pipeline] Running Visual, Vocal, and LLM Visibility agents...");
  const [visualData, vocalData, chatGPTData, perplexityData, claudeData] = await Promise.all([
    runVisualAgent(ai, business, identityData),
    runVocalSearchAgent(ai, business, identityData, sentimentData),
    runChatGPTVisibilityAgent(ai, business, identityData),
    runPerplexityVisibilityAgent(ai, business, identityData),
    runClaudeVisibilityAgent(ai, business, identityData)
  ]);
  console.log("[Pipeline] Visual, Vocal, and LLM Visibility agents complete.");

  // 4. Compile Master Prompt
  const promptText = `
    You are a ** Forensic SEO Auditor ** specializing in "Generative Engine Optimization"(GEO).
    Your job is to compile the final analysis report. 
    YOU DO NOT HAVE SEARCH CAPABILITIES.
    You MUST strictly use the verified data provided below gathered by your research team.

    ** VERIFIED DATA FROM RESEARCH TEAM:**
    
    [IDENTITY AGENT FINDINGS]
    Business Status: ${identityData.found ? 'Found & Verified' : 'NOT FOUND — Digital Ghost'}
    Has Google Business Profile (GBP): ${identityData.hasGbp ? 'YES' : 'NO — Critical Gap'}
    Verified Address: ${identityData.exactAddress || 'Unknown'}
    Website URL: ${identityData.websiteUrl || 'NONE — Critical Gap'}
    Instagram Profile: ${identityData.instagramUrl || 'NONE'}
    Facebook Profile: ${identityData.facebookUrl || 'NONE'}

    [LIVE GEMINI LLM RESPONSE — What Gemini actually says when a customer asks about this business]
    "${realLLMData}"

    [CHATGPT VISIBILITY AGENT — Real web search simulating ChatGPT/Bing behavior]
    IMPORTANT: Use this data DIRECTLY for the ChatGPT entry in llmPerformance. Do NOT recalculate.
    Score: ${chatGPTData.score}/100 | Status: ${chatGPTData.status} | Appeared: ${chatGPTData.promptsAppeared}/7
    ${JSON.stringify(chatGPTData)}

    [PERPLEXITY VISIBILITY AGENT — Real web search simulating Perplexity multi-source behavior]
    IMPORTANT: Use this data DIRECTLY for the Perplexity entry in llmPerformance. Do NOT recalculate.
    Score: ${perplexityData.score}/100 | Status: ${perplexityData.status} | Appeared: ${perplexityData.promptsAppeared}/7
    ${JSON.stringify(perplexityData)}

    [CLAUDE VISIBILITY AGENT — Real web search simulating Claude training data coverage]
    IMPORTANT: Use this data DIRECTLY for the Claude entry in llmPerformance. Do NOT recalculate.
    Score: ${claudeData.score}/100 | Status: ${claudeData.status} | Appeared: ${claudeData.promptsAppeared}/7
    ${JSON.stringify(claudeData)}

    [COMPETITOR AGENT FINDINGS — Top local rivals appearing on Google Maps]
    ${JSON.stringify(competitorData)}

    [CITATION AGENT FINDINGS — Directory presence check for key LLM data sources]
    ${JSON.stringify(citationData)}

    [SENTIMENT AGENT FINDINGS — Review data from Google/Yelp search snippets]
    ${JSON.stringify(sentimentData)}

    [VISUAL AGENT FINDINGS — Auto-fetched Google Maps images + 3-layer analysis]
    Source: ${visualData.source}
    Visual Score: ${visualData.score}/100
    Images Found: ${(visualData.imageUrls || []).length}
    Overall Vibe: ${visualData.overallVibe}
    Detected Tags: ${JSON.stringify(visualData.detectedTags)}
    Missing Crucial Entities: ${JSON.stringify(visualData.missingCrucialEntities)}

    [VOCAL SEARCH AGENT FINDINGS — Voice assistant behavior + schema research]
    Voice Readiness: ${vocalData.voiceReadinessLabel} (Score: ${vocalData.overallVoiceScore}/100)
    Pass-through data (do NOT re-derive): ${JSON.stringify(vocalData)}

    ** LAYERED PROMPTING (CHAIN OF THOUGHT) REASONING (CRITICAL): **
    Before you calculate any scores or arrays, you MUST execute a 3-layer reasoning chain in the \`reasoningChain\` object:
    - \`layer1_DataIngestion\`: Acknowledge the raw verified data. (e.g. "Brand has Yelp but no GBP. Gemini Live says X.")
    - \`layer2_VisibilityMath\`: Deduce the mathematical ceilings based on the data. (e.g. "Because GBP is missing, Overall GEO Score is capped at 15. LLMs cannot recommend a ghost, so Gemini/ChatGPT must be 'Hidden' and score < 15.")
    - \`layer3_SimulationAlignment\`: State how the creative properties (Simulations, Personas) will reflect the math. (e.g. "AI simulations will respond with confusion or recommend competitors. Missions will focus heavily on creating a GBP.")

    ** ANTI-HALLUCINATION & STRICT DATA PROVENANCE RULES: **
    You are a deterministic evaluator. You MUST NOT hallucinate data, metrics, or positive outcomes that are not explicitly proven by the "VERIFIED DATA" above. 
    
    1. SCORING ALGORITHM & VERIFIABILITY: You MUST calculate all scores (0-100) using this strict mathematical rubric. 
       
       ** AUTHORITY (25% weight of Overall) **
       - Base: 0
       - +40 if identityData.hasGbp = true
       - +30 if identityData.websiteUrl exists
       - +30 if identityData.found = true
       - Penalty: -20 if no official social profiles (IG/FB) found.
       
       ** CONSISTENCY (25% weight of Overall) **
       - Base: 100
       - -15 for every 'Critical' gap in Citation Agent findings.
       - -10 for every platform where isListed=false in citations.
       - -20 if exactAddress is "Unknown".
       
       ** SENTIMENT (25% weight of Overall) **
       - If hasReviews=true: (sentimentData.rating / 5) * 80 + (sentimentData.reviewCount > 100 ? 20 : sentimentData.reviewCount / 5) 
       - If hasReviews=false: Score is fixed at 15.
       
       ** RELEVANCE (20% weight of Overall) **
        - +40 if the business category ("${business.category}") exactly matches the industry keywords found in search results.
        - +30 if the business website contains keyword-rich content relevant to the niche.
        - +30 if the business Google Business Profile category is correctly set.
        - Penalty: -20 if the business is listed in incorrect or irrelevant directories (e.g., a plumber on TripAdvisor).

       ** CITATIONS (25% weight of Overall) **
       - (Count of citations where isListed=true / Total targeted citations) * 100
       
       ** OVERALL SCORE **
       - This MUST be the mathematical average of the 5 attributes above (Authority, Consistency, Sentiment, Relevance, Citations). Avoid "gut feeling" rounding.

    2. ATTRIBUTE EXPLANATIONS: For every attribute score, the 'explanation' field MUST start with the breakdown (e.g., "Score 75: +40 GBP, +30 Website, +20 Searchable, -15 missing Citations."). This makes the audit 100% verifiable by the user. Explain any point losses based ONLY on proven missing data.
    
    3. LLM PERFORMANCE — USE AGENT DATA DIRECTLY (Do NOT recalculate):
    The 3 dedicated search agents above have already run real web searches for ChatGPT, Perplexity, and Claude.
    Their results are pre-computed and grounded in actual search findings.

    FOR CHATGPT: Copy the data from [CHATGPT VISIBILITY AGENT] directly into the llmPerformance array.
    FOR PERPLEXITY: Copy the data from [PERPLEXITY VISIBILITY AGENT] directly into the llmPerformance array.
    FOR CLAUDE: Copy the data from [CLAUDE VISIBILITY AGENT] directly into the llmPerformance array.
    DO NOT change their scores, promptsAppeared, testedPrompts, or behaviorInsight — these are real findings.

    FOR GEMINI ONLY: Calculate the score using this rubric based on the LIVE GEMINI FEEDBACK above:
      - Start at base 0
      - +35 if hasGbp=true AND address is complete | +20 if GBP exists but address partial | +0 (cap at 40) if no GBP
      - +20 if websiteUrl exists and appears established | +10 if website is minimal
      - +15 if hasReviews=true AND rating>=4.5 AND reviewCount>50 | +10 if rating>=4.0 AND reviewCount>20 | +5 if rating>=3.5 | +2 if low rating
      - +5 per CATEGORY-RELEVANT citation where isListed=true (max 3 citations = 15pts). Only count platforms relevant to the business category.
      - +5 if instagramUrl exists for visual categories (food/beauty/retail) | +2 for other categories
      - +2 if facebookUrl exists
      - +10 if LIVE GEMINI FEEDBACK explicitly names business as top recommendation
      - +5 if mentioned neutrally | +0 if not mentioned | -5 if Gemini says business is unknown
    Gemini status: score>=70 → "Top Choice" | 40-69 → "Option" | <40 → "Hidden"


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
    
    7. AEO ACTION PLAN — EXHAUSTIVE, EVIDENCE-BASED, DATA-DERIVED:
    
    This is the most critical section. Every single task MUST be derived from a specific, named piece of verified evidence from the VERIFIED DATA above. Generic advice is forbidden. Follow this framework exactly:
    
    STEP 1 — PRIORITY TRIAGE: Internally rank the identified issues by severity before generating tasks. Highest priority issues generate the most urgent tasks (highest Impact). Your triage must consider:
      - Missing GBP = CRITICAL
      - Missing Website = CRITICAL
      - Missing/unlisted on a key citation directory = HIGH
      - Negative review themes identified = HIGH
      - Low rating (< 4.0) = HIGH
      - Low review volume (< 20 reviews) = MODERATE
      - Missing social profiles = MODERATE
      - No visual content (visualAudit score: 0) = MODERATE
      - Competitors outranking on citations = LOW
    
    STEP 2 — GENERATE UP TO 10 MISSIONS based on the priority triage. Each mission MUST:
      a) Reference the EXACT verified data point that makes it necessary (e.g. "Identity Agent found: hasGbp = false", "Citation Agent found: Yelp isListed = false", "Sentiment: negativeTheme 'slow service' found in 8% of reviews").
      b) Have a hyper-specific title (NOT generic — e.g., NOT "Improve your GBP" but instead "Claim & Verify Your Google Business Profile on Google.com/business").
      c) Have a step-by-step description that someone can actually execute (e.g., "Go to google.com/business, search for your business name '${business.name}', click 'Claim This Business'...").
      d) Cite the 'Why' — i.e. connecting it to a specific LLM (e.g., "Why: Gemini sources GBP data directly to power local recommendations. Without it, you are invisible to all Google AI features.").
    
    THE 5 CATEGORIES (generate up to 2 distinct tasks per category for the highest-priority issues):
    
    PRESENCE (GBP / Website):
      - If hasGbp = false → Mission is about creating/claiming GBP. 
      - If hasGbp = true but websiteUrl = None → Mission is about building a landing page.
      - If both exist → Mission is about optimizing GBP with categories, attributes, or Q&A.
      - Add a second task for optimizing website speed or accessibility if applicable.
    
    CITATIONS (from the Verified Citation Ecosystem):
      - Find the highest-priority directories where isListed = false.
      - Create specific missions for getting listed on those exact URLs.
      - Explain which LLM feeds from those specific sources.
    
    REPUTATION (from Verified Sentiment):
      - If hasReviews = false → Mission is to generate first reviews (provide specific script/ask template).
      - If hasReviews = true AND rating < 4.0 → Mission is a response strategy for the specific negativeThemes found.
      - If rating >= 4.0 but volume is low → Mission is to increase review volume with a specific platform and tactic.
    
    CONTENT / KEYWORDS (from Keyword Heist):
      - Pick up to 2 keywords with high opportunityScores where owner = "Competitor".
      - Missions are to create content specifically targeting THOSE keywords on the most appropriate platforms.
    
    AEO TECH (Schema / LLM Feed):
      - Based on the biggest LLM gaps (from llmPerformance scores), provide technical actions.
      - If Perplexity score < 20 → Mission is to add FAQPage schema markup.
      - If ChatGPT score < 20 → Mission is to submit a business description to Wikipedia or Wikidata.
      - If Gemini score < 20 → Mission is to add LocalBusiness schema.org markup.
      - Provide the exact schema code snippets in the descriptions.
    
    FORBIDDEN: Do NOT generate a mission that says things like "improve your online presence" or "engage with customers" without a specific data-backed action. Every word must be traceable to the verified data payload.

    Calculate scores and return the final massive JSON report exactly matching the AnalysisResult interface.
    Each object in the response MUST contain all standard fields even if empty/default.
    
    Structure Template:
    {
      "reasoningChain": { "layer1_DataIngestion": "", "layer2_VisibilityMath": "", "layer3_SimulationAlignment": "" },
      "overallScore": 0,
      "summary": "",
      "businessCoordinates": { "lat": 0, "lng": 0 },
      "marketOverview": { "marketVibe": "", "competitionLevel": "Cut-throat"|"Moderate"|"Low"|"Blue Ocean", "popularPrompts": [], "opportunityNiche": "", "hiddenRankingFactor": "" },
      "attributes": {
        "authority": { "score": 0, "label": "", "explanation": "", "action": "" },
        "consistency": { "score": 0, "label": "", "explanation": "", "action": "" },
        "sentiment": { "score": 0, "label": "", "explanation": "", "action": "" },
        "relevance": { "score": 0, "label": "", "explanation": "", "action": "" },
        "citations": { "score": 0, "label": "", "explanation": "", "action": "" }
      },
      "simulations": [{ "query": "", "aiResponse": "", "rank": "Top Recommendation"|"Mentioned"|"Not Found" }],
      "personas": [{ "personaName": "", "userIntent": "", "simulatedQuery": "", "aiResponseSummary": "", "brandMentioned": true|false }],
      "contentGaps": [{ "missingElement": "", "importance": "High"|"Medium"|"Low", "fix": "" }],
      "platformPerformance": [{ "platform": "Chat Interfaces"|"Voice Search"|"Traditional Search", "score": 0, "status": "Optimized"|"Needs Work"|"Invisible" }],
      "globalLLMInsight": { "summary": "", "visibilityByIntent": [{"intent": "Discovery", "total": 10, "appeared": 5}], "entityConfidenceScore": 50, "entitySignals": [""], "visibilityPotential": "" },
      "llmPerformance": [{ "model": "ChatGPT"|"Gemini"|"Perplexity"|"Claude", "status": "Top Choice"|"Option"|"Hidden", "details": "", "score": 0, "promptsTested": 10, "promptsAppeared": 5, "topPromptsAppeared": [""], "topPromptsMissed": [""], "competitorReplacements": [{"name": "", "appearancePercentage": 0, "examplePrompts": [""]}], "behaviorInsight": "", "testedPrompts": [{"text": "", "intent": "Discovery", "appears": true, "competitorsShown": [""]}] }],
      "localCompetitors": [{ "name": "", "rank": 0, "distance": "", "lat": 0, "lng": 0, "address": "", "sourceUrl": "" }],
      "citationOpportunities": [{ "siteName": "", "domain": "", "type": "Directory"|"Social"|"Forum"|"Health/Niche"|"LLM Data Source", "priority": "High"|"Medium"|"Low", "reason": "", "isListed": true|false, "feedsModels": [] }],
      "keywordHeist": [{ "term": "", "owner": "Competitor"|"You"|"Shared", "intent": "Navigational"|"Commercial"|"Deep Research", "llmPromptVolumes": { "gemini": 0, "chatgpt": 0, "claude": 0, "perplexity": 0 }, "opportunityScore": 0 }],
      "sentimentAudit": { "toxicityScore": 0, "summary": "", "negativeEntities": [{ "term": "", "frequency": "", "impact": "Critical"|"Moderate"|"Low" }] },
      "dailyMissions": [{ "id": "", "title": "", "description": "", "category": "Presence"|"Citations"|"Reputation"|"Content"|"AEO Tech", "estimatedTime": "" }],
      "contentStrategy": [{ "platform": "Instagram"|"LinkedIn"|"GMB", "focusKeyword": "", "caption": "", "hashtags": [], "imageIdea": "", "whyThisWorks": "" }],
      "voiceSimulation": { "query": "", "script": "", "voiceParams": { "pitch": 1, "rate": 1 } },
      "competitors": [{ "name": "", "strengths": [] }],
      "recommendations": [{ "title": "", "description": "", "impact": "High"|"Medium"|"Low", "actionItem": "" }]
    }

    For localCompetitors array in the JSON, map directly from the Verified Local Competitors. 
    For citationOpportunities array, map directly from the Verified Citation Ecosystem, adding priorities and models.
    For factCheck array, verify facts based solely on the data provided or leave empty if no data exists.
    IMPORTANT: Do NOT invent missing data. If it is not in the verified data payload above, mark it as 'Not Found', mark the score poorly, or exclude it.
  `;

  const parts: any[] = [{ text: promptText }];

  // Photos feature removed as per user request

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        // NOTE: search tool is EXPLICITLY DISABLED for the compiler

        // STABILITY SETTINGS: Low temperature for consistent scoring
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        // MASSIVE SCHEMAS cause "too many states" errors. 
        // We ensure valid JSON but simplified constraints to avoid the state limit.
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
              properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
              required: ["lat", "lng"]
            },
            marketOverview: {
              type: Type.OBJECT,
              properties: {
                marketVibe: { type: Type.STRING },
                competitionLevel: { type: Type.STRING, enum: ["Cut-throat", "Moderate", "Low", "Blue Ocean"] },
                popularPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunityNiche: { type: Type.STRING },
                hiddenRankingFactor: { type: Type.STRING }
              },
              required: ["marketVibe", "competitionLevel", "popularPrompts", "opportunityNiche", "hiddenRankingFactor"]
            },
            attributes: {
              type: Type.OBJECT,
              properties: {
                authority: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, label: { type: Type.STRING }, explanation: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["score", "label", "explanation", "action"] },
                consistency: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, label: { type: Type.STRING }, explanation: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["score", "label", "explanation", "action"] },
                sentiment: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, label: { type: Type.STRING }, explanation: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["score", "label", "explanation", "action"] },
                relevance: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, label: { type: Type.STRING }, explanation: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["score", "label", "explanation", "action"] },
                citations: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, label: { type: Type.STRING }, explanation: { type: Type.STRING }, action: { type: Type.STRING } }, required: ["score", "label", "explanation", "action"] }
              },
              required: ["authority", "consistency", "sentiment", "relevance", "citations"]
            },
            simulations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { query: { type: Type.STRING }, aiResponse: { type: Type.STRING }, rank: { type: Type.STRING } }, required: ["query", "aiResponse", "rank"] } },
            personas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { personaName: { type: Type.STRING }, userIntent: { type: Type.STRING }, simulatedQuery: { type: Type.STRING }, aiResponseSummary: { type: Type.STRING }, brandMentioned: { type: Type.BOOLEAN } }, required: ["personaName", "userIntent", "simulatedQuery", "aiResponseSummary", "brandMentioned"] } },
            contentGaps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { missingElement: { type: Type.STRING }, importance: { type: Type.STRING }, fix: { type: Type.STRING } }, required: ["missingElement", "importance", "fix"] } },
            platformPerformance: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, score: { type: Type.NUMBER }, status: { type: Type.STRING } }, required: ["platform", "score", "status"] } },
            globalLLMInsight: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                visibilityByIntent: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { intent: { type: Type.STRING }, total: { type: Type.NUMBER }, appeared: { type: Type.NUMBER } }, required: ["intent", "total", "appeared"] } },
                entityConfidenceScore: { type: Type.NUMBER },
                entitySignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                visibilityPotential: { type: Type.STRING }
              },
              required: ["summary", "visibilityByIntent", "entityConfidenceScore", "entitySignals", "visibilityPotential"]
            },
            llmPerformance: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  model: { type: Type.STRING }, 
                  status: { type: Type.STRING }, 
                  details: { type: Type.STRING }, 
                  score: { type: Type.NUMBER },
                  promptsTested: { type: Type.NUMBER },
                  promptsAppeared: { type: Type.NUMBER },
                  topPromptsAppeared: { type: Type.ARRAY, items: { type: Type.STRING } },
                  topPromptsMissed: { type: Type.ARRAY, items: { type: Type.STRING } },
                  competitorReplacements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, appearancePercentage: { type: Type.NUMBER }, examplePrompts: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "appearancePercentage"] } },
                  behaviorInsight: { type: Type.STRING },
                  testedPrompts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, intent: { type: Type.STRING }, appears: { type: Type.BOOLEAN }, competitorsShown: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["text", "intent", "appears"] } }
                }, 
                required: ["model", "status", "details", "score", "promptsTested", "promptsAppeared", "behaviorInsight", "testedPrompts"] 
              } 
            },
            localCompetitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, rank: { type: Type.NUMBER }, distance: { type: Type.STRING }, lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER }, address: { type: Type.STRING }, sourceUrl: { type: Type.STRING }, rating: { type: Type.NUMBER }, reviewCount: { type: Type.NUMBER }, profileCompleteness: { type: Type.NUMBER } }, required: ["name", "rank"] } },
            citationOpportunities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { siteName: { type: Type.STRING }, domain: { type: Type.STRING }, type: { type: Type.STRING }, priority: { type: Type.STRING }, reason: { type: Type.STRING }, isListed: { type: Type.BOOLEAN }, feedsModels: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["siteName", "domain", "isListed"] } },
            keywordHeist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, owner: { type: Type.STRING }, intent: { type: Type.STRING }, llmPromptVolumes: { type: Type.OBJECT }, opportunityScore: { type: Type.NUMBER } }, required: ["term", "owner", "intent"] } },
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
                      impact: { type: Type.STRING, enum: ["Critical", "Moderate", "Low"] } 
                    }, 
                    required: ["term", "frequency", "impact"] 
                  } 
                } 
              }, 
              required: ["toxicityScore", "summary", "negativeEntities"] 
            },
            dailyMissions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, category: { type: Type.STRING }, estimatedTime: { type: Type.STRING } }, required: ["id", "title", "description", "category", "estimatedTime"] } },
            contentStrategy: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, focusKeyword: { type: Type.STRING }, caption: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, imageIdea: { type: Type.STRING }, whyThisWorks: { type: Type.STRING } }, required: ["platform", "focusKeyword", "caption", "hashtags", "imageIdea", "whyThisWorks"] } },
            voiceSimulation: { 
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING },
                script: { type: Type.STRING },
                voiceParams: { 
                  type: Type.OBJECT,
                  properties: { pitch: { type: Type.NUMBER }, rate: { type: Type.NUMBER } },
                  required: ["pitch", "rate"]
                }
              },
              required: ["query", "script", "voiceParams"]
            },
            competitors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "strengths"] } },
            recommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, impact: { type: Type.STRING }, actionItem: { type: Type.STRING } }, required: ["title", "description", "impact", "actionItem"] } },
            visualAudit: { type: Type.OBJECT },
            vocalSearch: { type: Type.OBJECT },
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
                required: ["question", "aiAnswer", "confidence", "sourceUrl"] 
              } 
            },
            hallucinationWall: { 
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
          },
          required: ["reasoningChain", "overallScore", "summary", "businessCoordinates", "marketOverview", "attributes", "simulations", "personas", "contentGaps", "platformPerformance", "llmPerformance", "globalLLMInsight", "localCompetitors", "citationOpportunities", "keywordHeist", "sentimentAudit", "dailyMissions", "contentStrategy", "voiceSimulation", "competitors", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    let data = JSON.parse(text) as AnalysisResult;

    // DATA NORMALIZATION: Ensure all frontend-required fields exist to prevent crashes
    const defaultAttribute = { score: 0, label: "Invisible", explanation: "Data unavailable", action: "Complete your profile" };
    data.attributes = {
      authority: data.attributes?.authority || defaultAttribute,
      consistency: data.attributes?.consistency || defaultAttribute,
      sentiment: data.attributes?.sentiment || defaultAttribute,
      relevance: data.attributes?.relevance || defaultAttribute,
      citations: data.attributes?.citations || defaultAttribute,
    };

    data.keywordHeist = Array.isArray(data.keywordHeist) ? data.keywordHeist : [];
    data.dailyMissions = Array.isArray(data.dailyMissions) ? data.dailyMissions : [];
    data.recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    data.localCompetitors = Array.isArray(data.localCompetitors) ? data.localCompetitors : [];
    data.simulations = Array.isArray(data.simulations) ? data.simulations : [];
    data.personas = Array.isArray(data.personas) ? data.personas : [];
    data.contentGaps = Array.isArray(data.contentGaps) ? data.contentGaps : [];
    data.platformPerformance = Array.isArray(data.platformPerformance) ? data.platformPerformance : [];
    data.llmPerformance = Array.isArray(data.llmPerformance) ? data.llmPerformance : [];
    data.citationOpportunities = Array.isArray(data.citationOpportunities) ? data.citationOpportunities : [];
    data.contentStrategy = Array.isArray(data.contentStrategy) ? data.contentStrategy : [];
    
    // Normalization for new LLM Diagnostics panel fields
    if (!data.globalLLMInsight) {
      data.globalLLMInsight = { summary: "Analysis complete.", visibilityByIntent: [], entityConfidenceScore: 0, entitySignals: [], visibilityPotential: "Requires deeper optimization." };
    } else {
      data.globalLLMInsight.visibilityByIntent = Array.isArray(data.globalLLMInsight.visibilityByIntent) ? data.globalLLMInsight.visibilityByIntent : [];
      data.globalLLMInsight.entitySignals = Array.isArray(data.globalLLMInsight.entitySignals) ? data.globalLLMInsight.entitySignals : [];
    }

    if (!data.businessCoordinates) data.businessCoordinates = { lat: 0, lng: 0 };
    if (!data.marketOverview) {
      data.marketOverview = { marketVibe: "N/A", competitionLevel: "Low", popularPrompts: [], opportunityNiche: "N/A", hiddenRankingFactor: "N/A" };
    } else {
      // Deep normalization for marketOverview
      data.marketOverview.popularPrompts = Array.isArray(data.marketOverview.popularPrompts) ? data.marketOverview.popularPrompts : [];
      data.marketOverview.marketVibe = data.marketOverview.marketVibe || "N/A";
      data.marketOverview.competitionLevel = data.marketOverview.competitionLevel || "Low";
      data.marketOverview.opportunityNiche = data.marketOverview.opportunityNiche || "N/A";
      data.marketOverview.hiddenRankingFactor = data.marketOverview.hiddenRankingFactor || "N/A";
    }
    
    if (!data.sentimentAudit) {
      data.sentimentAudit = { toxicityScore: 0, negativeEntities: [], summary: "N/A" };
    } else {
      data.sentimentAudit.negativeEntities = Array.isArray(data.sentimentAudit.negativeEntities) ? data.sentimentAudit.negativeEntities : [];
      data.sentimentAudit.toxicityScore = data.sentimentAudit.toxicityScore ?? 0;
      data.sentimentAudit.summary = data.sentimentAudit.summary || "N/A";
    }

    // ZERO HALLUCINATION FILTERING: Programmatic Data Sanitization
    data.localCompetitors = data.localCompetitors.filter(c => c.sourceUrl && c.sourceUrl.includes('.'));
    data.citationOpportunities = data.citationOpportunities.filter(c => c.domain && c.domain.includes('.'));
    
    // Generate simple IDs for missions if not present
    data.dailyMissions = data.dailyMissions.map((m, i) => ({
      ...m,
      id: m.id || `mission-${i}`
    }));

    // 5. Inject Visual + Vocal data directly
    data.visualAudit = visualData;
    data.vocalSearch = vocalData;

    // 6. Run Hallucination Wall Validation
    try {
        const hallucinationReport = await runHallucinationWall(ai, data, identityData, competitorData, citationData);
        data.hallucinationWall = hallucinationReport;
    } catch (e) {
        data.hallucinationWall = [];
    }

    return data;

  } catch (error) {
    console.error("Error analyzing business:", error);
    throw error;
  }
};

/**
 * Runs a live, high-precision voice assistant simulation using Gemini.
 * Factors in distance, category relevance, and actual AEO scores to prevent brand bias.
 */
export const runLiveVoiceSimulation = async (
  ai: GoogleGenAI,
  params: {
    query: string;
    assistant: string;
    device: string;
    businessName: string;
    businessCategory: string;
    businessAddress: string;
    voiceScore: number;
    competitors: any[];
  }
) => {
  // Calculate a realistic distance based on device context
  const baseDistance = params.device === 'In-Car Navigation' ? '1.5 miles' : '0.8 miles';

  const prompt = `
    PERSISTENT PERSONA: You are the "${params.assistant}" voice assistant on a "${params.device}". 
    CONTEXT: The user is approximately "${baseDistance}" away from "${params.businessAddress}".
    TARGET BUSINESS: "${params.businessName}" (Category: "${params.businessCategory}").
    AEO SCORE: ${params.voiceScore}/100 (This score represents how visible and trusted they are to LLMs).
    LOCAL COMPETITORS: ${JSON.stringify(params.competitors.slice(0, 3).map(c => c.name))}

    TASK:
    A user just asked: "${params.query}"
    
    RULES:
    1. RELEVANCE CHECK (CRITICAL): Does the query "${params.query}" actually match the Category "${params.businessCategory}"? 
       - If NO (e.g., asking for Tiramisu at a Chiropractor), you MUST recommend local businesses that ARE relevant (Italian restaurants) and ignore "${params.businessName}".
       - If YES, proceed to Ranking.
    
    2. RANKING LOGIC (STRICT):
       - If AEO Score > 85: Highly likely (85%) you recommend "${params.businessName}" as the #1 choice.
       - If AEO Score 65-84: Mention "${params.businessName}" as one of 3 options, but NOT necessarily the first.
       - If AEO Score < 50: Recommend competitors instead, or say nothing found.
    
    3. RESPONSE STYLE:
       - Keep it brief (under 35 words).
       - Sounds exactly like ${params.assistant}.
       - Mention specific distances or travel times based on the 1-mile range.
       - DO NOT add any markdown, conversational intro, or triple backticks.
       - Return ONLY the raw JSON object like this: {"response": "I found...", "verdict": "Mentions Business", "distance": "0.5 mi", "location": "London"}
  `;

  try {
    const result = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.7,
        topK: 1
      }
    });
    
    const text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Voice simulation error:", error);
    // Return a structured error response that the UI can handle gracefully
    return {
      response: `I'm having trouble connecting to the network right now. Please check your API key and try again.`,
      verdict: "No Answer" as const,
      distance: baseDistance,
      location: "Sync Error"
    };
  }
};
