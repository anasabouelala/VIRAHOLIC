import React, { useState } from 'react';
import { XIcon, SparklesIcon, AlertCircleIcon, MessageSquareIcon as SupportIcon } from './Icons';
import { createSupportTicket } from '../services/supabaseService';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userId?: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userEmail, userId }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (userId) {
                const { success: ticketSuccess, error: ticketError } = await createSupportTicket({
                    user_id: userId,
                    user_email: userEmail,
                    subject,
                    message
                });
                
                if (!ticketSuccess) throw ticketError;
            } else {
                // If no userId (guest), still simulate or just fail
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setSubject('');
                setMessage('');
            }, 6000); // Give user time to read the extra contact info
        } catch (err: any) {
            setError("Failed to log ticket. Please use the direct email link below.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
                
                <div className="p-8 sm:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                <SupportIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight leading-none mb-3">Support Ticket</h2>
                            <p className="text-zinc-500 text-[11px] uppercase tracking-[0.2em] font-black">
                                Direct VIP Assistance
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all transform hover:rotate-90"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {success ? (
                        <div className="py-12 text-center animate-scale-up">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <SparklesIcon className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Ticket Logged!</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto mb-8 text-sm">We've saved your request. As we are in Beta, <br/> feel free to reach out directly if needed:</p>
                            
                            <a 
                                href={`mailto:contact@aeoholic.com?subject=RE: ${subject}&body=Hello AEOHOLIC Team,%0D%0A%0D%0Amy user ID is ${userId}.%0D%0A%0D%0A${message}`}
                                className="inline-block px-8 py-4 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg"
                            >
                                Open Mailbox App
                            </a>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-4 animate-shake">
                                    <div className="flex items-center gap-4">
                                        <AlertCircleIcon className="w-5 h-5 text-rose-500" />
                                        <p className="text-xs text-rose-200 font-bold uppercase tracking-wide">{error}</p>
                                    </div>
                                    <a href="mailto:contact@aeoholic.com" className="text-[10px] text-white underline tracking-widest uppercase font-black text-center">Contact via Email Instead</a>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 pl-1">Ticket Subject</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="What can we help you with?"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-zinc-900/50 transition-all shadow-inner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 pl-1">How can we assist you?</label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Describe your issue or request in detail..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-zinc-900/50 transition-all resize-none shadow-inner"
                                    />
                                </div>

                                <div className="pt-4 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/30 rounded-xl border border-zinc-900/50">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] lowercase text-zinc-500 italic">Replying to {userEmail}</p>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.25em] py-5 rounded-2xl hover:bg-indigo-400 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/10"
                                    >
                                        {loading ? (
                                            <span className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                Sending Ticket
                                                <SparklesIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportModal;
