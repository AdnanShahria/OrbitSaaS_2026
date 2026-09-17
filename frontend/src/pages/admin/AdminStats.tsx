import { useState, useEffect } from 'react';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';

export default function AdminStats() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('stats');

    const [liveProjects, setLiveProjects] = useState('24');
    const [countries, setCountries] = useState('5');
    const [usersServed, setUsersServed] = useState('120');
    const [yearsExperience, setYearsExperience] = useState('3');

    // Labels (translatable)
    const [labelProjects, setLabelProjects] = useState('Live Projects');
    const [labelCountries, setLabelCountries] = useState('Countries');
    const [labelUsers, setLabelUsers] = useState('Users Served');
    const [labelYears, setLabelYears] = useState('Years Experience');

    useEffect(() => {
        const d = getData();
        if (d && d.items && Array.isArray(d.items)) {
            if (d.items[0]) {
                setLiveProjects(String(d.items[0].value ?? '24'));
                setLabelProjects(d.items[0].label || 'Live Projects');
            }
            if (d.items[1]) {
                setCountries(String(d.items[1].value ?? '5'));
                setLabelCountries(d.items[1].label || 'Countries');
            }
            if (d.items[2]) {
                setUsersServed(String(d.items[2].value ?? '120'));
                setLabelUsers(d.items[2].label || 'Users Served');
            }
            if (d.items[3]) {
                setYearsExperience(String(d.items[3].value ?? '3'));
                setLabelYears(d.items[3].label || 'Years Experience');
            }
        }
    }, [getData]);

    const currentPayload = {
        items: [
            { value: Number(liveProjects) || 0, suffix: '+', label: labelProjects },
            { value: Number(countries) || 0, suffix: '+', label: labelCountries },
            { value: Number(usersServed) || 0, suffix: '+', label: labelUsers },
            { value: Number(yearsExperience) || 0, suffix: '+', label: labelYears },
        ],
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Stats Counter" description="Edit the stats numbers displayed between Hero and Services" />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />

            <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-5">
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    📊 Stats Values
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                        <TextField label="Live Projects (Number)" value={liveProjects} onChange={setLiveProjects} lang={lang} />
                        <TextField label="Label" value={labelProjects} onChange={setLabelProjects} lang={lang} />
                    </div>
                    <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                        <TextField label="Countries (Number)" value={countries} onChange={setCountries} lang={lang} />
                        <TextField label="Label" value={labelCountries} onChange={setLabelCountries} lang={lang} />
                    </div>
                    <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                        <TextField label="Users Served (Number)" value={usersServed} onChange={setUsersServed} lang={lang} />
                        <TextField label="Label" value={labelUsers} onChange={setLabelUsers} lang={lang} />
                    </div>
                    <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                        <TextField label="Years Experience (Number)" value={yearsExperience} onChange={setYearsExperience} lang={lang} />
                        <TextField label="Label" value={labelYears} onChange={setLabelYears} lang={lang} />
                    </div>
                </div>
            </div>

            <SaveButton onClick={() => save(currentPayload)} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`JSON Import / Export (${lang.toUpperCase()})`}
                    data={currentPayload}
                    onImport={(parsed: any) => {
                        if (!parsed || typeof parsed !== 'object') return;
                        const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : []);
                        if (items.length > 0) {
                            if (items[0]) {
                                if (items[0].value !== undefined) setLiveProjects(String(items[0].value));
                                if (items[0].label !== undefined) setLabelProjects(items[0].label);
                            }
                            if (items[1]) {
                                if (items[1].value !== undefined) setCountries(String(items[1].value));
                                if (items[1].label !== undefined) setLabelCountries(items[1].label);
                            }
                            if (items[2]) {
                                if (items[2].value !== undefined) setUsersServed(String(items[2].value));
                                if (items[2].label !== undefined) setLabelUsers(items[2].label);
                            }
                            if (items[3]) {
                                if (items[3].value !== undefined) setYearsExperience(String(items[3].value));
                                if (items[3].label !== undefined) setLabelYears(items[3].label);
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}
