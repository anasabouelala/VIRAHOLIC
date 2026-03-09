
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

            {/* Visual GEO Input */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1 flex items-center justify-between">
                    <span>Visual Audit (Photos)</span>
                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">NEW FEATURE</span>
                </label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full bg-zinc-900/50 border border-dashed rounded-lg px-4 py-6 flex flex-col items-center justify-center cursor-pointer transition-all group
                        ${previewImages.length > 0 ? 'border-zinc-600' : 'border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-950/5'}`}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                    />
                    {previewImages.length > 0 ? (
                        <div className="w-full">
                            <div className="flex gap-2 justify-center mb-2">
                                {previewImages.map((img, idx) => (
                                    <img key={idx} src={img} alt="Preview" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-zinc-500">Manual images selected. Click to change.</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative">
                                <SparklesIcon className="w-5 h-5 text-emerald-400 relative z-10" />
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-1">Auto-Scan Active</p>
                                <p className="text-zinc-500 text-[10px] max-w-xs mx-auto">
                                    We will automatically scan Google Maps for your business photos. 
                                    <span className="text-zinc-400 block mt-1">(Optional) Click here to upload specific photos instead.</span>
                                </p>
                            </div>
                        </>
                    )}
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
                  SCANNING GMB & VISUAL DATA...
                </span>
              ) : (
                'INITIATE ANALYSIS'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessForm;
