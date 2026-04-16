import React from 'react';
import { CheckIcon, SparklesIcon } from './Icons';
import { supabase } from '../services/supabase';

interface PlanSelectionProps {
    userId: string;
    onSuccess: () => void;
    onClose?: () => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ userId, onSuccess, onClose }) => {
    // We will inject the actual Lemon Squeezy URLs here
    const plans = [
        {
            name: 'Business',
            price: '39',
            description: 'Designed for business owners.',
            features: [
                '12 Active Projects (12 Full Audits)',
                '20 Prompt Simulations',
                '20 Vocal Simulations',
                'Full diagnostic suite'
            ],
            color: 'zinc',
            popular: true,
            checkoutUrl: import.meta.env.VITE_LEMON_BUSINESS_URL || '',
        },
        {
            name: 'Specialists',
            price: '99',
            description: 'Elite choice for consultants and marketers.',
            features: [
                '50 Active Projects',
                'Unlimited Simulations',
                'Unlimited Vocal',
                'Premium Support'
            ],
            color: 'emerald',
            checkoutUrl: import.meta.env.VITE_LEMON_SPECIALIST_URL || '',
        },
        {
            name: 'Agency',
            price: '199',
            description: 'Ultimate scaling for companies.',
            features: [
                '120 Active Projects',
                'Unlimited Simulations',
                'Unlimited Vocal',
                'Strategy Manager'
            ],
            color: 'indigo',
            checkoutUrl: import.meta.env.VITE_LEMON_AGENCY_URL || '',
        }
    ];

    React.useEffect(() => {
        // Initialize Lemon.js overlay seamlessly
        const win = window as any;
        if (win.createLemonSqueezy) {
            win.createLemonSqueezy();
            win.LemonSqueezy.Setup({
                eventHandler: (event: any) => {
                    console.log("Lemon Squeezy Payment Event:", event);
                    if (event.event === 'Checkout.Success') {
                        // Briefly delay to let your Supabase backend webhook save the upgrade
                        setTimeout(() => {
                            win.LemonSqueezy.Url.Close();
                            onSuccess(); // Triggers Dash reload with new quotas
                        }, 2500);
                    }
                }
            });
        }
    }, [onSuccess]);

    const selectPlan = async (plan: typeof plans[0]) => {
        // If URLs are missing, fallback to development auto-upgrade for testing
        if (!plan.checkoutUrl || plan.checkoutUrl === '') {
            console.warn("No Lemon Squeezy URLs provided. Simulating upgrade for development.");
            const { error } = await supabase
                .from('profiles')
                .update({ plan_name: plan.name, geo_score: 1 }) 
                .eq('id', userId);
            
            if (!error) onSuccess();
            return;
        }

        // Add custom user_id so edge function knows who to upgrade securely
        const url = new URL(plan.checkoutUrl);
        url.searchParams.set('checkout[custom][user_id]', userId);
        
        // Launch the beautiful inline overlay instead of a hard redirect
        const win = window as any;
        if (win.LemonSqueezy) {
            win.LemonSqueezy.Url.Open(url.toString());
        } else {
            // Fallback if script failed to load for some reason
            window.location.href = url.toString();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950/90 backdrop-blur-xl animate-fade-in">
            {/* Sticky close button for all screen sizes */}
            {onClose && (
                <div className="sticky top-0 z-[80] flex justify-end p-4 pointer-events-none">
                    <button 
                        onClick={onClose}
                        className="pointer-events-auto px-4 py-2 sm:px-6 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        ← Dashboard
                    </button>
                </div>
            )}
            <div className="min-h-full flex items-start justify-center p-4 pb-12">
                <div className="max-w-5xl w-full">
                    <div className="text-center mb-8 sm:mb-12 pt-2 sm:pt-6">
                        <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Choose your AEO velocity</h2>
                        <p className="text-zinc-400 text-sm max-w-2xl mx-auto px-2">
                            Your audit is ready and waiting. Select a plan to unlock the full forensic report and start your optimization journey.
                        </p>
                    </div>

                    {/* Cards: single column on mobile, 3-col on md+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {plans.map((plan) => (
                            <div 
                                key={plan.name}
                                className={`relative bg-zinc-900/50 border ${plan.popular ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-zinc-800'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col transition-all hover:scale-[1.01] sm:hover:scale-[1.02] hover:bg-zinc-900`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6 sm:mb-8">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl sm:text-4xl font-bold text-white">${plan.price}</span>
                                        <span className="text-zinc-500 text-sm">/mo</span>
                                    </div>
                                    <p className="text-zinc-400 text-xs mt-3 sm:mt-4 leading-relaxed">{plan.description}</p>
                                </div>

                                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                <CheckIcon className="w-2.5 h-2.5 text-emerald-400" />
                                            </div>
                                            <span className="text-xs text-zinc-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => selectPlan(plan)}
                                    className={`w-full py-3 sm:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                                        ${plan.popular 
                                            ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                                >
                                    <SparklesIcon className="w-3 h-3" />
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 sm:mt-12 text-center text-[10px] text-zinc-600 uppercase tracking-widest pb-4">
                        Secure 256-bit payment processing by Lemon Squeezy
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanSelection;
