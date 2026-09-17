import { useState, useEffect, useCallback, useRef } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import AppleAdminThemeToggle from '@/components/admin/AppleAdminThemeToggle';
import { Helmet } from 'react-helmet-async';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
    LayoutDashboard, Type, ShoppingCart, Users, FolderOpen,
    MessageCircle, Globe, Shield, LogOut, Menu, PanelLeftClose, PanelLeft,
    Lightbulb, Phone, FileText, Cpu, CloudUpload, Loader2, Link as LinkIcon,
    Database, BarChart3, Star, Trash2, CheckCircle2, XCircle, Bell, Layers, UserCircle, Trophy, Wallet, Activity, Zap, ImageIcon, Receipt,
    Search, X, Compass, Sparkles, RefreshCw
} from 'lucide-react';


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

export interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export const navSections: NavSection[] = [
    {
        title: 'Content & Pages',
        items: [
            { label: 'Hero', path: '/admin/hero', icon: Type },
            { label: 'Stats', path: '/admin/stats', icon: BarChart3 },
            { label: 'Services', path: '/admin/services', icon: ShoppingCart },
            { label: 'Process', path: '/admin/process', icon: Layers },
            { label: 'Tech Stack', path: '/admin/tech-stack', icon: Cpu },
            { label: 'Why Us', path: '/admin/why-us', icon: Lightbulb },
            { label: 'Projects', path: '/admin/project', icon: FolderOpen },
            { label: 'Leadership', path: '/admin/leadership', icon: Users },
            { label: 'Reviews', path: '/admin/reviews', icon: Star },
            { label: 'Achievements', path: '/admin/achievements', icon: Trophy },
        ]
    },
    {
        title: 'Channels & UX',
        items: [
            { label: 'Navbar', path: '/admin/navbar', icon: Compass, badge: 'Nav' },
            { label: 'Footer', path: '/admin/footer', icon: FileText },
            { label: 'Contact', path: '/admin/contact', icon: Phone },
            { label: 'Chatbot', path: '/admin/chatbot', icon: MessageCircle, badge: 'AI' },
            { label: 'Quick Links', path: '/admin/links', icon: LinkIcon },
            { label: 'Legal', path: '/admin/legal', icon: Shield },
            { label: 'SEO Engine', path: '/admin/seo', icon: Globe },
        ]
    },
    {
        title: 'Finance & Ops',
        items: [
            { label: 'Finance Suite', path: '/admin/finance', icon: Wallet, badge: 'Pro' },
            { label: 'Invoices & Billing', path: '/admin/invoices', icon: Receipt, badge: 'Live' },
            { label: 'CRM Leads', path: '/admin/leads', icon: BarChart3 },
            { label: 'Notifications', path: '/admin/notifications', icon: Bell },
            { label: 'Audit Log', path: '/admin/audit', icon: Activity, badge: 'Logs' },
            { label: 'Cloud Backup', path: '/admin/backup', icon: Database },
            { label: 'Image OS', path: '/admin/optimizer', icon: ImageIcon },
        ]
    },
    {
        title: 'Preferences',
        items: [
            { label: 'Admin Profile', path: '/admin/profile', icon: UserCircle },
        ]
    }
];

// Progress toast renderer
function ProgressToast({ progress, label, color, doneMessage }: { progress: number; label: string; color: string; doneMessage?: string }) {
    const pct = Math.round(progress);
    const isDone = pct >= 100;
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color }} />}
                    {isDone && doneMessage ? doneMessage : label}
                </span>
                <span className="text-muted-foreground font-mono text-xs">{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                        boxShadow: `0 0 8px ${color}66`,
                    }}
                />
            </div>
        </div>
    );
}

