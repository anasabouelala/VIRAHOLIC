
import { analyzeBusinessVisibility } from "./services/geminiService.ts";
import dotenv from "dotenv";
dotenv.config();

const business = {
    name: "Antigravity Coffee",
    location: "San Francisco, CA",
    category: "Coffee Shop"
};

async function testFullPipeline() {
    try {
        console.log("Starting full pipeline test...");
        const result = await analyzeBusinessVisibility(business);
        console.log("Pipeline SUCCESS!");
        console.log("Overall Score:", result.overallScore);
        console.log("Missions Count:", result.dailyMissions?.length);
        // Verify key structure pieces exist
        if (result.reasoningChain && result.marketOverview && result.dailyMissions) {
            console.log("Verified: Key structure components are present.");
        } else {
            console.log("Warning: Some components are missing.");
        }
    } catch (e) {
        console.error("PIPELINE ERROR:", e);
    }
}

testFullPipeline();
