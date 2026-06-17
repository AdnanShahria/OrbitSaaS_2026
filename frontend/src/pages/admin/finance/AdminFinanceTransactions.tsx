import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit3, Search, Download, X, Save,
    Calendar, CreditCard, Loader2, ChevronLeft, ChevronRight, Settings, PlusCircle, Users, Share2, Shield, TrendingUp, TrendingDown, Landmark, HelpCircle, LayoutDashboard
} from 'lucide-react';

interface Transaction {
    id: string; type: string; amount: number; currency: string; category: string;
    subcategory?: string; description: string; date: string; project_id?: string;
    client_name?: string; payment_method: string; receipt_url?: string;
    tags: string[]; is_recurring: number; recurring_interval?: string; notes?: string;
    recipient?: string; parent_id?: string; created_at?: string; updated_at?: string; created_by?: string; updated_by?: string;
}

interface Category { id: string; name: string; name_bn?: string; type: string; icon?: string; color?: string; }

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'bKash', 'Nagad', 'PayPal', 'Stripe', 'Card', 'Wise', 'Other'];
const TYPES = [
    { value: 'income', label: 'Income', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { value: 'expense', label: 'Expense (from Funding)', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { value: 'distribution', label: 'Distribution', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
];

function formatCurrency(amount: number, currency = 'BDT') {
    if (currency === 'USD') return `$${amount.toLocaleString()}`;
    return `৳${amount.toLocaleString()}`;
}

const emptyTx: Omit<Transaction, 'id'> = {
    type: 'income', amount: 0, currency: 'BDT', category: '', description: '',
    date: new Date().toISOString().split('T')[0], payment_method: 'Bank Transfer',
    tags: [], is_recurring: 0, notes: '', recipient: '', parent_id: '',
};

export default function AdminFinanceTransactions() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [form, setForm] = useState<any>({ ...emptyTx });
    const [saving, setSaving] = useState(false);

    // Distribution split percentages (for Income form)
    const [companyFundingPercent, setCompanyFundingPercent] = useState(30);
    const [brokerPercent, setBrokerPercent] = useState(10);
    const [marketingPercent, setMarketingPercent] = useState(25);
    const [devPercent, setDevPercent] = useState(35);

    // Miscellaneous Expense inside Income Modal State
    const [miscExpenseAmount, setMiscExpenseAmount] = useState(0);
    const [miscExpenseDescription, setMiscExpenseDescription] = useState('Tea/coffee & bus fare');

    // Corporate Funding Report View Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [rawReportTxs, setRawReportTxs] = useState<Transaction[]>([]);
    const [reportTimeline, setReportTimeline] = useState<string>('overall');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [reportLoading, setReportLoading] = useState(false);

    // Category Creator State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('expense');
    const [newCatColor, setNewCatColor] = useState('#10B981');
    const [catSaving, setCatSaving] = useState(false);

    // Toggle exact timestamps state
    const [expandedTimestamps, setExpandedTimestamps] = useState<Record<string, boolean>>({});

    // OTP Modal States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [selectedOtpEmail, setSelectedOtpEmail] = useState('adnanshahria2019@gmail.com');
    const [financeToken, setFinanceToken] = useState<string | null>(() => {
        // Hard cache: only restore from localStorage if the JWT is still valid (not expired)
        const cached = localStorage.getItem('finance_token');
        if (!cached) return null;
        try {
            const payload = JSON.parse(atob(cached.split('.')[1]));
            if (payload.exp && Date.now() / 1000 > payload.exp) {
                // Token expired — evict from cache
                localStorage.removeItem('finance_token');
                return null;
            }
            return cached;
        } catch {
            localStorage.removeItem('finance_token');
            return null;
        }
    });
    const [otpSent, setOtpSent] = useState(false);
    const [isOtpDropdownOpen, setIsOtpDropdownOpen] = useState(false);
    const pendingActionRef = useRef<((token: string) => Promise<void>) | null>(null);

    const OTP_EMAILS = [
        { label: 'Adnan Shahria (adnanshahria2019@gmail.com)', value: 'adnanshahria2019@gmail.com' },
        { label: 'Abdur Rafiu (abdurrafiu7@gmail.com)', value: 'abdurrafiu7@gmail.com' },
    ];

    /** Clears the finance token from state + localStorage and re-opens the OTP modal. */
    const invalidateFinanceToken = (actionFn: (token: string) => Promise<void>) => {
        localStorage.removeItem('finance_token');
        setFinanceToken(null);
        pendingActionRef.current = actionFn;
        setShowOtpModal(true);
        setOtpSent(false);
        setOtpInput('');
        toast.error('Financial session expired. Please re-verify your identity.');
    };

    const triggerOtpAndExecute = async (actionFn: (token: string) => Promise<void>) => {
        const currentToken = financeToken || localStorage.getItem('finance_token');
        if (currentToken) {
            try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                if (!payload.exp || Date.now() / 1000 > payload.exp) {
                    invalidateFinanceToken(actionFn);
                    return;
                }
                if (!financeToken) {
                    setFinanceToken(currentToken);
                }
            } catch {
                invalidateFinanceToken(actionFn);
                return;
            }
            await actionFn(currentToken);
            return;
        }
        pendingActionRef.current = actionFn;
        setShowOtpModal(true);
        setOtpSent(false);
        setOtpInput('');
    };

    const closeOtpModal = () => {
        setShowOtpModal(false);
        pendingActionRef.current = null;
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/finance-otp?action=send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: selectedOtpEmail })
            });
            if (!res.ok) throw new Error('Failed to send OTP');
            toast.success(`Financial OTP sent to ${selectedOtpEmail}.`);
            setOtpSent(true);
        } catch (err: any) {
            console.error('OTP Send error', err);
            toast.error('Failed to send OTP email.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput) {
            toast.error('Please enter the OTP.');
            return;
        }

        setIsVerifyingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/finance-otp?action=verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ code: otpInput })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Financial authorization verified!');
                setFinanceToken(data.finance_token);
                localStorage.setItem('finance_token', data.finance_token);
                setShowOtpModal(false);
                setOtpInput('');
                setOtpSent(false);
                if (pendingActionRef.current) {
                    await pendingActionRef.current(data.finance_token);
                    pendingActionRef.current = null;
                }
            } else {
                toast.error(data.error || 'Invalid or expired OTP');
            }
        } catch (err: any) {
            console.error('OTP Verify error', err);
            toast.error('Failed to verify OTP.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const formatExactTimestamp = (createdAt?: string, fallbackDate?: string) => {
        const val = createdAt || fallbackDate;
        if (!val) return '—';
        try {
            let utcDateStr = val;
            if (val.includes(' ') && !val.includes('T')) {
                utcDateStr = val.replace(' ', 'T') + 'Z';
            } else if (!val.includes('Z') && !val.includes('T')) {
                utcDateStr = val + 'T12:00:00Z';
            }
            const date = new Date(utcDateStr);
            if (isNaN(date.getTime())) {
                return val;
            }
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            return `${timeStr}, ${dateStr}`;
        } catch {
            return val;
        }
    };

    const toggleTimestamp = (txId: string) => {
        setExpandedTimestamps(prev => ({ ...prev, [txId]: !prev[txId] }));
    };

    const API_BASE = import.meta.env.VITE_API_URL || '';
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ action: 'transactions', page: String(page), limit: '30', _t: Date.now().toString() });
            if (search) params.set('search', search);
            if (filterType) params.set('type', filterType);
            if (filterCategory) params.set('category', filterCategory);

            const res = await fetch(`${API_BASE}/api/finance?${params}`, { 
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setTransactions(json.transactions || []);
            setTotal(json.total || 0);
        } catch { toast.error('Failed to load transactions'); }
        finally { setLoading(false); }
    }, [page, search, filterType, filterCategory, API_BASE, token]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=categories&_t=${Date.now()}`, { 
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const json = await res.json();
                setCategories(json.categories || []);
            }
        } catch { /* silent */ }
    }, [API_BASE, token]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const openCreate = () => {
        setEditTx(null);
        setForm({ ...emptyTx, subcategory: 'Pending' });
        setMiscExpenseAmount(0);
        setMiscExpenseDescription('Tea/coffee & bus fare');
        setShowModal(true);
    };

    const openEdit = (tx: Transaction) => {
        setEditTx(tx);
        setForm({ ...tx });
        setMiscExpenseAmount(0);
        setMiscExpenseDescription('Tea/coffee & bus fare');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.description || !form.amount) { toast.error('Fill required fields'); return; }
        if (form.type !== 'distribution' && !form.category) { toast.error('Please select a category'); return; }
        if (form.type === 'distribution' && !form.recipient) { toast.error('Please specify a recipient'); return; }

        triggerOtpAndExecute(async (fToken) => {
            setSaving(true);
            try {
                const payload = { ...form };

                // For Income type: Calculate & inject the automatic distributions
                if (form.type === 'income' && !editTx) {
                    payload.misc_amount = miscExpenseAmount;
                    payload.misc_description = miscExpenseDescription;

                    // Subtract misc directly from the parent income amount
                    const netIncomeAmount = Math.max(0, form.amount - miscExpenseAmount);
                    payload.amount = netIncomeAmount;

                    const companyAmt = Math.round((netIncomeAmount * companyFundingPercent) / 100);
                    const brokerAmt = Math.round((netIncomeAmount * brokerPercent) / 100);
                    const marketingAmt = Math.round((netIncomeAmount * marketingPercent) / 100);
                    const devAmt = Math.round((netIncomeAmount * devPercent) / 100);

                    payload.distributions = [
                        { recipient: 'Company Funding', amount: companyAmt },
                        { recipient: 'Broker Allowance', amount: brokerAmt },
                        { recipient: 'Marketing Team', amount: marketingAmt },
                        { recipient: 'Development Team', amount: devAmt }
                    ];
                }

                const method = editTx ? 'PUT' : 'POST';
                const url = editTx ? `${API_BASE}/api/finance?action=transactions&id=${editTx.id}` : `${API_BASE}/api/finance?action=transactions`;
                const res = await fetch(url, {
                    method,
                    headers: { ...headers, 'Finance-Token': fToken },
                    body: JSON.stringify(payload)
                });

                // If the backend rejects the token, evict cache and re-prompt
                if (res.status === 401) {
                    setSaving(false);
                    invalidateFinanceToken(async (newToken) => {
                        setSaving(true);
                        try {
                            const retryRes = await fetch(url, {
                                method,
                                headers: { ...headers, 'Finance-Token': newToken },
                                body: JSON.stringify(payload)
                            });
                            if (!retryRes.ok) throw new Error();
                            toast.success(editTx ? 'Transaction updated!' : 'Transaction saved!');
                            setShowModal(false);
                            fetchTransactions();
                        } catch { toast.error('Failed to save transaction'); }
                        finally { setSaving(false); }
                    });
                    return;
                }

                if (!res.ok) throw new Error();
                toast.success(editTx ? 'Transaction updated!' : 'Transaction saved!');
                setShowModal(false);
                fetchTransactions();
            } catch { toast.error('Failed to save transaction'); }
            finally { setSaving(false); }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this transaction?')) return;
        triggerOtpAndExecute(async (fToken) => {
            try {
                const res = await fetch(`${API_BASE}/api/finance?action=transactions&id=${id}`, {
                    method: 'DELETE',
                    headers: { ...headers, 'Finance-Token': fToken }
                });
                // If the backend rejects the token, evict cache and re-prompt
                if (res.status === 401) {
                    invalidateFinanceToken(async (newToken) => {
                        try {
                            const retryRes = await fetch(`${API_BASE}/api/finance?action=transactions&id=${id}`, {
                                method: 'DELETE',
                                headers: { ...headers, 'Finance-Token': newToken }
                            });
                            if (!retryRes.ok) throw new Error();
                            toast.success('Transaction deleted!');
                            fetchTransactions();
                        } catch { toast.error('Failed to delete transaction'); }
                    });
                    return;
                }
                if (!res.ok) throw new Error();
                toast.success('Transaction deleted!');
                fetchTransactions();
            } catch { toast.error('Failed to delete transaction'); }
        });
    };

    const handleCreateCategory = async () => {
        if (!newCatName) return;
        setCatSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: newCatName,
                    type: newCatType,
                    icon: '📦',
                    color: newCatColor
                })
            });
            if (res.ok) {
                toast.success('Category created successfully!');
                setNewCatName('');
                fetchCategories();
            } else { toast.error('Failed to create category'); }
        } catch { toast.error('Error'); }
        finally { setCatSaving(false); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Delete this category? Transactions may lose mapping.')) return;
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=categories&id=${id}`, { method: 'DELETE', headers });
            if (res.ok) {
                toast.success('Category deleted successfully');
                fetchCategories();
            } else { toast.error('Delete failed'); }
        } catch { toast.error('Error'); }
    };

    // Typable Money Input Split Logic & Auto-balancer of 4th Field
    const handleSplitChange = (field: 'company' | 'broker' | 'marketing' | 'dev', key: 'percent' | 'amount', value: number) => {
        const totalAmt = form.amount || 0;
        if (totalAmt <= 0) {
            toast.error('Please enter transaction amount first!');
            return;
        }

        let targetPct = 0;
        if (key === 'percent') {
            targetPct = Math.min(100, Math.max(0, value));
        } else {
            targetPct = Math.min(100, Math.max(0, Math.round((value / totalAmt) * 100)));
        }

        if (field === 'company') {
            setCompanyFundingPercent(targetPct);
            const sum = targetPct + brokerPercent + marketingPercent;
            setDevPercent(Math.max(0, Math.min(100, 100 - sum)));
        } else if (field === 'broker') {
            setBrokerPercent(targetPct);
            const sum = companyFundingPercent + targetPct + marketingPercent;
            setDevPercent(Math.max(0, Math.min(100, 100 - sum)));
        } else if (field === 'marketing') {
            setMarketingPercent(targetPct);
            const sum = companyFundingPercent + brokerPercent + targetPct;
            setDevPercent(Math.max(0, Math.min(100, 100 - sum)));
        } else if (field === 'dev') {
            setDevPercent(targetPct);
            const sum = brokerPercent + marketingPercent + targetPct;
            setCompanyFundingPercent(Math.max(0, Math.min(100, 100 - sum)));
        }
    };

    const handleAutoBalance = () => {
        const sum = companyFundingPercent + brokerPercent + marketingPercent + devPercent;
        if (sum === 0) {
            setCompanyFundingPercent(30);
            setBrokerPercent(10);
            setMarketingPercent(25);
            setDevPercent(35);
            return;
        }
        const factor = 100 / sum;
        const cVal = Math.round(companyFundingPercent * factor);
        const bVal = Math.round(brokerPercent * factor);
        const mVal = Math.round(marketingPercent * factor);
        const dVal = 100 - (cVal + bVal + mVal);
        setCompanyFundingPercent(cVal);
        setBrokerPercent(bVal);
        setMarketingPercent(mVal);
        setDevPercent(dVal);
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({ action: 'export' });
            if (filterType) params.set('type', filterType);
            const res = await fetch(`${API_BASE}/api/finance?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { toast.error('Export failed'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orbit_finance_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch { toast.error('Export error'); }
    };

    // Load Overall Company Funding Report
    const loadCompanyReport = async () => {
        setReportLoading(true);
        setShowReportModal(true);
        setReportTimeline('overall');
        setCustomStartDate('');
        setCustomEndDate('');
        try {
            const res = await fetch(`${API_BASE}/api/finance?action=transactions&limit=2000&_t=${Date.now()}`, { 
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const json = await res.json();
                setRawReportTxs(json.transactions || []);
            }
        } catch {
            toast.error('Failed to load corporate funding reports');
        } finally {
            setReportLoading(false);
        }
    };

    // Dynamically filter and calculate ledger statistics
    const reportData = useMemo(() => {
        if (!rawReportTxs || rawReportTxs.length === 0) return null;

        const now = new Date();
        let filtered = [...rawReportTxs];

        if (reportTimeline === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday as start of week
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = rawReportTxs.filter(t => new Date(t.date + 'T00:00:00') >= startOfWeek);
        } else if (reportTimeline === 'this_month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            filtered = rawReportTxs.filter(t => new Date(t.date + 'T00:00:00') >= startOfMonth);
        } else if (reportTimeline === 'previous_month') {
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            startOfPrevMonth.setHours(0, 0, 0, 0);
            endOfPrevMonth.setHours(23, 59, 59, 999);
            filtered = rawReportTxs.filter(t => {
                const d = new Date(t.date + 'T00:00:00');
                return d >= startOfPrevMonth && d <= endOfPrevMonth;
            });
        } else if (reportTimeline === 'six_months') {
            const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            startOfSixMonthsAgo.setHours(0, 0, 0, 0);
            filtered = rawReportTxs.filter(t => new Date(t.date + 'T00:00:00') >= startOfSixMonthsAgo);
        } else if (reportTimeline === 'this_year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            startOfYear.setHours(0, 0, 0, 0);
            filtered = rawReportTxs.filter(t => new Date(t.date + 'T00:00:00') >= startOfYear);
        } else if (reportTimeline === 'custom') {
            const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
            const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;

            filtered = rawReportTxs.filter(t => {
                const d = new Date(t.date + 'T00:00:00');
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
            });
        }

        // Funding allocated into "Company Funding"
        const fundingTxs = filtered.filter(t => t.type === 'distribution' && t.recipient === 'Company Funding');
        const totalFunding = fundingTxs.reduce((sum, t) => sum + t.amount, 0);

        // Corporate operational expenses (normal expenses)
        const expenseTxs = filtered.filter(t => t.type === 'expense');
        const totalExpenses = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

        // Deducted misc expenses
        const miscTxs = filtered.filter(t => t.type === 'expense' && t.recipient === 'Company Funding' && t.subcategory === 'Misc Income Deduction');
        const totalMisc = miscTxs.reduce((sum, t) => sum + t.amount, 0);

        // Net Available Reserve
        const netBalance = totalFunding - totalExpenses;

        // Combined Ledger (Injections + Expenses)
        const ledger = filtered.filter(t =>
            (t.type === 'distribution' && t.recipient === 'Company Funding') ||
            (t.type === 'expense')
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalFunding,
            totalExpenses,
            totalMisc,
            netBalance,
            fundingTxs,
            expenseTxs,
            ledger
        };
    }, [rawReportTxs, reportTimeline, customStartDate, customEndDate]);

    const formCategories = categories.filter(c => c.type === form.type || c.type === 'both');
    const totalPages = Math.ceil(total / 30);
    const typeInfo = (type: string) => TYPES.find(t => t.value === type) || { label: type, color: 'text-muted-foreground', bg: 'bg-secondary' };

    // Live split calculations
    const totalSplitPercent = companyFundingPercent + brokerPercent + marketingPercent + devPercent;
    const companyFundingShare = Math.round((form.amount * companyFundingPercent) / 100);
    const brokerShare = Math.round((form.amount * brokerPercent) / 100);
    const marketingShare = Math.round((form.amount * marketingPercent) / 100);
    const devShare = Math.round((form.amount * devPercent) / 100);

    return (
        <div className="space-y-6 relative">
            {/* Financial OTP Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card/95 border border-indigo-500/20 p-8 rounded-3xl shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] w-full max-w-md relative"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

                            <button
                                type="button"
                                onClick={closeOtpModal}
                                className="absolute top-5 right-5 text-muted-foreground/70 hover:text-foreground hover:bg-secondary/50 p-2 rounded-full transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <motion.div
                                    initial={{ scale: 0.5, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner"
                                >
                                    <Shield className="w-8 h-8 text-indigo-400" />
                                </motion.div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Financial Identity</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {!otpSent ? 'Select your email to receive an authorization code.' : 'Enter the 6-digit OTP sent to your email.'}
                                    </p>
                                </div>

                                {!otpSent ? (
                                    <div className="w-full space-y-4 mt-2">
                                        <div className="relative group text-left">
                                            <button
                                                type="button"
                                                onClick={() => setIsOtpDropdownOpen(!isOtpDropdownOpen)}
                                                className="w-full flex items-center justify-between bg-secondary/50 hover:bg-secondary/80 transition-colors border border-border/50 rounded-xl px-4 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
                                            >
                                                <span className="truncate pr-4">{OTP_EMAILS.find(e => e.value === selectedOtpEmail)?.label || selectedOtpEmail}</span>
                                                <div className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOtpDropdownOpen ? 'rotate-180' : ''}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {isOtpDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute top-full left-0 w-full mt-2 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                                                    >
                                                        {OTP_EMAILS.map((emailObj) => (
                                                            <button
                                                                key={emailObj.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOtpEmail(emailObj.value);
                                                                    setIsOtpDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-3.5 text-sm transition-colors ${selectedOtpEmail === emailObj.value
                                                                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold border-l-2 border-indigo-500'
                                                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent'
                                                                    }`}
                                                            >
                                                                {emailObj.label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={isSendingOtp}
                                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                                        >
                                            {isSendingOtp ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending Secure OTP...</> : 'Send Authorization Code'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-5 mt-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="••••••"
                                            value={otpInput}
                                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                            className="w-full text-center text-4xl tracking-[0.5em] font-mono py-4 bg-white text-indigo-950 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all placeholder:text-indigo-950/30 font-bold"
                                            disabled={isVerifyingOtp}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleVerifyOtp}
                                            disabled={isVerifyingOtp || otpInput.length < 6}
                                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                                        >
                                            {isVerifyingOtp ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Identity...</> : 'Verify & Authorize'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <SectionHeader title="📊 Corporate Transactions" description="Track and partition SaaS income, operational funding expenses, and distribution splits." />
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                    <button onClick={() => navigate('/admin/finance')} className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium transition-all">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={loadCompanyReport} className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 text-sm font-medium transition-all">
                        <Landmark className="w-4 h-4" /> Company Funding Ledger
                    </button>
                    <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium transition-all">
                        <Settings className="w-4 h-4" /> Entity & Category Manager
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium transition-all">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Transaction
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search descriptions, clients, recipients..."
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
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-secondary/50 text-muted-foreground uppercase tracking-wider text-[11px] font-bold border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Category/Recipient</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No transactions found.</td></tr>
                                    ) : transactions.map(tx => {
                                        const ti = typeInfo(tx.type);
                                        return (
                                            <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                                        <span className="font-mono">
                                                            {expandedTimestamps[tx.id]
                                                                ? formatExactTimestamp(tx.created_at, tx.date)
                                                                : tx.date
                                                            }
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleTimestamp(tx.id);
                                                            }}
                                                            title="Toggle exact timestamp"
                                                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground/50 hover:text-indigo-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                                                        >
                                                            <HelpCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${ti.bg} ${ti.color}`}>{ti.label}</span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground max-w-[240px] truncate">
                                                    <div>{tx.description}</div>
                                                    {tx.parent_id && <div className="text-[10px] text-primary">Linked to Income Split</div>}
                                                    {tx.created_by && (
                                                        <div className="text-[10px] text-muted-foreground mt-1">
                                                            By: <span className="text-indigo-400">{tx.created_by.split('@')[0]}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                    {tx.type === 'distribution' ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                                                                <Users className="w-3.5 h-3.5" /> {tx.recipient || 'N/A'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${tx.subcategory === 'Distributed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'}`}>
                                                                {tx.subcategory || 'Pending'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        tx.category
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{tx.client_name || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-secondary border border-border text-muted-foreground">{tx.payment_method}</span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${ti.color}`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
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

            {/* Custom Category Maker Modal */}
            <AnimatePresence>
                {showCategoryModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-primary animate-spin" /> Entity & Category Manager
                                </h2>
                                <button onClick={() => setShowCategoryModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="bg-secondary/40 border border-border rounded-xl p-4 mb-5 space-y-4">
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Create New Entity or Category</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Name *</label>
                                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                                            placeholder="e.g. Server Upgrades" className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Type *</label>
                                        <select value={newCatType} onChange={e => setNewCatType(e.target.value)}
                                            className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border cursor-pointer">
                                            <option value="income">Income</option>
                                            <option value="expense">Expense</option>
                                            <option value="distribution">Distribution</option>
                                            <option value="both">Both (Income & Expense)</option>
                                            <option value="receiver">Receiver (Recipient)</option>
                                            <option value="client">Client</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Hex Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-9 h-9 p-0 bg-transparent border-0 cursor-pointer animate-pulse" />
                                            <input type="text" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border" />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCreateCategory} disabled={catSaving}
                                    className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    <PlusCircle className="w-4 h-4" /> Create Category
                                </button>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">All Active Entities & Categories</h3>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2.5 bg-secondary/20 border border-border/80 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: cat.color || '#10B981', boxShadow: `0 0 8px ${cat.color || '#10B981'}44` }} />
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{cat.type}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dedicated Overall Company Funding Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowReportModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className="bg-card/95 border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.25)] rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar transition-all"
                        >
                            <div className="flex items-center justify-between mb-6 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">🏢 Corporate Reserve & Funding Ledger</h2>
                                        <p className="text-xs text-muted-foreground">Comprehensive overview of company allocations, operational expenses, and custom deductions.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Dynamic Timeline Selector */}
                            {!reportLoading && rawReportTxs.length > 0 && (
                                <div className="mb-6 space-y-4">
                                    <div className="bg-secondary/40 border border-border/80 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                                            <span className="text-xs font-semibold text-muted-foreground">Ledger Period:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { id: 'overall', label: 'Overall' },
                                                { id: 'this_week', label: 'This Week' },
                                                { id: 'this_month', label: 'This Month' },
                                                { id: 'previous_month', label: 'Previous Month' },
                                                { id: 'six_months', label: '6 Months' },
                                                { id: 'this_year', label: 'This Year' },
                                                { id: 'custom', label: 'Custom Range' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setReportTimeline(opt.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${reportTimeline === opt.id
                                                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25 scale-[1.02]'
                                                            : 'bg-secondary/60 border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Range Date Pickers */}
                                    <AnimatePresence>
                                        {reportTimeline === 'custom' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                exit={{ opacity: 0, y: -8, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-indigo-300 block">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={customStartDate}
                                                            onChange={e => setCustomStartDate(e.target.value)}
                                                            className="w-full bg-secondary/80 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-indigo-300 block">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={customEndDate}
                                                            onChange={e => setCustomEndDate(e.target.value)}
                                                            className="w-full bg-secondary/80 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {reportLoading ? (
                                <div className="space-y-4 py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                                    <p className="text-sm text-muted-foreground">Generating live balance statements and operational ledger audit...</p>
                                </div>
                            ) : reportData ? (
                                <div className="space-y-6">
                                    {/* Stat Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-1">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                {reportTimeline === 'overall' ? 'All-Time Funding' : 'Allocated Funding'}
                                            </span>
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-extrabold text-indigo-400">{formatCurrency(reportData.totalFunding)}</p>
                                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                                            </div>
                                        </div>
                                        <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-1">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Operational Expenses</span>
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-extrabold text-rose-400">{formatCurrency(reportData.totalExpenses)}</p>
                                                <TrendingDown className="w-4 h-4 text-rose-400" />
                                            </div>
                                        </div>
                                        <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-1">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Misc Deductions</span>
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-extrabold text-amber-400">{formatCurrency(reportData.totalMisc)}</p>
                                                <Landmark className="w-4 h-4 text-amber-400" />
                                            </div>
                                        </div>
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-1">
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                                {reportTimeline === 'overall' ? 'Net Available Reserve' : 'Period Net Balance'}
                                            </span>
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-extrabold text-emerald-400">{formatCurrency(reportData.netBalance)}</p>
                                                <Landmark className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed ledger table */}
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                                            📋 Corporate Ledger Audit Timeline
                                        </h3>
                                        <div className="border border-border/80 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left text-xs whitespace-nowrap">
                                                <thead className="bg-secondary/60 text-muted-foreground uppercase font-bold sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Date</th>
                                                        <th className="px-4 py-2.5">Mutation Type</th>
                                                        <th className="px-4 py-2.5">Item / Description</th>
                                                        <th className="px-4 py-2.5">Subcategory</th>
                                                        <th className="px-4 py-2.5 text-right">Impact</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {reportData.ledger.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                                                                No corporate ledger activities found for this timeline period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        reportData.ledger.map((item: any) => {
                                                            const isFunding = item.type === 'distribution';
                                                            return (
                                                                <tr key={item.id} className="hover:bg-muted/20">
                                                                    <td className="px-4 py-2.5 text-muted-foreground">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono">
                                                                                {expandedTimestamps[item.id]
                                                                                    ? formatExactTimestamp(item.created_at, item.date)
                                                                                    : item.date
                                                                                }
                                                                            </span>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    toggleTimestamp(item.id);
                                                                                }}
                                                                                title="Toggle exact timestamp"
                                                                                className="p-1 rounded-md hover:bg-secondary text-muted-foreground/50 hover:text-indigo-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                                                                            >
                                                                                <HelpCircle className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${isFunding ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                                            {isFunding ? 'Funding Split Inflow' : 'Operational Expense'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-2.5 font-medium text-foreground max-w-[250px] truncate">{item.description}</td>
                                                                    <td className="px-4 py-2.5 text-muted-foreground">{item.subcategory || 'General'}</td>
                                                                    <td className={`px-4 py-2.5 text-right font-bold ${isFunding ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {isFunding ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center py-6 text-muted-foreground text-sm">Failed to generate reports.</p>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition-all">Close Report</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Transaction Create / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-400" /> {editTx ? 'Edit Corporate Transaction' : 'Record Corporate Mutation'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Type Select */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">System Type *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {TYPES.map(t => (
                                            <button key={t.value} onClick={() => setForm((f: any) => ({ ...f, type: t.value, category: '' }))}
                                                className={`px-2 py-2.5 rounded-lg text-xs font-bold border transition-all ${form.type === t.value ? `${t.bg} ${t.color} border-current` : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
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
                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border" placeholder="e.g. Agency Retainer, Server Upgrades" />
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

                                {/* ──────── INCOME-SPECIFIC FIELDS AND SPLIT LIVE VISUALIZER ──────── */}
                                {form.type === 'income' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-1.5">Category *</label>
                                                <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                                                    className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer">
                                                    <option value="">Select category...</option>
                                                    {formCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-1.5">Client / Source</label>
                                                <input type="text" list="clientList" value={form.client_name || ''} onChange={e => setForm((f: any) => ({ ...f, client_name: e.target.value }))}
                                                    className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none border border-border" placeholder="Client Name" />
                                                <datalist id="clientList">
                                                    {categories.filter(c => c.type === 'client').map(c => (
                                                        <option key={c.id} value={c.name} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>

                                        {!editTx && (
                                            <div className="bg-secondary/40 border border-primary/20 rounded-xl p-4 space-y-4">
                                                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                                                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                                        <Share2 className="w-3.5 h-3.5 text-primary" /> Live Distribution Split (Automatic)
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalSplitPercent === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        Total: {totalSplitPercent}%
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Company Funding */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-muted-foreground flex items-center gap-1">🏢 Company Funding:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Amt:</span>
                                                                <input type="number" min="0" value={companyFundingShare}
                                                                    onChange={e => handleSplitChange('company', 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-20 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="0" max="100" value={companyFundingPercent}
                                                                onChange={e => handleSplitChange('company', 'percent', parseInt(e.target.value) || 0)}
                                                                className="flex-1 accent-emerald-500 bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer" />
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min="0" max="100" value={companyFundingPercent}
                                                                    onChange={e => handleSplitChange('company', 'percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                                    className="w-12 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                                <span className="text-xs text-muted-foreground">%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Broker Allowance */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-muted-foreground flex items-center gap-1">💼 Broker Allowance:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Amt:</span>
                                                                <input type="number" min="0" value={brokerShare}
                                                                    onChange={e => handleSplitChange('broker', 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-20 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="0" max="100" value={brokerPercent}
                                                                onChange={e => handleSplitChange('broker', 'percent', parseInt(e.target.value) || 0)}
                                                                className="flex-1 accent-indigo-500 bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer" />
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min="0" max="100" value={brokerPercent}
                                                                    onChange={e => handleSplitChange('broker', 'percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                                    className="w-12 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                                <span className="text-xs text-muted-foreground">%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Marketing Percentage */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-muted-foreground flex items-center gap-1">📢 Marketing Share:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Amt:</span>
                                                                <input type="number" min="0" value={marketingShare}
                                                                    onChange={e => handleSplitChange('marketing', 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-20 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="0" max="100" value={marketingPercent}
                                                                onChange={e => handleSplitChange('marketing', 'percent', parseInt(e.target.value) || 0)}
                                                                className="flex-1 accent-pink-500 bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer" />
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min="0" max="100" value={marketingPercent}
                                                                    onChange={e => handleSplitChange('marketing', 'percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                                    className="w-12 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                                <span className="text-xs text-muted-foreground">%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Development Percentage */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className="text-muted-foreground flex items-center gap-1">🛠️ Development Share:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Amt:</span>
                                                                <input type="number" min="0" value={devShare}
                                                                    onChange={e => handleSplitChange('dev', 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-20 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="0" max="100" value={devPercent}
                                                                onChange={e => handleSplitChange('dev', 'percent', parseInt(e.target.value) || 0)}
                                                                className="flex-1 accent-amber-500 bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer" />
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min="0" max="100" value={devPercent}
                                                                    onChange={e => handleSplitChange('dev', 'percent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                                    className="w-12 bg-secondary border border-border text-center text-xs font-bold rounded py-0.5 text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
                                                                <span className="text-xs text-muted-foreground">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2 border-t border-border/80">
                                                    <button type="button" onClick={handleAutoBalance}
                                                        className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-[10px] font-bold text-foreground transition-all flex items-center justify-center gap-1">
                                                        ⚖️ Auto-Balance splits to 100%
                                                    </button>
                                                    <button type="button" onClick={() => { setCompanyFundingPercent(25); setBrokerPercent(25); setMarketingPercent(25); setDevPercent(25); }}
                                                        className="py-1.5 px-3 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all">
                                                        Equal (25% each)
                                                    </button>
                                                </div>
                                                {totalSplitPercent !== 100 && (
                                                    <p className="text-[10px] text-amber-400 font-medium animate-pulse text-center">
                                                        ⚠️ Warning: Sum is {totalSplitPercent}%. It is highly recommended to balance to 100%.
                                                    </p>
                                                )}

                                                {/* ☕ Miscellaneous Expense Input Inside Income Modal */}
                                                <div className="border-t border-border/80 pt-3 mt-3 space-y-2">
                                                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        ☕ Miscellaneous Expense Deduction
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="col-span-1">
                                                            <label className="text-[10px] text-muted-foreground block mb-1">Deduct Amount</label>
                                                            <input type="number" min="0" value={miscExpenseAmount || ''} onChange={e => setMiscExpenseAmount(parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-amber-500/50 font-bold" placeholder="0" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-muted-foreground block mb-1">Expense Remarks</label>
                                                            <input type="text" value={miscExpenseDescription} onChange={e => setMiscExpenseDescription(e.target.value)}
                                                                className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-amber-500/50" placeholder="e.g. Bus fare & tea" />
                                                        </div>
                                                    </div>
                                                    {miscExpenseAmount > 0 && (
                                                        <p className="text-[9px] text-muted-foreground leading-normal mt-1">
                                                            💡 <strong>{formatCurrency(miscExpenseAmount, form.currency)}</strong> will be subtracted from the income total. The net split amount will be <strong>{formatCurrency(form.amount - miscExpenseAmount, form.currency)}</strong>. A linked operational expense of type <strong>expense</strong> will be created in Company Funding!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ──────── EXPENSE-SPECIFIC FIELDS ──────── */}
                                {form.type === 'expense' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5">Expense Category *</label>
                                            <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                                                className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer">
                                                <option value="">Select category...</option>
                                                {formCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5">Project ID (Optional)</label>
                                            <input type="text" value={form.project_id || ''} onChange={e => setForm((f: any) => ({ ...f, project_id: e.target.value }))}
                                                className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none border border-border" placeholder="Project tag ID" />
                                        </div>
                                    </div>
                                )}

                                {/* ──────── DISTRIBUTION-SPECIFIC FIELDS ──────── */}
                                {form.type === 'distribution' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-1.5">Recipient Identity *</label>
                                                <select value={form.recipient || ''} onChange={e => setForm((f: any) => ({ ...f, recipient: e.target.value, category: 'Distribution' }))}
                                                    className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border cursor-pointer font-bold">
                                                    <option value="">Select recipient team...</option>
                                                    <option value="Company Funding">Company Funding</option>
                                                    <option value="Broker Allowance">Broker Allowance</option>
                                                    <option value="Marketing Team">Marketing Team</option>
                                                    <option value="Development Team">Development Team</option>
                                                    {categories.filter(c => c.type === 'receiver').map(c => (
                                                        <option key={c.id} value={c.name}>{c.name}</option>
                                                    ))}
                                                    <option value="Other Custom">Other Custom Recipient</option>
                                                </select>
                                            </div>
                                            {form.recipient === 'Other Custom' && (
                                                <div>
                                                    <label className="text-sm font-medium text-foreground block mb-1.5">Custom Recipient Name *</label>
                                                    <input type="text" onChange={e => setForm((f: any) => ({ ...f, recipient: e.target.value }))}
                                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none border border-border" placeholder="e.g. Design Vendor" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-foreground block mb-1.5">Distribution Status</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setForm((f: any) => ({ ...f, subcategory: 'Pending' }))}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${form.subcategory !== 'Distributed' ? 'bg-amber-500/10 text-amber-400 border-amber-500' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                                                    ⏳ Pending Distribution
                                                </button>
                                                <button type="button" onClick={() => setForm((f: any) => ({ ...f, subcategory: 'Distributed' }))}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${form.subcategory === 'Distributed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                                                    ✅ Distributed (Paid Out)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="text-sm font-medium text-foreground block mb-1.5">Notes & Remarks</label>
                                    <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2}
                                        className="w-full bg-secondary rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 border border-border resize-y" placeholder="Additional details..." />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editTx ? 'Update Mutation' : 'Authorize Mutation'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
