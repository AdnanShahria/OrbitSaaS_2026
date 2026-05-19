import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ChevronLeft, ChevronRight, Clock, User, Shield, Edit3,
    Trash2, Plus, LogIn, CloudUpload, Download, Database, RefreshCw,
    Activity, Eye, ChevronDown, X, Loader2
} from 'lucide-react';

interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    entity_label?: string;
    changes_summary?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

interface AdminActivity {
    admin_email: string;
    last_seen: string;
    total_actions: number;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Edit3 }> = {
    create: { label: 'Created', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Plus },
    update: { label: 'Updated', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Edit3 },
    delete: { label: 'Deleted', color: 'text-red-400', bg: 'bg-red-500/10', icon: Trash2 },
    login: { label: 'Login', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: LogIn },
    cache_publish: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CloudUpload },
    cache_delete: { label: 'Cache Clear', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Trash2 },
    export: { label: 'Exported', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Download },
    seed: { label: 'Seeded', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Database },
    logout: { label: 'Logout', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: LogIn },
};

const ENTITY_COLORS: Record<string, string> = {
    content: '#3B82F6',
    transaction: '#10B981',
    category: '#F59E0B',
    savings_goal: '#8B5CF6',
    budget: '#EC4899',
    cache: '#14B8A6',
    auth: '#F97316',
    finance: '#10B981',
    system: '#6366F1',
};

function timeAgo(dateStr: string): string {
    const d = new Date(dateStr + 'Z');
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitials(email: string): string {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
}

function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 55%)`;
}

export default function AdminAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterAdmin, setFilterAdmin] = useState('');
    const [admins, setAdmins] = useState<string[]>([]);
    const [entityTypes, setEntityTypes] = useState<string[]>([]);
    const [adminActivity, setAdminActivity] = useState<AdminActivity[]>([]);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const limit = 40;
    const totalPages = Math.ceil(total / limit);

    const fetchLogs = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const params = new URLSearchParams({ action: 'audit', page: String(page), limit: String(limit) });
            if (search) params.set('search', search);
            if (filterAction) params.set('action_type', filterAction);
            if (filterEntity) params.set('entity_type', filterEntity);
            if (filterAdmin) params.set('admin', filterAdmin);

            const res = await fetch(`${API_BASE}/api/admin?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) { toast.error('Session expired'); return; }
            if (!res.ok) throw new Error('Failed');

            const json = await res.json();
            setLogs(json.logs || []);
            setTotal(json.total || 0);
            setAdmins(json.admins || []);
            setEntityTypes(json.entityTypes || []);
            setAdminActivity(json.adminActivity || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, search, filterAction, filterEntity, filterAdmin]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleRefresh = () => fetchLogs(false);

    const clearFilters = () => {
        setSearch('');
        setFilterAction('');
        setFilterEntity('');
        setFilterAdmin('');
        setPage(1);
    };

    const hasFilters = search || filterAction || filterEntity || filterAdmin;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SectionHeader
                    title="🔍 Audit Log"
                    description="Track every admin action — who changed what, when, and from where."
                />
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            {/* Admin Activity Cards */}
            {adminActivity.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {adminActivity.map((a) => {
                        const color = hashColor(a.admin_email);
                        return (
                            <motion.div
                                key={a.admin_email}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-white/10 transition-all duration-300 group cursor-pointer"
                                onClick={() => { setFilterAdmin(a.admin_email); setPage(1); }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 group-hover:scale-110 transition-transform duration-300"
                                    style={{ backgroundColor: color }}
                                >
                                    {getInitials(a.admin_email)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground truncate">{a.admin_email.split('@')[0]}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {timeAgo(a.last_seen)}
                                        </span>
                                        <span>·</span>
                                        <span>{a.total_actions} actions</span>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search actions, labels, admins..."
                        className="w-full bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border"
                    />
                </div>
                <select
                    value={filterAction}
                    onChange={e => { setFilterAction(e.target.value); setPage(1); }}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                    <option value="">All Actions</option>
                    {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <select
                    value={filterEntity}
                    onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                    <option value="">All Types</option>
                    {entityTypes.map(et => (
                        <option key={et} value={et}>{et.charAt(0).toUpperCase() + et.slice(1)}</option>
                    ))}
                </select>
                {admins.length > 1 && (
                    <select
                        value={filterAdmin}
                        onChange={e => { setFilterAdmin(e.target.value); setPage(1); }}
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer max-w-[180px]"
                    >
                        <option value="">All Admins</option>
                        {admins.map(a => (
                            <option key={a} value={a}>{a.split('@')[0]}</option>
                        ))}
                    </select>
                )}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
            ) : logs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No Audit Logs Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm text-center">
                        {hasFilters
                            ? 'No logs match your current filters. Try adjusting or clearing them.'
                            : 'Admin actions will appear here once you start using the panel. Try saving a section or publishing the cache.'}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {logs.map((log, i) => {
                            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.update;
                            const Icon = config.icon;
                            const entityColor = ENTITY_COLORS[log.entity_type] || '#71717a';
                            const adminColor = hashColor(log.admin_email);
                            const isExpanded = expandedLog === log.id;

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="group"
                                >
                                    <div
                                        className={`bg-card border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:border-white/10 ${isExpanded ? 'border-white/10 shadow-lg shadow-black/20' : 'border-border'}`}
                                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                    >
                                        {/* Main row */}
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {/* Timeline dot */}
                                            <div className="relative flex flex-col items-center">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Admin avatar */}
                                                    <div
                                                        className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black text-white shrink-0"
                                                        style={{ backgroundColor: adminColor }}
                                                        title={log.admin_email}
                                                    >
                                                        {getInitials(log.admin_email)}
                                                    </div>
                                                    <span className="text-xs font-semibold text-foreground">{log.admin_email.split('@')[0]}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    <span
                                                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                                        style={{ backgroundColor: `${entityColor}15`, color: entityColor }}
                                                    >
                                                        {log.entity_type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                                    {log.entity_label || log.changes_summary || `${log.action} on ${log.entity_type}`}
                                                </p>
                                            </div>

                                            {/* Time + expand */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                                                    {timeAgo(log.created_at)}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        <div
                                            className="grid transition-all duration-300 ease-in-out"
                                            style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <DetailItem label="Admin" value={log.admin_email} icon={User} />
                                                        <DetailItem label="Timestamp" value={formatDateTime(log.created_at)} icon={Clock} />
                                                        {log.entity_id && <DetailItem label="Entity ID" value={log.entity_id} icon={Database} />}
                                                        {log.ip_address && log.ip_address !== 'unknown' && <DetailItem label="IP Address" value={log.ip_address} icon={Shield} />}
                                                    </div>
                                                    {log.changes_summary && (
                                                        <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Summary</p>
                                                            <p className="text-sm text-foreground">{log.changes_summary}</p>
                                                        </div>
                                                    )}
                                                    {log.user_agent && log.user_agent !== 'unknown' && (
                                                        <p className="text-[10px] text-muted-foreground/50 font-mono truncate">{log.user_agent}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                    <span className="text-xs text-muted-foreground">{total} total entries</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-foreground font-medium">Page {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon: typeof User }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
                <p className="text-xs text-foreground font-medium truncate">{value}</p>
            </div>
        </div>
    );
}
