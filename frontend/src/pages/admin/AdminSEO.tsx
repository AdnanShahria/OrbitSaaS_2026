import { useState, useEffect, useCallback, useMemo } from 'react';
import { SectionHeader, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';
import { ExternalLink, RefreshCw, CheckCircle2, Globe, FileCode2, Bot, Sparkles, Image as ImageIcon, AlertCircle, Wand2, Layers, Search, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/imageUpload';
import { getImageUrl } from '@/lib/imageUrl';
import { generateSharePoster } from '@/lib/sharePosterGenerator';

interface CoverItem {
    id: string;
    type: 'project' | 'achievement' | 'leadership';
    title: string;
    role?: string;
    subDetail?: string;
    sourceImage: string;
    seoCover: string;
    shareImage: string;
    hasCover: boolean;
    url: string;
}

interface CoverStats {
    total: number;
    covered: number;
    missing: number;
    percent: number;
    byType: {
        projects: { total: number; covered: number; missing: number };
        achievements: { total: number; covered: number; missing: number };
        leadership: { total: number; covered: number; missing: number };
    };
}

export default function AdminSEO() {
    const { lang, saving, saved, error, getData, save } = useSectionEditor('seo');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');
    const [seoKeywords, setSeoKeywords] = useState('');
    const [pinging, setPinging] = useState(false);

    // ─── SEO Covers State ───
    const [coverStats, setCoverStats] = useState<CoverStats | null>(null);
    const [coverItems, setCoverItems] = useState<CoverItem[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<'all' | 'missing' | 'project' | 'achievement' | 'leadership'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [batchProgress, setBatchProgress] = useState<{ active: boolean; current: number; total: number; name: string }>({
        active: false,
        current: 0,
        total: 0,
        name: ''
    });

    const API_BASE = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const d = getData();
        if (d) {
            setSeoTitle(d.title || '');
            setSeoDesc(d.description || '');
            setSeoKeywords(d.keywords || '');
        }
    }, [getData]);

    const handlePingSearchEngines = async () => {
        setPinging(true);
        try {
            const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('orbit_admin_token') || '';
            if (!token) {
                toast.error('Admin authentication token missing. Please log in again.');
                setPinging(false);
                return;
            }

            const res = await fetch(`${API_BASE}/api/admin?action=ping-sitemap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Search engines notified (IndexNow) & Cloudflare edge cache purged!');
            } else {
                toast.error(data.error || 'Failed to ping search engines');
            }
        } catch (err: any) {
            toast.error(err.message || 'Network error pinging search engines');
        } finally {
            setPinging(false);
        }
    };

    // ─── SEO Covers Audit & Generation ───
    const fetchCoversAudit = useCallback(async (quiet = false) => {
        setAuditLoading(true);
        try {
            const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('orbit_admin_token') || '';
            const res = await fetch(`${API_BASE}/api/admin?action=seo-covers-audit`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setCoverStats(data.stats);
                setCoverItems(data.items || []);
                if (!quiet) {
                    toast.success(`Audit complete: ${data.stats.covered}/${data.stats.total} covers active (${data.stats.percent}%)`);
                }
            } else {
                if (!quiet) toast.error(data.error || 'Failed to audit SEO covers');
            }
        } catch (e: any) {
            if (!quiet) toast.error(e.message || 'Network error auditing SEO covers');
        } finally {
            setAuditLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchCoversAudit(true);
    }, [fetchCoversAudit]);

    const handleGenerateSingle = async (item: CoverItem) => {
        if (!item.sourceImage) {
            toast.error(`"${item.title}" does not have a source image uploaded yet.`);
            return;
        }

        setGeneratingIds(prev => new Set(prev).add(item.id));
        const toastId = toast.loading(`Generating 1200×630 share cover for "${item.title}"...`);

        try {
            const posterFile = await generateSharePoster(item.sourceImage, {
                type: item.type,
                title: item.title,
                name: item.title,
                role: item.role,
                subDetail: item.subDetail
            });

            const folder = item.type === 'project' ? 'projects' : (item.type === 'achievement' ? 'achievements' : 'team');
            const uploaded = await uploadImage(posterFile, folder, true);
            const coverUrl = typeof uploaded === 'object' ? (uploaded as any).primary : uploaded;

            const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('orbit_admin_token') || '';
            const syncRes = await fetch(`${API_BASE}/api/admin?action=seo-covers-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    updates: [{
                        type: item.type,
                        id: item.id,
                        title: item.title,
                        sourceImage: item.sourceImage,
                        seoCover: coverUrl,
                        shareImage: coverUrl
                    }]
                })
            });

            if (syncRes.ok) {
                toast.success(`Generated & synced cover for "${item.title}"!`, { id: toastId });
                await fetchCoversAudit(true);
            } else {
                toast.error('Failed to sync cover to database', { id: toastId });
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Failed to generate cover', { id: toastId });
        } finally {
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleBatchGenerate = async (onlyMissing = true) => {
        const targets = onlyMissing
            ? coverItems.filter(i => !i.hasCover && i.sourceImage)
            : coverItems.filter(i => i.sourceImage);

        if (targets.length === 0) {
            toast.info(onlyMissing ? 'All items already have valid SEO share covers!' : 'No items with images to generate');
            return;
        }

        setBatchProgress({ active: true, current: 0, total: targets.length, name: '' });
        const updates: any[] = [];
        let successCount = 0;

        for (let i = 0; i < targets.length; i++) {
            const item = targets[i];
            setBatchProgress({ active: true, current: i + 1, total: targets.length, name: item.title });

            try {
                const posterFile = await generateSharePoster(item.sourceImage, {
                    type: item.type,
                    title: item.title,
                    name: item.title,
                    role: item.role,
                    subDetail: item.subDetail
                });

                const folder = item.type === 'project' ? 'projects' : (item.type === 'achievement' ? 'achievements' : 'team');
                const uploaded = await uploadImage(posterFile, folder, true);
                const coverUrl = typeof uploaded === 'object' ? (uploaded as any).primary : uploaded;

                updates.push({
                    type: item.type,
                    id: item.id,
                    title: item.title,
                    sourceImage: item.sourceImage,
                    seoCover: coverUrl,
                    shareImage: coverUrl
                });
                successCount++;
            } catch (e) {
                console.error(`Failed generating for ${item.title}:`, e);
            }
        }

        if (updates.length > 0) {
            try {
                const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('orbit_admin_token') || '';
                await fetch(`${API_BASE}/api/admin?action=seo-covers-sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ updates })
                });
                toast.success(`Successfully generated and synced ${successCount} SEO share covers!`);
                await fetchCoversAudit(true);
            } catch (e) {
                toast.error('Error saving generated covers to database');
            }
        }

        setBatchProgress({ active: false, current: 0, total: 0, name: '' });
    };

    const filteredItems = useMemo(() => {
        return coverItems.filter(item => {
            if (filterType === 'missing' && item.hasCover) return false;
            if (filterType === 'project' && item.type !== 'project') return false;
            if (filterType === 'achievement' && item.type !== 'achievement') return false;
            if (filterType === 'leadership' && item.type !== 'leadership') return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = item.title?.toLowerCase().includes(q);
                const matchId = item.id?.toLowerCase().includes(q);
                const matchRole = item.role?.toLowerCase().includes(q);
                return matchTitle || matchId || matchRole;
            }
            return true;
        });
    }, [coverItems, filterType, searchQuery]);

    return (
        <div className="space-y-6">
            <SectionHeader title="SEO & Sitemaps" description="Manage search engine metadata, automated indexing, and branded social share covers" />
            <ErrorAlert message={error} />

            {/* Automated Sitemaps & Search Engine Indexing Status Card */}
            <div className="bg-gradient-to-br from-emerald-950/20 via-card to-card border border-emerald-500/20 rounded-xl p-5 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="font-display font-bold text-foreground text-base md:text-lg flex items-center gap-2">
                                Automated Dynamic Sitemaps <Sparkles className="w-4 h-4 text-emerald-400" />
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Updates <strong className="text-foreground">every single day</strong> automatically and refreshes instantly on <strong className="text-foreground">every content edition</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePingSearchEngines}
                        disabled={pinging}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                        {pinging ? 'Notifying Bots...' : 'Ping Search Engines (IndexNow)'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-2.5">
                            <FileCode2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-xs font-semibold text-foreground">Main Sitemap</div>
                                <div className="text-[11px] text-muted-foreground">/sitemap.xml</div>
                            </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                    </a>

                    <a
                        href="/sitemap-images.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-xs font-semibold text-foreground">Image Sitemap</div>
                                <div className="text-[11px] text-muted-foreground">/sitemap-images.xml</div>
                            </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                    </a>

                    <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-2.5">
                            <Bot className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-xs font-semibold text-foreground">Robots Rules</div>
                                <div className="text-[11px] text-muted-foreground">/robots.txt</div>
                            </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                    </a>

                    <a
                        href="/llms.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="text-xs font-semibold text-foreground">AI Search (AEO)</div>
                                <div className="text-[11px] text-muted-foreground">/llms.txt</div>
                            </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                    </a>
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground/80 flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border/40">
                    <span>⚡ <strong>IndexNow:</strong> Instant ping to Bing, Yandex, Seznam & Naver.</span>
                    <span>🌐 <strong>Google:</strong> Auto-crawls via dynamic <code>&lt;lastmod&gt;</code> & purged Cloudflare edge cache.</span>
                </div>
            </div>

            {/* ─── Social Share & SEO Covers Manager (1200x630 Link Preview Banners) ─── */}
            <div className="bg-gradient-to-br from-cyan-950/20 via-card to-card border border-cyan-500/20 rounded-xl p-5 md:p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            <h3 className="font-display font-bold text-foreground text-base md:text-lg flex items-center gap-2">
                                Link Preview & SEO Share Covers (1200×630) <ImageIcon className="w-4 h-4 text-cyan-400" />
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Internal & external link sharing banners with top-right <strong className="text-foreground">ORBIT SaaS logo</strong>. Formatted for WhatsApp, LinkedIn, Twitter/X, Discord, and search engines.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchCoversAudit(false)}
                            disabled={auditLoading || batchProgress.active}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                            {auditLoading ? 'Auditing...' : 'Check & Audit Covers'}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleBatchGenerate(true)}
                            disabled={batchProgress.active || (coverStats?.missing || 0) === 0}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer disabled:opacity-40"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Generate Missing Covers {coverStats?.missing ? `(${coverStats.missing})` : ''}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleBatchGenerate(false)}
                            disabled={batchProgress.active || coverItems.length === 0}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80 transition-all cursor-pointer disabled:opacity-40"
                            title="Re-creates all banners with the latest watermark logo"
                        >
                            <Wand2 className="w-3.5 h-3.5" />
                            Regenerate All Covers
                        </button>
                    </div>
                </div>

                {/* Batch Progress Bar */}
                {batchProgress.active && (
                    <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-cyan-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Generating {batchProgress.current} of {batchProgress.total}: <strong>{batchProgress.name}</strong>
                            </span>
                            <span className="text-muted-foreground font-mono">
                                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Statistics Overview */}
                {coverStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-background/60 border border-border space-y-1">
                            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total Items</div>
                            <div className="text-2xl font-bold font-display text-foreground">{coverStats.total}</div>
                            <div className="text-[11px] text-muted-foreground">Projects + Achievements + Team</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                            <div className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">Covered & Active</div>
                            <div className="text-2xl font-bold font-display text-emerald-400">{coverStats.covered}</div>
                            <div className="text-[11px] text-emerald-400/80">Has 1200×630 share poster</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                            <div className="text-[11px] text-amber-400 font-medium uppercase tracking-wider">Missing Covers</div>
                            <div className="text-2xl font-bold font-display text-amber-400">{coverStats.missing}</div>
                            <div className="text-[11px] text-amber-400/80">Needs branded banner</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                            <div className="text-[11px] text-cyan-400 font-medium uppercase tracking-wider">Coverage Rate</div>
                            <div className="text-2xl font-bold font-display text-cyan-400">{coverStats.percent}%</div>
                            <div className="text-[11px] text-cyan-400/80">
                                {coverStats.percent === 100 ? '✓ Complete & optimal' : 'Incomplete coverage'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'all' ? 'bg-primary text-white shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                            All ({coverItems.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('missing')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'missing' ? 'bg-amber-500 text-white shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                            Missing ({coverStats?.missing || 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('project')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'project' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                            Projects ({coverStats?.byType.projects.total || 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('achievement')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'achievement' ? 'bg-purple-600 text-white shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                            Achievements ({coverStats?.byType.achievements.total || 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('leadership')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterType === 'leadership' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                            Leadership ({coverStats?.byType.leadership.total || 0})
                        </button>
                    </div>

                    <div className="relative min-w-[220px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter by title or slug..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {filteredItems.map((item) => {
                        const isGenerating = generatingIds.has(item.id);
                        const coverUrl = getImageUrl(item.seoCover || item.shareImage);
                        const sourceUrl = getImageUrl(item.sourceImage);

                        return (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`rounded-xl border p-4 bg-card/60 flex flex-col justify-between gap-3 transition-all ${item.hasCover ? 'border-border/80 hover:border-cyan-500/40' : 'border-amber-500/40 bg-amber-950/10'}`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider mb-1 ${
                                                    item.type === 'project'
                                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                        : item.type === 'achievement'
                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                            >
                                                {item.type}
                                            </span>
                                            <h4 className="font-semibold text-foreground text-sm line-clamp-1" title={item.title}>
                                                {item.title}
                                            </h4>
                                            {item.role && (
                                                <p className="text-[11px] text-muted-foreground line-clamp-1">{item.role}</p>
                                            )}
                                        </div>

                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded-md text-muted-foreground hover:text-cyan-400 hover:bg-secondary/60 transition-colors flex-shrink-0"
                                            title="Open Public Link"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* Cover Image Preview */}
                                    <div className="relative aspect-[1200/630] rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
                                        {coverUrl ? (
                                            <>
                                                <img
                                                    src={coverUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <a
                                                        href={coverUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> Full View
                                                    </a>
                                                </div>
                                                <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                                    ✓ Logo Active
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-muted-foreground">
                                                <AlertCircle className="w-6 h-6 text-amber-400/80 mb-1" />
                                                <span className="text-[11px] font-medium text-amber-400">Missing SEO Cover</span>
                                                <span className="text-[9px] text-muted-foreground">Original image available</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        {sourceUrl ? (
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Source Photo OK
                                            </span>
                                        ) : (
                                            <span className="text-red-400 flex items-center gap-1">
                                                ✗ No Source Photo
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGenerateSingle(item)}
                                        disabled={isGenerating || batchProgress.active || !sourceUrl}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                                            !item.hasCover
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
                                        }`}
                                    >
                                        <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                                        {isGenerating ? 'Generating...' : item.hasCover ? 'Regenerate' : 'Create Cover'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="col-span-full p-8 text-center text-muted-foreground text-xs rounded-xl border border-dashed border-border">
                            No items match the selected filter.
                        </div>
                    )}
                </div>
            </div>

            {/* Primary Meta Tags Configuration */}
            <div className="space-y-4 bg-card rounded-xl p-4 md:p-6 border border-border">
                <TextField label="Page Title" value={seoTitle} onChange={setSeoTitle} lang="en" />
                <TextField label="Meta Description" value={seoDesc} onChange={setSeoDesc} multiline lang="en" />
                <TextField label="Keywords (comma-separated)" value={seoKeywords} onChange={setSeoKeywords} lang="en" />
            </div>
            <SaveButton onClick={() => save({ title: seoTitle, description: seoDesc, keywords: seoKeywords })} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`SEO JSON (${lang.toUpperCase()})`}
                    data={{ title: seoTitle, description: seoDesc, keywords: seoKeywords }}
                    onImport={(parsed) => {
                        setSeoTitle(parsed.title || '');
                        setSeoDesc(parsed.description || '');
                        setSeoKeywords(parsed.keywords || '');
                    }}
                />
            </div>
        </div>
    );
}
