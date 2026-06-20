import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    SectionHeader,
    SaveButton,
    TextField,
    ErrorAlert,
    ItemListEditor,
    JsonPanel,
    ToggleField,
} from '@/components/admin/EditorComponents';
import { Upload, Trash2, User, Mail, Instagram, Facebook, Twitter, Linkedin, Github, Globe, Briefcase, AtSign } from 'lucide-react';
import { uploadToImgBB } from '@/lib/imgbb';
import { useContent } from '@/contexts/ContentContext';

// ─── Custom SVG Icons ───

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// ─── Types ───

const ALL_SOCIAL_PLATFORMS = [
    'google', 'whatsapp', 'instagram', 'facebook', 'threads',
    'twitter', 'fiverr', 'upwork', 'linkedin', 'github', 'email'
] as const;

type SocialPlatform = typeof ALL_SOCIAL_PLATFORMS[number];

interface SocialEntry { enabled: boolean; url: string }

type SocialsMap = { [K in SocialPlatform]?: SocialEntry };

interface LocalizedMember {
    name: string;
    role: string;
    bio: string;
}

interface UnifiedMember {
    image: string;
    order: number;
    en: LocalizedMember;
    bn: LocalizedMember;
    socials: SocialsMap;
    [key: string]: any;
}

const makeDefaultSocials = (): SocialsMap => {
    const m: SocialsMap = {};
    for (const p of ALL_SOCIAL_PLATFORMS) {
        m[p] = { enabled: false, url: '' };
    }
    return m;
};

const DEFAULT_MEMBER: UnifiedMember = {
    image: '',
    order: 0,
    en: { name: '', role: '', bio: '' },
    bn: { name: '', role: '', bio: '' },
    socials: makeDefaultSocials(),
};

const MAX_ENABLED_CONTACTS = 4;

// ─── Social platform icons/labels map ───

const SOCIAL_CONFIG: { key: SocialPlatform; label: string; icon: any }[] = [
    { key: 'google', label: 'Google', icon: GoogleIcon },
    { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'threads', label: 'Threads', icon: AtSign },
    { key: 'twitter', label: 'Twitter', icon: Twitter },
    { key: 'fiverr', label: 'Fiverr', icon: Briefcase },
    { key: 'upwork', label: 'Upwork', icon: Globe },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'github', label: 'GitHub', icon: Github },
    { key: 'email', label: 'Email', icon: Mail },
];

// ─── Single Image Upload (circular preview) ───

