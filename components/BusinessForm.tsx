
import React, { useState, useRef } from 'react';
import { BusinessInfo } from '../types';
import { MapPinIcon, GlobeIcon, SearchIcon, SparklesIcon, GlobeIcon as NetworkIcon } from './Icons';

interface Props {
  onSubmit: (info: BusinessInfo) => void;
  onDemo?: () => void;
  isLoading: boolean;
  hideDemo?: boolean;
  initialInfo: BusinessInfo;
  onInfoChange: (info: BusinessInfo) => void;
}

const BusinessForm: React.FC<Props> = ({ onSubmit, onDemo, isLoading, hideDemo, initialInfo, onInfoChange }) => {
  const info = initialInfo;
  const setInfo = (update: (prev: BusinessInfo) => BusinessInfo) => {
    onInfoChange(update(info));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (info.name && info.location && info.category) {
      onSubmit(info);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-surface border border-border rounded-xl p-1 shadow-2xl">
        <form onSubmit={handleSubmit} className="bg-background rounded-lg p-6 sm:p-8 space-y-6 border border-zinc-900">

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Joe's Coffee Spot"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium"
                value={info.name}
                onChange={(e) => setInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coffee Shop"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium"
                    value={info.category}
                    onChange={(e) => setInfo(prev => ({ ...prev, category: e.target.value }))}
                  />
                  <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin, TX"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium"
                    value={info.location}
                    onChange={(e) => setInfo(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <MapPinIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Website (Optional)</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium"
                  value={info.website}
                  onChange={(e) => setInfo(prev => ({ ...prev, website: e.target.value }))}
                />
                <GlobeIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Target Keywords (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 'best espresso', 'cheap latte'"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium"
                value={info.keywords || ''}
                onChange={(e) => setInfo(prev => ({ ...prev, keywords: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Search Language (Vital for AEO)</label>
              <div className="relative">
                <select 
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all font-medium appearance-none"
                  value={info.language}
                  onChange={(e) => setInfo(prev => ({ ...prev, language: e.target.value }))}
                >
                  {['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic', 'Portuguese', 'Hindi'].map(lang => (
                    <option key={lang} value={lang} className="bg-zinc-900 text-white">{lang}</option>
                  ))}
                </select>
                <GlobeIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <div className="absolute right-3 top-4 pointer-events-none text-zinc-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>


          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-[2] py-4 px-6 rounded-lg font-bold text-xs tracking-[0.2em] uppercase transition-all active:scale-95
                ${isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 border border-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  SCANNING...
                </span>
              ) : (
                'RUN YOUR AUDIT'
              )}
            </button>
            {!hideDemo && onDemo && (
              <button
                type="button"
                onClick={onDemo}
                disabled={isLoading}
                className="flex-[1.5] py-4 px-6 rounded-lg font-bold text-xs tracking-[0.2em] uppercase transition-all bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 hover:text-white hover:border-indigo-400/50 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.1)] group"
              >
                <NetworkIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                EXPLORE LIVE SAMPLE
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;
