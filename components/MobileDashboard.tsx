import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import LoadingScreen from './LoadingScreen';
import ErrorBoundary from './ErrorBoundary';
import BusinessForm from './BusinessForm';
import NewProjectModal from './NewProjectModal';
import SupportModal from './SupportModal';
import PlanSelection from './PlanSelection';
import PaywallOverlay from './PaywallOverlay';
import { SparklesIcon, AlertCircleIcon } from './Icons';

interface MobileDashboardProps {
    session: any;
    currentProject: any;
    projects: any[];
    userProfile: any;
    auditProjectIds: string[];
    state: any;
    businessName: string;
    showPaywall: boolean;
    showPlanSelection: boolean;
    showNewProjectModal: boolean;
    showProjectSettingsModal: boolean;
    geminiKey: string;
    formInfo: any;
    modalFormInfo: any;
    onAddProject: () => void;
    onSettings: () => void;
    onUpgrade: () => void;
    onRenameProject: (name: string) => void;
    onDeleteProject: (id: string) => void;
    onLogout: () => void;
    onSelectProject: (proj: any) => void;
    onClosePlanSelection: () => void;
    onPlanSuccess: () => void;
    onCloseNewProject: () => void;
    onSubmitNewProject: (info: any) => void;
    onCloseSettings: () => void;
    onFormInfoChange: (info: any) => void;
    onModalFormInfoChange: (info: any) => void;
    onReset: () => void;
    onRunAnalysis: (info: any, projectId: string) => void;
    onDemo: () => void;
    onIncrementSimulation: () => void;
    auditCache: Record<string, any>;
    setState: (state: any) => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
    session, currentProject, projects, userProfile, auditProjectIds,
    state, businessName, showPaywall, showPlanSelection, showNewProjectModal,
    showProjectSettingsModal, geminiKey, formInfo, modalFormInfo,
    onAddProject, onSettings, onUpgrade, onRenameProject, onDeleteProject,
    onLogout, onSelectProject, onClosePlanSelection, onPlanSuccess,
    onCloseNewProject, onSubmitNewProject, onCloseSettings, onFormInfoChange,
    onModalFormInfoChange, onReset, onRunAnalysis, onDemo, onIncrementSimulation,
    auditCache, setState,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen text-zinc-100 relative w-full">
            {/* Background Grid */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-grid"></div>

            {/* Mobile Top Bar — only visible on small screens */}
            <div className="fixed top-0 left-0 right-0 z-[45] flex lg:hidden items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900">
                <span className="font-display font-black text-base tracking-tighter text-emerald-500">
                    AEOHOLIC
                </span>
                <div className="flex items-center gap-3">
                    {currentProject && (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[140px]">
                            {currentProject.name}
                        </span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex flex-col gap-1 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        aria-label="Open sidebar menu"
                    >
                        <span className="w-5 h-0.5 bg-zinc-300 rounded"></span>
                        <span className="w-5 h-0.5 bg-zinc-300 rounded"></span>
                        <span className="w-4 h-0.5 bg-zinc-300 rounded"></span>
                    </button>
                </div>
            </div>

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-[48] lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — always visible on lg+, slide-in drawer on mobile */}
            <div className={`
                fixed top-0 left-0 h-full z-[49] transform transition-transform duration-300 ease-out
                lg:relative lg:translate-x-0 lg:z-auto
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile close button inside sidebar */}
                <div className="lg:hidden absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <Sidebar
                    projectName={currentProject?.name || 'My Project'}
                    brandName={currentProject?.brand_name}
                    userEmail={session?.user?.email}
                    planName={userProfile?.plan_name}
                    auditsUsed={userProfile?.audits_consumed || 0}
                    promptsUsed={userProfile?.simulations_consumed || 0}
                    onAddProject={() => { onAddProject(); setSidebarOpen(false); }}
                    onSettings={() => { onSettings(); setSidebarOpen(false); }}
                    onUpgrade={() => { onUpgrade(); setSidebarOpen(false); }}
                    onRenameProject={onRenameProject}
                    onDeleteProject={onDeleteProject}
                    onLogout={onLogout}
                    projects={projects}
                    onSelectProject={(proj) => { onSelectProject(proj); setSidebarOpen(false); }}
                    currentProjectId={currentProject?.id}
                    auditProjectIds={auditProjectIds}
                />
            </div>

            {/* Main Content — top padding on mobile for the top bar */}
            <main className="flex-grow overflow-y-auto relative z-10 h-screen pt-14 lg:pt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">
                    {state.loading ? (
                        <LoadingScreen />
                    ) : state.result ? (
                        <ErrorBoundary>
                            <div className="relative">
                                <div className={`${showPaywall ? 'blur-xl select-none pointer-events-none' : ''} transition-all duration-1000`}>
                                    <Dashboard
                                        data={state.result}
                                        businessName={businessName}
                                        onReset={onReset}
                                        geminiApiKey={geminiKey}
                                        onIncrementSimulation={onIncrementSimulation}
                                    />
                                </div>
                            </div>
                        </ErrorBoundary>
                    ) : !currentProject && projects.length === 0 ? (
                        <div className="text-center py-12 sm:py-20 px-4 animate-fade-in">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 sm:mb-10 shadow-[0_0_50px_rgba(16,185,129,0.15)] group hover:scale-105 transition-all duration-500">
                                <SparklesIcon className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500 group-hover:rotate-12 transition-transform" />
                            </div>
                            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 sm:mb-6 tracking-tight">
                                Ready for your{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                    first deep-agent audit?
                                </span>
                            </h2>
                            <p className="text-zinc-400 max-w-xl mx-auto text-base sm:text-xl mb-8 sm:mb-12 leading-relaxed">
                                Your project suite is currently empty. Create your first diagnostic environment to start mapping AI visibility for any local business.
                            </p>
                            <button
                                onClick={onAddProject}
                                className="px-8 py-4 sm:px-10 sm:py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95"
                            >
                                Create Your First Project
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up">
                            {state.error && (
                                <div className="w-full max-w-2xl bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 sm:p-6 mb-8 text-center animate-fade-in shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <AlertCircleIcon className="w-5 h-5 text-rose-500" />
                                        <h3 className="text-rose-500 font-bold uppercase tracking-widest text-sm">Audit System Error</h3>
                                    </div>
                                    <p className="text-zinc-400 text-sm font-medium">{state.error}</p>
                                </div>
                            )}
                            <div className="text-center mb-8 sm:mb-12 px-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                                    Active Project: {currentProject?.name}
                                </h2>
                                <p className="text-zinc-500 max-w-md mx-auto text-base sm:text-lg">
                                    Your diagnostic environment is ready. Initialize the 12-agent research pipeline for{' '}
                                    <span className="text-white font-bold">{currentProject?.business_name || 'this business'}</span> to see local performance.
                                </p>
                            </div>
                            <div className="w-full max-w-xl px-4 sm:px-0">
                                <BusinessForm
                                    onSubmit={(info: any) => {
                                        const isLocked = !!currentProject && auditProjectIds.includes(currentProject.id);
                                        if (isLocked) {
                                            if (auditCache[currentProject?.id]) {
                                                setState({ loading: false, error: null, result: auditCache[currentProject.id].result });
                                            }
                                            return;
                                        }
                                        if (currentProject?.id) {
                                            onRunAnalysis(info, currentProject.id);
                                        } else {
                                            setState({ loading: false, error: "Please select a project before starting an audit.", result: null });
                                        }
                                    }}
                                    onDemo={onDemo}
                                    isLoading={state.loading}
                                    initialInfo={formInfo}
                                    onInfoChange={onFormInfoChange}
                                    isLocked={!!currentProject && auditProjectIds.includes(currentProject.id)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={onCloseNewProject}
                initialInfo={modalFormInfo}
                onInfoChange={onModalFormInfoChange}
                onSubmit={onSubmitNewProject}
                isLoading={state.loading}
            />

            <SupportModal
                isOpen={showProjectSettingsModal}
                onClose={onCloseSettings}
                userEmail={session?.user?.email || 'contact@aeoholic.com'}
                userId={session?.user?.id}
            />

            {showPlanSelection && (
                <PlanSelection
                    userId={session?.user?.id}
                    onClose={onClosePlanSelection}
                    onSuccess={onPlanSuccess}
                />
            )}

            {showPaywall && (
                <PaywallOverlay
                    businessName={businessName}
                    onAction={onUpgrade}
                    isLoggedIn={!!session}
                />
            )}
        </div>
    );
};

export default MobileDashboard;
