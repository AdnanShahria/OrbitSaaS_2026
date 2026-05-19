import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Send, Users, Loader2, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationLog {
    id: number;
    title: string;
    body: string;
    url: string;
    sent_count: number;
    failed_count: number;
    created_at: string;
}

export default function AdminNotifications() {
    const [subscribers, setSubscribers] = useState(0);
    const [history, setHistory] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/notifications?action=stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSubscribers(data.subscribers || 0);
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load notification stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            toast.error('Title and body are required');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/notifications?action=send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    body: body.trim(),
                    url: url.trim() || '/',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Notification sent!');
                setTitle('');
                setBody('');
                setUrl('');
                fetchStats();
            } else if (res.status === 404) {
                toast.error('No subscribers found. Users need to allow notifications first.');
            } else {
                throw new Error('Failed to send');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Push Notifications"
                description="Send browser push notifications to subscribed visitors."
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1 tracking-wide">Active Subscribers</p>
                        <h3 className="text-4xl font-black text-foreground">{subscribers}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-7 h-7 text-purple-500" />
                    </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1 tracking-wide">Total Sent</p>
                        <h3 className="text-4xl font-black text-foreground">{history.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Bell className="w-7 h-7 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Compose Notification */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                    <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                        <Send className="w-4 h-4 text-primary" />
                        Compose Notification
                    </h3>
                </div>
                <form onSubmit={handleSend} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. New Feature Launch!"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                            maxLength={100}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Body *
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="e.g. Check out our latest project showcase. We built something amazing!"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
                            rows={3}
                            maxLength={300}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{body.length}/300 characters</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Click URL <span className="font-normal normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. /project or https://orbitsaas.cloud"
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending || subscribers === 0}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {sending ? 'Sending...' : `Send to ${subscribers} subscriber${subscribers !== 1 ? 's' : ''}`}
                    </button>
                </form>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-secondary/30">
                        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Notification History
                        </h3>
                    </div>
                    <div className="divide-y divide-border">
                        <AnimatePresence>
                            {history.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Bell className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span className="font-semibold text-foreground text-sm truncate">{item.title}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 pl-5.5">{item.body}</p>
                                        {item.url && item.url !== '/' && (
                                            <div className="flex items-center gap-1 text-[10px] text-primary/70 mt-1 pl-5.5">
                                                <ExternalLink className="w-3 h-3" />
                                                <span className="truncate">{item.url}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            {item.sent_count} sent
                                        </div>
                                        {item.failed_count > 0 && (
                                            <span className="text-red-400">{item.failed_count} failed</span>
                                        )}
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
