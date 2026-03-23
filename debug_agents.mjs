
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const business = {
    name: "Antigravity Coffee",
    location: "San Francisco, CA",
    category: "Coffee Shop"
};

const identityData = {
    found: true,
    hasGbp: true,
    exactAddress: "123 Market St, San Francisco, CA 94105",
    websiteUrl: "https://antigravity.coffee"
};

const sentimentData = {
    hasReviews: true,
    rating: 4.8
};

// Mocking the agent logic from geminiService.ts
async function runVisualAgent(ai, business, identityData) {
    console.log("[DEBUG] Starting runVisualAgent...");
    const l1Prompt = `You are an OSINT researcher. Search Google to find 3 real, publicly accessible photo URLs for:
Business: "${business.name}", Category: "${business.category}", Location: "${business.location}"${identityData.exactAddress ? ', Address: "' + identityData.exactAddress + '"' : ''}
Look for images hosted at lh3.googleusercontent.com (Google Maps CDN), or their official website if available.
Return EXACTLY raw JSON: { "imageUrls": ["url1","url2","url3"], "found": boolean }
If no images found, return { "imageUrls": [], "found": false }. No markdown.`;

    try {
        const l1Res = await ai.models.generateContent({ 
            model: "models/gemini-2.5-pro", 
            contents: { parts: [{ text: l1Prompt }] }, 
            config: { tools: [{ googleSearch: {} }], temperature: 0.0 } 
        });
        console.log("[DEBUG] L1 Response:", l1Res.text);
    } catch (e) {
        console.log("[DEBUG] L1 ERROR:", e.message);
    }
}

async function runVocalSearchAgent(ai, business, identityData, sentimentData) {
    console.log("[DEBUG] Starting runVocalSearchAgent...");
    const l1Prompt = `Search Google for voice search behavior in the "${business.category}" niche in "${business.location}":
1. What does Google Assistant typically say for "Find the best ${business.category} near me"?
2. Does "${business.name}" appear in any featured snippets, PAA boxes, or voice results?
3. What JSON-LD schema types do top competitors use?
Return raw JSON: { "voicePresenceFound": boolean, "topVoiceQueries": ["q1","q2","q3","q4"], "competitorSchemas": ["FAQPage","LocalBusiness"], "businessMentionedInVoice": boolean }
No markdown.`;

    try {
        const l1Res = await ai.models.generateContent({ 
            model: "models/gemini-2.5-pro", 
            contents: { parts: [{ text: l1Prompt }] }, 
            config: { tools: [{ googleSearch: {} }], temperature: 0.0 } 
        });
        console.log("[DEBUG] L1 Response:", l1Res.text);
    } catch (e) {
        console.log("[DEBUG] L1 ERROR:", e.message);
    }
}

async function start() {
    await runVisualAgent(ai, business, identityData);
    await runVocalSearchAgent(ai, business, identityData, sentimentData);
}

start();
