import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';

export function LeadMagnetPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const { lang } = useLang();

    useEffect(() => {
        // Only show once per session
        if (sessionStorage.getItem('leadMagnetDismissed')) return;

        // 1. Time-based trigger (15 seconds)
        const timerId = setTimeout(() => {
            if (!sessionStorage.getItem('leadMagnetDismissed') && localStorage.getItem('orbit_chatbot_email_provided') !== 'true') {
                setIsOpen(true);
            }
        }, 15000);

        // 2. Exit-intent trigger
        const handleMouseLeave = (e: MouseEvent) => {
            // If cursor moves above the top of the viewport
            if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
                if (!sessionStorage.getItem('leadMagnetDismissed') && localStorage.getItem('orbit_chatbot_email_provided') !== 'true') {
                    setIsOpen(true);
                }
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        
        // 3. Manual trigger via custom event
        const handleManualTrigger = () => setIsOpen(true);
        window.addEventListener('trigger-lead-magnet', handleManualTrigger);

        return () => {
            clearTimeout(timerId);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('trigger-lead-magnet', handleManualTrigger);
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('leadMagnetDismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error(lang === 'bn' ? 'দয়া করে সঠিক ইমেইল দিন' : 'Please enter a valid email address');
            return;
        }

        setStatus('loading');

        const API_BASE = import.meta.env.VITE_API_URL || '';
        try {
            const res = await fetch(`${API_BASE}/api/leads?action=submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'Exit Intent Popup' })
            });

            if (res.ok) {
                setStatus('success');
                localStorage.setItem('orbit_chatbot_email_provided', 'true');
                toast.success(
                    lang === 'bn'
                        ? 'ধন্যবাদ! আপনি ওয়েটলিস্টে যুক্ত হয়েছেন।'
                        : 'Thank you! You have joined the waitlist.'
                );
                handleClose();
            } else {
                throw new Error('Failed to submit');
            }
        } catch (err) {
            console.error(err);
            toast.error(lang === 'bn' ? 'দুঃখিত, আবার চেষ্টা করুন' : 'Something went wrong. Please try again.');
            setStatus('idle');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" style={{ height: '100dvh' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={handleClose}
                    />
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{
                            type: 'spring',
                            damping: 26,
                            stiffness: 320,
                            layout: { duration: 0.3, ease: 'easeOut' }
                        }}
                        className="relative z-10 w-full max-w-[92%] sm:max-w-[440px] rounded-[28px] bg-white/95 border border-zinc-200/90 backdrop-blur-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden p-6 sm:p-8 text-center"
                    >
                        {/* Top specular hairline */}
                        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-300 to-transparent pointer-events-none" />

                        {/* Ambient soft background glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

                        {/* Apple Close Pill */}
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-800 transition-all p-2 rounded-full bg-zinc-100/80 hover:bg-zinc-200/80 border border-zinc-200/60 active:scale-95 cursor-pointer z-20"
                            aria-label="Close"
                        >
                            <X size={15} />
                        </button>

                        {/* Apple Frosted Squircle Icon Badge */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-emerald-500/15 to-teal-500/5 border border-emerald-500/25 shadow-[0_8px_20px_rgba(16,185,129,0.12)] flex items-center justify-center mx-auto mb-4 relative group">
                            <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold font-display text-zinc-950 tracking-tight mb-2">
                            {lang === 'bn' ? 'ওয়েটলিস্টে যুক্ত হোন' : 'Join The Waitlist'}
                        </h2>
                        <p className="text-zinc-600 text-xs sm:text-[13px] leading-relaxed mb-6 px-2">
                            {lang === 'bn'
                                ? 'আমাদের এক্সক্লুসিভ আপডেটের জন্য ওয়েটলিস্টে যুক্ত হোন।'
                                : 'Join our exclusive waitlist to get early access and modern AI insights.'
                            }
                        </p>

                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 rounded-2xl p-4 font-semibold text-sm flex items-center justify-center gap-2 shadow-2xs"
                            >
                                <Send className="w-4 h-4" />
                                {lang === 'bn' ? 'যুক্ত হওয়া সম্পন্ন হয়েছে!' : 'Successfully joined!'}
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    required
                                    placeholder={lang === 'bn' ? 'আপনার সেরা ইমেইল দিন' : 'Enter your email address'}
                                    className="w-full bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-center font-medium shadow-2xs"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading'}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] cursor-pointer disabled:opacity-50"
                                >
                                    {status === 'loading' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {lang === 'bn' ? 'ওয়েটলিস্টে যুক্ত হোন' : "Let's Build"}
                                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-zinc-400 mt-1 font-medium tracking-wide">
                                    {lang === 'bn' ? 'আমরা স্প্যাম করি না। শুধুমাত্র প্রয়োজনীয় আপডেট।' : '100% free. No spam. Unsubscribe anytime.'}
                                </p>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
