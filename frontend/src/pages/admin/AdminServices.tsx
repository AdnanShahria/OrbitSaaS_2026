import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SectionHeader, SaveButton, TextField, ErrorAlert, JsonPanel, ColorField } from '@/components/admin/EditorComponents';
import { Settings2, Paintbrush, Palette, ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Eye, Layers, Sparkles, Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud, Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase, Award, BookOpen, Users, BarChart3 } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import type { LucideIcon } from 'lucide-react';

// ─── Icon Registry ───
const ICON_MAP: Record<string, LucideIcon> = {
    Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud,
    Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
    Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, Eye, Palette
};
const ICON_NAMES = Object.keys(ICON_MAP);
const DEFAULT_ICONS = ['Globe', 'Bot', 'Zap', 'Smartphone', 'ShoppingCart', 'Rocket'];

// ─── Types ───
interface ServiceText {
    title: string;
    desc: string;
    badge: string;
}

interface UnifiedService {
    en: ServiceText;
    bn: ServiceText;
    icon?: string; // Lucide icon name e.g. 'Globe'
    color?: string;
    border?: string;
}

const DEFAULT_ITEM: UnifiedService = {
    en: { title: '', desc: '', badge: '' },
    bn: { title: '', desc: '', badge: '' },
    icon: '',
};

