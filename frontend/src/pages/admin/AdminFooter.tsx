import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    SectionHeader,
    SaveButton,
    TextField,
    ErrorAlert,
    JsonPanel,
} from '@/components/admin/EditorComponents';
import { useContent } from '@/contexts/ContentContext';
import {
    Facebook,
    Instagram,
    Linkedin,
    Send,
    Twitter,
    Youtube,
    Github,
    Plus,
    Trash2,
} from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

// ─── Types ───

interface SocialLink {
    platform: string;
    url: string;
    enabled: boolean;
}

interface QuickLink {
    label: string;
    url: string;
}

const PLATFORMS = [
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'telegram', label: 'Telegram', icon: Send },
    { id: 'twitter', label: 'X / Twitter', icon: Twitter },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
];

const DEFAULT_SOCIALS: SocialLink[] = PLATFORMS.map((p) => ({
    platform: p.id,
    url: '',
    enabled: false,
}));

// ─── Toggle Switch ───

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary border border-border'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );
}

// ─── Main Admin Footer Page ───

export default function AdminFooter() {
    const { content, updateSection, refreshContent, loading: contentLoading } = useContent();

    const [loading, setLoading] = useState(true);
    const [sectionInfo, setSectionInfo] = useState({
        en: { brandName: '', rights: '', tagline: '', email: '', phone: '', location: '', mapLink: '', madeWith: '' },
        bn: { brandName: '', rights: '', tagline: '', email: '', phone: '', location: '', mapLink: '', madeWith: '' },
    });
    const [socials, setSocials] = useState<SocialLink[]>(DEFAULT_SOCIALS);
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
    const [legalLinks, setLegalLinks] = useState<QuickLink[]>([
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
    ]);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // ─── Load ───
    useEffect(() => {
        if (contentLoading) return;

        if (!content.en || !content.bn) {
            setLoading(false);
            return;
        }

        const enF = (content.en.footer as any) || {};
        const bnF = (content.bn.footer as any) || {};

        setSectionInfo({
            en: {
                brandName: enF.brandName || '',
                rights: enF.rights || '',
                tagline: enF.tagline || '',
                email: enF.email || '',
                phone: enF.phone || '',
                location: enF.location || '',
                mapLink: enF.mapLink || '',
                madeWith: enF.madeWith || '',
            },
            bn: {
                brandName: bnF.brandName || '',
                rights: bnF.rights || '',
                tagline: bnF.tagline || '',
                email: bnF.email || '',
                phone: bnF.phone || '',
                location: bnF.location || '',
                mapLink: bnF.mapLink || '',
                madeWith: bnF.madeWith || '',
            },
        });

        // Quick links (shared, read from EN)
        setQuickLinks(enF.quickLinks || []);

        // Legal links (shared, read from EN)
        setLegalLinks(enF.legalLinks || [
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
        ]);

        // Prefer EN socials, fallback to BN, then defaults
        const rawSocials: SocialLink[] = enF.socials || bnF.socials || [];
        if (rawSocials.length > 0) {
            const merged = PLATFORMS.map((p) => {
                const existing = rawSocials.find((s: SocialLink) => s.platform === p.id);
                return existing || { platform: p.id, url: '', enabled: false };
            });
            setSocials(merged);
        }

        setLoading(false);
    }, [content, contentLoading]);

    // ─── Save ───
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        const toastId = toast.loading('Saving footer...');

        try {
            const enOk = await updateSection('footer', 'en', {
                brandName: sectionInfo.en.brandName,
                rights: sectionInfo.en.rights,
                tagline: sectionInfo.en.tagline,
                email: sectionInfo.en.email,
                phone: sectionInfo.en.phone,
                location: sectionInfo.en.location,
                mapLink: sectionInfo.en.mapLink,
                quickLinks,
                legalLinks,
                socials,
            });

            const bnOk = await updateSection('footer', 'bn', {
                brandName: sectionInfo.bn.brandName,
                rights: sectionInfo.bn.rights,
                tagline: sectionInfo.bn.tagline,
                email: sectionInfo.bn.email,
                phone: sectionInfo.bn.phone,
                location: sectionInfo.bn.location,
                mapLink: sectionInfo.bn.mapLink,
                quickLinks,
                legalLinks,
                socials,
            });

            if (enOk && bnOk) {
                setSaved(true);
                toast.success('Footer saved!', { id: toastId });
                window.dispatchEvent(
                    new CustomEvent('orbit:save-success', { detail: { section: 'footer' } })
                );
                await refreshContent();
                setTimeout(() => setSaved(false), 2000);
            } else {
                setError('Error saving footer.');
                toast.error('Error saving footer', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save footer.');
            toast.error('Save failed', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // ─── Helpers ───
    const updateSocial = (platform: string, field: 'url' | 'enabled', value: string | boolean) => {
        setSocials((prev) =>
            prev.map((s) => (s.platform === platform ? { ...s, [field]: value } : s))
        );
    };

    const addQuickLink = () => setQuickLinks([...quickLinks, { label: '', url: '' }]);
    const removeQuickLink = (idx: number) => setQuickLinks(quickLinks.filter((_, i) => i !== idx));
    const updateQuickLink = (idx: number, field: keyof QuickLink, value: string) => {
        setQuickLinks(quickLinks.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const addLegalLink = () => setLegalLinks([...legalLinks, { label: '', url: '' }]);
    const removeLegalLink = (idx: number) => setLegalLinks(legalLinks.filter((_, i) => i !== idx));
    const updateLegalLink = (idx: number, field: keyof QuickLink, value: string) => {
        setLegalLinks(legalLinks.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading footer...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader
                    title="Footer Manager (Unified)"
                    description="Edit footer text, contact info, quick links, and social media."
                />
                <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    ✅ Dual-Language Mode Active
                </div>
            </div>

            <ErrorAlert message={error} />

            {/* ─── Brand & Tagline (EN + BN) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="space-y-4">
                    <h3 className="font-semibold text-primary">🇬🇧 English</h3>
                    <TextField
                        label="Brand Name"
                        value={sectionInfo.en.brandName}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, brandName: v } })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Tagline"
                        value={sectionInfo.en.tagline}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, tagline: v } })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Rights Text"
                        value={sectionInfo.en.rights}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, rights: v } })
                        }
                        lang="en"
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-primary">🇧🇩 বাংলা</h3>
                    <TextField
                        label="ব্র্যান্ড নাম (Brand Name)"
                        value={sectionInfo.bn.brandName}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, brandName: v } })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="ট্যাগলাইন (Tagline)"
                        value={sectionInfo.bn.tagline}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, tagline: v } })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="রাইটস টেক্সট (Rights)"
                        value={sectionInfo.bn.rights}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, rights: v } })
                        }
                        lang="bn"
                    />
                </div>
            </div>

            {/* ─── Contact Info (EN + BN) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">📞 Contact Info (EN)</h3>
                    <TextField
                        label="Email"
                        value={sectionInfo.en.email}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, email: v } })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Phone"
                        value={sectionInfo.en.phone}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, phone: v } })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Location"
                        value={sectionInfo.en.location}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, location: v } })
                        }
                        lang="en"
                    />
                    <TextField
                        label="Google Maps Link"
                        value={sectionInfo.en.mapLink}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, en: { ...sectionInfo.en, mapLink: v } })
                        }
                        lang="en"
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">📞 Contact Info (BN)</h3>
                    <TextField
                        label="ইমেইল (Email)"
                        value={sectionInfo.bn.email}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, email: v } })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="ফোন (Phone)"
                        value={sectionInfo.bn.phone}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, phone: v } })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="অবস্থান (Location)"
                        value={sectionInfo.bn.location}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, location: v } })
                        }
                        lang="bn"
                    />
                    <TextField
                        label="গুগল ম্যাপ লিংক (Map Link)"
                        value={sectionInfo.bn.mapLink}
                        onChange={(v) =>
                            setSectionInfo({ ...sectionInfo, bn: { ...sectionInfo.bn, mapLink: v } })
                        }
                        lang="bn"
                    />
                </div>
            </div>

            {/* ─── Quick Links (Shared) ─── */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">🔗 Quick Links</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Navigation links shown in the footer (shared across languages). Use anchor links like <code className="text-primary">#services</code> for on-page navigation.
                        </p>
                    </div>
                    <button
                        onClick={addQuickLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Link
                    </button>
                </div>

                {quickLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                        No quick links yet. Click "Add Link" to get started.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {quickLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. Services)"
                                    value={link.label}
                                    onChange={(e) => updateQuickLink(idx, 'label', e.target.value)}
                                    className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <input
                                    type="text"
                                    placeholder="URL (e.g. #services or /about)"
                                    value={link.url}
                                    onChange={(e) => updateQuickLink(idx, 'url', e.target.value)}
                                    className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <button
                                    onClick={() => removeQuickLink(idx)}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Remove link"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Legal Links (Shared) ─── */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">⚖️ Legal Links</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Links shown under the "Legal" column in the footer. Use routes like <code className="text-primary">/privacy</code> or <code className="text-primary">/terms</code>.
                        </p>
                    </div>
                    <button
                        onClick={addLegalLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Link
                    </button>
                </div>

                {legalLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                        No legal links yet. Click "Add Link" to get started.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {legalLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. Privacy Policy)"
                                    value={link.label}
                                    onChange={(e) => updateLegalLink(idx, 'label', e.target.value)}
                                    className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <input
                                    type="text"
                                    placeholder="URL (e.g. /privacy)"
                                    value={link.url}
                                    onChange={(e) => updateLegalLink(idx, 'url', e.target.value)}
                                    className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <button
                                    onClick={() => removeLegalLink(idx)}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Remove link"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Social Media Links ─── */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-1">Social Media Links</h3>
                <p className="text-xs text-muted-foreground mb-5">
                    Enter the URLs for your social accounts. Toggle each one to show/hide it on the public site.
                </p>

                <div className="space-y-3">
                    {socials.map((social) => {
                        const platform = PLATFORMS.find((p) => p.id === social.platform);
                        if (!platform) return null;
                        const Icon = platform.icon;

                        return (
                            <div
                                key={social.platform}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${social.enabled
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'border-border bg-secondary/30'
                                    }`}
                            >
                                <Icon
                                    className={`w-5 h-5 flex-shrink-0 ${social.enabled ? 'text-primary' : 'text-muted-foreground'
                                        }`}
                                />
                                <span
                                    className={`text-sm font-medium w-24 flex-shrink-0 ${social.enabled ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                >
                                    {platform.label}
                                </span>
                                <input
                                    type="url"
                                    placeholder={`https://${social.platform}.com/...`}
                                    value={social.url}
                                    onChange={(e) => updateSocial(social.platform, 'url', e.target.value)}
                                    className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <Toggle
                                    checked={social.enabled}
                                    onChange={(v) => updateSocial(social.platform, 'enabled', v)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    data={{
                        en: {
                            brandName: sectionInfo.en.brandName,
                            rights: sectionInfo.en.rights,
                            tagline: sectionInfo.en.tagline,
                            email: sectionInfo.en.email,
                            phone: sectionInfo.en.phone,
                            location: sectionInfo.en.location,
                            mapLink: sectionInfo.en.mapLink,
                            madeWith: sectionInfo.en.madeWith,
                            quickLinks,
                            legalLinks,
                            socials,
                        },
                        bn: {
                            brandName: sectionInfo.bn.brandName,
                            rights: sectionInfo.bn.rights,
                            tagline: sectionInfo.bn.tagline,
                            email: sectionInfo.bn.email,
                            phone: sectionInfo.bn.phone,
                            location: sectionInfo.bn.location,
                            mapLink: sectionInfo.bn.mapLink,
                            madeWith: sectionInfo.bn.madeWith,
                            quickLinks,
                            legalLinks,
                            socials,
                        },
                    }}
                    onImport={(parsed) => {
                        if (!parsed.en || !parsed.bn) {
                            toast.error('JSON must have "en" and "bn" keys');
                            return;
                        }
                        setSectionInfo({
                            en: {
                                brandName: parsed.en.brandName || '',
                                rights: parsed.en.rights || '',
                                tagline: parsed.en.tagline || '',
                                email: parsed.en.email || '',
                                phone: parsed.en.phone || '',
                                location: parsed.en.location || '',
                                mapLink: parsed.en.mapLink || '',
                                madeWith: parsed.en.madeWith || '',
                            },
                            bn: {
                                brandName: parsed.bn.brandName || '',
                                rights: parsed.bn.rights || '',
                                tagline: parsed.bn.tagline || '',
                                email: parsed.bn.email || '',
                                phone: parsed.bn.phone || '',
                                location: parsed.bn.location || '',
                                mapLink: parsed.bn.mapLink || '',
                                madeWith: parsed.bn.madeWith || '',
                            },
                        });
                        if (parsed.en.quickLinks) setQuickLinks(parsed.en.quickLinks);
                        if (parsed.en.legalLinks) setLegalLinks(parsed.en.legalLinks);
                        if (parsed.en.socials) setSocials(parsed.en.socials);
                        else if (parsed.bn.socials) setSocials(parsed.bn.socials);
                    }}
                />
            </div>
        </div>
    );
}
