
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
    console.log("No API key found in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const model = "models/gemini-2.5-pro";

async function test() {
    try {
        console.log("Testing model:", model);
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: "Hello?" }] }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.log("Error type:", e.constructor.name);
        console.log("Error message:", e.message);
    }
}

test();