function AdminLayoutContent() {
    const navigate = useNavigate();
    const { isLight } = useAdminTheme();
    const { content, refreshContent } = useContent();
    const profile = (content.en.adminProfile as any) || {};
    
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const [publishing, setPublishing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [cacheStatus, setCacheStatus] = useState<{
        checked: boolean;
        active: boolean;
        checking: boolean;
        languages?: Record<string, string>;
        lastChecked?: Date;
    }>({
        checked: false,
        active: false,
        checking: false,
    });

    const checkCacheStatus = useCallback(async (notify = false) => {
        setCacheStatus(prev => ({ ...prev, checking: true }));
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/admin?action=cache`, {
                method: 'GET',
            });
            if (res.ok) {
                const data = await res.json() as { success?: boolean; cached?: boolean; languages?: Record<string, string> };
                const isActive = Boolean(data.success && data.cached && data.languages && Object.keys(data.languages).length > 0);
                setCacheStatus({
                    checked: true,
                    active: isActive,
                    checking: false,
                    languages: data.languages || {},
                    lastChecked: new Date(),
                });
                if (notify) {
                    if (isActive) {
                        const langs = Object.keys(data.languages || {}).map(l => l.toUpperCase()).join(' & ');
                        toast.success('Edge Cache is Active & Published', {
                            description: `Live on Cloudflare CDN for ${langs}.`,
                        });
                    } else {
                        toast.warning('Cache is Not Active', {
                            description: 'Database is serving live queries. Click "Publish Cache" to activate.',
                        });
                    }
                }
                return isActive;
            } else {
                setCacheStatus(prev => ({ ...prev, checked: true, active: false, checking: false, lastChecked: new Date() }));
            }
        } catch (err) {
            console.error('Failed to check cache status:', err);
            setCacheStatus(prev => ({ ...prev, checked: true, active: false, checking: false, lastChecked: new Date() }));
            if (notify) {
                toast.error('Could not verify cache status');
            }
        }
        return false;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSidebarOpen(true);
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const query = searchQuery.trim().toLowerCase();
    const filteredSections = query
        ? navSections.map(section => ({
            ...section,
            items: section.items.filter(item =>
                item.label.toLowerCase().includes(query) ||
                item.path.toLowerCase().includes(query) ||
                section.title.toLowerCase().includes(query)
            )
        })).filter(section => section.items.length > 0)
        : navSections;
    // Read NDJSON stream and update toast with real progress
    const readProgressStream = useCallback(async (
        response: Response,
        toastId: string | number,
        color: string,
        fallbackLabel: string,
    ) => {
        const reader = response.body?.getReader();
        if (!reader) return null;

        const decoder = new TextDecoder();
        let buffer = '';
        let lastData: any = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    lastData = data;
                    const isDone = data.progress >= 100;
                    const doneMsg = isDone ? data.status : undefined;
                    toast.custom(
                        () => <ProgressToast progress={data.progress} label={data.status || fallbackLabel} color={color} doneMessage={doneMsg} />,
                        { id: toastId, duration: isDone ? 4000 : Infinity }
                    );
                } catch {
                    // skip bad lines
                }
            }
        }

        return lastData;
    }, []);

    const handlePublishCache = async () => {
        setPublishing(true);
        const toastId = toast.custom(
            () => <ProgressToast progress={0} label="Connecting..." color="#10b981" />,
            { duration: Infinity }
        );
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/admin?action=cache`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                toast.custom(
                    () => (
                        <div className="flex items-center gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Session expired. Please log in again.</span>
                        </div>
                    ),
                    { id: toastId, duration: 4000 }
                );
                handleLogout();
                return;
            }

            if (!res.ok) throw new Error('Cache publish failed');

            // Read the NDJSON stream — toast updates happen inside
            await readProgressStream(res, toastId, '#10b981', 'Publishing cache...');
        } catch (err) {
            console.error(err);
            toast.custom(
                () => (
                    <div className="flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Failed to publish cache</span>
                    </div>
                ),
                { id: toastId, duration: 4000 }
            );
        } finally {
            setPublishing(false);
            checkCacheStatus(false);
        }
    };

    // Expiry-aware token guard: read once at render time
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const token = isAdminTokenValid(rawToken) ? rawToken : null;

    useEffect(() => {
        if (!token) {
            // Evict a stale/expired token so the login page starts clean
            if (rawToken) localStorage.removeItem('admin_token');
            navigate('/admin/login');
        } else {
            checkCacheStatus(false);
        }
    }, [navigate, token, rawToken, checkCacheStatus]);

    if (!token) return null;

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    return (
        <div className={`min-h-[100dvh] flex overflow-hidden relative admin-theme-wrapper transition-colors duration-300 ${
            isLight ? 'admin-light bg-[#f5f5f7] text-[#1d1d1f]' : 'admin-dark bg-[#09090b] text-foreground'
        }`}>
            <Helmet>
                <title>Admin Panel | Orbit SaaS</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Mobile Base (visible behind scaled main content) */}
            <div className={`fixed inset-0 z-0 lg:hidden transition-colors ${isLight ? 'bg-[#e5e5ea]' : 'bg-[#09090b]'}`} />

            {/* Sidebar - Apple HIG Liquid Glass Material */}
            <aside 
                className={`fixed top-0 left-0 h-[100dvh] w-64 border-r flex flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
                    isLight 
                        ? 'bg-white/80 backdrop-blur-2xl backdrop-saturate-[180%] border-black/[0.07] shadow-[1px_0_24px_rgba(0,0,0,0.03)]' 
                        : 'bg-[#121214]/85 backdrop-blur-2xl backdrop-saturate-[190%] border-white/[0.08] shadow-[1px_0_32px_rgba(0,0,0,0.4)]'
                } ${
                    sidebarOpen 
                        ? 'translate-x-0 z-10 opacity-100' 
                        : '-translate-x-12 opacity-0 pointer-events-none lg:pointer-events-auto lg:opacity-100 lg:-translate-x-full z-0'
                }`}
            >
                {/* Header / Brand Identity */}
                <div 
                    className="px-4 py-3.5 border-b flex items-center justify-between transition-colors shrink-0" 
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] via-[#0064cc] to-[#004bb5] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.35)] ring-1 ring-white/20 shrink-0">
                            <LayoutDashboard className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-display font-bold tracking-tight text-[15px] truncate ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>
                                Orbit Admin
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold tracking-wider shrink-0 ${
                                isLight ? 'bg-black/[0.05] text-[#86868b]' : 'bg-white/[0.08] text-[#a1a1a6]'
                            }`}>
                                PRO
                            </span>
                        </div>
                    </div>

                    {/* Only show collapse button on desktop, since mobile uses tap-outside */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className={`hidden lg:flex p-1.5 -mr-1 rounded-lg transition-colors items-center justify-center cursor-pointer ${
                            isLight ? 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.08]'
                        }`}
                        title="Collapse sidebar (⌘B)"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className={`lg:hidden p-1.5 -mr-1 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                            isLight ? 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05]' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.08]'
                        }`}
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>

                {/* macOS Spotlight / Quick Filter Input */}
                <div className="px-3 pt-3 pb-1.5 shrink-0">
                    <div className="relative flex items-center">
                        <Search className={`absolute left-2.5 w-3.5 h-3.5 pointer-events-none transition-colors ${
                            isLight ? 'text-black/40' : 'text-white/40'
                        }`} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Quick search... (⌘K)"
                            className={`w-full h-8 pl-8 pr-7 text-xs rounded-lg transition-all outline-none ${
                                isLight 
                                    ? 'bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.05] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15'
                                    : 'bg-white/[0.05] hover:bg-white/[0.08] focus:bg-[#1a1a1e] text-foreground placeholder:text-muted-foreground border border-white/[0.06] focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/25'
                            }`}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Grouped Navigation List with Apple System Blue Active Pills */}
                <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-3.5 custom-scrollbar">
                    {filteredSections.map(section => (
                        <div key={section.title} className="space-y-0.5">
                            <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] select-none ${
                                isLight ? 'text-[#86868b]' : 'text-[#8e8e93]'
                            }`}>
                                {section.title}
                            </div>

                            <div className="space-y-0.5">
                                {section.items.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) setSidebarOpen(false);
                                        }}
                                        className={({ isActive }) =>
                                            `group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 active:scale-[0.98] ${
                                                isActive
                                                    ? (isLight
                                                        ? 'bg-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.28)] font-semibold'
                                                        : 'bg-[#0a84ff] text-white shadow-[0_2px_10px_rgba(10,132,255,0.32)] font-semibold')
                                                    : (isLight
                                                        ? 'text-[#424245] hover:text-[#1d1d1f] hover:bg-black/[0.04] font-medium'
                                                        : 'text-[#d1d1d6] hover:text-white hover:bg-white/[0.06] font-medium')
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <item.icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                                        isActive
                                                            ? 'text-white'
                                                            : (isLight ? 'text-[#86868b] group-hover:text-[#1d1d1f]' : 'text-[#8e8e93] group-hover:text-white')
                                                    }`} />
                                                    <span className="truncate">{item.label}</span>
                                                </div>

                                                {item.badge && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-semibold tracking-wider shrink-0 transition-colors ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : (isLight
                                                                ? 'bg-black/[0.05] text-[#86868b] group-hover:text-[#1d1d1f]'
                                                                : 'bg-white/[0.08] text-[#8e8e93] group-hover:text-white')
                                                    }`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredSections.length === 0 && (
                        <div className="py-8 px-4 text-center">
                            <Search className="w-5 h-5 mx-auto text-muted-foreground/40 mb-2" />
                            <p className="text-xs font-medium text-muted-foreground">No matches for "{searchQuery}"</p>
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
                            >
                                Clear filter
                            </button>
                        </div>
                    )}
                </nav>

                {/* macOS Control Center Action Deck Footer */}
                <div className={`p-3 border-t space-y-2.5 w-full transition-colors shrink-0 ${
                    isLight ? 'bg-white/80 border-black/[0.06]' : 'bg-[#141416]/90 border-white/[0.08]'
                }`}>
                    {/* Cache Status & Publish Deck */}
                    <div className="space-y-1.5">
                        {/* Live Cache Status Badge & Verifier Button */}
                        <button
                            type="button"
                            onClick={() => checkCacheStatus(true)}
                            disabled={cacheStatus.checking}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none active:scale-[0.98] ${
                                cacheStatus.checking
                                    ? 'bg-muted/40 border-border text-muted-foreground'
                                    : cacheStatus.active
                                        ? (isLight
                                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 hover:bg-emerald-500/15 shadow-[0_1px_3px_rgba(16,185,129,0.12)]'
                                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_1px_4px_rgba(16,185,129,0.15)]')
                                        : (isLight
                                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 hover:bg-amber-500/15'
                                            : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/20')
                            }`}
                            title="Click to check if cache is published & active"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                {cacheStatus.checking ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-muted-foreground" />
                                ) : cacheStatus.active ? (
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                ) : (
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                                
                                <div className="flex flex-col items-start text-left min-w-0">
                                    <span className="text-[11px] font-bold leading-tight truncate">
                                        {cacheStatus.checking
                                            ? 'Checking Cache...'
                                            : cacheStatus.active
                                                ? 'Cache Active'
                                                : 'Cache Not Active'}
                                    </span>
                                    <span className="text-[9px] opacity-75 font-mono leading-tight truncate">
                                        {cacheStatus.checking
                                            ? 'Checking Cloudflare...'
                                            : cacheStatus.active
                                                ? 'Published • Live on CDN'
                                                : 'Serving Live Queries'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                {cacheStatus.checking ? (
                                    <span className="text-[9px] font-mono opacity-60">...</span>
                                ) : cacheStatus.active ? (
                                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>OK</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                                        Check
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Primary Publish Action */}
                        <button
                            onClick={handlePublishCache}
                            disabled={publishing}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-sm ${
                                isLight
                                    ? 'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-[0_2px_8px_rgba(0,113,227,0.28)]'
                                    : 'bg-[#0a84ff] text-white hover:bg-[#1a8cff] shadow-[0_2px_10px_rgba(10,132,255,0.32)]'
                            }`}
                            title="Compile database snapshot and warm Cloudflare Edge Cache"
                        >
                            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                            <span>{publishing ? 'Publishing Cache...' : 'Publish Cache'}</span>
                        </button>
                    </div>

                    {/* Apple Segmented Theme Toggle */}
                    <div>
                        <AppleAdminThemeToggle />
                    </div>

                    {/* User Session & Logout Tile */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                        isLight ? 'bg-black/[0.03] border border-black/[0.04]' : 'bg-white/[0.03] border border-white/[0.06]'
                    }`}>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#0a84ff]/20 text-[#0a84ff]'
                            }`}>
                                OA
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate leading-tight ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>
                                    Orbit Admin
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                    Active Session
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isLight 
                                    ? 'text-[#86868b] hover:text-red-600 hover:bg-red-500/10' 
                                    : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/20'
                            }`}
                            title="Log out of Orbit Admin"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area — features a unique 3D scale down on mobile when sidebar is open */}
            <main 
                className={`flex-1 min-h-[100dvh] w-full flex flex-col relative z-20 transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
                    sidebarOpen 
                        ? 'lg:ml-64 max-lg:translate-x-[256px] max-lg:scale-[0.88] max-lg:rounded-l-[2rem] max-lg:shadow-[-20px_0_40px_rgba(0,0,0,0.5)] max-lg:overflow-hidden max-lg:border-l border-white/10' 
                        : 'lg:ml-0 translate-x-0 scale-100 rounded-none shadow-none origin-right overflow-auto'
                }`}
            >
                {/* Mobile overlay to intercept clicks and close sidebar */}
                {sidebarOpen && (
                    <div 
                        className="absolute inset-0 z-50 lg:hidden cursor-pointer"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Tap to close sidebar"
                    />
                )}

                {/* Top Desktop Bar (Hidden when sidebar is open on Desktop) */}
                {!sidebarOpen && (
                    <div className={`hidden lg:flex sticky top-0 left-0 w-full z-30 backdrop-blur-xl border-b px-4 py-3 items-center justify-between shadow-sm transition-colors ${
                        isLight ? 'bg-white/80 border-black/[0.08]' : 'bg-card/95 border-border'
                    }`}>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className={`p-2 -ml-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                                    isLight ? 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1d1d1f]' : 'bg-secondary/30 hover:bg-secondary/80 text-foreground'
                                }`}
                                title="Open sidebar"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                            <span className={`font-display font-bold text-base tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>Admin Panel</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AppleAdminThemeToggle variant="compact" />
                        </div>
                    </div>
                )}

                {/* Top Mobile Bar (Always visible on mobile to toggle sidebar) */}
                <div className={`lg:hidden sticky top-0 left-0 w-full z-30 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between shadow-sm transition-colors ${
                    isLight ? 'bg-white/80 border-black/[0.08]' : 'bg-card/95 border-border'
                }`}>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-2 -ml-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                                isLight ? 'bg-black/[0.04] hover:bg-black/[0.08] text-[#1d1d1f]' : 'bg-secondary/30 hover:bg-secondary/80 text-foreground'
                            }`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className={`font-display font-bold text-base tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>Orbit Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <AppleAdminThemeToggle variant="compact" />
                    </div>
                </div>

                {/* Actual Page Content */}
                <div className={`p-4 sm:p-5 lg:p-8 max-w-[1200px] mx-auto w-full relative z-0 flex-1 transition-opacity duration-300 ${sidebarOpen ? 'max-lg:opacity-50 max-lg:pointer-events-none' : 'opacity-100'}`}>
                   <Outlet />
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout() {
    return (
        <AdminThemeProvider>
            <AdminLayoutContent />
        </AdminThemeProvider>
    );
}
