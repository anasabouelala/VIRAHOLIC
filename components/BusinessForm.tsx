
import React, { useState, useRef } from 'react';
import { BusinessInfo } from '../types';
import { MapPinIcon, GlobeIcon, SearchIcon, SparklesIcon, GlobeIcon as NetworkIcon } from './Icons';

interface Props {
  onSubmit: (info: BusinessInfo) => void;
  isLoading: boolean;
}

const BusinessForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [info, setInfo] = useState<BusinessInfo>({
    name: '',
    location: '',
    category: '',
    website: '',
    keywords: '',
    images: []
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3); // Max 3 images
      const promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file as Blob);
        });
      });

      Promise.all(promises).then(base64Images => {
        setInfo(prev => ({ ...prev, images: base64Images }));
        setPreviewImages(base64Images);
      });
    }
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
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Photos (Used for AI Visual Audit)</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors shadow-inner"
                >
                  <SparklesIcon className="w-4 h-4 text-emerald-400" />
                  Upload Photos
                </button>
                <div className="flex gap-2">
                  {previewImages.map((src, idx) => (
                    <div key={idx} className="w-10 h-10 rounded overflow-hidden border border-zinc-700 shadow-md">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-lg font-bold text-sm tracking-wide transition-all
                ${isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-white text-black hover:bg-zinc-200 border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                  SCANNING AI CITATIONS...
                </span>
              ) : (
                'RUN FREE AEO AUDIT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;
