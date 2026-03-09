
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

// New function to fetch REAL ChatGPT data if key exists
const fetchChatGPTInsight = async (business: BusinessInfo, openaiKey: string): Promise<string> => {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Use mini for speed and cost
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful local guide. Answer concisely."
                    },
                    {
                        role: "user",
                        content: `I am looking for the best ${business.category} in ${business.location}. Please provide your top 3 recommendations and explain why. Also, do you know "${business.name}"? If so, what is your opinion on it?`
                    }
                ],
                max_tokens: 300
            })
        });

        if (!response.ok) return "Error fetching ChatGPT data.";
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response from ChatGPT.";
    } catch (e) {
        console.error("OpenAI Fetch Error", e);
        return "Failed to connect to OpenAI.";
    }
};

export const analyzeBusinessVisibility = async (business: BusinessInfo, openaiKey?: string, geminiKey?: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey(geminiKey) });

  // 1. Fetch Real ChatGPT Data (Parallel)
  let realChatGPTData = "Simulation Mode (No Key Provided)";
  if (openaiKey) {
      realChatGPTData = await fetchChatGPTInsight(business, openaiKey);
  }

  const promptText = `
    You are a **Forensic SEO Auditor** specializing in "Generative Engine Optimization" (GEO).
    Your job is to analyze the visibility of a local business within LLMs (ChatGPT, Gemini, Perplexity).

    **STRICT RULES - ZERO TOLERANCE FOR HALLUCINATION:**
    1.  **Do NOT invent data.** If you cannot find a specific competitor or statistic via Google Search, state "Unknown" or return a generic valid placeholder, but DO NOT make up a business name or address.
    2.  **Verify everything.** Every competitor listed MUST exist in the real world. Every citation opportunity MUST be a real website that actually ranks.
    3.  **Be Exhaustive.** Dig deep. Look for social footprint, video content, and niche directories.

    **SUBJECT:**
    Business: ${business.name}
    Location: ${business.location}
    Category: ${business.category}
    ${business.website ? `Website: ${business.website}` : ''}

    **REAL DATA CONTEXT (ChatGPT):**
    "${realChatGPTData}"

    ========================================================
    PHASE 1: DISCOVERY & IDENTIFICATION
    ========================================================
    Use Google Search to find the exact entity.
    - Handle fuzzy matching (e.g. "Joe's Coffee" vs "Joe's Coffee Shop Austin").
    - If in a non-English region, search in the local language (e.g. "Kiné" for Physio in France/Morocco).
    - If you strictly CANNOT find the business after multiple search attempts, trigger "Ghost Mode" (Low Score) but proceed with a "Competitor Analysis" so the user still gets value.

    ========================================================
    PHASE 2: THE FORENSIC AUDIT
    ========================================================
    
    1.  **Market Intelligence (The Ecosystem)**:
        - Search for "Best ${business.category} in ${business.location}".
        - Analyze the Search Engine Results Page (SERP). Who dominates? Directories? Specific brands?
        - **Popular Prompts**: Infer what users actually ask based on "People Also Ask" results.
    
    2.  **Competitor Landscape (Accuracy Critical)**:
        - Identify 5-10 REAL competitors appearing in top search results or maps.
        - **MANDATORY**: Extract their **real address** or at least the street name. Do not guess coordinates. Estimate Lat/Lng from the real address found.
    
    3.  **Citation Analysis (RAG Sources)**:
        - **Logic**: Gemini/ChatGPT read the top 10 text results on Google to answer "Who is the best?".
        - Identify which specific URLS rank #1, #2, #3 for "Best ${business.category} ${business.location}".
        - These are your "Feeders". 
    
    4.  **Sentiment & Toxicity**:
        - Search for "Reviews ${business.name} ${business.location}".
        - Look for recurring negative words (e.g. "Rude", "Dirty", "Wait time").
        - If no reviews found, score as neutral/invisible.

    5.  **Visual Audit**:
        - If images are provided in this request, analyze them.
        - If NOT, search for "Photos ${business.name} ${business.location}".
        - If you see photos, analyze the "Vibe". If none, mark as "Visual Ghost".

    ========================================================
    PHASE 3: SCORING ALGORITHM (MATHEMATICAL, NOT GUESSWORK)
    ========================================================
    Calculate 'overallScore' strictly using this point system. Do not deviate.
    
    Start with 0 Points.
    
    1. **Identity Verified (+20 pts max)**
       - Found the Entity on Google Maps/Search: +10 pts
       - Found a specific physical address (not just city): +10 pts
       
    2. **RAG Ranking Simulation (+35 pts max)**
       - Perform a simulated search for "Best ${business.category} in ${business.location}" using your internal knowledge + Google Search results.
       - If Business is the #1 Recommendation: +35 pts
       - If Business is in Top 3 List: +20 pts
       - If Business is mentioned anywhere in text: +10 pts
       - If not found: 0 pts
       
    3. **Citation Authority (+20 pts max)**
       - For every valid Directory/Source found on Google Page 1 that lists this business: +5 pts (Max 20 pts).
       
    4. **Visuals (+10 pts max)**
       - Images provided or found on GMB: +10 pts
       - No images: 0 pts
       
    5. **Sentiment (+15 pts max)**
       - Positive sentiment found: +15 pts
       - No reviews found: +5 pts (Neutral)
       - Toxic/Negative words found: -10 pts (Penalty)

    **Ghost Mode Penalty:** If Identity Verification failed completely, Max Score is 15.

    Return a strict JSON object matching the schema.
  `;

  const parts: any[] = [{ text: promptText }];
  
  // Add images to the payload if they exist
  if (business.images && business.images.length > 0) {
    business.images.forEach(base64Str => {
      // Remove header if present (e.g., "data:image/jpeg;base64,")
      const base64Data = base64Str.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from header
          data: base64Data
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: parts },
      config: {
        tools: [{ googleSearch: {} }],
        // STABILITY SETTINGS: Low temperature for consistent scoring
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
                }
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
                }
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
                }
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
                  feedsModels: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            keywordHeist: {
              type: Type.ARRAY,
              items: {
                 type: Type.OBJECT,
                 properties: {
                    term: { type: Type.STRING },
                    owner: { type: Type.STRING, enum: ['Competitor', 'You', 'Shared'] },
                    searchVolume: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    opportunityScore: { type: Type.NUMBER }
                 }
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
                            }
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
                    improvements: { type: Type.STRING },
                    source: { type: Type.STRING, enum: ["Upload", "GMB_Scan", "Not_Found"] }
                },
                required: ['overallVibe', 'score', 'detectedTags', 'improvements', 'source']
            },
            factCheck: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        aiAnswer: { type: Type.STRING },
                        confidence: { type: Type.STRING }
                    }
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
          required: ["overallScore", "summary", "businessCoordinates", "marketOverview", "attributes", "simulations", "personas", "contentGaps", "platformPerformance", "llmPerformance", "localCompetitors", "citationOpportunities", "keywordHeist", "sentimentAudit", "dailyMissions", "contentStrategy", "voiceSimulation", "competitors", "recommendations", "visualAudit"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as AnalysisResult;
    // Generate simple IDs for missions if not present
    if (data.dailyMissions) {
        data.dailyMissions = data.dailyMissions.map((m, i) => ({
            ...m,
            id: m.id || `mission-${i}`
        }));
    }
    return data;

  } catch (error) {
    console.error("Error analyzing business:", error);
    throw error;
  }
};
