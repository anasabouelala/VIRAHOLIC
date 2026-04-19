import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FreeAuditLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load the Calendly script
    const head = document.querySelector('head');
    if (head && !document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      head.appendChild(script);
    }

    // Listen to Calendly events for redirect
    const handleMessage = (e: MessageEvent) => {
      if (
        e.origin === "https://calendly.com" &&
        e.data &&
        e.data.event === "calendly.event_scheduled"
      ) {
        navigate('/thankyou');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <header className="text-center mb-8 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
          Book Your Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Diagnostic</span>
        </h1>
        <p className="text-lg text-zinc-400">
          Schedule a call below to get your actionable AEO strategy.
        </p>
      </header>
      
      <div className="w-full max-w-5xl bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md p-4">
        {/* Calendly inline widget begin */}
        <div 
          className="calendly-inline-widget w-full" 
          data-url="https://calendly.com/anas_growth/aeo-diagnostic?hide_gdpr_banner=1" 
          style={{ minWidth: '320px', height: '700px' }}
        ></div>
        {/* Calendly inline widget end */}
      </div>
    </div>
  );
};

export default FreeAuditLanding;
