import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit3, Search, Filter, Download, X, Save, ArrowUpRight,
    ArrowDownRight, PiggyBank, Calendar, CreditCard, ChevronDown, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Transaction {
    id: string; type: string; amount: number; currency: string; category: string;
    subcategory?: string; description: string; date: string; project_id?: string;
    client_name?: string; payment_method: string; receipt_url?: string;
    tags: string[]; is_recurring: number; recurring_interval?: string; notes?: string;
}

interface Category { id: string; name: string; name_bn?: string; type: string; icon?: string; color?: string; }

const PAYMENT_METHODS = ['bKash', 'Nagad', 'Bank Transfer', 'Cash', 'PayPal', 'Wise', 'Stripe', 'Card', 'Other'];
const TYPES = [
    { value: 'income', label: 'Income', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { value: 'expense', label: 'Expense', color: 'text-red-400', bg: 'bg-red-500/10' },
    { value: 'savings_deposit', label: 'Savings Deposit', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { value: 'savings_withdrawal', label: 'Savings Withdrawal', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

function formatCurrency(amount: number, currency = 'BDT') {
    if (currency === 'USD') return `$${amount.toLocaleString()}`;
    return `৳${amount.toLocaleString()}`;
}

const emptyTx: Omit<Transaction, 'id'> = {
    type: 'expense', amount: 0, currency: 'BDT', category: '', description: '',
    date: new Date().toISOString().split('T')[0], payment_method: 'bKash',
    tags: [], is_recurring: 0, notes: '',
};

export default function AdminFinanceTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [form, setForm] = useState<any>({ ...emptyTx });
    const [saving, setSaving] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ action: 'transactions', page: String(page), limit: '30' });
            if (search) params.set('search', search);
            if (filterType) params.set('type', filterType);
            if (filterCategory) params.set('category', filterCategory);

            const res = await fetch(`${API_BASE}/api/finance?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setTransactions(json.transactions || []);
            setTotal(json.total || 0);
        } catch { toast.error('Failed to load transactions'); }
        finally { setLoading(false); }
    }, [page, search, filterType, filterCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=categories`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const json = await res.json(); setCategories(json.categories || []); }
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const openCreate = () => { setEditTx(null); setForm({ ...emptyTx }); setShowModal(true); };
    const openEdit = (tx: Transaction) => { setEditTx(tx); setForm({ ...tx }); setShowModal(true); };

    const handleSave = async () => {
        if (!form.description || !form.category || !form.amount) { toast.error('Fill required fields'); return; }
        setSaving(true);
        try {
            const method = editTx ? 'PUT' : 'POST';
            const url = editTx ? `${API_BASE}/api/finance?action=transactions&id=${editTx.id}` : `${API_BASE}/api/finance?action=transactions`;
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            if (res.ok) {
                toast.success(editTx ? 'Transaction updated' : 'Transaction created');
                setShowModal(false);
                fetchTransactions();
            } else { toast.error('Save failed'); }
        } catch { toast.error('Error saving'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this transaction?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=transactions&id=${id}`, { method: 'DELETE', headers });
            if (res.ok) { toast.success('Deleted'); fetchTransactions(); }
            else { toast.error('Delete failed'); }
        } catch { toast.error('Error'); }
    };

    const handleExport = () => {
        const params = new URLSearchParams({ action: 'export' });
        if (filterType) params.set('type', filterType);
        window.open(`${API_BASE}/api/finance?${params}`, '_blank');
    };

    const filteredCategories = filterType
        ? categories.filter(c => c.type === filterType || c.type === 'both')
        : categories;

    const formCategories = form.type
        ? categories.filter(c => c.type === form.type || c.type === 'both' || (form.type.startsWith('savings') && c.type === 'both'))
        : categories;

    const totalPages = Math.ceil(total / 30);

    const typeInfo = (type: string) => TYPES.find(t => t.value === type) || TYPES[1];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SectionHeader title="📊 Transactions" description="Manage all your income, expenses, and savings entries." />
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold shadow-lg shadow-emerald-500/20">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search descriptions, clients..."
                        className="w-full bg-secondary rounded-lg pl-9 pr-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border"
                    />
                </div>
                <select
                    value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                    <option value="">All Types</option>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select
                    value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer max-w-[200px]"
                >
                    <option value="">All Categories</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-[11px] font-bold border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No transactions found. Add your first one!</td></tr>
                                    ) : transactions.map(tx => {
                                        const ti = typeInfo(tx.type);
                                        return (
                                            <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground text-xs"><div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{tx.date}</div></td>
                                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${ti.bg} ${ti.color}`}>{ti.label}</span></td>
                                                <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{tx.description}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{tx.category}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{tx.client_name || '—'}</td>
                                                <td className="px-4 py-3"><span className="px-2 py-1 rounded-md text-[10px] font-medium bg-secondary border border-border text-muted-foreground">{tx.payment_method}</span></td>
                                                <td className={`px-4 py-3 text-right font-bold ${ti.color}`}>
                                                    {tx.type === 'income' || tx.type === 'savings_withdrawal' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">{total} total transactions</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-xs text-foreground font-medium">Page {page} / {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-foreground">{editTx ? 'Edit Transaction' : 'New Transaction'}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Type */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Type *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TYPES.map(t => (
                                            <button key={t.value} onClick={() => setForm((f: any) => ({ ...f, type: t.value, category: '' }))}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${form.type === t.value ? `${t.bg} ${t.color} border-current` : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
                                            >{t.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount + Currency */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-foreground block mb-1.5">Amount *</label>
                                        <input type="number" value={form.amount || ''} onChange={e => setForm((f: any) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                            className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-foreground block mb-1.5">Currency</label>
                                        <select value={form.currency} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))}
                                            className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer">
                                            <option value="BDT">৳ BDT</option>
                                            <option value="USD">$ USD</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Description *</label>
                                    <input type="text" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border" placeholder="e.g. Cloudflare Pro subscription" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Category *</label>
                                    <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                                        className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer">
                                        <option value="">Select category...</option>
                                        {formCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>

                                {/* Date + Payment Method */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-foreground block mb-1.5">Date *</label>
                                        <input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))}
                                            className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none border border-border" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-foreground block mb-1.5">Payment Method</label>
                                        <select value={form.payment_method} onChange={e => setForm((f: any) => ({ ...f, payment_method: e.target.value }))}
                                            className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer">
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Client Name */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Client / Source</label>
                                    <input type="text" value={form.client_name || ''} onChange={e => setForm((f: any) => ({ ...f, client_name: e.target.value }))}
                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border" placeholder="Client or source name" />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
                                    <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2}
                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border resize-y" placeholder="Optional notes..." />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editTx ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
