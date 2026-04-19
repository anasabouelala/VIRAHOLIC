import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYou: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative z-10">
      <div className="max-w-2xl bg-zinc-900/50 border border-white/10 rounded-3xl p-12 shadow-2xl backdrop-blur-md">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">
          Call Booked Successfully!
        </h1>
        
        <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
          Thank you for booking your free diagnostic and action plan. You will receive an email confirmation with the meeting details shortly. We look forward to speaking with you.
        </p>
        
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-sm font-black text-white hover:bg-white/10 uppercase tracking-widest transition-all shadow-xl backdrop-blur-md"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default ThankYou;
