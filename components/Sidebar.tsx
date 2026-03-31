import React from 'react';
import { 
    SparklesIcon, 
    PlusIcon, 
    GearIcon, 
    LogOutIcon, 
    TargetIcon, 
    GlobeIcon, 
    MapPinIcon,
    PenToolIcon,
    TrashIcon
} from './Icons';

interface SidebarProps {
    projectName: string;
    brandName?: string;
    userEmail: string;
    planName?: string;
    auditsUsed: number;
    promptsUsed: number;
    vocalUsed?: number;
    onAddProject: () => void;
    onSettings: () => void;
    onUpgrade: () => void;
    onLogin?: () => void;
    onRenameProject: (newName: string) => void;
    onDeleteProject: (projectId: string) => void;
    onLogout: () => void;
    projects: any[];
    onSelectProject: (project: any) => void;
    currentProjectId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    projectName, 
    brandName, 
    userEmail, 
    planName,
    auditsUsed,
    promptsUsed,
    vocalUsed = 0,
    onAddProject, 
    onSettings, 
    onUpgrade,
    onRenameProject,
    onDeleteProject,
    onLogout,
    projects,
    onSelectProject,
    currentProjectId,
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(projectName);
    const [projectToDelete, setProjectToDelete] = React.useState<any>(null);

    React.useEffect(() => {
        setEditValue(projectName);
    }, [projectName]);

    const handleRename = () => {
        if (editValue.trim() && editValue !== projectName) {
            onRenameProject(editValue.trim());
        }
        setIsEditing(false);
    };

    const PLAN_LIMITS: Record<string, { audits: number, prompts: number | string, vocal: number | string }> = {
        'Business': { audits: 12, prompts: 20, vocal: 20 },
        'Specialists': { audits: 50, prompts: 'Unlimited', vocal: 'Unlimited' },
        'Agency': { audits: 120, prompts: 'Unlimited', vocal: 'Unlimited' },
        'None': { audits: 0, prompts: 0, vocal: 0 }
    };

    const limits = PLAN_LIMITS[planName || 'None'] || PLAN_LIMITS['None'];
    const auditsLeft = Math.max(0, limits.audits - auditsUsed);
    const promptsLeft = typeof limits.prompts === 'string' ? limits.prompts : Math.max(0, limits.prompts - promptsUsed);
    const vocalLeft = typeof limits.vocal === 'string' ? limits.vocal : Math.max(0, limits.vocal - (vocalUsed || 0));

    return (
        <aside className="w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen sticky top-0 z-40 overflow-hidden">
            {/* Branding Header */}
            <div className="p-6 border-b border-zinc-900/50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-black text-xl tracking-tighter text-emerald-500">
                        {brandName || 'AEOHOLIC'}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 font-black tracking-[0.2em] uppercase">
                        {planName || 'Free Plan'}
                    </p>
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Active</span>
                </div>
            </div>

            {/* Project Context */}
            <div className="p-6 bg-zinc-900/20 flex-grow">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Project</span>
                    <button 
                        onClick={onAddProject}
                        className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                        title="Add New Project"
                    >
                        <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl group hover:border-emerald-500/30 transition-all flex items-center justify-between mb-8">
                    <div className="flex-grow min-w-0">
                        {isEditing ? (
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                                className="w-full"
                            >
                                <input
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setEditValue(projectName);
                                            setIsEditing(false);
                                        }
                                    }}
                                    className="w-full bg-zinc-900/50 text-sm font-bold text-white border-b border-emerald-500/50 focus:outline-none focus:border-emerald-400 py-0.5"
                                />
                            </form>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-white truncate cursor-pointer" onClick={() => setIsEditing(true)}>{projectName}</p>
                                <p className="text-[10px] text-zinc-500 font-medium truncate mt-1">Diagnostic Mode: Active</p>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors group/pen"
                        >
                            <PenToolIcon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 group-hover/pen:text-emerald-400 transition-colors ml-2 flex-shrink-0" />
                        </button>
                    )}
                </div>

                {/* Project List */}
                <div className="mb-8 space-y-2">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-3">All Projects</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {projects.map((proj) => (
                            <div key={proj.id} className="relative group w-full flex items-center gap-1">
                                <button
                                    onClick={() => onSelectProject(proj)}
                                    className={`flex-grow flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left group/btn
                                        ${currentProjectId === proj.id 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                            : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors flex-shrink-0
                                        ${currentProjectId === proj.id ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800 group-hover/btn:bg-zinc-600'}
                                    `}></div>
                                    <span className="text-[11px] font-bold truncate">{proj.name}</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setProjectToDelete(proj);
                                    }}
                                    className="p-2 rounded-lg transition-all flex-shrink-0 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10"
                                    title="Delete Project"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quota Section */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Audits Left</span>
                            <span className="text-[11px] font-black text-emerald-500">{auditsLeft} <span className="text-zinc-600 text-[10px]">/ {limits.audits}</span></span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${(auditsUsed / limits.audits) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prompt Simulator</span>
                            <span className="text-xs font-black text-white">{promptsLeft}</span>
                        </div>
                        <p className="text-[9px] text-zinc-600 font-medium italic opacity-80 mb-4">Allocation for deep-agent research calls.</p>
                        
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vocal Simulator</span>
                            <span className="text-xs font-black text-white">{vocalLeft}</span>
                        </div>
                        <p className="text-[9px] text-zinc-600 font-medium italic opacity-80">Remaining voice assistant interactions.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-900/50 space-y-2">
                <button 
                    onClick={onSettings}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <GearIcon className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                        <span className="text-[11px] font-bold">Settings</span>
                    </div>
                </button>
                <button 
                    onClick={onUpgrade}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-[11px] font-bold tracking-tight">Upgrade Plan</span>
                    </div>
                </button>
                <div className="px-4 py-4 mt-2 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">User Account</p>
                    <p className="text-[11px] font-bold text-zinc-300 truncate mb-4">{userEmail}</p>
                    <button 
                        onClick={onLogout}
                        className="flex items-center gap-2 text-[10px] font-black text-rose-500/70 hover:text-rose-400 transition-colors uppercase tracking-widest"
                    >
                        <LogOutIcon className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {projectToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full animate-slide-up shadow-2xl">
                        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <TrashIcon className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Delete Project</h3>
                        <p className="text-zinc-400 text-sm font-medium mb-8">
                            Are you sure you want to delete <span className="font-bold text-white">"{projectToDelete.name}"</span>? This will permanently remove its audit data and cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setProjectToDelete(null)}
                                className="flex-1 py-3.5 px-4 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    onDeleteProject(projectToDelete.id);
                                    setProjectToDelete(null);
                                }}
                                className="flex-1 py-3.5 px-4 bg-rose-500/10 text-rose-500 font-bold text-xs uppercase tracking-widest rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                            >
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
