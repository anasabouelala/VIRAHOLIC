import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';

const envFile = fs.readFileSync('../.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key) env[key.trim()] = vals.join('=').trim();
});

const ai = new GoogleGenAI({ apiKey: env.VITE_GEMINI_API_KEY });
const prompt = `
  Analyze this business. 
  Just return {"factCheck": [{"question": "a", "aiAnswer": "b", "sourceUrl": "c", "confidence": "high"}], "keywordHeist": [{"term":"a", "owner":"You", "searchVolume":"High", "opportunityScore":10}], "llmPerformance": [{"model": "Gemini", "status": "Top Choice", "details": "d", "score": 90}], "visualAudit": {"overallVibe": "a", "score": 10, "detectedTags": [], "missingCrucialEntities": [], "intentScores": [], "extractedText": [], "improvements": "a", "source": "Not_Found"}} exactly.
`;

ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [{ text: prompt }] },
    config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                factCheck: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, aiAnswer: { type: Type.STRING }, confidence: { type: Type.STRING }, sourceUrl: { type: Type.STRING } } } },
                keywordHeist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, owner: { type: Type.STRING, enum: ['Competitor', 'You', 'Shared'] }, searchVolume: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }, opportunityScore: { type: Type.NUMBER } } } },
                llmPerformance: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { model: { type: Type.STRING, enum: ["ChatGPT", "Gemini", "Perplexity"] }, status: { type: Type.STRING, enum: ["Top Choice", "Option", "Hidden"] }, details: { type: Type.STRING }, score: { type: Type.NUMBER } } } },
                visualAudit: { type: Type.OBJECT, properties: { overallVibe: { type: Type.STRING }, score: { type: Type.NUMBER }, detectedTags: { type: Type.ARRAY, items: { type: Type.STRING } }, missingCrucialEntities: { type: Type.ARRAY, items: { type: Type.STRING } }, intentScores: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { intent: { type: Type.STRING }, score: { type: Type.NUMBER } }, required: ['intent', 'score'] } }, extractedText: { type: Type.ARRAY, items: { type: Type.STRING } }, qualityWarning: { type: Type.STRING }, improvements: { type: Type.STRING }, source: { type: Type.STRING, enum: ["Upload", "GMB_Scan", "Not_Found"] } }, required: ['overallVibe', 'score', 'detectedTags', 'missingCrucialEntities', 'intentScores', 'extractedText', 'improvements', 'source'] }
            }
        }
    }
}).then(res => console.log(res.text)).catch(console.error);
