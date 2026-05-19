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
import { Upload, Trash2, User } from 'lucide-react';
import { uploadToImgBB } from '@/lib/imgbb';
import { useContent } from '@/contexts/ContentContext';

// ─── Types ───

interface LocalizedMember {
    name: string;
    role: string;
}

interface UnifiedMember {
    image: string;
    order: number;
    en: LocalizedMember;
    bn: LocalizedMember;
    socials: {
        linkedin: { enabled: boolean; url: string };
        twitter: { enabled: boolean; url: string };
        email: { enabled: boolean; url: string };
    };
    [key: string]: any;
}

const DEFAULT_MEMBER: UnifiedMember = {
    image: '',
    order: 0,
    en: { name: '', role: '' },
    bn: { name: '', role: '' },
    socials: {
        linkedin: { enabled: false, url: '' },
        twitter: { enabled: false, url: '' },
        email: { enabled: false, url: '' },
    },
};

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
        <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-border flex-shrink-0 group bg-secondary/30">
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

    return (
        <div className="space-y-4">
            {/* Shared fields */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-4">
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

                {/* Social Links Section */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        🔗 Social Links (Global)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['linkedin', 'twitter', 'email'] as const).map(platform => (
                            <div key={platform} className="space-y-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
                                <ToggleField 
                                    label={platform.charAt(0).toUpperCase() + platform.slice(1)} 
                                    checked={item.socials?.[platform]?.enabled ?? false} 
                                    onChange={(v) => update({
                                        ...item,
                                        socials: {
                                            ...item.socials,
                                            [platform]: { ...item.socials?.[platform], enabled: v }
                                        }
                                    })} 
                                />
                                {item.socials?.[platform]?.enabled && (
                                    <TextField 
                                        label={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`} 
                                        value={item.socials?.[platform]?.url || ''} 
                                        onChange={(v) => update({
                                            ...item,
                                            socials: {
                                                ...item.socials,
                                                [platform]: { ...item.socials?.[platform], url: v }
                                            }
                                        })} 
                                    />
                                )}
                            </div>
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

                <div className="p-6 space-y-4">
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
            merged.push({
                image: en.image || bn.image || '',
                order: en.order ?? bn.order ?? i + 1,
                en: { name: en.name || '', role: en.role || '' },
                bn: { name: bn.name || '', role: bn.role || '' },
                socials: en.socials || bn.socials || {
                    linkedin: { enabled: false, url: '' },
                    twitter: { enabled: false, url: '' },
                    email: { enabled: false, url: '' },
                },
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
                image: m.image,
                order: m.order,
                socials: m.socials,
            }));

            const bnMembers = sorted.map((m) => ({
                name: m.bn.name,
                role: m.bn.role,
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
                    newItem={{ ...DEFAULT_MEMBER, order: members.length + 1 }}
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
                        merged.push({
                            image: en.image || bn.image || '',
                            order: en.order ?? bn.order ?? i + 1,
                            en: { name: en.name || '', role: en.role || '' },
                            bn: { name: bn.name || '', role: bn.role || '' },
                            socials: en.socials || bn.socials || {
                                linkedin: { enabled: false, url: '' },
                                twitter: { enabled: false, url: '' },
                                email: { enabled: false, url: '' },
                            },
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
