import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/imageUpload';
import { getImageUrl } from '@/lib/imageUrl';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';
import { RichText } from '@/components/ui/RichText';
import {
    Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud,
    Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
    Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, Eye, Palette, Brain, Wrench,
    Activity, ChevronDown, MessageSquare, ArrowRight, Upload, ImageIcon, RotateCcw, Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Custom Icons ───
const Bullseye = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 4A9.5 9.5 0 1 0 20 7.5" />
        <path d="M14 8a4.5 4.5 0 1 0 2 2" />
        <line x1="11" y1="13" x2="20" y2="4" />
        <path d="M14 2h8v8Z" fill="currentColor" stroke="currentColor" />
    </svg>
);

// ─── Icon Registry ───
const ICON_MAP: Record<string, LucideIcon | any> = {
    Activity, Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud,
    Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
    Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, Eye, Palette, Brain, Wrench,
    Bullseye
};
const ICON_NAMES = Object.keys(ICON_MAP);

function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const CurrentIcon = ICON_MAP[value] || Target;
    return (
        <div className="relative">
            <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors text-sm w-full"
            >
                <CurrentIcon className="w-4 h-4 text-primary" />
                <span className="flex-1 text-left">{value || 'Select icon…'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-popover border border-border rounded-xl shadow-xl z-50 grid grid-cols-7 gap-1.5 max-h-52 overflow-y-auto">
                    {ICON_NAMES.map(name => {
                        const IconCmp = ICON_MAP[name];
                        return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => { onChange(name); setOpen(false); }}
                                className={`p-2 rounded-lg flex items-center justify-center transition-colors ${value === name
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                                    }`}
                                title={name}
                            >
                                <IconCmp className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const DEFAULT_PHRASES_EN = [
    'SCALABLE REALITIES',
    'REAL IMPACT',
    'MEASURABLE GROWTH',
    'POWERFUL SOLUTIONS',
    'INTELLIGENT SYSTEMS'
];

export default function AdminHero() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('hero');

    // Headlines
    const [tagline, setTagline] = useState('');
    const [titlePrefix, setTitlePrefix] = useState('');
    const [phrasesText, setPhrasesText] = useState('');
    const [subtitle, setSubtitle] = useState('');

    // Call To Actions
    const [cta, setCta] = useState('');
    const [learnMore, setLearnMore] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // Hero background image
    const [heroBgImage, setHeroBgImage] = useState('/images/hero-ai-hand-v3.jpg');
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const toastId = toast.loading('Uploading hero background image...');
        try {
            const uploaded = await uploadImage(file, 'hero', false);
            const resolvedUrl = getImageUrl(uploaded) || (typeof uploaded === 'string' ? uploaded : (uploaded as any)?.primary);
            if (resolvedUrl) {
                setHeroBgImage(resolvedUrl);
                toast.success('Hero background image uploaded successfully!', { id: toastId });
            }
        } catch (err) {
            console.error('Hero image upload failed:', err);
            toast.error('Upload failed. Please try again.', { id: toastId });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Feature Cards (Right side on desktop)
    const [feature1Title, setFeature1Title] = useState('Agentic AI nodes');
    const [feature1Icon, setFeature1Icon] = useState('Activity');
    const [f1Step1, setF1Step1] = useState('DISCOVERY');
    const [f1Step2, setF1Step2] = useState('AGENT_INIT');
    const [f1Step3, setF1Step3] = useState('EXECUTION');
    const [f1Step4, setF1Step4] = useState('OPTIMIZE');

    const [feature2Title, setFeature2Title] = useState('Conversational AI');
    const [feature2Icon, setFeature2Icon] = useState('Cpu');
    const [f2Query, setF2Query] = useState('How can I automate my business workflow?');
    const [f2Response, setF2Response] = useState('I can deploy Multi-Agent systems to...');
    const [f2FooterLeft, setF2FooterLeft] = useState('Custom Trained LLM');
    const [f2FooterRight, setF2FooterRight] = useState('Active');

    const [feature3Title, setFeature3Title] = useState('Enterprise Solutions');
    const [feature3Icon, setFeature3Icon] = useState('Zap');
    const [f3UptimeLabel, setF3UptimeLabel] = useState('Uptime');
    const [f3UptimeValue, setF3UptimeValue] = useState('99.9%');
    const [f3Latency, setF3Latency] = useState('Latency: 0.8ms');
    const [f3Edge, setF3Edge] = useState('Global Edge');

    useEffect(() => {
        const d = getData();
        if (d) {
            setTagline(d.tagline || '');
            setTitlePrefix(d.titlePrefix || d.title || 'Turning Ideas into');

            const loadedPhrases = Array.isArray(d.phrases) && d.phrases.length > 0
                ? d.phrases
                : typeof d.phrases === 'string' && d.phrases.trim()
                    ? d.phrases.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : DEFAULT_PHRASES_EN;
            setPhrasesText(loadedPhrases.join('\n'));

            setSubtitle(d.subtitle || '');
            setCta(d.cta || 'Get Started');
            setLearnMore(d.learnMore || 'Our Services');
            setWhatsappNumber(d.whatsappNumber || '8801853452264');
            setContactEmail(d.contactEmail || 'contact@orbitsaas.cloud');

            // Hero background
            setHeroBgImage(d.heroBgImage || '/images/hero-ai-hand-v3.jpg');

            // Features
            setFeature1Title(d.feature1Title || 'Agentic AI nodes');
            setFeature1Icon(d.feature1Icon || 'Activity');
            const steps = d.feature1Steps || ['DISCOVERY', 'AGENT_INIT', 'EXECUTION', 'OPTIMIZE'];
            setF1Step1(steps[0] || 'DISCOVERY');
            setF1Step2(steps[1] || 'AGENT_INIT');
            setF1Step3(steps[2] || 'EXECUTION');
            setF1Step4(steps[3] || 'OPTIMIZE');

            setFeature2Title(d.feature2Title || 'Conversational AI');
            setFeature2Icon(d.feature2Icon || 'Cpu');
            setF2Query(d.feature2Query || 'How can I automate my business workflow?');
            setF2Response(d.feature2Response || 'I can deploy Multi-Agent systems to...');
            setF2FooterLeft(d.feature2FooterLeft || 'Custom Trained LLM');
            setF2FooterRight(d.feature2FooterRight || 'Active');

            setFeature3Title(d.feature3Title || 'Enterprise Solutions');
            setFeature3Icon(d.feature3Icon || 'Zap');
            setF3UptimeLabel(d.feature3UptimeLabel || 'Uptime');
            setF3UptimeValue(d.feature3UptimeValue || '99.9%');
            setF3Latency(d.feature3Latency || 'Latency: 0.8ms');
            setF3Edge(d.feature3Edge || 'Global Edge');
        }
    }, [getData]);

    const parsedPhrases = phrasesText
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const currentPayload = {
        tagline,
        title: titlePrefix,
        titlePrefix,
        phrases: parsedPhrases.length > 0 ? parsedPhrases : DEFAULT_PHRASES_EN,
        subtitle,
        cta,
        learnMore,
        whatsappNumber,
        contactEmail,
        heroBgImage,
        feature1Title,
        feature1Icon,
        feature1Steps: [f1Step1, f1Step2, f1Step3, f1Step4],
        feature2Title,
        feature2Icon,
        feature2Query: f2Query,
        feature2Response: f2Response,
        feature2FooterLeft: f2FooterLeft,
        feature2FooterRight: f2FooterRight,
        feature3Title,
        feature3Icon,
        feature3UptimeLabel: f3UptimeLabel,
        feature3UptimeValue: f3UptimeValue,
        feature3Latency: f3Latency,
        feature3Edge: f3Edge
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Hero Section" description="Manage headlines, dynamic typewriter phrases, CTAs, and 3D visual card content." />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Headlines & Content (7 Cols) */}
                <div className="lg:col-span-7 space-y-5 bg-card rounded-xl p-4 md:p-6 border border-border">
                    <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                        📝 Headline &amp; Text Content
                    </h3>

                    {/* Tagline Pill Badge */}
                    <div>
                        <TextField label="Tagline (Glowing Pill Badge)" value={tagline} onChange={setTagline} lang={lang} />
                        <p className="text-[11px] text-muted-foreground mt-1">Appears at the top of the hero in the glowing pill badge (e.g. <code>Launch at Zero _ Scale to Orbit 🚀</code>).</p>
                    </div>

                    {/* Main Title Prefix (Line 1) */}
                    <div>
                        <TextField label="Title Line 1 (Static Heading)" value={titlePrefix} onChange={setTitlePrefix} lang={lang} />
                        <p className="text-[11px] text-muted-foreground mt-1">The bold static text on line 1 of the title (e.g. <code>Turning Ideas into</code>).</p>
                    </div>

                    {/* Typewriter Rotating Phrases (Line 2) */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Title Line 2 (Dynamic Rotating Phrases — Typewriter)
                        </label>
                        <textarea
                            value={phrasesText}
                            onChange={(e) => setPhrasesText(e.target.value)}
                            rows={4}
                            placeholder="SCALABLE REALITIES&#10;REAL IMPACT&#10;MEASURABLE GROWTH&#10;POWERFUL SOLUTIONS&#10;INTELLIGENT SYSTEMS"
                            className="w-full rounded-lg bg-background border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Enter one phrase per line (or separated by commas). These cycle sequentially in vibrant amber-purple gradient text.
                        </p>
                    </div>

                    {/* Subtitle */}
                    <div>
                        <TextField label="Hero Subtitle" value={subtitle} onChange={setSubtitle} multiline lang={lang} />
                        <p className="text-xs text-muted-foreground -mt-2 ml-1">
                            💡 Text formatting: <code className="bg-muted px-1 rounded text-[11px]">**text**</code> bold, <code className="bg-muted px-1 rounded text-[11px]">&lt;&lt;text&gt;&gt;</code> gradient, <code className="bg-muted px-1 rounded text-[11px]">((text))</code> badge, <code className="bg-muted px-1 rounded text-[11px]">==text==</code> green highlight.
                        </p>
                    </div>
                </div>

                {/* Right Column: Hero Image, CTA Buttons & Live Preview (5 Cols) */}
                <div className="lg:col-span-5 space-y-5 flex flex-col">
                    {/* Hero Background / Banner Image */}
                    <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <ImageIcon size={18} className="text-primary" />
                                Hero Visual / Banner Image
                            </h3>
                            {heroBgImage && heroBgImage !== '/images/hero-ai-hand-v3.jpg' && (
                                <button
                                    type="button"
                                    onClick={() => setHeroBgImage('/images/hero-ai-hand-v3.jpg')}
                                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded bg-secondary/60 hover:bg-secondary"
                                    title="Reset to default image"
                                >
                                    <RotateCcw size={11} />
                                    Reset Default
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            This static image replaces heavy animations, dramatically speeding up page performance while showcasing a high-end visual.
                        </p>

                        {/* Image Preview */}
                        <div className="relative rounded-xl overflow-hidden border border-border bg-black/40 aspect-[16/9] flex items-center justify-center group">
                            {heroBgImage ? (
                                <img
                                    src={getImageUrl(heroBgImage) || heroBgImage}
                                    alt="Hero background preview"
                                    className="w-full h-full object-cover object-center"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/hero-ai-hand-v3.jpg';
                                    }}
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                    <ImageIcon size={28} className="opacity-40" />
                                    <span>No hero image set</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                <span className="text-xs text-white font-medium bg-black/60 px-3 py-1 rounded-full border border-white/20">
                                    Current Hero Visual
                                </span>
                            </div>
                        </div>

                        {/* Upload & URL Input */}
                        <div className="space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                disabled={uploadingImage}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                {uploadingImage ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Uploading &amp; Optimizing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={13} />
                                        <span>Upload New Hero Image</span>
                                    </>
                                )}
                            </button>

                            <div>
                                <TextField
                                    label="Or enter Image URL / Local path"
                                    value={typeof heroBgImage === 'string' ? heroBgImage : (heroBgImage as any)?.primary || ''}
                                    onChange={setHeroBgImage}
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Default: <code>/images/hero-ai-hand-v3.jpg</code> (or R2 / Cloudflare CDN URL)
                                </p>
                            </div>

                            {/* Quick AI Wallpaper Presets */}
                            <div className="space-y-1.5 pt-2 border-t border-border/50">
                                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                    <span>AI Wallpaper Presets</span>
                                    <span className="text-[10px] text-primary font-medium">16:9 Widescreen</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: 'Concept 3', desc: 'Quantum Spark', url: '/images/hero-ai-hand-v3.jpg' },
                                        { label: 'Concept 1', desc: 'White Ceramic', url: '/images/hero-ai-hand-v1.jpg' },
                                        { label: 'Concept 2', desc: 'Dark Cyber', url: '/images/hero-ai-hand-v2.jpg' },
                                        { label: 'Original', desc: 'Adam Concept', url: '/images/hero-bg-backup.png' },
                                    ].map((preset) => {
                                        const currentVal = typeof heroBgImage === 'string' ? heroBgImage : (heroBgImage as any)?.primary;
                                        const isSelected = currentVal === preset.url;
                                        return (
                                            <button
                                                key={preset.url}
                                                type="button"
                                                onClick={() => setHeroBgImage(preset.url)}
                                                className={`relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-primary ring-2 ring-primary/40 bg-primary/10'
                                                        : 'border-border hover:border-primary/50 bg-secondary/30'
                                                }`}
                                            >
                                                <div className="aspect-[16/9] w-full rounded overflow-hidden bg-black/50 mb-1">
                                                    <img
                                                        src={preset.url}
                                                        alt={preset.label}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="text-[10px] font-semibold text-foreground truncate leading-tight">
                                                    {preset.label}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground truncate">
                                                    {preset.desc}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-4">
                        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                            ⚡ Call-to-Action &amp; Direct Contact
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <TextField label="Primary CTA Text" value={cta} onChange={setCta} lang={lang} />
                            <TextField label="Secondary Button Text" value={learnMore} onChange={setLearnMore} lang={lang} />
                        </div>

                        <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <TextField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} />
                                <p className="text-[10px] text-muted-foreground mt-0.5">e.g. <code>8801853452264</code></p>
                            </div>
                            <div>
                                <TextField label="Contact Email" value={contactEmail} onChange={setContactEmail} />
                                <p className="text-[10px] text-muted-foreground mt-0.5">e.g. <code>contact@orbitsaas.cloud</code></p>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="bg-[#0B0B0F] rounded-xl p-5 border border-white/10 shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">LIVE PREVIEW</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">General User View</span>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {/* Pill Badge */}
                            <div>
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[9px] font-black tracking-widest uppercase text-indigo-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    {tagline || 'Launch at Zero _ Scale to Orbit 🚀'}
                                </span>
                            </div>

                            {/* Headline */}
                            <div>
                                <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                                    {titlePrefix || 'Turning Ideas into'}
                                </div>
                                <div
                                    className="text-lg sm:text-xl font-black leading-tight mt-0.5"
                                    style={{
                                        background: 'linear-gradient(to right, #F59E0B, #A855F7, #EC4899)',
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        color: 'transparent',
                                        display: 'inline-block'
                                    }}
                                >
                                    {parsedPhrases[0] || 'SCALABLE REALITIES'}
                                    <span className="inline-block w-1.5 h-4 bg-violet-400 ml-1.5 animate-pulse" />
                                </div>
                            </div>

                            {/* Subtitle */}
                            <div className="text-xs text-white/60 leading-relaxed max-h-24 overflow-y-auto pr-1">
                                <RichText text={subtitle || 'From concept to scale, we engineer high-performance software and autonomous AI agents.'} />
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                                    <span>{cta || 'Get Started'}</span>
                                    <Zap size={12} className="fill-current text-indigo-600" />
                                </div>
                                <div className="px-3 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-lg flex items-center gap-1">
                                    <span>{learnMore || 'Our Services'}</span>
                                    <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>

                        {/* Background subtle glow */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Feature Flash Cards (Desktop Right Column Cards) */}
            <div className="space-y-4 bg-card rounded-xl p-4 md:p-6 border border-border">
                <div>
                    <h3 className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                        ✨ Apple Frosted Glass Feature Cards (Desktop Right Side)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        These are the three interactive Apple Liquid Glass cards floating beside the hero text on desktop screens.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Agentic AI */}
                    <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-background/50">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Card 1 (Top Right)</h4>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">Agentic AI</span>
                        </div>
                        <TextField label="Card Title" value={feature1Title} onChange={setFeature1Title} lang={lang} />
                        <IconPicker label="Icon" value={feature1Icon} onChange={setFeature1Icon} />
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                            <label className="text-[11px] font-medium text-muted-foreground block">Workflow Sequence Steps (4 nodes)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <TextField label="Step 1" value={f1Step1} onChange={setF1Step1} lang={lang} />
                                <TextField label="Step 2" value={f1Step2} onChange={setF1Step2} lang={lang} />
                                <TextField label="Step 3" value={f1Step3} onChange={setF1Step3} lang={lang} />
                                <TextField label="Step 4" value={f1Step4} onChange={setF1Step4} lang={lang} />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Conversational AI */}
                    <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-background/50">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Card 2 (Middle)</h4>
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">Chatbot Node</span>
                        </div>
                        <TextField label="Card Title" value={feature2Title} onChange={setFeature2Title} lang={lang} />
                        <IconPicker label="Icon" value={feature2Icon} onChange={setFeature2Icon} />
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                            <TextField label="Simulated User Query" value={f2Query} onChange={setF2Query} lang={lang} />
                            <TextField label="Simulated Bot Response" value={f2Response} onChange={setF2Response} lang={lang} />
                            <div className="grid grid-cols-2 gap-2">
                                <TextField label="Footer Tag Left" value={f2FooterLeft} onChange={setF2FooterLeft} lang={lang} />
                                <TextField label="Footer Tag Right" value={f2FooterRight} onChange={setF2FooterRight} lang={lang} />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Enterprise Solutions */}
                    <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-background/50">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Card 3 (Bottom)</h4>
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">Performance</span>
                        </div>
                        <TextField label="Card Title" value={feature3Title} onChange={setFeature3Title} lang={lang} />
                        <IconPicker label="Icon" value={feature3Icon} onChange={setFeature3Icon} />
                        <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                            <div className="grid grid-cols-2 gap-2">
                                <TextField label="Metric Label" value={f3UptimeLabel} onChange={setF3UptimeLabel} lang={lang} />
                                <TextField label="Metric Value" value={f3UptimeValue} onChange={setF3UptimeValue} lang={lang} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <TextField label="Subtext 1" value={f3Latency} onChange={setF3Latency} lang={lang} />
                                <TextField label="Subtext 2" value={f3Edge} onChange={setF3Edge} lang={lang} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SaveButton onClick={() => save(currentPayload)} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`JSON Import / Export (${lang.toUpperCase()})`}
                    data={currentPayload}
                    onImport={(parsed) => {
                        setTagline(parsed.tagline || '');
                        setTitlePrefix(parsed.titlePrefix || parsed.title || 'Turning Ideas into');
                        const importedPhrases = Array.isArray(parsed.phrases)
                            ? parsed.phrases
                            : typeof parsed.phrases === 'string'
                                ? parsed.phrases.split(',').map((s: string) => s.trim()).filter(Boolean)
                                : DEFAULT_PHRASES_EN;
                        setPhrasesText(importedPhrases.join('\n'));

                        setSubtitle(parsed.subtitle || '');
                        setCta(parsed.cta || 'Get Started');
                        setLearnMore(parsed.learnMore || 'Our Services');
                        setWhatsappNumber(parsed.whatsappNumber || '8801853452264');
                        setContactEmail(parsed.contactEmail || 'contact@orbitsaas.cloud');
                        setHeroBgImage(parsed.heroBgImage || '/images/hero-ai-hand-v3.jpg');

                        setFeature1Title(parsed.feature1Title || 'Agentic AI nodes');
                        setFeature1Icon(parsed.feature1Icon || 'Activity');
                        const steps = parsed.feature1Steps || [];
                        setF1Step1(steps[0] || 'DISCOVERY');
                        setF1Step2(steps[1] || 'AGENT_INIT');
                        setF1Step3(steps[2] || 'EXECUTION');
                        setF1Step4(steps[3] || 'OPTIMIZE');

                        setFeature2Title(parsed.feature2Title || 'Conversational AI');
                        setFeature2Icon(parsed.feature2Icon || 'Cpu');
                        setF2Query(parsed.feature2Query || 'How can I automate my business workflow?');
                        setF2Response(parsed.feature2Response || 'I can deploy Multi-Agent systems to...');
                        setF2FooterLeft(parsed.feature2FooterLeft || 'Custom Trained LLM');
                        setF2FooterRight(parsed.feature2FooterRight || 'Active');

                        setFeature3Title(parsed.feature3Title || 'Enterprise Solutions');
                        setFeature3Icon(parsed.feature3Icon || 'Zap');
                        setF3UptimeLabel(parsed.feature3UptimeLabel || 'Uptime');
                        setF3UptimeValue(parsed.feature3UptimeValue || '99.9%');
                        setF3Latency(parsed.feature3Latency || 'Latency: 0.8ms');
                        setF3Edge(parsed.feature3Edge || 'Global Edge');
                    }}
                />
            </div>
        </div>
    );
}
