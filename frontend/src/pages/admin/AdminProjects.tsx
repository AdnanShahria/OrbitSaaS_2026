import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader, SaveButton, TextField, ErrorAlert, ItemListEditor, LangToggle, JsonPanel, ToggleField } from '@/components/admin/EditorComponents';
import { Upload, Trash2, X, Plus, Layers, Settings2, ChevronDown, HelpCircle, Search, GripVertical, Link2, ArrowUp, ArrowDown } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { useContent } from '@/contexts/ContentContext';
import { uploadToImgBB } from '@/lib/imgbb';

// --- Shared Helper Components ---

function MultiImageUpload({ images, onChange, title }: { images: string[]; onChange: (imgs: string[]) => void; title: string; }) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleFiles = async (files: FileList) => {
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setUploading(true);
        const toastId = toast.loading(`Uploading ${imageFiles.length} images...`);

        try {
            // Upload sequentially to avoid aggressive rate limiting
            const newUrls: string[] = [];
            for (const file of imageFiles) {
                const url = await uploadToImgBB(file);
                newUrls.push(url);
            }

            onChange([...images, ...newUrls]);
            toast.success('Images uploaded successfully!', { id: toastId });
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Upload failed. Check Cloudinary settings.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        onChange(images.filter((_, i) => i !== idx));
    };

    const moveImage = (from: number, to: number) => {
        if (to < 0 || to >= images.length) return;
        const updated = [...images];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        onChange(updated);
    };

    const addImageUrl = () => {
        const url = imageUrl.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            toast.error('Please enter a valid URL starting with http:// or https://');
            return;
        }
        onChange([...images, url]);
        setImageUrl('');
        toast.success('Image URL added!');
    };

    // Scoped paste handler — only triggers when this specific container is focused
    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) imageFiles.push(blob);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setUploading(true);
            const toastId = toast.loading(`Uploading pasted image...`);
            try {
                const newUrls: string[] = [];
                for (const file of imageFiles) {
                    const url = await uploadToImgBB(file);
                    newUrls.push(url);
                }
                onChange([...images, ...newUrls]);
                toast.success('Image uploaded!', { id: toastId });
            } catch (err) {
                console.error(err);
                toast.error('Upload failed', { id: toastId });
            } finally {
                setUploading(false);
            }
        }
    }, [images, onChange]);


    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onPaste={handlePaste}
            className="outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 -m-1 transition-shadow"
        >
            <label className="text-sm font-medium text-foreground mb-1.5 block">
                {title} <span className="text-xs font-normal text-muted-foreground ml-2">({images.length} — first is cover)</span>
            </label>
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                    {images.map((img, i) => (
                        <div key={i} className={`relative rounded-lg overflow-hidden border group ${i === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                            <img src={img} alt="" className="w-full h-32 object-cover" />
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
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">{uploading ? 'Uploading...' : 'Click to Upload'}</span>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                </label>
                <div className="flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                                placeholder="Paste image URL..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addImageUrl}
                            disabled={!imageUrl.trim()}
                            className="px-3 py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Or click this area and press Ctrl+V to paste an image from clipboard</p>
                </div>
            </div>
        </div>
    );
}

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
    const [input, setInput] = useState('');
    const addTag = () => {
        if (input.trim() && !tags.includes(input.trim())) {
            onChange([...tags, input.trim()]);
            setInput('');
        }
    };
    return (
        <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {tag}
                        <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
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

// --- Unified Types ---

interface LocalizedContent {
    title: string;
    description: string;
    // tags moved to shared
    // seo moved to shared
}

interface SEOData {
    title: string;
    description: string;
    keywords: string[];
}

interface UnifiedProject {
    // Shared
    id: string; // Slug for URL (e.g. 'lifesolver')
    order: number; // Display order on homepage
    images: string[];
    hoverImages: number[]; // Indices into images[] to show on hover
    link: string;
    categories: string[];
    featured: boolean;
    hidden: boolean; // If true, project is hidden from public site
    videoPreview: string;
    tags: string[]; // Shared tags
    seo: SEOData; // Shared SEO
    // Localized
    en: LocalizedContent;
    bn: LocalizedContent;
    // Allow indexing for generic components
    [key: string]: any;
}

const DEFAULT_LOCALIZED: LocalizedContent = {
    title: '',
    description: ''
};

const DEFAULT_PROJECT: UnifiedProject = {
    id: '',
    order: 0,
    images: [],
    hoverImages: [],
    link: '',
    categories: ['SaaS'],
    featured: false,
    hidden: false,
    videoPreview: '',
    tags: [],
    seo: { title: '', description: '', keywords: [] },
    en: { ...DEFAULT_LOCALIZED },
    bn: { ...DEFAULT_LOCALIZED }
};

// --- Project Editor Component (Handles Tabs) ---

function ProjectEditor({ item, update, categories: availableCategories, onSave }: { item: UnifiedProject; update: (i: UnifiedProject) => void; categories: string[]; onSave?: () => void }) {
    const [tab, setTab] = useState<'en' | 'bn'>('en');
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [imagesExpanded, setImagesExpanded] = useState(false);
    const [seoExpanded, setSeoExpanded] = useState(false);
    const [seoHelpOpen, setSeoHelpOpen] = useState(false);
    const [htmlParserOpen, setHtmlParserOpen] = useState(false);
    const [jsonDescOpen, setJsonDescOpen] = useState(false);
    const [jsonDescHelp, setJsonDescHelp] = useState(false);
    const [jsonDescText, setJsonDescText] = useState('');
    const [jsonDescError, setJsonDescError] = useState('');

    const toggleSection = (index: number) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // Helper to update localized content
    const updateLoc = (lang: 'en' | 'bn', field: keyof LocalizedContent, value: any) => {
        update({
            ...item,
            [lang]: { ...item[lang], [field]: value }
        });
    };

    // Helper to update Shared SEO
    const updateSeo = (field: keyof SEOData, value: any) => {
        update({
            ...item,
            seo: { ...item.seo, [field]: value }
        });
    };

    return (
        <div className="space-y-6">
            {/* Shared Fields */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    🌍 Shared Settings (Applies to both languages)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Project ID (Slug for URL)" value={item.id || ''} onChange={v => update({ ...item, id: v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })} />
                    <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-sm font-medium text-foreground block">Categories</label>
                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-secondary rounded-lg border border-border min-h-[42px]">
                            {availableCategories.map(cat => {
                                const isSelected = (item.categories || []).includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            const current = item.categories || [];
                                            const updated = isSelected
                                                ? current.filter(c => c !== cat)
                                                : [...current, cat];
                                            update({ ...item, categories: updated.length > 0 ? updated : [cat] });
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isSelected
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Feature this project?</label>
                        <div className="flex items-center gap-2 bg-secondary rounded-lg px-4 py-2.5 border border-border">
                            <input
                                type="checkbox"
                                checked={!!item.featured}
                                onChange={e => update({ ...item, featured: e.target.checked })}
                                className="w-4 h-4 text-primary rounded"
                            />
                            <span className="text-sm">Active (Show at top)</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Visibility</label>
                        <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2.5 border border-border">
                            <button
                                type="button"
                                onClick={() => update({ ...item, hidden: !item.hidden })}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                    item.hidden ? 'bg-red-500/80' : 'bg-emerald-500'
                                }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                    item.hidden ? 'translate-x-0' : 'translate-x-5'
                                }`} />
                            </button>
                            <span className={`text-sm font-medium ${item.hidden ? 'text-red-400' : 'text-emerald-500'}`}>
                                {item.hidden ? '🔴 Hidden from users' : '🟢 Visible to users'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField label="Live Link" value={item.link || ''} onChange={v => update({ ...item, link: v })} />
                    <TextField label="Video URL (YouTube / Direct)" value={item.videoPreview || ''} onChange={v => update({ ...item, videoPreview: v })} />
                </div>
            </div>

            <div className="bg-secondary/30 rounded-xl border border-border overflow-hidden">
                <button
                    type="button"
                    onClick={() => setImagesExpanded(!imagesExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">🖼️ Project Images & Hover Preview</span>
                        {item.images?.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                                {item.images.length} added
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs font-medium">{imagesExpanded ? 'Collapse' : 'Expand'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${imagesExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {imagesExpanded && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-4">
                        <MultiImageUpload
                            images={item.images}
                            onChange={imgs => {
                                // Clean up hoverImages: remove any indices that are out of bounds
                                const validHover = (item.hoverImages || []).filter(idx => idx < imgs.length);
                                update({ ...item, images: imgs, hoverImages: validHover });
                            }}
                            title=""
                        />

                        {/* Hover Images Selector */}
                        {item.images.length > 1 && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    Hover Preview Images
                                    <span className="text-xs font-normal text-muted-foreground ml-2">
                                        (Click to toggle — selected images cycle on card hover every 2s)
                                    </span>
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {item.images.map((img, i) => {
                                        if (i === 0) return null; // Skip cover image
                                        const isSelected = (item.hoverImages || []).includes(i);
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    const current = item.hoverImages || [];
                                                    const updated = isSelected
                                                        ? current.filter(idx => idx !== i)
                                                        : [...current, i];
                                                    update({ ...item, hoverImages: updated });
                                                }}
                                                className={`relative rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                    ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                                                    : 'border-border/50 opacity-60 hover:opacity-100 hover:border-border'
                                                    }`}
                                            >
                                                <img src={img} alt="" className="w-full h-20 object-cover" />
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white">
                                                            {(item.hoverImages || []).indexOf(i) + 1}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5">
                                                    <span className="text-[9px] text-white/80 font-medium">
                                                        {isSelected ? 'Selected' : 'Click to add'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {(item.hoverImages || []).length > 0 && (
                                    <p className="text-[11px] text-muted-foreground mt-1.5">
                                        {(item.hoverImages || []).length} image{(item.hoverImages || []).length !== 1 ? 's' : ''} will cycle on hover
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <TagsInput
                tags={item.tags || []}
                onChange={t => update({ ...item, tags: t })}
            />

            {/* Shared SEO Section */}
            <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden mt-4">
                <button
                    type="button"
                    onClick={() => setSeoExpanded(!seoExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">🔍 Shared SEO Settings</span>
                        {(item.seo?.title || item.seo?.keywords?.length > 0) && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                                Configured
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs font-medium">{seoExpanded ? 'Collapse' : 'Expand'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {seoExpanded && (
                    <div className="p-4 pt-0 border-t border-border/50">
                        <div className="flex items-center justify-end mb-3">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setSeoHelpOpen(!seoHelpOpen)}
                                    className="p-1.5 rounded-lg bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Show SEO format guide"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="text-xs">Help</span>
                                </button>
                                {seoHelpOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[min(400px,calc(100vw-2rem))] p-4 rounded-xl bg-background border border-border shadow-2xl z-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-foreground">SEO Input Guide</h4>
                                            <button onClick={() => setSeoHelpOpen(false)} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
                                            <div>
                                                <p className="font-bold text-foreground mb-1">✏️ Manual Input:</p>
                                                <ul className="list-disc ml-4 space-y-1">
                                                    <li><strong>Meta Title</strong> — Under 60 characters. E.g: <code className="bg-secondary px-1 py-0.5 rounded text-primary">My Project | Orbit SaaS</code></li>
                                                    <li><strong>Meta Description</strong> — Under 160 characters. Summarize the project in 1-2 sentences.</li>
                                                    <li><strong>Keywords</strong> — Type a keyword and press Enter to add. Add 5-10 relevant terms.</li>
                                                </ul>
                                            </div>
                                            <div className="border-t border-border pt-3">
                                                <p className="font-bold text-foreground mb-1">📋 HTML Parser (Optional):</p>
                                                <p>Paste HTML meta tags into the textarea below and click <span className="text-primary font-bold">Analyze</span>. Supported tags:</p>
                                                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                                                    <li><code className="bg-secondary px-1 py-0.5 rounded">&lt;title&gt;...&lt;/title&gt;</code></li>
                                                    <li><code className="bg-secondary px-1 py-0.5 rounded">meta name="description"</code></li>
                                                    <li><code className="bg-secondary px-1 py-0.5 rounded">meta name="keywords"</code></li>
                                                </ul>
                                            </div>
                                            <div className="border-t border-border pt-3">
                                                <p className="font-bold text-foreground mb-1">🔎 Result Preview:</p>
                                                <pre className="bg-secondary/50 rounded-lg p-2 text-[10px] font-mono overflow-auto whitespace-pre">{`<title>Your Meta Title</title>
<meta name="description" content="Your description...">
<meta name="keywords" content="keyword1, keyword2, ...">`}</pre>
                                                <p className="text-primary font-medium mt-1">These tags appear in Google search results and social shares.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manual Input Fields — Primary */}
                        <div className="space-y-3 mb-4">
                            <TextField label="Meta Title" value={item.seo?.title || ''} onChange={v => updateSeo('title', v)} lang="en" />
                            <TextField label="Meta Description" value={item.seo?.description || ''} onChange={v => updateSeo('description', v)} multiline lang="en" />
                            <TagsInput tags={item.seo?.keywords || []} onChange={t => updateSeo('keywords', t)} />
                        </div>

                        {/* HTML Parser — Optional, Collapsible */}
                        <div className="rounded-lg border border-border/50 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setHtmlParserOpen(!htmlParserOpen)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/30 transition-colors cursor-pointer text-left"
                            >
                                <span className="text-xs font-medium text-muted-foreground">📋 Import from HTML <span className="text-[10px] opacity-60">(optional)</span></span>
                                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${htmlParserOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {htmlParserOpen && (
                                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                                    <p className="text-[10px] text-muted-foreground mb-2">Paste HTML meta tags and click Analyze to auto-fill the fields above.</p>
                                    <div className="flex gap-2">
                                        <textarea
                                            id="seo-html-input"
                                            className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground border border-border/50 outline-none resize-y"
                                            rows={3}
                                            placeholder={'<title>My Project</title>\n<meta name="description" content="...">\n<meta name="keywords" content="a, b, c">'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.getElementById('seo-html-input') as HTMLTextAreaElement;
                                                const val = input?.value || '';
                                                if (!val.trim()) {
                                                    toast.error('Please paste some HTML meta tags first');
                                                    return;
                                                }

                                                const titleMatch = val.match(/<title>(.*?)<\/title>/i) || val.match(/meta\s+name=["']title["']\s+content=["'](.*?)["']/i);
                                                const descMatch = val.match(/meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || val.match(/meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
                                                const keyMatch = val.match(/meta\s+name=["']keywords["']\s+content=["'](.*?)["']/i);

                                                const title = titleMatch ? titleMatch[1] : '';
                                                const description = descMatch ? descMatch[1] : '';
                                                const keywords = keyMatch ? keyMatch[1].split(',').map(s => s.trim()) : [];

                                                if (title || description || keywords.length > 0) {
                                                    update({
                                                        ...item,
                                                        seo: {
                                                            title: title || item.seo.title,
                                                            description: description || item.seo.description,
                                                            keywords: keywords.length > 0 ? keywords : item.seo.keywords
                                                        }
                                                    });
                                                    toast.success('SEO tags analyzed and applied!');
                                                    input.value = '';
                                                } else {
                                                    toast.error('Could not detect valid SEO tags. Check your HTML format.');
                                                }
                                            }}
                                            className="px-4 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-1 group whitespace-nowrap"
                                        >
                                            <Search className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Analyze</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* JSON Description Import */}
            {
                (() => {

                    const joinParagraphs = (paras: { heading: string; body: string; color: string }[]) => {
                        return paras.map(p => {
                            if (!p.heading?.trim()) return p.body || '<p><br></p>';
                            const colorAttr = p.color ? ` data-color="${p.color}"` : '';
                            return `<h3${colorAttr}>${p.heading.trim()}</h3>` + (p.body || '<p><br></p>');
                        }).join('<hr>');
                    };

                    const handleParse = () => {
                        setJsonDescError('');
                        try {
                            const parsed = JSON.parse(jsonDescText);

                            // Support both formats:
                            // Format 1: { "en": [...], "bn": [...] }
                            // Format 2: { "en": { "title": "...", "sections": [...] }, "bn": { ... } }
                            const getTitle = (langObj: any) => {
                                if (typeof langObj?.title === 'string') return langObj.title;
                                return null;
                            };

                            const getSections = (langObj: any) => {
                                if (Array.isArray(langObj)) return langObj;
                                if (Array.isArray(langObj?.sections)) return langObj.sections;
                                return null;
                            };

                            const enSections = getSections(parsed.en);
                            const bnSections = getSections(parsed.bn);

                            if (!enSections && !bnSections) {
                                setJsonDescError('JSON must have "en" and/or "bn" with sections array. Click (?) for format.');
                                return;
                            }

                            let updatedItem = { ...item };

                            // Update EN title + description
                            if (enSections) {
                                const enTitle = getTitle(parsed.en);
                                const enParas = enSections.map((s: any) => ({
                                    heading: s.title || '',
                                    body: typeof s.description === 'string' ? (s.description.startsWith('<') ? s.description : `<p>${s.description}</p>`) : '<p><br></p>',
                                    color: ''
                                }));
                                updatedItem = {
                                    ...updatedItem,
                                    en: {
                                        ...updatedItem.en,
                                        ...(enTitle ? { title: enTitle } : {}),
                                        description: joinParagraphs(enParas)
                                    }
                                };
                            }

                            // Update BN title + description
                            if (bnSections) {
                                const bnTitle = getTitle(parsed.bn);
                                const bnParas = bnSections.map((s: any) => ({
                                    heading: s.title || '',
                                    body: typeof s.description === 'string' ? (s.description.startsWith('<') ? s.description : `<p>${s.description}</p>`) : '<p><br></p>',
                                    color: ''
                                }));
                                updatedItem = {
                                    ...updatedItem,
                                    bn: {
                                        ...updatedItem.bn,
                                        ...(bnTitle ? { title: bnTitle } : {}),
                                        description: joinParagraphs(bnParas)
                                    }
                                };
                            }

                            update(updatedItem);
                            toast.success(`Description imported! ${enSections ? enSections.length + ' EN' : ''}${enSections && bnSections ? ' + ' : ''}${bnSections ? bnSections.length + ' BN' : ''} sections. Click "Save Changes" to persist.`);
                            setJsonDescText('');
                            setJsonDescOpen(false);
                        } catch (err: any) {
                            setJsonDescError(`Invalid JSON: ${err.message}`);
                        }
                    };

                    return (
                        <div className="bg-background rounded-xl border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setJsonDescOpen(!jsonDescOpen)}
                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Layers className="w-4.5 h-4.5 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">📋 JSON Description Import</span>
                                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">EN + BN</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${jsonDescOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {jsonDescOpen && (
                                <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Paste a JSON object with <code className="bg-secondary px-1 py-0.5 rounded text-primary">"en"</code> and <code className="bg-secondary px-1 py-0.5 rounded text-primary">"bn"</code> keys containing section <code className="bg-secondary px-1 py-0.5 rounded text-primary">title</code> and <code className="bg-secondary px-1 py-0.5 rounded text-primary">description</code> to import for both languages at once.
                                        </p>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setJsonDescHelp(!jsonDescHelp)}
                                                className="p-1.5 rounded-lg bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                                title="Show format guide"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                            </button>
                                            {jsonDescHelp && (
                                                <div className="absolute right-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] p-4 rounded-xl bg-background border border-border shadow-2xl z-50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-bold text-foreground">JSON Format Guide</h4>
                                                        <button onClick={() => setJsonDescHelp(false)} className="text-muted-foreground hover:text-foreground">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <pre className="text-[11px] font-mono text-muted-foreground bg-secondary/50 rounded-lg p-3 overflow-auto max-h-[320px] leading-relaxed whitespace-pre">{`{
  "en": {
    "title": "Project Title (optional)",
    "sections": [
      {
        "title": "Section Title",
        "description": "Section description text"
      },
      {
        "title": "Another Section",
        "description": "More details here"
      }
    ]
  },
  "bn": {
    "title": "প্রজেক্টের নাম (ঐচ্ছিক)",
    "sections": [
      {
        "title": "সেকশনের শিরোনাম",
        "description": "সেকশনের বিবরণ"
      }
    ]
  }
}`}</pre>
                                                    <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                                                        <p>• <strong>title</strong> (in sections) — Section heading displayed as a card title</p>
                                                        <p>• <strong>description</strong> — Section body text (plain text or HTML)</p>
                                                        <p>• <strong>title</strong> (top-level) — Sets the project title (optional)</p>
                                                        <p className="text-primary font-medium">Each section becomes a description card on the project page.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <textarea
                                        value={jsonDescText}
                                        onChange={e => { setJsonDescText(e.target.value); setJsonDescError(''); }}
                                        placeholder='{ "en": { "title": "...", "sections": [{ "title": "...", "description": "..." }] }, "bn": { ... } }'
                                        rows={8}
                                        className="w-full rounded-lg bg-secondary border border-border p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                                        spellCheck={false}
                                    />

                                    {jsonDescError && (
                                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                                            <span>⚠️ {jsonDescError}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleParse}
                                            disabled={!jsonDescText.trim()}
                                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            Import Description
                                        </button>
                                        <span className="text-[10px] text-muted-foreground">Both EN + BN will be populated. Click "Save Changes" after.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()
            }

            {/* Language Tabs */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="flex border-b border-border bg-secondary/30">
                    <button
                        onClick={() => setTab('en')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'en' ? 'bg-background border-t-2 border-t-primary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        English Texts
                    </button>
                    <button
                        onClick={() => setTab('bn')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'bn' ? 'bg-background border-t-2 border-t-primary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        বাংলা টেক্সট (Bangla Texts)
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <TextField
                        label={tab === 'en' ? "Project Title" : "প্রজেক্টের নাম"}
                        value={item[tab].title}
                        onChange={v => updateLoc(tab, 'title', v)}
                        lang={tab}
                    />

                    {/* Multi-Paragraph Description Editor */}
                    {(() => {
                        // Parse existing description into paragraph blocks: split by <h3>
                        const rawDesc = item[tab].description || '';
                        const parseParagraphs = (html: string): { heading: string; body: string; color: string }[] => {
                            if (!html.trim()) return [{ heading: '', body: '', color: '' }];
                            // First split by <hr>, then further split by <h3> within each part
                            const hrParts = html.split(/<hr\s*\/?>/i).filter(p => p.trim());
                            if (hrParts.length === 0) return [{ heading: '', body: html, color: '' }];
                            const result: { heading: string; body: string; color: string }[] = [];
                            for (const hrPart of hrParts) {
                                // Check if this part starts with <h3>
                                const h3Parts = hrPart.split(/(?=<h3[^>]*>)/i).filter(p => p.trim());
                                for (const part of h3Parts) {
                                    const headingMatch = part.match(/^<h3([^>]*)>(.*?)<\/h3>/i);
                                    if (headingMatch) {
                                        const attrs = headingMatch[1];
                                        const colorMatch = attrs.match(/data-color="([^"]*)"/i);
                                        result.push({
                                            heading: headingMatch[2].replace(/<[^>]*>/g, '').trim(),
                                            body: part.replace(/^<h3[^>]*>.*?<\/h3>/i, '').trim(),
                                            color: colorMatch ? colorMatch[1] : ''
                                        });
                                    } else {
                                        result.push({ heading: '', body: part.trim(), color: '' });
                                    }
                                }
                            }
                            return result.length > 0 ? result : [{ heading: '', body: html, color: '' }];
                        };

                        const paragraphs = parseParagraphs(rawDesc);

                        // Join paragraphs back into a single HTML string using <hr> separator
                        const joinParagraphs = (paras: { heading: string; body: string; color: string }[]) => {
                            return paras.map(p => {
                                if (!p.heading.trim()) return p.body || '<p><br></p>';
                                const colorAttr = p.color ? ` data-color="${p.color}"` : '';
                                return `<h3${colorAttr}>${p.heading.trim()}</h3>` + (p.body || '<p><br></p>');
                            }).join('<hr>');
                        };

                        const updateParagraphs = (newParas: { heading: string; body: string; color: string }[]) => {
                            updateLoc(tab, 'description', joinParagraphs(newParas));
                        };

                        return (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground block">
                                    {tab === 'en' ? 'Description Paragraphs' : 'বিবরণ অনুচ্ছেদ'}
                                    <span className="text-xs text-muted-foreground ml-2">({paragraphs.length} sections — each becomes a card)</span>
                                </label>
                                {paragraphs.map((para, pi) => {
                                    const isCollapsed = !expandedSections.has(pi);
                                    return (
                                        <div key={pi} className="rounded-xl border border-border bg-secondary/30 overflow-hidden relative group">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                                                onClick={() => toggleSection(pi)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                                    {para.color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: para.color }} />}
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                        Section {pi + 1}
                                                    </span>
                                                    {isCollapsed && para.heading && (
                                                        <span className="text-xs text-foreground/60 ml-1 truncate max-w-[200px]">
                                                            — {para.heading}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    {pi > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = [...paragraphs];
                                                                [updated[pi - 1], updated[pi]] = [updated[pi], updated[pi - 1]];
                                                                updateParagraphs(updated);
                                                            }}
                                                            className="p-1 rounded bg-secondary hover:bg-primary/20 text-xs"
                                                            title="Move up"
                                                        >↑</button>
                                                    )}
                                                    {pi < paragraphs.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = [...paragraphs];
                                                                [updated[pi], updated[pi + 1]] = [updated[pi + 1], updated[pi]];
                                                                updateParagraphs(updated);
                                                            }}
                                                            className="p-1 rounded bg-secondary hover:bg-primary/20 text-xs"
                                                            title="Move down"
                                                        >↓</button>
                                                    )}
                                                    {paragraphs.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = paragraphs.filter((_, j) => j !== pi);
                                                                updateParagraphs(updated);
                                                            }}
                                                            className="p-1 rounded bg-secondary hover:bg-red-500/20 hover:text-red-400 text-muted-foreground"
                                                            title="Remove section"
                                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                                    )}
                                                    {onSave && (
                                                        <button
                                                            type="button"
                                                            onClick={onSave}
                                                            className="p-1 px-2 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold uppercase transition-all"
                                                            title="Save changes"
                                                        >Save</button>
                                                    )}
                                                </div>
                                            </div>
                                            {!isCollapsed && (
                                                <div className="px-4 pb-4 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder={tab === 'en' ? "Section heading (optional, e.g. 'How We Solved the Problem')" : "শিরোনাম (ঐচ্ছিক)"}
                                                            value={para.heading}
                                                            onChange={e => {
                                                                const updated = [...paragraphs];
                                                                updated[pi] = { ...updated[pi], heading: e.target.value };
                                                                updateParagraphs(updated);
                                                            }}
                                                            className="flex-1 bg-background rounded-lg px-4 py-2.5 text-sm text-foreground font-semibold outline-none border border-border placeholder:font-normal placeholder:text-muted-foreground"
                                                        />
                                                        <div className="relative flex items-center gap-1.5">
                                                            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors" title="Title color">
                                                                <span
                                                                    className="w-5 h-5 rounded-full border border-border/50 flex-shrink-0"
                                                                    style={{ backgroundColor: para.color || '#ffffff' }}
                                                                />
                                                                <input
                                                                    type="color"
                                                                    value={para.color || '#ffffff'}
                                                                    onChange={e => {
                                                                        const updated = [...paragraphs];
                                                                        updated[pi] = { ...updated[pi], color: e.target.value };
                                                                        updateParagraphs(updated);
                                                                    }}
                                                                    className="sr-only"
                                                                />
                                                            </label>
                                                            {para.color && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...paragraphs];
                                                                        updated[pi] = { ...updated[pi], color: '' };
                                                                        updateParagraphs(updated);
                                                                    }}
                                                                    className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                                                                    title="Reset color"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <RichTextEditor
                                                        label=""
                                                        value={para.body}
                                                        onChange={v => {
                                                            const updated = [...paragraphs];
                                                            updated[pi] = { ...updated[pi], body: v };
                                                            updateParagraphs(updated);
                                                        }}
                                                        lang={tab}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => updateParagraphs([...paragraphs, { heading: '', body: '', color: '' }])}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Paragraph Section
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div >
    );
}


export default function AdminProjects() {
    const { content, updateSection, refreshContent, loading: contentLoading } = useContent();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<UnifiedProject[]>([]);
    const [sectionInfo, setSectionInfo] = useState({
        en: { title: '', subtitle: '' },
        bn: { title: '', subtitle: '' },
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    // Load and Merge Data on Mount
    useEffect(() => {
        if (!content.en || !content.bn) return;

        const enP = (content.en.projects as any) || { items: [] };
        const bnP = (content.bn.projects as any) || { items: [], categories: [] };

        setIsVisible(enP.visible !== false); // Default to true if not specified
        setCategories(enP.categories || []);

        setSectionInfo({
            en: { title: enP.title || '', subtitle: enP.subtitle || '' },
            bn: { title: bnP.title || '', subtitle: bnP.subtitle || '' }
        });

        const storedCategories = enP.categories || ['SaaS', 'eCommerce', 'Enterprise', 'Education', 'Portfolio', 'Other'];
        setCategories(storedCategories);
        // Merge English and Bangla content
    }, [content]);

    useEffect(() => {
        // If context is still loading, wait.
        if (contentLoading) return;

        // If context is done but data is missing, we should still stop "local" loading to show empty state.
        if (!content.en || !content.bn) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const enItems = (content.en.projects as any)?.items || [];
        const bnItems = (content.bn.projects as any)?.items || [];

        const maxLength = Math.max(enItems.length, bnItems.length);
        const merged: UnifiedProject[] = [];

        for (let i = 0; i < maxLength; i++) {
            const enItem = enItems[i] || {};
            const bnItem = bnItems[i] || {};

            // Prefer shared settings from EN (or BN if EN missing)
            const sharedImages = enItem.images || enItem.image ? (enItem.images || [enItem.image]) : (bnItem.images || (bnItem.image ? [bnItem.image] : []));
            const sharedSeo = enItem.seo || bnItem.seo || { title: '', description: '', keywords: [] };
            // Shared tags: prefer EN, then BN, then empty
            const sharedTags = enItem.tags || bnItem.tags || [];

            // Auto-migrate: category (string) → categories (array)
            const rawCats = enItem.categories || bnItem.categories || (enItem.category ? [enItem.category] : (bnItem.category ? [bnItem.category] : ['SaaS']));
            const sharedCategories = Array.isArray(rawCats) ? rawCats : [rawCats];

            merged.push({
                // Shared
                id: enItem.id || bnItem.id || '',
                order: enItem.order ?? bnItem.order ?? i,
                images: sharedImages,
                hoverImages: enItem.hoverImages || bnItem.hoverImages || [],
                link: enItem.link || bnItem.link || '',
                categories: sharedCategories,
                featured: enItem.featured ?? bnItem.featured ?? false,
                hidden: enItem.hidden ?? bnItem.hidden ?? false,
                videoPreview: enItem.videoPreview || bnItem.videoPreview || '',
                tags: sharedTags,
                seo: sharedSeo,

                // Localized
                en: {
                    title: enItem.title || '',
                    description: enItem.desc || '',
                },
                bn: {
                    title: bnItem.title || '',
                    description: bnItem.desc || '',
                }
            });
        }

        // Sort by order before setting so admin list matches user-facing order
        merged.sort((a, b) => a.order - b.order);
        setProjects(merged);
        setLoading(false);
    }, [content, contentLoading]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        const toastId = toast.loading('Saving projects...');

        try {
            // 1. Construct EN payload
            const enItems = projects.map(p => ({
                title: p.en.title,
                desc: p.en.description,
                tags: p.tags,
                seo: p.seo,
                id: p.id,
                order: p.order,
                images: p.images,
                hoverImages: p.hoverImages || [],
                image: p.images[0] || '',
                link: p.link,
                categories: p.categories,
                category: p.categories[0] || 'SaaS',
                featured: p.featured,
                hidden: p.hidden || false,
                videoPreview: p.videoPreview
            }));

            // 2. Construct BN payload
            const bnItems = projects.map(p => ({
                title: p.bn.title,
                desc: p.bn.description,
                tags: p.tags,
                seo: p.seo,
                id: p.id,
                order: p.order,
                images: p.images,
                hoverImages: p.hoverImages || [],
                image: p.images[0] || '',
                link: p.link,
                categories: p.categories,
                category: p.categories[0] || 'SaaS',
                featured: p.featured,
                hidden: p.hidden || false,
                videoPreview: p.videoPreview
            }));

            // 3. Save both
            const enSuccess = await updateSection('projects', 'en', {
                title: sectionInfo.en.title,
                subtitle: sectionInfo.en.subtitle,
                categories: categories,
                items: enItems,
                visible: isVisible,
            });
            const bnSuccess = await updateSection('projects', 'bn', {
                title: sectionInfo.bn.title,
                subtitle: sectionInfo.bn.subtitle,
                items: bnItems,
                visible: isVisible,
            });

            if (enSuccess && bnSuccess) {
                setSaved(true);
                toast.success('Projects saved successfully', { id: toastId });
                window.dispatchEvent(new CustomEvent('orbit:save-success', { detail: { section: 'projects' } }));

                // Refresh content to ensure context is in sync
                await refreshContent();

                setTimeout(() => setSaved(false), 2000);
            } else {
                setError('Error saving projects. Please try again.');
                toast.error('Error saving projects', { id: toastId });
            }

        } catch (err) {
            console.error(err);
            setError('Failed to save projects. Please try again.');
            toast.error('Failed to save projects', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-40 rounded-2xl" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col gap-4 p-6 bg-card border border-border rounded-xl">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Skeleton className="h-32 rounded-lg" />
                                <Skeleton className="h-32 rounded-lg" />
                                <Skeleton className="h-32 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Projects Manager (Unified)" description="Manage English and Bangla content in one place." />
                <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    ✅ Dual-Language Mode Active
                </div>
            </div>

            <ErrorAlert message={error} />

            {/* Global Settings */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Global Portfolio Settings
                </h3>
                <div className="max-w-md">
                    <ToggleField 
                        label="Show Portfolio on Main Page" 
                        description="If disabled, the entire projects section will be hidden from the public site."
                        checked={isVisible}
                        onChange={setIsVisible}
                    />
                </div>
            </div>

            {/* Edit Section Title/Subtitle */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <SectionHeader title="Section Title & Options" description="Configure English and Bangla titles and edit Categories for this section." />
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> English Context
                            </h3>
                            <TextField label="Section Title" value={sectionInfo.en.title} onChange={(v) => setSectionInfo(prev => ({ ...prev, en: { ...prev.en, title: v } }))} />
                            <TextField label="Section Subtitle" value={sectionInfo.en.subtitle} onChange={(v) => setSectionInfo(prev => ({ ...prev, en: { ...prev.en, subtitle: v } }))} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Bangla Context
                            </h3>
                            <TextField label="Section Title (BN)" value={sectionInfo.bn.title} onChange={(v) => setSectionInfo(prev => ({ ...prev, bn: { ...prev.bn, title: v } }))} />
                            <TextField label="Section Subtitle (BN)" value={sectionInfo.bn.subtitle} onChange={(v) => setSectionInfo(prev => ({ ...prev, bn: { ...prev.bn, subtitle: v } }))} />
                        </div>

                        {/* Manage Categories Section */}
                        <div className="space-y-4 lg:pl-6 lg:border-l lg:border-border">
                            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> Manage Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <span key={cat} className="inline-flex items-center gap-1.5 bg-secondary text-foreground text-xs font-medium px-3 py-1.5 rounded-full border border-border/50">
                                        {cat}
                                        <button
                                            type="button"
                                            onClick={() => setCategories(categories.filter(c => c !== cat))}
                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 w-full pt-1">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newCategory.trim() && !categories.includes(newCategory.trim())) {
                                            setCategories([...categories, newCategory.trim()]);
                                            setNewCategory('');
                                        }
                                    }}
                                    placeholder="Add new category..."
                                    className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm text-foreground outline-none border border-border min-w-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                                            setCategories([...categories, newCategory.trim()]);
                                            setNewCategory('');
                                        }
                                    }}
                                    className="bg-primary/20 text-primary hover:bg-primary/30 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">Categories appear as filters on the frontend and in project editors.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reorder Projects Section */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-primary" /> Reorder Projects
                    </h3>
                    <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                        Drag or click buttons to reorder
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projects.map((p, i) => (
                        <div key={p.id || i} className={`flex flex-col rounded-lg overflow-hidden border group transition-all ${
                            p.hidden 
                                ? 'bg-red-500/5 border-red-500/20 opacity-60' 
                                : 'bg-secondary/50 border-border'
                        }`}>
                            <div className="flex items-center p-2 gap-3 pb-1">
                                <span className="text-sm font-bold text-muted-foreground w-5 text-center flex-shrink-0">{i + 1}</span>
                                {p.images && p.images[0] ? (
                                    <div className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-background border ${p.hidden ? 'border-red-500/30 grayscale' : 'border-border'}`}>
                                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded flex-shrink-0 bg-background border border-border flex flex-col items-center justify-center text-[8px] text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-sm font-semibold truncate ${p.hidden ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{p.en.title || p.bn.title || 'Untitled Project'}</h4>
                                        {p.hidden && (
                                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-bold uppercase tracking-wider">Hidden</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border truncate max-w-full inline-block mt-0.5">
                                        {p.categories.join(', ')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (i === 0) return;
                                            const updated = [...projects];
                                            [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                                            // Update explicit order property to match new array index
                                            const synced = updated.map((proj, idx) => ({ ...proj, order: idx }));
                                            setProjects(synced);
                                        }}
                                        disabled={i === 0}
                                        className="p-1.5 bg-background rounded border border-border hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border transition-colors cursor-pointer"
                                        title="Move Up"
                                    >
                                        <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (i === projects.length - 1) return;
                                            const updated = [...projects];
                                            [updated[i + 1], updated[i]] = [updated[i], updated[i + 1]];
                                            // Update explicit order property to match new array index
                                            const synced = updated.map((proj, idx) => ({ ...proj, order: idx }));
                                            setProjects(synced);
                                        }}
                                        disabled={i === projects.length - 1}
                                        className="p-1.5 bg-background rounded border border-border hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border transition-colors cursor-pointer"
                                        title="Move Down"
                                    >
                                        <ArrowDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic flex items-center justify-center gap-1.5">
                    Changes require clicking <strong>Save Changes</strong> at the bottom of the page.
                </p>
            </div>

            {/* Projects List */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Projects Content Editor ({projects.length})</h3>
                </div>

                <ItemListEditor
                    items={projects}
                    setItems={(reordered) => {
                        // Sync the order field with the new array position
                        const synced = reordered.map((p, i) => ({ ...p, order: i }));
                        setProjects(synced);
                    }}
                    newItem={DEFAULT_PROJECT}
                    addLabel="Add New Project"
                    getItemLabel={(item) => item.en.title || item.bn.title || ''}
                    onSave={handleSave}
                    renderItem={(item, _i, update) => (
                        <ProjectEditor item={item} update={update} categories={categories} onSave={handleSave} />
                    )}
                />
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    data={{
                        en: {
                            title: sectionInfo.en.title,
                            subtitle: sectionInfo.en.subtitle,
                            items: projects.map(p => ({
                                title: p.en.title,
                                desc: p.en.description,
                                tags: p.tags,
                                seo: p.seo,
                                id: p.id,
                                order: p.order,
                                images: p.images,
                                link: p.link,
                                categories: p.categories,
                                category: p.categories[0] || 'SaaS',
                                featured: p.featured,
                                videoPreview: p.videoPreview
                            }))
                        },
                        bn: {
                            title: sectionInfo.bn.title,
                            subtitle: sectionInfo.bn.subtitle,
                            items: projects.map(p => ({
                                title: p.bn.title,
                                desc: p.bn.description,
                                tags: p.tags,
                                seo: p.seo,
                                id: p.id,
                                order: p.order,
                                images: p.images,
                                link: p.link,
                                categories: p.categories,
                                category: p.categories[0] || 'SaaS',
                                featured: p.featured,
                                videoPreview: p.videoPreview
                            }))
                        }
                    }}
                    onImport={(parsed) => {
                        if (!parsed.en || !parsed.bn) {
                            toast.error('JSON must have "en" and "bn" keys');
                            return;
                        }
                        setSectionInfo({
                            en: { title: parsed.en.title || '', subtitle: parsed.en.subtitle || '' },
                            bn: { title: parsed.bn.title || '', subtitle: parsed.bn.subtitle || '' }
                        });
                        const enItems = parsed.en.items || [];
                        const bnItems = parsed.bn.items || [];
                        const maxLen = Math.max(enItems.length, bnItems.length);
                        const merged: UnifiedProject[] = [];
                        for (let i = 0; i < maxLen; i++) {
                            const en = enItems[i] || {};
                            const bn = bnItems[i] || {};
                            const importCats = en.categories || bn.categories || (en.category ? [en.category] : (bn.category ? [bn.category] : ['SaaS']));
                            merged.push({
                                id: en.id || bn.id || '',
                                order: en.order ?? bn.order ?? i,
                                images: en.images || bn.images || [],
                                hoverImages: en.hoverImages || bn.hoverImages || [],
                                link: en.link || bn.link || '',
                                categories: Array.isArray(importCats) ? importCats : [importCats],
                                featured: en.featured ?? bn.featured ?? false,
                                hidden: en.hidden ?? bn.hidden ?? false,
                                videoPreview: en.videoPreview || bn.videoPreview || '',
                                tags: en.tags || bn.tags || [],
                                seo: en.seo || bn.seo || { title: '', description: '', keywords: [] },
                                en: {
                                    title: en.title || '',
                                    description: en.desc || ''
                                },
                                bn: {
                                    title: bn.title || '',
                                    description: bn.desc || ''
                                }
                            });
                        }
                        setProjects(merged);
                    }}
                />
            </div>
        </div>
    );
}
