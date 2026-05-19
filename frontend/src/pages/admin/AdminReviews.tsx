import { useState, useEffect } from 'react';
import { SectionHeader, LangToggle, SaveButton, TextField, ToggleField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';
import { Star, Plus, Trash2, ChevronUp, ChevronDown, Mail, MessageCircle, ShoppingBag, Briefcase, Globe, AtSign, Hash, Instagram, Facebook, Twitter, Linkedin, Github } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

interface ReviewItem {
    name: string;
    role: string;
    avatar: string;
    rating: number;
    text: string;
    projectId: string;
    projectName: string;
    badgeName: string;
    hidden: boolean;
    social?: {
        google?: { url: string; enabled: boolean };
        whatsapp?: { url: string; enabled: boolean };
        instagram?: { url: string; enabled: boolean };
        facebook?: { url: string; enabled: boolean };
        threads?: { url: string; enabled: boolean };
        twitter?: { url: string; enabled: boolean };
        fiverr?: { url: string; enabled: boolean };
        upwork?: { url: string; enabled: boolean };
        linkedin?: { url: string; enabled: boolean };
        github?: { url: string; enabled: boolean };
    };
}

const emptyReview: ReviewItem = { 
    name: '', 
    role: '', 
    avatar: '', 
    rating: 5, 
    text: '', 
    projectId: '', 
    projectName: '', 
    badgeName: '', 
    hidden: false,
    social: {} 
};

export default function AdminReviews() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('reviews');
    const { content } = useContent();

    const [title, setTitle] = useState('Client Reviews');
    const [subtitle, setSubtitle] = useState('What our clients say about working with us');
    const [items, setItems] = useState<ReviewItem[]>([]);
    const [showSocials, setShowSocials] = useState(true);

    // Get project list for dropdown
    const enProjects = (content.en as any).projects;
    const projectItems: any[] = Array.isArray(enProjects?.items) ? enProjects.items : [];

    useEffect(() => {
        const d = getData();
        if (d) {
            const rawItems = Array.isArray(d) ? d : (d.items || []);
            setShowSocials(d.showSocials ?? true);
            
            setItems(rawItems.map((item: any) => ({
                name: item.name || '',
                role: item.role || '',
                avatar: item.avatar || '',
                rating: item.rating ?? 5,
                text: item.text || '',
                projectId: item.projectId || '',
                projectName: item.projectName || '',
                badgeName: item.badgeName || '',
                hidden: item.hidden ?? false,
                social: item.social ? Object.fromEntries(
                    Object.entries(item.social).map(([k, v]) => [
                        k,
                        typeof v === 'string' ? { url: v, enabled: true } : (v as any)
                    ])
                ) : { ...emptyReview.social },
            })));
        }
    }, [getData]);

    const handleSave = async () => {
        await save({
            title,
            subtitle,
            items,
            showSocials
        });
    };

    const updateItem = (idx: number, field: keyof ReviewItem, value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            // Auto-fill project name from dropdown
            if (field === 'projectId' && typeof value === 'string') {
                const proj = projectItems.find((p: any) => (p.id || '') === value);
                if (proj) {
                    updated.projectName = proj.title || '';
                    // Auto-fill badge name only if empty
                    if (!updated.badgeName) updated.badgeName = proj.title || '';
                }
            }
            return updated;
        }));
    };

    const addItem = () => setItems(prev => [...prev, { ...emptyReview }]);
    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const moveItem = (idx: number, dir: -1 | 1) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= items.length) return;
        setItems(prev => {
            const next = [...prev];
            [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
            return next;
        });
    };

    const updateSocial = (idx: number, platform: string, field: 'url' | 'enabled', value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const currentSocial = item.social?.[platform as keyof NonNullable<ReviewItem['social']>] || { url: '', enabled: false };
            const normalized = typeof currentSocial === 'string' ? { url: currentSocial, enabled: true } : currentSocial;
            return {
                ...item,
                social: {
                    ...item.social,
                    [platform]: {
                        ...normalized,
                        [field]: value
                    }
                }
            };
        }));
    };

    const ReviewSocialField = ({ idx, label, platform, icon: Icon }: { idx: number, label: string, platform: string, icon?: any }) => {
        const item = items[idx].social?.[platform as keyof NonNullable<ReviewItem['social']>] || { url: '', enabled: false };
        return (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/10 border border-border/30 group/socket transition-all hover:bg-secondary/20 hover:border-primary/30">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className="w-3 h-3 text-muted-foreground group-hover/socket:text-primary transition-colors" />}
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/socket:text-foreground">{label}</span>
                </div>
                <button
                    type="button"
                    onClick={() => updateSocial(idx, platform, 'enabled', !item.enabled)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${item.enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
            </div>
        );
    };

    const currentPayload = { title, subtitle, items, showSocials };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Reviews" description="Manage client reviews linked to projects" />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />

            {/* Section Header Fields */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">📝 Section Header</h3>
                <TextField label="Title" value={title} onChange={setTitle} lang={lang} />
                <TextField label="Subtitle" value={subtitle} onChange={setSubtitle} lang={lang} />
                
                <ToggleField
                    label="Show Social Icons on Review Cards"
                    description="If enabled, social media and marketplace icons will be shown on each review card where links are provided."
                    checked={showSocials}
                    onChange={setShowSocials}
                />
            </div>

            {/* Review Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">⭐ Reviews ({items.length})</h3>
                    <button
                        onClick={addItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-medium border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Add Review
                    </button>
                </div>

                {items.map((item, idx) => (
                    <div key={idx} className="bg-card rounded-xl p-5 border border-border space-y-4 relative">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-muted-foreground">Review #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                                {/* Reorder Buttons */}
                                <button
                                    onClick={() => moveItem(idx, -1)}
                                    disabled={idx === 0}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move up"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveItem(idx, 1)}
                                    disabled={idx === items.length - 1}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move down"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField label="Reviewer Name" value={item.name} onChange={(v) => updateItem(idx, 'name', v)} lang={lang} />
                                <TextField label="Role / Company" value={item.role} onChange={(v) => updateItem(idx, 'role', v)} lang={lang} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1.5">Visibility</label>
                                <div className="flex items-center gap-3 bg-secondary rounded-lg px-4 py-2.5 border border-border h-[42px]">
                                    <button
                                        type="button"
                                        onClick={() => updateItem(idx, 'hidden', !item.hidden)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${item.hidden ? 'bg-red-500/80' : 'bg-emerald-500'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${item.hidden ? 'translate-x-0' : 'translate-x-5'
                                            }`} />
                                    </button>
                                    <span className={`text-sm font-medium ${item.hidden ? 'text-red-400' : 'text-emerald-500'}`}>
                                        {item.hidden ? '🔴 Hidden' : '🟢 Visible'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <TextField label="Avatar URL" value={item.avatar} onChange={(v) => updateItem(idx, 'avatar', v)} />

                        {/* Rating Stars */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => updateItem(idx, 'rating', star)}
                                        className="cursor-pointer transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text — dark themed textarea */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Review Text</label>
                            <textarea
                                value={item.text}
                                onChange={(e) => updateItem(idx, 'text', e.target.value)}
                                rows={3}
                                placeholder="Write the review text here..."
                                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Project Dropdown */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Linked Project</label>
                            <select
                                value={item.projectId}
                                onChange={(e) => updateItem(idx, 'projectId', e.target.value)}
                                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <option value="">— None —</option>
                                {projectItems.map((proj: any, pi: number) => (
                                    <option key={pi} value={proj.id || String(pi)}>
                                        {proj.title || `Project ${pi + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Badge Name (custom label for the project badge on the card) */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Badge Name <span className="text-muted-foreground/50 text-xs">(custom name shown on the review card badge)</span></label>
                            <input
                                type="text"
                                value={item.badgeName}
                                onChange={(e) => updateItem(idx, 'badgeName', e.target.value)}
                                placeholder={item.projectName || 'e.g. LifeSolver'}
                                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Social Links */}
                        <div className="pt-4 border-t border-border mt-4">
                            <label className="text-sm font-bold text-foreground block mb-4">🔗 Reviewer Social / Marketplace Links</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <ReviewSocialField idx={idx} label="Google" platform="google" icon={Mail} />
                                <ReviewSocialField idx={idx} label="WhatsApp" platform="whatsapp" icon={WhatsAppIcon} />
                                <ReviewSocialField idx={idx} label="Instagram" platform="instagram" icon={Instagram} />
                                <ReviewSocialField idx={idx} label="Facebook" platform="facebook" icon={Facebook} />
                                <ReviewSocialField idx={idx} label="Threads" platform="threads" icon={AtSign} />
                                <ReviewSocialField idx={idx} label="Twitter" platform="twitter" icon={Twitter} />
                                <ReviewSocialField idx={idx} label="Fiverr" platform="fiverr" icon={Briefcase} />
                                <ReviewSocialField idx={idx} label="Upwork" platform="upwork" icon={Globe} />
                                <ReviewSocialField idx={idx} label="LinkedIn" platform="linkedin" icon={Linkedin} />
                                <ReviewSocialField idx={idx} label="GitHub" platform="github" icon={Github} />
                            </div>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                        No reviews yet. Click "Add Review" to create one.
                    </div>
                )}
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`JSON Import / Export (${lang.toUpperCase()})`}
                    data={currentPayload}
                    onImport={(parsed: any) => {
                        if (parsed.title) setTitle(parsed.title);
                        if (parsed.subtitle) setSubtitle(parsed.subtitle);
                        if (parsed.showSocials !== undefined) setShowSocials(parsed.showSocials);
                        if (parsed.items && Array.isArray(parsed.items)) {
                            setItems(parsed.items.map((item: any) => ({
                                name: item.name || '',
                                role: item.role || '',
                                avatar: item.avatar || '',
                                rating: item.rating ?? 5,
                                text: item.text || '',
                                projectId: item.projectId || '',
                                projectName: item.projectName || '',
                                badgeName: item.badgeName || '',
                                social: item.social ? Object.fromEntries(
                                    Object.entries(item.social).map(([k, v]) => [
                                        k,
                                        typeof v === 'string' ? { url: v, enabled: true } : (v as any)
                                    ])
                                ) : {},
                            })));
                        }
                    }}
                />
            </div>
        </div>
    );
}
