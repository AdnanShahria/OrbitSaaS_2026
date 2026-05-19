import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.VITE_API_URL || '';

import { encryptPayload } from '@/lib/crypto';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Encrypt the payload so it cannot be read in the Network tab
            const encryptedBody = await encryptPayload({ 
                email: email || undefined,
                code: password 
            });

            const res = await fetch(`${API_BASE}/api/admin?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: encryptedBody }),
            });

            const data = await res.json();
            if (data.success && data.token) {
                localStorage.setItem('admin_token', data.token);
                navigate('/admin');
            } else {
                if (data.details) {
                    localStorage.setItem('last_error_details', `${data.details}\n${data.stack || ''}`);
                }
                setError(data.error || 'Invalid access code');
            }
        } catch {
            setError('Server unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
            <Helmet>
                <title>Admin Login | Orbit SaaS</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                className="w-full max-w-md"
            >
                <div className="glass-effect rounded-2xl p-8 border border-border">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Admin Access</h1>
                        <p className="text-muted-foreground text-sm mt-1">Enter your secret access code to manage content</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Admin Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border"
                                    placeholder="admin@orbitsaas.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Admin Access Code</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full bg-secondary rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border"
                                    placeholder="Enter your access code..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <p className="text-red-500 text-sm text-center font-semibold">
                                    {error}
                                </p>
                                {error.includes('Server unavailable') ? null : (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[10px] text-red-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                                        {localStorage.getItem('last_error_details') || 'Check console for details'}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            ← Back to website
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
