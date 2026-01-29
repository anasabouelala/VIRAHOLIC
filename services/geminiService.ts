
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BusinessInfo, ImpactLevel } from "../types";

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API Key not found. Please set REACT_APP_GEMINI_API_KEY.");
  }
  return key;
};

export const analyzeBusinessVisibility = async (business: BusinessInfo): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const prompt = `
    Analyze the "LLM Visibility" (GEO - Generative Engine Optimization) for:
    
    Business: ${business.name}
    Location: ${business.location}
    Category: ${business.category}
    ${business.website ? `Website: ${business.website}` : ''}
    ${business.keywords ? `Keywords: ${business.keywords}` : ''}

    Target Audience: The user is a business owner who is NOT technical. 
    Crucial Requirement: For every metric, explain "Why it matters" and "What to do" in simple, non-jargon English.

    Task: Simulate an advanced SEO audit for AI engines.
    
    1.  **Research**: Use Google Search to find real info, reviews, citations, and competitors.
    2.  **LLM Ranking**: Simulate how this business appears specifically in ChatGPT, Gemini, and Perplexity.
    3.  **Local Map**: Identify 10-15 key competitors.
    4.  **KPI Analysis**: For Authority, Consistency, Sentiment, Relevance, and Citations, provide a score (0-100), a label (e.g. "Good"), a simple explanation, and a direct fix.
    5.  **Keyword Heist**: Identify adjectives AI associates with competitors but not the user.
    6.  **Training Data Audit**: Scan for negative words in reviews that might poison AI answers.
    7.  **Daily Missions**: Create 4 specific, actionable tasks the user can do TODAY in under 5 minutes.
    8.  **Content Studio Strategy**: Create 3 completely written social media posts (Instagram, LinkedIn, GMB) that explicitly use the *missing* keywords found in the analysis. This is a "Done for you" service.
    9.  **Voice Search Simulation**: Write a script of exactly what Siri/Google Assistant would say if asked "Best ${business.category} in ${business.location}". Make it sound natural.
    
    Return strict JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
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
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
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
                  type: { type: Type.STRING, enum: ["Directory", "Social", "Forum", "Health/Niche"] },
                  priority: { type: Type.STRING, enum: [ImpactLevel.HIGH, ImpactLevel.MEDIUM, ImpactLevel.LOW] },
                  reason: { type: Type.STRING }
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
          required: ["overallScore", "summary", "attributes", "simulations", "personas", "contentGaps", "platformPerformance", "llmPerformance", "localCompetitors", "citationOpportunities", "keywordHeist", "sentimentAudit", "dailyMissions", "contentStrategy", "voiceSimulation", "competitors", "recommendations"]
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
