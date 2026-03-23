
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const result = await ai.models.list();
        for await (const m of result) {
            console.log(m.name);
        }
    } catch (e) { }
}

listModels();
