import { useState, useEffect } from 'react';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel, ToggleField } from '@/components/admin/EditorComponents';

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

    const sections: { id: keyof typeof visibility; label: string; value: string; setter: (v: string) => void }[] = [
        { id: 'services', label: 'Services', value: services, setter: setServices },
        { id: 'techStack', label: 'Tech Stack', value: techStack, setter: setTechStack },
        { id: 'whyUs', label: 'Why Us', value: whyUs, setter: setWhyUs },
        { id: 'projects', label: 'Projects', value: projects, setter: setProjects },
        { id: 'leadership', label: 'Leadership', value: leadership, setter: setLeadership },
        { id: 'contact', label: 'Contact', value: contact, setter: setContact },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Navbar Manager" description="Manage navigation link labels, visibility, and custom URLs." />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />
            
            <div className="grid grid-cols-1 gap-6">
                {sections.map(section => (
                    <div key={section.id} className="bg-card rounded-xl p-6 border border-border space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                🔗 {section.label} Link
                            </h3>
                            <ToggleField 
                                label="Visible in Navbar" 
                                checked={visibility[section.id]} 
                                onChange={(v) => setVisibility({ ...visibility, [section.id]: v })} 
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField 
                                label="Display Label" 
                                value={section.value} 
                                onChange={section.setter} 
                                lang={lang} 
                            />
                            <TextField 
                                label="Custom URL (Optional)" 
                                value={urls[section.id as keyof typeof urls] || ''} 
                                onChange={(v) => setUrls({ ...urls, [section.id]: v })} 
                                lang={lang}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Leave URL empty for default internal routing. Use full URL (https://...) for external links.
                        </p>
                    </div>
                ))}

                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="font-bold text-primary">🔘 Special Actions</h3>
                    <TextField label="Book Call Button Text" value={bookCall} onChange={setBookCall} lang={lang} />
                </div>
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`JSON Import / Export (${lang.toUpperCase()})`}
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
