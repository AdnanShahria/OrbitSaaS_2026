import { useState, useEffect, useCallback } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { Helmet } from 'react-helmet-async';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
    LayoutDashboard, Type, ShoppingCart, Users, FolderOpen,
    MessageCircle, Globe, Shield, LogOut, Menu, PanelLeftClose, PanelLeft,
    Lightbulb, Phone, FileText, Cpu, CloudUpload, Loader2, Link as LinkIcon,
    Database, BarChart3, Star, Trash2, CheckCircle2, XCircle, Bell, Layers, UserCircle, Trophy, Wallet
} from 'lucide-react';



const navItems = [
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
    { label: 'Contact', path: '/admin/contact', icon: Phone },
    { label: 'Footer', path: '/admin/footer', icon: FileText },
    { label: 'Legal', path: '/admin/legal', icon: Shield },
    { label: 'Chatbot', path: '/admin/chatbot', icon: MessageCircle },
    { label: 'Links', path: '/admin/links', icon: LinkIcon },
    { label: 'Navbar', path: '/admin/navbar', icon: LinkIcon },
    { label: 'Profile', path: '/admin/profile', icon: UserCircle },
    { label: 'SEO', path: '/admin/seo', icon: Globe },
    { label: 'Leads', path: '/admin/leads', icon: BarChart3 },
    { label: '💰 Finance', path: '/admin/finance', icon: Wallet },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Backup', path: '/admin/backup', icon: Database },
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

export default function AdminLayout() {
    const navigate = useNavigate();
    const { content, refreshContent } = useContent();
    const profile = (content.en.adminProfile as any) || {};
    
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const [publishing, setPublishing] = useState(false);
    const [deleting, setDeleting] = useState(false);
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
        }
    };

    const handleDeleteCache = async () => {
        if (!confirm('Are you sure you want to delete all cached content? The site will fall back to live DB queries until republished.')) return;
        setDeleting(true);
        const toastId = toast.custom(
            () => <ProgressToast progress={0} label="Connecting..." color="#f59e0b" />,
            { duration: Infinity }
        );
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/admin?action=cache`, {
                method: 'DELETE',
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

            if (!res.ok) throw new Error('Cache delete failed');

            await readProgressStream(res, toastId, '#f59e0b', 'Deleting cache...');
        } catch (err) {
            console.error(err);
            toast.custom(
                () => (
                    <div className="flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Failed to delete cache</span>
                    </div>
                ),
                { id: toastId, duration: 4000 }
            );
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) navigate('/admin/login');
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-[100dvh] bg-[#09090b] flex overflow-hidden relative">
            <Toaster position="top-right" theme="dark" richColors closeButton />
            <Helmet>
                <title>Admin Panel | Orbit SaaS</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Mobile Dark Base (visible behind scaled main content) */}
            <div className="fixed inset-0 bg-[#09090b] z-0 lg:hidden" />

            {/* Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-[100dvh] w-64 bg-card border-r border-border flex flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
                    sidebarOpen 
                        ? 'translate-x-0 z-10 opacity-100' 
                        : '-translate-x-12 opacity-0 pointer-events-none lg:pointer-events-auto lg:opacity-100 lg:-translate-x-full z-0'
                }`}
            >
                <div className="px-4 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                        <span className="font-display font-bold text-foreground">Orbit Admin</span>
                    </div>
                    {/* Only show collapse button on desktop, since mobile uses tap-outside */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="hidden lg:flex p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors items-center justify-center cursor-pointer"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-500 scale-[1.02]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary hover:translate-x-1'
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-border space-y-1 bg-card w-full">
                    <button
                        onClick={handlePublishCache}
                        disabled={publishing}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors w-full cursor-pointer disabled:opacity-50"
                    >
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                        {publishing ? 'Publishing...' : 'Publish Cache'}
                    </button>
                    <button
                        onClick={handleDeleteCache}
                        disabled={deleting}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors w-full cursor-pointer disabled:opacity-50"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {deleting ? 'Deleting...' : 'Delete Cache'}
                    </button>
                    <a
                        href="/"
                        target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <Globe className="w-4 h-4" />
                        View Site
                    </a>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors w-full cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area — features a unique 3D scale down on mobile when sidebar is open */}
            <main 
                className={`flex-1 min-h-[100dvh] w-full flex flex-col relative z-20 bg-background transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
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
                    <div className="hidden lg:flex sticky top-0 left-0 w-full z-30 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 -ml-2 rounded-lg text-foreground bg-secondary/30 hover:bg-secondary/80 focus:bg-secondary/80 transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <span className="font-display font-bold text-foreground text-lg">Admin Panel</span>
                        </div>
                    </div>
                )}

                {/* Top Mobile Bar (Always visible on mobile to toggle sidebar) */}
                <div className="lg:hidden sticky top-0 left-0 w-full z-30 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 rounded-lg text-foreground bg-secondary/30 hover:bg-secondary/80 focus:bg-secondary/80 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="font-display font-bold text-foreground text-lg">Orbit Admin</span>
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
