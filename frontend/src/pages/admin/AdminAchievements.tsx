import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, X, Link2, Layers, Settings2, HelpCircle, Search, Eye, Edit3, Sparkles, ExternalLink } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { uploadImage } from '@/lib/imageUpload';
import { getImageUrl } from '@/lib/imageUrl';
import { generateSharePoster } from '@/lib/sharePosterGenerator';
import DOMPurify from 'dompurify';

// --- Multi Image Upload ---
function MultiImageUpload({ images, onChange, title }: { images: any[]; onChange: (imgs: any[]) => void; title: string }) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleFiles = async (files: FileList) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;
        setUploading(true);
        const toastId = toast.loading(`Uploading ${imageFiles.length} images...`);
        try {
            const newUrls: any[] = [];
            for (let i = 0; i < imageFiles.length; i += 3) {
                const batch = imageFiles.slice(i, i + 3);
                const urls = await Promise.all(batch.map(file => uploadImage(file, 'achievements')));
                newUrls.push(...urls);
            }
            onChange([...images, ...newUrls]);
            toast.success('Images uploaded!', { id: toastId });
        } catch { toast.error('Upload failed', { id: toastId }); }
        finally { setUploading(false); }
    };

    const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx));
    const moveImage = (from: number, to: number) => {
        if (to < 0 || to >= images.length) return;
        const updated = [...images]; const [moved] = updated.splice(from, 1); updated.splice(to, 0, moved); onChange(updated);
    };

    const addImageUrl = () => {
        const url = imageUrl.trim();
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) { toast.error('Enter a valid URL'); return; }
        onChange([...images, url]); setImageUrl(''); toast.success('Image URL added!');
    };

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items; if (!items) return;
        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf('image') !== -1) { const blob = items[i].getAsFile(); if (blob) imageFiles.push(blob); } }
        if (imageFiles.length > 0) {
            e.preventDefault(); e.stopPropagation(); setUploading(true);
            const toastId = toast.loading('Uploading pasted image...');
            try { 
                const urls: any[] = []; 
                for (let i = 0; i < imageFiles.length; i += 3) {
                    const batch = imageFiles.slice(i, i + 3);
                    const batchUrls = await Promise.all(batch.map(f => uploadImage(f, 'achievements')));
                    urls.push(...batchUrls);
                }
                onChange([...images, ...urls]); 
                toast.success('Uploaded!', { id: toastId }); 
            }
            catch { toast.error('Upload failed', { id: toastId }); }
            finally { setUploading(false); }
        }
    }, [images, onChange]);

    return (
        <div ref={containerRef} tabIndex={0} onPaste={handlePaste} className="outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 -m-1 transition-shadow">
            <label className="text-sm font-medium text-foreground mb-1.5 block">{title} <span className="text-xs font-normal text-muted-foreground ml-2">({images.length} — first is cover)</span></label>
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                    {images.map((img, i) => (
                        <div key={i} className={`relative rounded-lg overflow-hidden border group ${i === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                            <img src={getImageUrl(img)} alt="" className="w-full h-32 object-cover" />
                            {i === 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary text-white text-[10px] uppercase">Cover</span>}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                {i > 0 && <button onClick={() => moveImage(i, i - 1)} className="p-1 rounded-full bg-white text-black text-xs">←</button>}
                                <button onClick={() => removeImage(i)} className="p-1 rounded-full bg-red-500 text-white"><Trash2 className="w-3 h-3" /></button>
                                {i < images.length - 1 && <button onClick={() => moveImage(i, i + 1)} className="p-1 rounded-full bg-white text-black text-xs">→</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 max-w-xs h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground"><Upload className="w-5 h-5" /><span className="text-xs">{uploading ? 'Uploading...' : 'Click to Upload'}</span></div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
                </label>
                <div className="flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                                placeholder="Paste image URL..." className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <button type="button" onClick={addImageUrl} disabled={!imageUrl.trim()} className="px-3 py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"><Plus className="w-4 h-4" /></button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Or click this area and press Ctrl+V to paste</p>
                </div>
            </div>
        </div>
    );
}

// --- Tags Input ---
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
    const [input, setInput] = useState('');
    const addTag = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(''); } };
    return (
        <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {tag}<button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="Add tag..." className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border" />
                <button onClick={addTag} className="px-3 py-2 rounded-lg bg-secondary"><Plus className="w-4 h-4" /></button>
            </div>
        </div>
    );
}

// --- Types ---
interface UnifiedAchievement {
    id: string;
    order: number;
    images: string[];
    shareImage?: string;
    seoCover?: string;
    link: string;
    category: string;
    date: string;
    featured: boolean;
    hidden: boolean;
    videoPreview: string;
    tags: string[];
    seo: { title: string; description: string; keywords: string[] };
    en: { title: string; description: string };
    bn: { title: string; description: string };
    [key: string]: any;
}

const DEFAULT_ACHIEVEMENT: UnifiedAchievement = {
    id: '', order: 0, images: [], shareImage: '', seoCover: '', link: '', category: '', date: '',
    featured: false, hidden: false, videoPreview: '', tags: [],
    seo: { title: '', description: '', keywords: [] },
    en: { title: '', description: '' }, bn: { title: '', description: '' }
};

// --- Achievement Editor ---
function AchievementEditor({ item, update }: { item: UnifiedAchievement; update: (i: UnifiedAchievement) => void }) {
    const [tab, setTab] = useState<'en' | 'bn'>('en');
    const [imagesExpanded, setImagesExpanded] = useState(false);
    const [seoExpanded, setSeoExpanded] = useState(false);
    const [descPreview, setDescPreview] = useState(false);

    const updateLoc = (lang: 'en' | 'bn', field: string, value: any) => update({ ...item, [lang]: { ...item[lang], [field]: value } });
    const updateSeo = (field: string, value: any) => update({ ...item, seo: { ...item.seo, [field]: value } });

    return (
        <div className="space-y-6">
            {/* Shared Fields */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">🌍 Shared Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Achievement ID (Slug)" value={item.id} onChange={v => update({ ...item, id: v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })} />
                    <TextField label="Category / Badge" value={item.category} onChange={v => update({ ...item, category: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Date / Period" value={item.date} onChange={v => update({ ...item, date: v })} />
                    <TextField label="Live Link (optional)" value={item.link} onChange={v => update({ ...item, link: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Video URL (YouTube / Direct)" value={item.videoPreview} onChange={v => update({ ...item, videoPreview: v })} />
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Visibility</label>
                        <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2.5 border border-border">
                            <button type="button" onClick={() => update({ ...item, hidden: !item.hidden })}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${item.hidden ? 'bg-red-500/80' : 'bg-emerald-500'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${item.hidden ? 'translate-x-0' : 'translate-x-5'}`} />
                            </button>
                            <span className={`text-sm font-medium ${item.hidden ? 'text-red-400' : 'text-emerald-500'}`}>{item.hidden ? '🔴 Hidden' : '🟢 Visible'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="bg-secondary/30 rounded-xl border border-border overflow-hidden">
                <button type="button" onClick={() => setImagesExpanded(!imagesExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">🖼️ Achievement Images</span>
                        {item.images?.length > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{item.images.length} added</span>}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${imagesExpanded ? 'rotate-180' : ''}`} />
                </button>
                {imagesExpanded && (
                    <div className="p-4 pt-0 border-t border-border/50">
                        <MultiImageUpload
                            images={item.images}
                            onChange={async (imgs) => {
                                const coverChanged = imgs[0] && imgs[0] !== item.images[0];
                                update({ ...item, images: imgs });

                                if (imgs[0] && (coverChanged || !item.shareImage)) {
                                    try {
                                        const toastId = toast.loading('Generating branded social share poster...');
                                        const posterFile = await generateSharePoster(imgs[0], {
                                            type: 'achievement',
                                            title: item.en?.title || item.bn?.title || item.category || 'Achievement',
                                        });
                                        const uploaded = await uploadImage(posterFile, 'achievements', true);
                                        const shareUrl = typeof uploaded === 'object' ? (uploaded as any).primary : uploaded;
                                        update({ ...item, images: imgs, shareImage: shareUrl, seoCover: shareUrl });
                                        toast.success('Branded share poster generated!', { id: toastId });
                                    } catch (err) {
                                        console.warn('Achievement share poster warning:', err);
                                    }
                                }
                            }}
                            title=""
                        />
                    </div>
                )}
            </div>

            {/* Branded Social Share & SEO Banner (1200x630) */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">🖼️ Branded Social & SEO Share Banner (1200×630)</span>
                            {(item.seoCover || item.shareImage) ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                    ✓ Active Cover
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                                    ⚠️ Missing Cover
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Renders on WhatsApp, LinkedIn, Twitter, and social link previews with top-right ORBIT SaaS logo.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            const cover = item.images?.[0] || item.image;
                            if (!cover) {
                                toast.error('Please add or upload an achievement image first.');
                                return;
                            }
                            const toastId = toast.loading('Generating 1200×630 branded SEO cover...');
                            try {
                                const posterFile = await generateSharePoster(cover, {
                                    type: 'achievement',
                                    title: item.en?.title || item.bn?.title || item.category || 'Achievement',
                                });
                                const uploaded = await uploadImage(posterFile, 'achievements', true);
                                const url = typeof uploaded === 'object' ? (uploaded as any).primary : uploaded;
                                update({ ...item, shareImage: url, seoCover: url });
                                toast.success('Branded SEO share cover generated!', { id: toastId });
                            } catch (e: any) {
                                console.error(e);
                                toast.error(e.message || 'Failed to generate SEO cover', { id: toastId });
                            }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold border border-primary/30 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        {(item.seoCover || item.shareImage) ? 'Regenerate SEO Cover' : 'Auto-Generate SEO Cover'}
                    </button>
                </div>

                {(item.seoCover || item.shareImage) && (
                    <div className="relative rounded-lg overflow-hidden border border-border/80 bg-black/40 aspect-[1200/630] max-w-sm group">
                        <img
                            src={getImageUrl(item.seoCover || item.shareImage)}
                            alt="Social Share Banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                                href={getImageUrl(item.seoCover || item.shareImage)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium flex items-center gap-1"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> View Full Poster
                            </a>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white/90 font-mono">
                            1200 × 630 • Social Link Preview
                        </div>
                    </div>
                )}
            </div>

            <TagsInput tags={item.tags || []} onChange={t => update({ ...item, tags: t })} />

            {/* SEO */}
            <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                <button type="button" onClick={() => setSeoExpanded(!seoExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">🔍 SEO Settings</span>
                        {(item.seo?.title || item.seo?.keywords?.length > 0) && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">Configured</span>}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`} />
                </button>
                {seoExpanded && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-3">
                        <TextField label="Meta Title" value={item.seo?.title || ''} onChange={v => updateSeo('title', v)} />
                        <TextField label="Meta Description" value={item.seo?.description || ''} onChange={v => updateSeo('description', v)} multiline />
                        <TagsInput tags={item.seo?.keywords || []} onChange={t => updateSeo('keywords', t)} />
                    </div>
                )}
            </div>

            {/* Language Tabs */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="flex border-b border-border bg-secondary/30">
                    <button onClick={() => setTab('en')} className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'en' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground hover:text-foreground'}`}>🇬🇧 English</button>
                    <button onClick={() => setTab('bn')} className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'bn' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground hover:text-foreground'}`}>🇧🇩 বাংলা</button>
                </div>
                <div className="p-5 space-y-4">
                    <TextField label={`Title (${tab.toUpperCase()})`} value={item[tab]?.title || ''} onChange={v => updateLoc(tab, 'title', v)} lang={tab} />
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-foreground block">Description ({tab.toUpperCase()})</label>
                            <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border">
                                <button
                                    type="button"
                                    onClick={() => setDescPreview(false)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${!descPreview ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Edit3 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDescPreview(true)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${descPreview ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Eye className="w-3 h-3" /> Live Preview
                                </button>
                            </div>
                        </div>

                        {!descPreview ? (
                            <>
                                <RichTextEditor value={item[tab]?.description || ''} onChange={v => updateLoc(tab, 'description', v)} />
                                <p className="text-[11px] text-muted-foreground mt-1.5">
                                    💡 Tip: Press <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono border border-border">Enter</kbd> for paragraph breaks. Format bold headings, lists, and links as needed.
                                </p>
                            </>
                        ) : (
                            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-inner">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Formatted Visitor View Preview
                                </div>
                                <div 
                                    className="text-foreground text-sm sm:text-base leading-relaxed space-y-3 [&_h3]:font-bold [&_h3]:text-emerald-500 [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:mt-3 [&_b]:font-bold [&_strong]:font-bold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-emerald-500 [&_a]:underline font-normal"
                                    dangerouslySetInnerHTML={{ 
                                        __html: DOMPurify.sanitize(
                                            item[tab]?.description?.replace(/([.!?])([A-Z][a-zA-Z0-9\s]{2,30}:)/g, '$1\n\n$2') || '<span class="text-muted-foreground italic">No description entered yet.</span>'
                                        ) 
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Admin Page ---
export default function AdminAchievements() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('achievements');
    const [title, setTitle] = useState('Our Achievements');
    const [subtitle, setSubtitle] = useState('Milestones & Appreciations');
    const [items, setItems] = useState<UnifiedAchievement[]>([]);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    useEffect(() => {
        const d = getData();
        if (d) {
            setTitle(d.title || '');
            setSubtitle(d.subtitle || '');
            const rawItems = Array.isArray(d.items) ? d.items : [];
            setItems(rawItems.map((item: any, i: number) => ({
                ...DEFAULT_ACHIEVEMENT,
                id: item.id || '',
                order: item.order ?? i,
                images: item.images || (item.image ? [item.image] : []),
                shareImage: item.shareImage || item.seoCover || item.image || (item.images && item.images[0]) || '',
                seoCover: item.seoCover || item.shareImage || item.image || (item.images && item.images[0]) || '',
                link: item.link || '',
                category: item.category || '',
                date: item.date || '',
                featured: !!item.featured,
                hidden: !!item.hidden,
                videoPreview: item.videoPreview || '',
                tags: item.tags || [],
                seo: item.seo || { title: '', description: '', keywords: [] },
                en: { title: item.title || item.en?.title || '', description: item.desc || item.en?.description || '' },
                bn: { title: item.bn?.title || '', description: item.bn?.description || '' }
            })));
        }
    }, [getData]);

    const handleSave = async () => {
        // Flatten to storage format compatible with both admin and public site
        const payload = {
            title, subtitle,
            items: items.map((item, i) => ({
                id: item.id,
                title: item.en.title,
                desc: item.en.description,
                image: item.images[0] || '',
                shareImage: item.shareImage || item.seoCover || item.images[0] || '',
                seoCover: item.seoCover || item.shareImage || item.images[0] || '',
                images: item.images,
                category: item.category,
                date: item.date,
                link: item.link,
                videoPreview: item.videoPreview,
                tags: item.tags,
                featured: item.featured,
                hidden: item.hidden,
                order: item.order ?? i,
                seo: item.seo,
                en: item.en,
                bn: item.bn
            }))
        };
        await save(payload);
    };

    const addItem = () => {
        const id = `achievement-${Date.now()}`;
        setItems(prev => [...prev, { ...DEFAULT_ACHIEVEMENT, id, order: prev.length }]);
        setExpandedIdx(items.length);
    };

    const removeItem = (idx: number) => { setItems(prev => prev.filter((_, i) => i !== idx)); if (expandedIdx === idx) setExpandedIdx(null); };
    const moveItem = (idx: number, dir: -1 | 1) => {
        const newIdx = idx + dir; if (newIdx < 0 || newIdx >= items.length) return;
        setItems(prev => { const next = [...prev]; [next[idx], next[newIdx]] = [next[newIdx], next[idx]]; return next; });
        if (expandedIdx === idx) setExpandedIdx(newIdx);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Achievements Manager" description="Manage achievements with images, rich descriptions, SEO & social sharing" />
            </div>
            <ErrorAlert message={error} />

            {/* Section Header Fields */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">📝 Section Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Title" value={title} onChange={setTitle} lang={lang} />
                    <TextField label="Subtitle" value={subtitle} onChange={setSubtitle} lang={lang} />
                </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">🏆 Achievements ({items.length})</h3>
                    <button onClick={addItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-medium border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer">
                        <Plus className="w-4 h-4" /> Add Achievement
                    </button>
                </div>

                {items.map((item, idx) => (
                    <div key={idx} className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Collapsed Header */}
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                            <div className="flex items-center gap-3 min-w-0">
                                {item.images[0] && <img src={getImageUrl(item.images[0])} alt="" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />}
                                <div className="min-w-0">
                                    <span className="text-sm font-bold text-foreground block truncate">{item.en.title || `Achievement #${idx + 1}`}</span>
                                    <span className="text-[10px] text-muted-foreground">{item.category} {item.date ? `· ${item.date}` : ''} {item.hidden ? '· 🔴 Hidden' : ''}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={e => { e.stopPropagation(); moveItem(idx, -1); }} disabled={idx === 0} className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                <button onClick={e => { e.stopPropagation(); moveItem(idx, 1); }} disabled={idx === items.length - 1} className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                <button onClick={e => { e.stopPropagation(); removeItem(idx); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ml-1 ${expandedIdx === idx ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        {/* Expanded Editor */}
                        {expandedIdx === idx && (
                            <div className="border-t border-border p-5">
                                <AchievementEditor item={item} update={updated => setItems(prev => prev.map((it, i) => i === idx ? updated : it))} />
                            </div>
                        )}
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                        No achievements added yet. Click "Add Achievement" to create one.
                    </div>
                )}
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel title={`JSON Import / Export (${lang.toUpperCase()})`} data={{ title, subtitle, items }}
                    onImport={(parsed: any) => {
                        if (parsed.title) setTitle(parsed.title);
                        if (parsed.subtitle) setSubtitle(parsed.subtitle);
                        if (parsed.items && Array.isArray(parsed.items)) {
                            setItems(parsed.items.map((item: any, i: number) => ({
                                ...DEFAULT_ACHIEVEMENT,
                                ...item,
                                images: item.images || (item.image ? [item.image] : []),
                                shareImage: item.shareImage || item.seoCover || item.image || (item.images && item.images[0]) || '',
                                seoCover: item.seoCover || item.shareImage || item.image || (item.images && item.images[0]) || '',
                                en: item.en || { title: item.title || '', description: item.desc || '' },
                                bn: item.bn || { title: '', description: '' },
                                seo: item.seo || { title: '', description: '', keywords: [] },
                                order: item.order ?? i,
                            })));
                        }
                    }}
                />
            </div>
        </div>
    );
}
