import { useState, useEffect } from 'react';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel, ToggleField } from '@/components/admin/EditorComponents';
import { ShoppingCart, Cpu, Lightbulb, FolderOpen, Users, Phone, PhoneCall, Link as LinkIcon, Compass, Sparkles, CheckCircle2, EyeOff } from 'lucide-react';

export default function AdminNavbar() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('nav');
    
    // Labels
    const [services, setServices] = useState('');
    const [techStack, setTechStack] = useState('');
    const [whyUs, setWhyUs] = useState('');
    const [leadership, setLeadership] = useState('');
    const [contact, setContact] = useState('');
    const [projects, setProjects] = useState('');
    const [bookCall, setBookCall] = useState('');

    // Visibility
    const [visibility, setVisibility] = useState({
        services: true,
        techStack: true,
        whyUs: true,
        projects: true,
        leadership: true,
        contact: true
    });

    // Custom URLs
    const [urls, setUrls] = useState({
        services: '',
        techStack: '',
        whyUs: '',
        projects: '',
        leadership: '',
        contact: ''
    });

    useEffect(() => {
        const d = getData();
        if (d) {
            setServices(d.services || '');
            setTechStack(d.techStack || '');
            setWhyUs(d.whyUs || '');
            setLeadership(d.leadership || '');
            setContact(d.contact || '');
            setProjects(d.projects || '');
            setBookCall(d.bookCall || '');
            
            if (d.visibility) setVisibility(prev => ({ ...prev, ...d.visibility }));
            if (d.urls) setUrls(prev => ({ ...prev, ...d.urls }));
        }
    }, [getData]);

    const handleSave = () => {
        save({
            services,
            techStack,
            whyUs,
            leadership,
            contact,
            projects,
            bookCall,
            visibility,
            urls
        });
    };

    const sections: {
        id: keyof typeof visibility;
        label: string;
        value: string;
        setter: (v: string) => void;
        icon: React.ComponentType<{ className?: string }>;
        defaultPath: string;
    }[] = [
        { id: 'services', label: 'Services', value: services, setter: setServices, icon: ShoppingCart, defaultPath: '/services' },
        { id: 'techStack', label: 'Tech Stack', value: techStack, setter: setTechStack, icon: Cpu, defaultPath: '/techstack' },
        { id: 'whyUs', label: 'Why Us', value: whyUs, setter: setWhyUs, icon: Lightbulb, defaultPath: '/why-us' },
        { id: 'projects', label: 'Projects', value: projects, setter: setProjects, icon: FolderOpen, defaultPath: '/proj' },
        { id: 'leadership', label: 'Leadership', value: leadership, setter: setLeadership, icon: Users, defaultPath: '/leadership' },
        { id: 'contact', label: 'Contact', value: contact, setter: setContact, icon: Phone, defaultPath: '/contact' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border/60">
                <SectionHeader 
                    title="Navbar Navigation Manager" 
                    description="Configure top navigation link titles, visibility toggles, and optional custom external/internal routing." 
                />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />
            
            {/* Quick summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {sections.map(s => {
                    const isVis = visibility[s.id];
                    return (
                        <div
                            key={s.id}
                            className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                                isVis
                                    ? 'bg-card border-border shadow-sm'
                                    : 'bg-muted/30 border-border/50 opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <s.icon className={`w-3.5 h-3.5 ${isVis ? 'text-[#0071e3] dark:text-[#0a84ff]' : 'text-muted-foreground'}`} />
                                <span className={`w-2 h-2 rounded-full ${isVis ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                            </div>
                            <span className="text-xs font-semibold text-foreground truncate">{s.value || s.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">{s.defaultPath}</span>
                        </div>
                    );
                })}
            </div>

            {/* Inset Grouped Section Cards */}
            <div className="grid grid-cols-1 gap-5">
                {sections.map(section => {
                    const isVis = visibility[section.id];
                    return (
                        <div 
                            key={section.id} 
                            className="bg-card rounded-2xl p-5 border border-border/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4 hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all"
                        >
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                        isVis 
                                            ? 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0a84ff]/20 dark:text-[#0a84ff]' 
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <section.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                            {section.label} Link
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Default Route: <code className="font-mono text-[10px] bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{section.defaultPath}</code>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold tracking-wider ${
                                        isVis 
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-muted text-muted-foreground border border-border'
                                    }`}>
                                        {isVis ? 'LIVE ON SITE' : 'HIDDEN'}
                                    </span>
                                    <ToggleField 
                                        label="Show in Navbar" 
                                        checked={isVis} 
                                        onChange={(v) => setVisibility({ ...visibility, [section.id]: v })} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField 
                                    label="Navigation Label" 
                                    value={section.value} 
                                    onChange={section.setter} 
                                    lang={lang} 
                                />
                                <TextField 
                                    label="Custom URL Override (Optional)" 
                                    value={urls[section.id as keyof typeof urls] || ''} 
                                    onChange={(v) => setUrls({ ...urls, [section.id]: v })} 
                                    lang={lang}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                Leave URL blank for default route. Provide full URL (e.g. <code className="font-mono text-[10px]">https://...</code>) for external links.
                            </p>
                        </div>
                    );
                })}

                {/* Primary Call-to-Action Card */}
                <div className="bg-card rounded-2xl p-5 border border-border/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#005bb5] text-white flex items-center justify-center shadow-sm">
                            <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground">Primary Action Button (CTA)</h3>
                            <p className="text-[11px] text-muted-foreground">The prominent action capsule displayed at the end of the top navigation bar</p>
                        </div>
                    </div>
                    <TextField label="Button Text" value={bookCall} onChange={setBookCall} lang={lang} />
                </div>
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-6 border-t border-border">
                <JsonPanel
                    title={`JSON Data Inspector (${lang.toUpperCase()})`}
                    data={{ services, techStack, whyUs, leadership, contact, projects, bookCall, visibility, urls }}
                    onImport={(parsed) => {
                        setServices(parsed.services || '');
                        setTechStack(parsed.techStack || '');
                        setWhyUs(parsed.whyUs || '');
                        setLeadership(parsed.leadership || '');
                        setContact(parsed.contact || '');
                        setProjects(parsed.projects || '');
                        setBookCall(parsed.bookCall || '');
                        if (parsed.visibility) setVisibility(parsed.visibility);
                        if (parsed.urls) setUrls(parsed.urls);
                    }}
                />
            </div>
        </div>
    );
}
