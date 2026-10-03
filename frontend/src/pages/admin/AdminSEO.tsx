import { useState, useEffect } from 'react';
import { SectionHeader, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';
import { ExternalLink, RefreshCw, CheckCircle2, Globe, FileCode2, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSEO() {
    const { lang, saving, saved, error, getData, save } = useSectionEditor('seo');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');
    const [seoKeywords, setSeoKeywords] = useState('');
    const [pinging, setPinging] = useState(false);

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
            const token = localStorage.getItem('orbit_admin_token') || sessionStorage.getItem('orbit_admin_token') || '';
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/admin?action=ping-sitemap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Search engines notified & Cloudflare cache purged!');
            } else {
                toast.error(data.error || 'Failed to ping search engines');
            }
        } catch (err: any) {
            toast.error(err.message || 'Network error pinging search engines');
        } finally {
            setPinging(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="SEO & Sitemaps" description="Manage search engine metadata and automated indexing pipelines" />
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
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                        {pinging ? 'Notifying Bots...' : 'Ping Search Engines (IndexNow)'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
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
                        rel="noreferrer"
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
                        rel="noreferrer"
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
                        rel="noreferrer"
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
