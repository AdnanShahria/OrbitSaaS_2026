import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Shield, ArrowRight, Loader2, X, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_URL || '';

/** Decode the JWT exp claim without a library and return true if the token is still valid. */
function isAdminTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return !payload.exp || Date.now() / 1000 < payload.exp;
    } catch {
        return false;
    }
}

const AUTHORIZED_EMAILS = [
    { label: 'Adnan Shahria (adnanshahria2019@gmail.com)', value: 'adnanshahria2019@gmail.com' },
    { label: 'Abdur Rafiu (abdurrafiu7@gmail.com)', value: 'abdurrafiu7@gmail.com' },
    { label: 'Nisar (nisarfeni2015@gmail.com)', value: 'nisarfeni2015@gmail.com' },
];

export default function AdminLogin() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState(AUTHORIZED_EMAILS[0].value);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Hard cache: if admin_token exists and is not expired, skip login entirely
    useEffect(() => {
        const cached = localStorage.getItem('admin_token');
        if (isAdminTokenValid(cached)) {
            navigate('/admin', { replace: true });
        }
    }, [navigate]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/admin?action=login-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (data.success) {
                setStep(2);
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch {
            setError('Server unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/admin?action=login-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp }),
            });

            const data = await res.json();
            if (data.success && data.token) {
                localStorage.setItem('admin_token', data.token);
                navigate('/admin');
            } else {
                setError(data.error || 'Invalid or expired OTP');
            }
        } catch {
            setError('Server unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            <Helmet>
                <title>Admin Login | Orbit SaaS</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-effect rounded-3xl p-8 border border-border/50 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-inner">
                            {step === 1 ? <Lock className="w-8 h-8 text-primary" /> : <Shield className="w-8 h-8 text-primary" />}
                        </div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Admin Access</h1>
                        <p className="text-muted-foreground text-sm mt-2">
                            {step === 1 ? 'Select your identity to request an access code' : 'Enter the 6-digit access code sent to your email'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form 
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSendOtp} 
                                className="space-y-5"
                            >
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Authorized Email</label>
                                    <div className="relative group text-left">
                                        <button
                                            type="button"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full flex items-center justify-between bg-secondary/50 hover:bg-secondary/80 transition-colors border border-border/50 rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
                                        >
                                            <span className="truncate pr-4 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                {AUTHORIZED_EMAILS.find(e => e.value === email)?.label}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {isDropdownOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full left-0 w-full mt-2 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                                                >
                                                    {AUTHORIZED_EMAILS.map((emailObj) => (
                                                        <button
                                                            key={emailObj.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setEmail(emailObj.value);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3.5 text-sm transition-colors ${
                                                                email === emailObj.value 
                                                                    ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary' 
                                                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent'
                                                            }`}
                                                        >
                                                            {emailObj.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/25"
                                >
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : 'Send Access Code'}
                                    {!loading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleVerifyOtp} 
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground mb-4 border border-border/50">
                                        <Mail className="w-3.5 h-3.5" />
                                        {email}
                                        <button type="button" onClick={() => setStep(1)} className="ml-1 text-primary hover:text-primary/80" title="Change Email">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        autoFocus
                                        className="w-full text-center text-4xl tracking-[0.5em] font-mono py-4 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary/50 transition-all placeholder:text-muted-foreground/30 text-red-500 font-bold"
                                        placeholder="••••••"
                                    />
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                        {error}
                                    </motion.p>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length < 6}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/25"
                                    >
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={loading}
                                        className="w-full py-2.5 rounded-xl bg-secondary/50 text-foreground font-medium text-sm flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center">
                        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to website
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
