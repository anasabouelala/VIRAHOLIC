import React, { useState } from 'react';

const faqs = [
    {
        question: "What exactly is AEO?",
        answer: "AEO stays for Answer Engine Optimization. It's the process of structuring your business data so that AI models like ChatGPT, Gemini, and Perplexity recommend you as the top choice when users ask for local services."
    },
    {
        question: "How is this different from traditional SEO?",
        answer: "SEO focuses on 'Blue Links' and keywords. AEO focuses on 'Recommendations' and 'Context'. If Google Maps shows you but ChatGPT doesn't mention you, you're missing out on the fastest-growing search segment."
    },
    {
        question: "Do I really need this for my local shop?",
        answer: "Yes. 70% of high-intent searches are moving to conversational AI. If a customer asks Siri or Perplexity for 'the best coffee shop near me with outlets', AEO ensures your specific attributes are what the AI finds first."
    },
    {
        question: "Which AI models does AEOHOLIC scan?",
        answer: "We scan the Big Three: OpenAI (ChatGPT), Google Cloud (Gemini), and Perplexity. We also analyze the underlying data sources they feed from, like local directories and vision-based map data."
    },
    {
        question: "How long until I see results?",
        answer: "Our real-time audit takes 60 seconds. Implementing the fixes (Missions) can start impacting AI retrieval in as little as 2-4 weeks, depending on the model's update cycle."
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-20 animate-fade-in border-t border-border/50">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-display font-bold text-primary mb-4">Frequently Asked Questions</h2>
                <p className="text-secondary text-sm max-w-lg mx-auto font-medium">Everything you need to know about the future of local visibility.</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white border border-border rounded-[24px] overflow-hidden transition-all hover:border-indigo-100">
                        <button 
                            onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            className="w-full p-6 text-left flex items-center justify-between group"
                        >
                            <span className="text-sm font-bold text-primary group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                {faq.question}
                            </span>
                            <span className={`text-indigo-500 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </span>
                        </button>
                        <div className={`transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-6 pt-0 text-[11px] text-secondary leading-relaxed font-medium border-t border-border/10">
                                {faq.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;