// ─── Elegant Service Card Editor ───
function ServiceCard({
    item,
    update,
    onRemove,
    onMoveUp,
    onMoveDown,
    index,
    total,
    iconColor,
    cardBorder,
}: {
    item: UnifiedService;
    update: (m: UnifiedService) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    index: number;
    total: number;
    iconColor: string;
    cardBorder: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [tab, setTab] = useState<'en' | 'bn'>('en');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const accentColor = item.color || iconColor;
    const currentIconName = item.icon || DEFAULT_ICONS[index % DEFAULT_ICONS.length];
    const CurrentIcon = ICON_MAP[currentIconName] || Globe;

    const updateLoc = (lang: 'en' | 'bn', field: keyof ServiceText, value: string) => {
        update({ ...item, [lang]: { ...item[lang], [field]: value } });
    };

    const cardTitle = item.en.title || item.bn.title || 'Untitled Module';

    return (
        <div
            className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${expanded
                ? 'bg-card border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/10'
                : 'bg-card/60 border-border/60 hover:border-border hover:shadow-md'
                }`}
        >
            {/* Accent top line */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300"
                style={{ background: expanded ? `linear-gradient(90deg, ${accentColor}, ${accentColor}40)` : 'transparent' }}
            />

            {/* Collapsed Header */}
            <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Order & Drag indicator */}
                <div className="flex flex-col items-center gap-0.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                    <GripVertical className="w-4 h-4" />
                </div>

                {/* Icon + Number badge */}
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                        backgroundColor: `${accentColor}15`,
                        border: `1px solid ${accentColor}25`
                    }}
                >
                    <CurrentIcon className="w-4.5 h-4.5" style={{ color: accentColor }} />
                </div>

                {/* Title & preview */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground/50">#{String(index + 1).padStart(2, '0')}</span>
                        <h4 className="text-sm font-semibold text-foreground truncate">{cardTitle}</h4>
                    </div>
                    {item.en.desc && !expanded && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">{item.en.desc.slice(0, 80)}…</p>
                    )}
                </div>

                {/* Color dot preview */}
                <div
                    className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-card shrink-0 transition-all"
                    style={{ backgroundColor: accentColor }}
                    title={`Accent: ${accentColor}`}
                />

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                        disabled={index === 0}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-all"
                        title="Move up"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                        disabled={index === total - 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-all"
                        title="Move down"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${cardTitle}"?`)) onRemove(); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Remove"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground transition-all ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-border/40">
                    {/* Language tabs */}
                    <div className="flex bg-secondary/20">
                        {(['en', 'bn'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setTab(lang)}
                                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all relative ${tab === lang
                                    ? 'text-primary bg-background/80'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                                    }`}
                            >
                                {lang === 'en' ? '🇺🇸 English' : '🇧🇩 বাংলা'}
                                {tab === lang && (
                                    <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-primary rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Icon Picker */}
                        <div className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module Icon</span>
                                    <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-md">{currentIconName}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${showIconPicker ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground border border-border/30'}`}
                                >
                                    {showIconPicker ? 'Done' : 'Change'}
                                </button>
                            </div>
                            {/* Selected icon preview */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}20` }}
                                >
                                    <CurrentIcon className="w-6 h-6" style={{ color: accentColor }} />
                                </div>
                                <div className="text-xs text-muted-foreground">This icon appears on the website service card.</div>
                            </div>
                            {/* Icon grid */}
                            {showIconPicker && (
                                <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 pt-3 border-t border-border/20">
                                    {ICON_NAMES.map(name => {
                                        const IconComp = ICON_MAP[name];
                                        const isActive = currentIconName === name;
                                        return (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => { update({ ...item, icon: name }); setShowIconPicker(false); }}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-primary shadow-sm' : 'hover:bg-secondary border border-transparent hover:border-border/30'}`}
                                                style={isActive ? { backgroundColor: `${accentColor}15` } : {}}
                                                title={name}
                                            >
                                                <IconComp className="w-4 h-4" style={{ color: isActive ? accentColor : undefined }} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Text fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <TextField
                                label={tab === 'en' ? 'Module Title' : 'মডিউল শিরোনাম'}
                                value={item[tab].title}
                                onChange={v => updateLoc(tab, 'title', v)}
                                lang={tab}
                            />
                            <TextField
                                label={tab === 'en' ? 'Description' : 'বিবরণ'}
                                value={item[tab].desc}
                                onChange={v => updateLoc(tab, 'desc', v)}
                                multiline
                                lang={tab}
                            />
                            <TextField
                                label={tab === 'en' ? 'Badge Text (e.g. Premium Solution)' : 'ব্যাজ টেক্সট (যেমন: প্রিমিয়াম সলিউশন)'}
                                value={item[tab].badge}
                                onChange={v => updateLoc(tab, 'badge', v)}
                                lang={tab}
                            />
                        </div>

                        {/* Branding Section */}
                        <div className="rounded-2xl border border-border/40 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-secondary/50 via-secondary/30 to-transparent border-b border-border/20">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                                        <Palette className="w-3 h-3" style={{ color: accentColor }} />
                                    </div>
                                    <span className="text-xs font-bold text-foreground tracking-wide">Appearance</span>
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Synced</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${showAdvanced
                                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border/30'
                                        }`}
                                >
                                    <Paintbrush className="w-3 h-3" />
                                    {showAdvanced ? 'Less' : 'More'}
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Live Preview — Full-width realistic card mockup */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                        <Eye className="w-3 h-3 text-muted-foreground/50" />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Live Preview</span>
                                    </div>
                                    <div
                                        className="relative rounded-xl border-2 p-5 transition-all duration-300 overflow-hidden bg-card/60 backdrop-blur-md"
                                        style={{
                                            borderColor: item.border || cardBorder,
                                        }}
                                    >
                                        {/* Accent gradient glow at top */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                            style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}30)` }}
                                        />

                                        <div className="flex items-start gap-4 mt-1">
                                            {/* Icon */}
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                                style={{ backgroundColor: `${accentColor}12`, border: `1px solid ${accentColor}20` }}
                                            >
                                                <CurrentIcon className="w-6 h-6" style={{ color: accentColor }} />
                                            </div>

                                            {/* Skeleton content */}
                                            <div className="flex-1 pt-1 space-y-3">
                                                <div className="h-3 w-2/5 rounded-full" style={{ backgroundColor: `${accentColor}30` }} />
                                                <div className="space-y-2">
                                                    <div className="h-2 w-full rounded-full bg-foreground/8" />
                                                    <div className="h-2 w-11/12 rounded-full bg-foreground/6" />
                                                    <div className="h-2 w-3/4 rounded-full bg-foreground/5" />
                                                </div>
                                                <div className="pt-2 flex justify-end">
                                                    <span className="text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                                                        {item[tab].badge || 'Badge Text'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Controls — full-width grid */}
                                <div className={`grid gap-5 ${showAdvanced ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
                                    <div>
                                        <ColorField label="Accent Color" value={accentColor} onChange={v => update({ ...item, color: v })} />
                                    </div>

                                    {showAdvanced && (
                                        <>
                                            <div className="space-y-2">
                                                <ColorField label="Card Border" value={item.border || cardBorder} onChange={v => update({ ...item, border: v })} />
                                                <button
                                                    className="text-[10px] text-muted-foreground/50 hover:text-primary font-medium transition-colors flex items-center gap-1"
                                                    onClick={() => update({ ...item, border: undefined })}
                                                >
                                                    <span className="text-xs">↺</span> Reset to global
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Admin Page ───
export default function AdminServices() {
    const { content, updateSection, refreshContent, loading: contentLoading } = useContent();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // State
    const [sectionInfo, setSectionInfo] = useState({
        en: { title: '', subtitle: '' },
        bn: { title: '', subtitle: '' },
    });
    const [items, setItems] = useState<UnifiedService[]>([]);

    // Shared Global Theme
    const [titleColor, setTitleColor] = useState('');
    const [subtitleColor, setSubtitleColor] = useState('');
    const [cardBorder, setCardBorder] = useState('');
    const [iconColor, setIconColor] = useState('');

    const [showGlobal, setShowGlobal] = useState(false);

    // Load and Merge Data
    useEffect(() => {
        if (contentLoading) return;
        if (!content.en || !content.bn) { setLoading(false); return; }

        const enS = (content.en.services as any) || { items: [] };
        const bnS = (content.bn.services as any) || { items: [] };

        setSectionInfo({
            en: { title: enS.title || '', subtitle: enS.subtitle || '' },
            bn: { title: bnS.title || '', subtitle: bnS.subtitle || '' },
        });

        setTitleColor(enS.titleColor || '#ffffff');
        setSubtitleColor(enS.subtitleColor || '#94a3b8');
        setCardBorder(enS.cardBorder || 'rgba(108, 92, 231, 0.4)');
        setIconColor(enS.iconColor || '#6c5ce7');

        const enItems = enS.items || [];
        const bnItems = bnS.items || [];
        const maxLen = Math.max(enItems.length, bnItems.length);

        const merged: UnifiedService[] = [];
        for (let i = 0; i < maxLen; i++) {
            const en = enItems[i] || {};
            const bn = bnItems[i] || {};
            merged.push({
                en: { title: en.title || '', desc: en.desc || '', badge: en.badge || '' },
                bn: { title: bn.title || '', desc: bn.desc || '', badge: bn.badge || '' },
                icon: en.icon || bn.icon || '',
                color: en.color,
                border: en.border,
            });
        }

        setItems(merged);
        setLoading(false);
    }, [content, contentLoading]);

    // Save
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        const toastId = toast.loading('Saving Services…');

        try {
            const globalTheme = { titleColor, subtitleColor, cardBorder, iconColor };

            const enItems = items.map(m => ({
                title: m.en.title, desc: m.en.desc, badge: m.en.badge,
                icon: m.icon, color: m.color, border: m.border
            }));

            const bnItems = items.map(m => ({
                title: m.bn.title, desc: m.bn.desc, badge: m.bn.badge,
                icon: m.icon, color: m.color, border: m.border
            }));

            const enOk = await updateSection('services', 'en', {
                title: sectionInfo.en.title, subtitle: sectionInfo.en.subtitle,
                items: enItems, ...globalTheme
            });

            const bnOk = await updateSection('services', 'bn', {
                title: sectionInfo.bn.title, subtitle: sectionInfo.bn.subtitle,
                items: bnItems, ...globalTheme
            });

            if (enOk && bnOk) {
                setSaved(true);
                toast.success('Services saved!', { id: toastId });
                window.dispatchEvent(new CustomEvent('orbit:save-success', { detail: { section: 'services' } }));
                await refreshContent();
                setTimeout(() => setSaved(false), 2000);
            } else {
                setError('Failed to save across languages.');
                toast.error('Sync error', { id: toastId });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save');
            toast.error('Save failed', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // Helpers
    const addItem = () => setItems([...items, { ...DEFAULT_ITEM }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= items.length) return;
        const arr = [...items];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        setItems(arr);
    };
    const updateItem = (i: number, val: UnifiedService) => {
        const arr = [...items];
        arr[i] = val;
        setItems(arr);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading Services…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24 relative">

            {/* ── Sticky Top Bar ── */}
            <div className="sticky top-0 z-50 -mx-4 px-4 py-3 md:-mx-8 md:px-8 bg-background/80 backdrop-blur-xl border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                        <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground leading-tight">Services</h1>
                        <p className="text-xs text-muted-foreground">Manage modules &amp; styling • EN/BN synced</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/15 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Sync Active
                    </div>
                    <SaveButton onClick={handleSave} saving={saving} saved={saved} />
                </div>
            </div>

            <ErrorAlert message={error} />

            {/* ── Section Identity ── */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-transparent px-5 py-4 border-b border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Section Identity</h3>
                        <p className="text-[10px] text-muted-foreground">Title &amp; subtitle shown on website</p>
                    </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            🇺🇸 English
                        </div>
                        <TextField label="Title" value={sectionInfo.en.title} onChange={v => setSectionInfo(s => ({ ...s, en: { ...s.en, title: v } }))} lang="en" />
                        <TextField label="Subtitle" value={sectionInfo.en.subtitle} onChange={v => setSectionInfo(s => ({ ...s, en: { ...s.en, subtitle: v } }))} multiline lang="en" />
                    </div>
                    <div className="space-y-4 md:border-l md:border-border/30 md:pl-6">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            🇧🇩 বাংলা
                        </div>
                        <TextField label="Title" value={sectionInfo.bn.title} onChange={v => setSectionInfo(s => ({ ...s, bn: { ...s.bn, title: v } }))} lang="bn" />
                        <TextField label="Subtitle" value={sectionInfo.bn.subtitle} onChange={v => setSectionInfo(s => ({ ...s, bn: { ...s.bn, subtitle: v } }))} multiline lang="bn" />
                    </div>
                </div>
            </div>

            {/* ── Service Modules ── */}
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500/5 to-transparent px-5 py-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Paintbrush className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Service Modules</h3>
                            <p className="text-[10px] text-muted-foreground">Edit content per language, colors sync globally</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-lg font-medium">
                            {items.length} module{items.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={addItem}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/15 hover:border-primary/25 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Module
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No service modules yet</p>
                            <p className="text-xs mt-1 opacity-60">Click "Add Module" to create your first service.</p>
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <ServiceCard
                                key={i}
                                item={item}
                                update={(val) => updateItem(i, val)}
                                onRemove={() => removeItem(i)}
                                onMoveUp={() => moveItem(i, i - 1)}
                                onMoveDown={() => moveItem(i, i + 1)}
                                index={i}
                                total={items.length}
                                iconColor={iconColor}
                                cardBorder={cardBorder}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── Global Theme Panel ── */}
            <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${showGlobal ? 'border-primary/20 bg-card shadow-md shadow-primary/5' : 'border-border/50 bg-card/60'
                }`}>
                <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
                    onClick={() => setShowGlobal(!showGlobal)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showGlobal ? 'bg-primary/15' : 'bg-secondary/70'}`}>
                            <Palette className={`w-4 h-4 transition-colors ${showGlobal ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Global Theme</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Default colors &amp; typography applied to all modules</p>
                        </div>
                    </div>
                    <div className={`w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground transition-all ${showGlobal ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </button>

                {showGlobal && (
                    <div className="px-5 pb-5 border-t border-border/30 pt-5 bg-gradient-to-b from-background/50 to-transparent">
                        <div className="mb-5">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                <span className="w-4 h-px bg-border" /> Typography
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <ColorField label="Header Title" value={titleColor} onChange={setTitleColor} />
                                <ColorField label="Header Subtitle" value={subtitleColor} onChange={setSubtitleColor} />
                                <ColorField label="Default Accent" value={iconColor} onChange={setIconColor} />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                <span className="w-4 h-px bg-border" /> Card Defaults
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                                <ColorField label="Border" value={cardBorder} onChange={setCardBorder} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── JSON ── */}
            <div className="pt-6 border-t border-border/30">
                <JsonPanel
                    title="Data Blueprint"
                    description="Raw merged view of EN + BN data structures."
                    data={{ sectionInfo, items, globalTheme: { titleColor, subtitleColor, cardBorder, iconColor } }}
                    onImport={() => toast.error('JSON import disabled in sync mode.')}
                />
            </div>
        </div>
    );
}
