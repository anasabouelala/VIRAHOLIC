import { AnalysisResult, ImpactLevel } from './types';

export const DEMO_DATA: AnalysisResult = {
    reasoningChain: {
        layer1_DataIngestion: "Aggregated 42 signal points from Google Business Profile, Apple Maps, and local niche directories in San Francisco.",
        layer2_VisibilityMath: "Computed multi-platform rank using intent-weighted AEO algorithms (commercial/informational).",
        layer3_SimulationAlignment: "Validated responses against Perplexity 3.0 and GPT-4o-mini search grounding."
    },
    overallScore: 82,
    summary: "Blue Bottle Coffee maintains a strong authority in San Francisco, but is currently losing 'Specific-Intent' queries (e.g., 'quietest coffee shop with outlets') to local competitors like Philz. Improving attribute consistency across second-tier directories will unlock the remaining 18% of visibility.",
    attributes: {
        authority: {
            score: 88,
            label: "Excellent",
            explanation: "Over 450 citations and high brand mentions across lifestyle blogs.",
            action: "Secure a backlink from a local 'Best of SF' 2024 list."
        },
        consistency: {
            score: 72,
            label: "Good",
            explanation: "Multiple addresses found for the Mint Plaza location across old directories.",
            action: "Manual audit of Foursquare and Yelp for legacy addresses."
        },
        sentiment: {
            score: 85,
            label: "Excellent",
            explanation: "Consumer sentiment is high, focused on 'Precision' and 'Quality'.",
            action: "Respond specifically to negative feedback about wait times."
        },
        relevance: {
            score: 79,
            label: "Good",
            explanation: "Content is coffee-focused but lacks local neighborhood context.",
            action: "Update landing page to mention 'walking distance from Union Square'."
        },
        citations: {
            score: 86,
            label: "Solid",
            explanation: "Strong presence on all Tier 1 platforms.",
            action: "Add structured data for current seasonal hours."
        }
    },
    simulations: [
        {
            query: "What's the best place for pour-over coffee in SF?",
            aiResponse: "Blue Bottle Coffee is widely considered a top choice for pour-over, specifically their Mint Plaza and Ferry Building locations which use custom drippers.",
            rank: "Top Recommendation"
        },
        {
            query: "Coffee shops near Union Square for working",
            aiResponse: "While Blue Bottle is nearby, users often prefer Philz or Sightglass for longer work sessions due to seating availability.",
            rank: "Mentioned"
        }
    ],
    personas: [
        {
            personaName: "The Digital Nomad",
            userIntent: "Remote Work & Wi-Fi",
            simulatedQuery: "Best coffee shop with fast wifi in Soma",
            aiResponseSummary: "AI suggested 3 competitors. Blue Bottle not mentioned due to lack of 'Fast WiFi' attribute in metadata.",
            brandMentioned: false
        }
    ],
    contentGaps: [
        {
            missingElement: "Sustainability Report",
            importance: ImpactLevel.MEDIUM,
            fix: "Highlight direct-trade practices in a 'Transparency' section."
        }
    ],
    platformPerformance: [
        { platform: 'Chat Interfaces', score: 85, status: 'Optimized' },
        { platform: 'Voice Search', score: 72, status: 'Needs Work' },
        { platform: 'Traditional Search', score: 90, status: 'Optimized' }
    ],
    globalLLMInsight: {
        summary: "Across 40 tested prompts, Blue Bottle Coffee is rarely surfaced as the primary discovery recommendation, frequently losing to Philz Coffee in Comparison and Alternatives queries due to weaker seating/WiFi sentiment.",
        visibilityByIntent: [
            { intent: "Discovery", total: 15, appeared: 10 },
            { intent: "Comparison", total: 10, appeared: 3 },
            { intent: "Alternatives", total: 8, appeared: 0 },
            { intent: "Local", total: 7, appeared: 6 }
        ],
        entityConfidenceScore: 48,
        entitySignals: [
            "Losing 'Best Cafe for Work' terms",
            "Strong product sentiment but weak logistical markers",
            "Inconsistent hours on tier-2 directories"
        ],
        visibilityPotential: "Low presence across comparative prompts indicates significant upside in AI-driven generic discovery contexts if local attributes are expanded."
    },
    llmPerformance: [
        {
            model: "ChatGPT",
            status: "Top Choice",
            details: "Frequently cited for 'Premium Coffee'.",
            score: 72,
            promptsTested: 10,
            promptsAppeared: 6,
            topPromptsAppeared: ["Best pour over coffee SF", "Where is Blue Bottle Mint Plaza"],
            topPromptsMissed: ["Coffee shop with fast wifi SF", "Best coffee alternatives to Starbucks downtown"],
            competitorReplacements: [
                { name: "Philz Coffee", appearancePercentage: 65, examplePrompts: ["Best coffee shop to work in SF", "SF cafes with free wifi"] },
                { name: "Sightglass Coffee", appearancePercentage: 35, examplePrompts: ["Best coffee alternatives to Starbucks downtown"] }
            ],
            behaviorInsight: "Relies heavily on structured directory sentiment; prioritizes cafes explicitly categorized as 'workspace-friendly' for generic queries.",
            testedPrompts: [
                { text: "Best pour over coffee SF", intent: "Discovery", appears: true, competitorsShown: [] },
                { text: "Where is Blue Bottle Mint Plaza", intent: "Local", appears: true, competitorsShown: [] },
                { text: "Coffee shop with fast wifi SF", intent: "Discovery", appears: false, competitorsShown: ["Philz Coffee", "Sightglass Coffee"] },
                { text: "Is Blue Bottle better than Philz?", intent: "Comparison", appears: true, competitorsShown: ["Philz Coffee"] }
            ]
        },
        {
            model: "Gemini",
            status: "Option",
            details: "Strongly linked to local map packs.",
            score: 55,
            promptsTested: 10,
            promptsAppeared: 5,
            topPromptsAppeared: ["Coffee near Mint Plaza", "Blue Bottle hours"],
            topPromptsMissed: ["Quiet cafes Soma", "Alternatives to Blue Bottle"],
            competitorReplacements: [
                { name: "Sightglass Coffee", appearancePercentage: 50, examplePrompts: ["Quiet cafes Soma"] },
                { name: "Philz Coffee", appearancePercentage: 40, examplePrompts: ["Alternatives to Blue Bottle"] }
            ],
            behaviorInsight: "Struggles with entity disambiguation when 'wifi' or 'seating' is not tagged in Google Maps attributes.",
            testedPrompts: [
                { text: "Coffee near Mint Plaza", intent: "Local", appears: true, competitorsShown: [] },
                { text: "Quiet cafes Soma", intent: "Discovery", appears: false, competitorsShown: ["Sightglass Coffee", "Ritual Coffee Roasters"] },
                { text: "Best alternatives to Blue Bottle in SF", intent: "Alternatives", appears: false, competitorsShown: ["Philz Coffee", "Sightglass Coffee"] }
            ]
        },
        {
            model: "Perplexity",
            status: "Hidden",
            details: "Associated with SF history/tech culture.",
            score: 35,
            promptsTested: 10,
            promptsAppeared: 3,
            topPromptsAppeared: ["History of Blue Bottle", "Specialty coffee roasters SF"],
            topPromptsMissed: ["Best coffee SF 2024", "Top cafes to study SF"],
            competitorReplacements: [
                { name: "Philz Coffee", appearancePercentage: 80, examplePrompts: ["Best coffee SF 2024", "Top cafes to study SF"] }
            ],
            behaviorInsight: "Highly reliant on recent listicles and Reddit threads, where Philz dominates user-generated recommendations.",
            testedPrompts: [
                { text: "History of Blue Bottle", intent: "Other", appears: true, competitorsShown: [] },
                { text: "Specialty coffee roasters SF", intent: "Discovery", appears: true, competitorsShown: ["Sightglass Coffee"] },
                { text: "Top cafes to study SF Reddit", intent: "Comparison", appears: false, competitorsShown: ["Philz Coffee", "The Mill"] }
            ]
        },
        {
            model: "Claude",
            status: "Hidden",
            details: "Deep analytical processing, struggles with local queries.",
            score: 41,
            promptsTested: 10,
            promptsAppeared: 5,
            topPromptsAppeared: ["What is Blue Bottle Coffee known for?", "Best artisanal coffee chains SF"],
            topPromptsMissed: ["Where to get coffee right now near Mint Plaza", "Cafes open late SF"],
            competitorReplacements: [
                { name: "Starbucks", appearancePercentage: 60, examplePrompts: ["Cafes open late SF", "Where to get coffee right now near Mint Plaza"] }
            ],
            behaviorInsight: "Defaults to well-known national brands when local entity presence is weak on third-party aggregators.",
            testedPrompts: [
                { text: "What is Blue Bottle Coffee known for?", intent: "Discovery", appears: true, competitorsShown: [] },
                { text: "Where to get coffee right now near Mint Plaza", intent: "Local", appears: false, competitorsShown: ["Starbucks", "Peet's Coffee"] }
            ]
        }
    ],
    citationOpportunities: [
        {
            siteName: "SF Eater",
            domain: "eater.com",
            type: "LLM Data Source",
            priority: ImpactLevel.HIGH,
            reason: "Heavily utilized by Perplexity for local curation.",
            isListed: true,
            feedsModels: ["Perplexity", "Gemini"]
        }
    ],
    localCompetitors: [
        { name: "Philz Coffee", rank: 1, distance: "0.2 miles", lat: 37.782, lng: -122.401, sourceUrl: "https://philzcoffee.com", rating: 4.6, reviewCount: 1240 },
        { name: "Sightglass Coffee", rank: 2, distance: "0.5 miles", lat: 37.777, lng: -122.408, sourceUrl: "https://sightglasscoffee.com", rating: 4.5, reviewCount: 890 },
        { name: "Sextant Coffee Roasters", rank: 3, distance: "0.7 miles", lat: 37.774, lng: -122.411, sourceUrl: "https://sextantcoffee.com", rating: 4.4, reviewCount: 450 },
        { name: "The Mill", rank: 4, distance: "1.2 miles", lat: 37.776, lng: -122.438, sourceUrl: "https://themillsf.com", rating: 4.3, reviewCount: 720 },
        { name: "Ritual Coffee Roasters", rank: 5, distance: "1.5 miles", lat: 37.756, lng: -122.419, sourceUrl: "https://ritualcoffee.com", rating: 4.4, reviewCount: 1100 },
        { name: "Four Barrel Coffee", rank: 6, distance: "1.8 miles", lat: 37.767, lng: -122.422, sourceUrl: "https://fourbarrelcoffee.com", rating: 4.5, reviewCount: 1350 },
        { name: "Equator Coffees", rank: 7, distance: "0.3 miles", lat: 37.784, lng: -122.405, sourceUrl: "https://equatorcoffees.com", rating: 4.3, reviewCount: 280 },
        { name: "Saint Frank Coffee", rank: 8, distance: "2.1 miles", lat: 37.799, lng: -122.422, sourceUrl: "https://saintfrankcoffee.com", rating: 4.6, reviewCount: 520 },
        { name: "Wrecking Ball Coffee", rank: 9, distance: "2.5 miles", lat: 37.798, lng: -122.435, sourceUrl: "https://wreckingballcoffee.com", rating: 4.4, reviewCount: 310 },
        { name: "Andytown Coffee Roasters", rank: 10, distance: "4.2 miles", lat: 37.754, lng: -122.506, sourceUrl: "https://andytownsf.com", rating: 4.7, reviewCount: 940 }
    ],
    businessCoordinates: { lat: 37.784, lng: -122.403 },
    keywordHeist: [
        {
            term: "Artisanal espresso SF",
            owner: "Competitor",
            intent: "Commercial",
            llmPromptVolumes: { gemini: 1200, chatgpt: 4500, claude: 800, perplexity: 1500 },
            opportunityScore: 84
        },
        {
            term: "Blue Bottle pour over technique",
            owner: "You",
            intent: "Deep Research",
            llmPromptVolumes: { gemini: 800, chatgpt: 1200, claude: 400, perplexity: 600 },
            opportunityScore: 12
        }
    ],
    sentimentAudit: {
        toxicityScore: 2,
        negativeEntities: [
            { term: "Wait times", frequency: "18% of reviews", impact: "Moderate" },
            { term: "Seating", frequency: "12% of reviews", impact: "Moderate" }
        ],
        summary: "Exceptionally positive sentiment regarding product quality, with minor friction points on logistics and space."
    },
    dailyMissions: [
        {
            id: "1",
            title: "Update WIFI Credentials",
            description: "Add 'Free High-Speed WiFi' to your GBP attributes. Why: Remote workers currently recommend Philz over you for this specific reason.",
            category: "Content",
            estimatedTime: "2 mins"
        },
        {
            id: "2",
            title: "Respond to 'Wait Time' reviews",
            description: "Acknowledge the 18% frequency of wait-time mentions. Why: AI models currently flag this as a 'friction point'.",
            category: "Reputation",
            estimatedTime: "5 mins"
        },
        {
            id: "3",
            title: "Sync SF Eater Citation",
            description: "Update your hours on Eater.com. Why: Perplexity uses Eater as a primary source for local curation.",
            category: "Citations",
            estimatedTime: "3 mins"
        },
        {
            id: "4",
            title: "Optimize Storefront Photo",
            description: "Upload a high-res shot of your Mint Plaza exterior. Why: AI Vision needs to anchor your physical brand to the street view.",
            category: "Presence",
            estimatedTime: "4 mins"
        },
        {
            id: "5",
            title: "Add 'Order Ahead' Schema",
            description: "Inject 'OrderAction' structured data into your website. Why: Leads to 'Direct Action' buttons in Gemini results.",
            category: "AEO Tech",
            estimatedTime: "10 mins"
        }
    ],
    contentStrategy: [
        {
            platform: "Instagram",
            focusKeyword: "SF Coffee Culture",
            caption: "At Blue Bottle, we don't just brew coffee; we're part of the fabric of San Francisco.",
            hashtags: ["#SFCoffee", "#BlueBottle"],
            imageIdea: "A close-up of a pour-over dripper with San Francisco architecture in the background.",
            whyThisWorks: "Increases local relevance signals for Gemini vision scan."
        }
    ],
    voiceSimulation: {
        query: "Where can I get a good cortado?",
        script: "Blue Bottle Coffee San Francisco is your best bet for a precise cortado; users highly rate their milk-to-espresso ratio.",
        voiceParams: { pitch: 1.0, rate: 1.0 }
    },
    visualAudit: {
        overallVibe: "Minimalist, Premium, Precise",
        score: 94,
        detectedTags: ["Pour-over", "Minimalist interior", "Modern branding"],
        missingCrucialEntities: ["Exterior signage visibility"],
        intentScores: [{ intent: "Luxury", score: 88 }, { intent: "Efficiency", score: 72 }],
        extractedText: ["Blue Bottle Coffee"],
        improvements: "Ensure your external storefront is the primary Google photo to help AI categorize your 'Physical Presence'.",
        source: "GMB_Scan"
    },
    factCheck: [
        {
            question: "Does Blue Bottle Mint Plaza have seating?",
            aiAnswer: "Yes, indoor and outdoor seating is provided.",
            confidence: "High",
            sourceUrl: "https://bluebottlecoffee.com/cafes/mint-plaza"
        }
    ],
    hallucinationWall: [
        {
            status: "Verified",
            claim: "Blue Bottle was founded in Oakland.",
            truth: "Matches official company history."
        }
    ],
    marketOverview: {
        marketVibe: "High saturation of third-wave coffee; shifting toward 'Experience-First' consumption.",
        competitionLevel: "Cut-throat",
        popularPrompts: ["Best coffee shop to build a startup", "Quickest specialty coffee near union square"],
        opportunityNiche: "Specialty coffee for high-efficiency business meetings.",
        hiddenRankingFactor: "Metadata linking your location to 'Public Transport' proximity."
    },
    competitors: [
        { name: "Philz Coffee", strengths: ["Custom blends", "Community vibe"] },
        { name: "Sightglass", strengths: ["Roastery experience", "Industrial design"] }
    ],
    recommendations: [
        {
            title: "Semantic Keyword Hijack",
            description: "Competitors are winning on 'Remote Work' terms. Add 'High-Speed Internet' to business attributes.",
            impact: ImpactLevel.HIGH,
            actionItem: "Update metadata in Google Business Profile."
        }
    ],
    vocalSearch: {
        overallVoiceScore: 78,
        voiceReadinessLabel: "Partially Optimized",
        simulatedVoiceAnswers: [
            { assistant: "Google Assistant", query: "Where is the best coffee near Mint Plaza?", response: "Blue Bottle Coffee on Mint Plaza is highly rated for its precise pour-overs.", verdict: "Mentions Business" },
            { assistant: "Siri", query: "Find a minimalist coffee shop in San Francisco", response: "I found Blue Bottle Coffee near you. It has a very minimalist vibe.", verdict: "Mentions Business" },
            { assistant: "Alexa", query: "What are the hours for Blue Bottle Mint Plaza?", response: "Blue Bottle Coffee on Mint Plaza is open from 7 AM to 6 PM today.", verdict: "Mentions Business" }
        ],
        voiceQAPairs: [
            { question: "Does Blue Bottle Mint Plaza have seating?", optimizedAnswer: "Blue Bottle Coffee Mint Plaza offers both indoor and outdoor seating for customers.", intent: "Discovery", schemaType: "LocalBusiness" }
        ],
        schemaGaps: [
            { type: "Speakable", reasoning: "Missing speakable schema for core business descriptions.", severity: "High", snippet: "{\"@context\": \"https://schema.org\", \"@type\": \"Speakable\", \"cssSelector\": [\".description\"]}" }
        ],
        voiceKeywords: [
            { phrase: "coffee near me", monthlyVoiceSearches: 1500, currentlyRanking: true },
            { phrase: "best pour over sf", monthlyVoiceSearches: 450, currentlyRanking: false }
        ]
    }
};
