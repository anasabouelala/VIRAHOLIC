import React from 'react';
import BusinessForm from './BusinessForm';
import { XIcon, SparklesIcon } from './Icons';
import { BusinessInfo } from '../types';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (info: BusinessInfo) => void;
    isLoading: boolean;
    initialInfo: BusinessInfo;
    onInfoChange: (info: BusinessInfo) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSubmit, isLoading, initialInfo, onInfoChange }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
            onClick={onClose}
        >
            <div className="w-full max-w-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="absolute -top-12 right-0 flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">New Mission</span>
                        <span className="text-xs text-zinc-500">Initialize Agent Discovery</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-zinc-950 border border-emerald-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Add New Project</h2>
                            <p className="text-zinc-500 text-xs font-medium mt-1">Provide business details for the 12-agent audit chain.</p>
                        </div>
                    </div>

                    <BusinessForm 
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                        hideDemo={true}
                        initialInfo={initialInfo}
                        onInfoChange={onInfoChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;
