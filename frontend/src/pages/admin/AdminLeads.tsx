import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Trash2, Mail, Loader2, Calendar, Globe, Users, Target, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
    id: number;
    email: string;
    source: string;
    name?: string;
    interest?: string;
    chat_summary?: string;
    created_at: string;
}

export default function AdminLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVisitors, setTotalVisitors] = useState<number>(0);
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';

            const [leadsRes, visitorsRes] = await Promise.all([
                fetch(`${API_BASE}/api/leads?action=list`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE}/api/leads?action=visitors`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (leadsRes.ok) {
                const data = await leadsRes.json();
                setLeads(data.leads || []);
            }
            if (visitorsRes.ok) {
                const vData = await visitorsRes.json();
                setTotalVisitors(vData.count || 0);
            }

        } catch (err) {
            console.error(err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/leads?action=list&id=${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                toast.success('Lead deleted');
                setLeads(leads.filter(l => l.id !== id));

                // Trigger cache rebuild so chatbot AI context stays fresh
                fetch(`${API_BASE}/api/admin?action=cache`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }).catch(() => { /* cache rebuild is best-effort */ });
            } else {
                toast.error('Failed to delete lead');
            }
        } catch {
            toast.error('An error occurred');
        }
    };

    const exportCSV = () => {
        if (leads.length === 0) return toast.error('No leads to export');

        const headers = ['ID', 'Email', 'Source', 'Intent', 'Chat Summary', 'Date'];
        const csvContent = [
            headers.join(','),
            ...leads.map(lead => [
                lead.id,
                lead.email,
                `"${(lead.source || '').replace(/"/g, '""')}"`,
                `"${(lead.interest || '').replace(/"/g, '""')}"`,
                `"${(lead.chat_summary || '').replace(/"/g, '""')}"`,
                new Date(lead.created_at).toLocaleString().replace(/,/g, '')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `orbitsaas_leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Exporting leads...');
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <Skeleton className="h-12 w-full border-b border-border rounded-none" />
                    <div className="divide-y divide-border">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-5 w-48" />
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SectionHeader
                    title="Traffic & Leads"
                    description="Monitor your website visitors and email waitlist conversion."
                />
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1 tracking-wide">Total Unique Visitors</p>
                        <h3 className="text-4xl font-black text-foreground">{totalVisitors}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-7 h-7 text-blue-500" />
                    </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1 tracking-wide">Total Emails Captured</p>
                        <h3 className="text-4xl font-black text-foreground">{leads.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Target className="w-7 h-7 text-green-500" />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-[11px] font-bold border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Lead Email</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Intent / Interest</th>
                                <th className="px-6 py-4">Captured At</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <AnimatePresence>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            No leads captured yet. They will appear here once visitors submit their emails.
                                        </td>
                                    </tr>
                                ) : leads.map((lead) => (
                                    <React.Fragment key={lead.id}>
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Mail className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium text-foreground">{lead.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary w-fit text-xs font-medium text-muted-foreground border border-border">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    {lead.source}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.interest ? (
                                                    <div className="flex items-start gap-2 max-w-[200px] text-xs text-muted-foreground">
                                                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                                                        <span className="truncate" title={lead.interest}>{lead.interest}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(lead.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {lead.chat_summary && (
                                                        <button
                                                            onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${expandedLeadId === lead.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                                        >
                                                            {expandedLeadId === lead.id ? 'Hide Chat' : 'View Chat'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(lead.id)}
                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                        title="Delete Lead"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>

                                        <AnimatePresence>
                                            {expandedLeadId === lead.id && lead.chat_summary && (
                                                <motion.tr
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    <td colSpan={5} className="px-6 py-4 bg-muted/20 border-b border-border">
                                                        <div className="p-4 bg-card border border-border rounded-xl shadow-inner max-h-[300px] overflow-y-auto">
                                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                                                                <MessageSquare className="w-4 h-4 text-primary" />
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chat History Context</h4>
                                                            </div>
                                                            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                                                                {lead.chat_summary}
                                                            </pre>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