function MemberImageUpload({
    image,
    onChange,
}: {
    image: string;
    onChange: (url: string) => void;
}) {
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        setUploading(true);
        const toastId = toast.loading('Uploading image...');
        try {
            const url = await uploadToImgBB(file);
            onChange(url);
            toast.success('Image uploaded!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Upload failed', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Preview */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-border flex-shrink-0 group bg-secondary/30">
                {image ? (
                    <>
                        <img
                            src={image}
                            alt="Member"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => onChange('')}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                            <Trash2 className="w-6 h-6 text-white" />
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Upload button */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : image ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                </label>
                <p className="text-[10px] text-muted-foreground/60 px-1">
                    No size limit — high resolution supported.
                </p>
            </div>
        </div>
    );
}

// ─── Social Toggle Row (compact, matching AdminReviews style) ───

function SocialToggleRow({
    platform,
    socials,
    onToggle,
    onUrlChange,
    enabledCount,
}: {
    platform: typeof SOCIAL_CONFIG[number];
    socials: SocialsMap;
    onToggle: (key: SocialPlatform, enabled: boolean) => void;
    onUrlChange: (key: SocialPlatform, url: string) => void;
    enabledCount: number;
}) {
    const entry = socials[platform.key] || { enabled: false, url: '' };
    const Icon = platform.icon;
    const isCustomSvg = platform.key === 'google' || platform.key === 'whatsapp';

    const handleToggle = () => {
        if (!entry.enabled && enabledCount >= MAX_ENABLED_CONTACTS) {
            toast.error(`Maximum ${MAX_ENABLED_CONTACTS} contacts allowed per member. Disable another contact first.`);
            return;
        }
        onToggle(platform.key, !entry.enabled);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/10 border border-border/30 group/socket transition-all hover:bg-secondary/20 hover:border-primary/30">
                <div className="flex items-center gap-1.5">
                    {isCustomSvg ? (
                        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/socket:text-primary transition-colors" />
                    ) : (
                        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/socket:text-primary transition-colors" />
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/socket:text-foreground">{platform.label}</span>
                </div>
                <button
                    type="button"
                    onClick={handleToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${entry.enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${entry.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
            </div>
            {entry.enabled && (
                <div className="pl-1">
                    <TextField
                        label={`${platform.label} URL`}
                        value={entry.url}
                        onChange={(v) => onUrlChange(platform.key, v)}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Member Editor (per-item, with EN/BN tabs) ───

function MemberEditor({
    item,
    update,
}: {
    item: UnifiedMember;
    update: (m: UnifiedMember) => void;
}) {
    const [tab, setTab] = useState<'en' | 'bn'>('en');

    const updateLoc = (lang: 'en' | 'bn', field: keyof LocalizedMember, value: string) => {
        update({
            ...item,
            [lang]: { ...item[lang], [field]: value },
        });
    };

    // Count enabled socials
    const enabledCount = ALL_SOCIAL_PLATFORMS.filter(
        p => item.socials?.[p]?.enabled
    ).length;

    const handleSocialToggle = (key: SocialPlatform, enabled: boolean) => {
        update({
            ...item,
            socials: {
                ...item.socials,
                [key]: { ...item.socials?.[key], enabled },
            },
        });
    };

    const handleSocialUrl = (key: SocialPlatform, url: string) => {
        update({
            ...item,
            socials: {
                ...item.socials,
                [key]: { ...item.socials?.[key], url },
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Shared fields */}
            <div className="p-3 sm:p-4 rounded-xl bg-background/50 border border-border/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    🌍 Shared Settings
                </h4>

                <MemberImageUpload
                    image={item.image}
                    onChange={(url) => update({ ...item, image: url })}
                />

                <div className="max-w-[120px]">
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                        Display Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={item.order}
                        onChange={(e) =>
                            update({ ...item, order: parseInt(e.target.value) || 0 })
                        }
                        className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border"
                    />
                </div>

                {/* Social Links Section — 10 platforms with max 4 enforcement */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            🔗 Contact Links (Global)
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enabledCount >= MAX_ENABLED_CONTACTS ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {enabledCount}/{MAX_ENABLED_CONTACTS} active
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SOCIAL_CONFIG.map(platform => (
                            <SocialToggleRow
                                key={platform.key}
                                platform={platform}
                                socials={item.socials || {}}
                                onToggle={handleSocialToggle}
                                onUrlChange={handleSocialUrl}
                                enabledCount={enabledCount}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Language tabs */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="flex border-b border-border bg-secondary/30">
                    <button
                        onClick={() => setTab('en')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'en'
                            ? 'bg-background border-t-2 border-t-primary text-primary'
                            : 'text-muted-foreground hover:bg-secondary'
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setTab('bn')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'bn'
                            ? 'bg-background border-t-2 border-t-primary text-primary'
                            : 'text-muted-foreground hover:bg-secondary'
                            }`}
                    >
                        বাংলা (Bangla)
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    <TextField
                        label={tab === 'en' ? 'Name' : 'নাম'}
                        value={item[tab].name}
                        onChange={(v) => updateLoc(tab, 'name', v)}
                        lang={tab}
                    />
                    <TextField
                        label={tab === 'en' ? 'Role / Title' : 'পদবি'}
                        value={item[tab].role}
                        onChange={(v) => updateLoc(tab, 'role', v)}
                        lang={tab}
                    />
                    <TextField
                        label={tab === 'en' ? 'Bio (optional)' : 'সংক্ষিপ্ত পরিচিতি (ঐচ্ছিক)'}
                        value={item[tab].bio || ''}
                        onChange={(v) => updateLoc(tab, 'bio', v)}
                        multiline
                        lang={tab}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Main Admin Page ───

export default function AdminLeadership() {
    const { content, updateSection, refreshContent, loading: contentLoading } = useContent();

    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<UnifiedMember[]>([]);
    const [sectionInfo, setSectionInfo] = useState({
        en: { title: '', subtitle: '', tagline: '' },
        bn: { title: '', subtitle: '', tagline: '' },
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // ─── Load & merge EN + BN ───
    useEffect(() => {
        if (contentLoading) return;

        if (!content.en || !content.bn) {
            setMembers([]);
            setLoading(false);
            return;
        }

        const enL = (content.en.leadership as any) || { members: [] };
        const bnL = (content.bn.leadership as any) || { members: [] };

        setSectionInfo({
            en: { title: enL.title || '', subtitle: enL.subtitle || '', tagline: enL.tagline || '' },
            bn: { title: bnL.title || '', subtitle: bnL.subtitle || '', tagline: bnL.tagline || '' },
        });

        const enMembers = enL.members || [];
        const bnMembers = bnL.members || [];
        const maxLen = Math.max(enMembers.length, bnMembers.length);

        const merged: UnifiedMember[] = [];
        for (let i = 0; i < maxLen; i++) {
            const en = enMembers[i] || {};
            const bn = bnMembers[i] || {};
            // Merge existing socials with defaults so all platforms are present
            const existingSocials = en.socials || bn.socials || {};
            const mergedSocials: SocialsMap = { ...makeDefaultSocials() };
            for (const p of ALL_SOCIAL_PLATFORMS) {
                if (existingSocials[p]) {
                    mergedSocials[p] = existingSocials[p];
                }
            }
            merged.push({
                image: en.image || bn.image || '',
                order: en.order ?? bn.order ?? i + 1,
                en: { name: en.name || '', role: en.role || '', bio: en.bio || '' },
                bn: { name: bn.name || '', role: bn.role || '', bio: bn.bio || '' },
                socials: mergedSocials,
            });
        }

        setMembers(merged);
        setLoading(false);
    }, [content, contentLoading]);

    // ─── Save ───
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        const toastId = toast.loading('Saving leadership...');

        // Sort by order before saving
        const sorted = [...members].sort((a, b) => a.order - b.order);

        try {
            const enMembers = sorted.map((m) => ({
                name: m.en.name,
                role: m.en.role,
                bio: m.en.bio,
                image: m.image,
                order: m.order,
                socials: m.socials,
            }));

            const bnMembers = sorted.map((m) => ({
                name: m.bn.name,
                role: m.bn.role,
                bio: m.bn.bio,
                image: m.image,
                order: m.order,
                socials: m.socials,
            }));

            const enOk = await updateSection('leadership', 'en', {
                title: sectionInfo.en.title,
                subtitle: sectionInfo.en.subtitle,
                tagline: sectionInfo.en.tagline,
                members: enMembers,
            });

            const bnOk = await updateSection('leadership', 'bn', {
                title: sectionInfo.bn.title,
                subtitle: sectionInfo.bn.subtitle,
                tagline: sectionInfo.bn.tagline,
                members: bnMembers,
            });

            if (enOk && bnOk) {
                setSaved(true);
                toast.success('Leadership saved!', { id: toastId });
                window.dispatchEvent(
                    new CustomEvent('orbit:save-success', { detail: { section: 'leadership' } })
                );
                await refreshContent();
                setTimeout(() => setSaved(false), 2000);
            } else {
                setError('Error saving leadership. Please try again.');
                toast.error('Error saving leadership', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save leadership.');
            toast.error('Save failed', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="p-8 text-center text-muted-foreground">
                Loading leadership...
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader
                    title="Leadership Manager (Unified)"
                    description="Manage team members with English & Bangla content, photos, and ordering."
                />
                <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    ✅ Dual-Language Mode Active
                </div>
            </div>

            <ErrorAlert message={error} />

            {/* Section titles (EN + BN side by side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="space-y-4">
                    <h3 className="font-semibold text-primary">English Section Info</h3>
                    <TextField
                        label="Title"
                        value={sectionInfo.en.title}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                en: { ...sectionInfo.en, title: v },
                            })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Subtitle"
                        value={sectionInfo.en.subtitle}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                en: { ...sectionInfo.en, subtitle: v },
                            })
                        }
                        multiline
                        lang="en"
                    />
                    <TextField
                        label="Bottom Tagline (Optional)"
                        value={sectionInfo.en.tagline}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                en: { ...sectionInfo.en, tagline: v },
                            })
                        }
                        lang="en"
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-primary">Bangla Section Info</h3>
                    <TextField
                        label="শিরোনাম (Title)"
                        value={sectionInfo.bn.title}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                bn: { ...sectionInfo.bn, title: v },
                            })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="সাবটাইটেল (Subtitle)"
                        value={sectionInfo.bn.subtitle}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                bn: { ...sectionInfo.bn, subtitle: v },
                            })
                        }
                        multiline
                        lang="bn"
                    />
                    <TextField
                        label="নিচের ট্যাগলাইন (Tagline)"
                        value={sectionInfo.bn.tagline}
                        onChange={(v) =>
                            setSectionInfo({
                                ...sectionInfo,
                                bn: { ...sectionInfo.bn, tagline: v },
                            })
                        }
                        lang="bn"
                    />
                </div>
            </div>

            {/* Members list */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                        Team Members ({members.length})
                    </h3>
                </div>

                <ItemListEditor
                    items={members}
                    setItems={setMembers}
                    newItem={{ ...DEFAULT_MEMBER, order: members.length + 1, socials: makeDefaultSocials() }}
                    addLabel="Add Member"
                    getItemLabel={(item) =>
                        item.en.name || item.bn.name || ''
                    }
                    renderItem={(item, _i, update) => (
                        <MemberEditor item={item} update={update} />
                    )}
                />
            </div>

            {/* ── Inline JSON Import / Export ── */}
            <JsonPanel
                data={{
                    en: {
                        title: sectionInfo.en.title,
                        subtitle: sectionInfo.en.subtitle,
                        tagline: sectionInfo.en.tagline,
                        members: members.map(m => ({
                            name: m.en.name,
                            role: m.en.role,
                            bio: m.en.bio,
                            image: m.image,
                            order: m.order,
                            socials: m.socials,
                        })),
                    },
                    bn: {
                        title: sectionInfo.bn.title,
                        subtitle: sectionInfo.bn.subtitle,
                        tagline: sectionInfo.bn.tagline,
                        members: members.map(m => ({
                            name: m.bn.name,
                            role: m.bn.role,
                            bio: m.bn.bio,
                            image: m.image,
                            order: m.order,
                            socials: m.socials,
                        })),
                    },
                }}
                onImport={(parsed) => {
                    if (!parsed.en || !parsed.bn) {
                        toast.error('JSON must have "en" and "bn" keys');
                        return;
                    }
                    const newInfo = {
                        en: { title: parsed.en.title || '', subtitle: parsed.en.subtitle || '', tagline: parsed.en.tagline || '' },
                        bn: { title: parsed.bn.title || '', subtitle: parsed.bn.subtitle || '', tagline: parsed.bn.tagline || '' },
                    };
                    const enMembers = parsed.en.members || [];
                    const bnMembers = parsed.bn.members || [];
                    const maxLen = Math.max(enMembers.length, bnMembers.length);
                    const merged: UnifiedMember[] = [];
                    for (let i = 0; i < maxLen; i++) {
                        const en = enMembers[i] || {};
                        const bn = bnMembers[i] || {};
                        const existingSocials = en.socials || bn.socials || {};
                        const mergedSocials: SocialsMap = { ...makeDefaultSocials() };
                        for (const p of ALL_SOCIAL_PLATFORMS) {
                            if (existingSocials[p]) {
                                mergedSocials[p] = existingSocials[p];
                            }
                        }
                        merged.push({
                            image: en.image || bn.image || '',
                            order: en.order ?? bn.order ?? i + 1,
                            en: { name: en.name || '', role: en.role || '', bio: en.bio || '' },
                            bn: { name: bn.name || '', role: bn.role || '', bio: bn.bio || '' },
                            socials: mergedSocials,
                        });
                    }
                    setSectionInfo(newInfo);
                    setMembers(merged);
                }}
            />

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
    );
}
