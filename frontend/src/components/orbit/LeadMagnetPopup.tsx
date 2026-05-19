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
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={handleClose}
                    />
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            layout: { duration: 0.3, ease: 'easeOut' }
                        }}
                        className="relative z-10 w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-2xl bg-card border border-border shadow-xl overflow-hidden"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10 p-1 bg-background/50 rounded-full cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Flat Header Pattern */}
                        <div className="h-24 sm:h-32 bg-muted relative overflow-hidden flex items-end justify-center">
                            <div className="w-full h-px bg-border" />
                        </div>

                        <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-0 relative z-10 -mt-10 sm:-mt-12 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-card border border-border rounded-2xl flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 relative group">
                                <Rocket className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary relative z-10 transition-transform group-hover:scale-110 duration-300" />
                            </div>

                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                                {lang === 'bn' ? 'ওয়েটলিস্টে যুক্ত হোন' : 'Join The Waitlist'}
                            </h2>
                            <p className="text-muted-foreground text-xs sm:text-sm lg:text-base mb-5 sm:mb-6 lg:mb-8 leading-relaxed px-2 md:px-10">
                                {lang === 'bn'
                                    ? 'আমাদের এক্সক্লুসিভ আপডেটের জন্য ওয়েটলিস্টে যুক্ত হোন।'
                                    : 'Join our exclusive waitlist to get early access and modern AI insights.'
                                }
                            </p>

                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl p-4 font-semibold flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {lang === 'bn' ? 'যুক্ত হওয়া সম্পন্ন হয়েছে!' : 'Successfully joined!'}
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <input
                                        type="email"
                                        required
                                        placeholder={lang === 'bn' ? 'আপনার সেরা ইমেইল' : 'Enter your best email address'}
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-center"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={status === 'loading'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-primary text-primary-foreground font-semibold py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        {status === 'loading' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {lang === 'bn' ? 'ওয়েটলিস্টে যুক্ত হোন' : "Let's Build"}
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        {lang === 'bn' ? 'আমরা স্প্যাম করি না। শুধুমাত্র প্রয়োজনীয় আপডেট।' : '100% free. No spam. Unsubscribe anytime.'}
                                    </p>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )
            }
        </AnimatePresence >
    );
}
