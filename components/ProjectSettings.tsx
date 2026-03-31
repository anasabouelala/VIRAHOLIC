import React, { useState } from 'react';
import { GearIcon, XIcon, SparklesIcon, AlertCircleIcon } from './Icons';
import { updateProject } from '../services/supabaseService';

interface ProjectSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    userEmail: string;
    onUpdate: () => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ isOpen, onClose, project, userEmail, onUpdate }) => {
    const [projectName, setProjectName] = useState(project?.name || '');
    const [brandName, setBrandName] = useState(project?.brand_name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { success, error } = await updateProject(project.id, {
                name: projectName,
                brand_name: brandName
            });
            if (!success) throw error;
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"></div>
                
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Project Settings</h2>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mt-1">
                                Customize your AEO environment
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
                            <AlertCircleIcon className="w-4 h-4 text-rose-500" />
                            <p className="text-[11px] text-rose-200 font-bold uppercase tracking-wide">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Project Name</label>
                            <input
                                type="text"
                                required
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Custom Brand Name</label>
                            <input
                                type="text"
                                placeholder="AEOHOLIC"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <p className="text-[9px] text-zinc-600 mt-2 italic">Replaces the top sidebar branding.</p>
                        </div>

                        <div className="pt-4 border-t border-zinc-900">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Account Email</label>
                            <div className="bg-zinc-900/50 px-4 py-3 rounded-xl border border-dashed border-zinc-800">
                                <span className="text-xs font-medium text-zinc-400">{userEmail}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProjectSettings;
