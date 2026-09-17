import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FinanceThemeProvider, useFinanceTheme } from './FinanceThemeContext';
import AppleThemeToggle from './AppleThemeToggle';
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

interface Category { id: string; name: string; name_bn?: string; type: string; icon?: string; color?: string; parent_id?: string | null; }

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

/** Parses string or number to a scaled BigInt along with its decimal place count */
function parseToScaledBigInt(str: string | number) {
    const s = String(str ?? '').trim();
    if (!s) return { val: 0n, decimals: 0 };
    const parts = s.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';
    const cleanStr = (intPart.replace(/^-/, '') || '0') + fracPart;
    return { val: BigInt(cleanStr), decimals: fracPart.length };
}

/** Auto-calculates percentage with up to 25+ digits after the decimal point */
function calcPercentageExact(amountStr: string | number, totalStr: string | number, precision = 28): string {
    const amt = parseToScaledBigInt(amountStr);
    const tot = parseToScaledBigInt(totalStr);
    if (tot.val <= 0n || amt.val <= 0n) return '0';
    
    let num = amt.val;
    let den = tot.val;
    const scaleDiff = tot.decimals - amt.decimals;
    if (scaleDiff > 0) {
        num = num * (10n ** BigInt(scaleDiff));
    } else if (scaleDiff < 0) {
        den = den * (10n ** BigInt(-scaleDiff));
    }
    
    const effPrecision = Math.max(precision, amt.decimals + 5);
    const mult = 10n ** BigInt(effPrecision);
    const quotient = (num * 100n * mult) / den;
    
    let qStr = quotient.toString();
    if (qStr.length <= effPrecision) {
        qStr = qStr.padStart(effPrecision + 1, '0');
    }
    const intPart = qStr.slice(0, -effPrecision);
    let fracPart = qStr.slice(-effPrecision);
    fracPart = fracPart.replace(/0+$/, '');
    return fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart;
}

/** Calculates Tk amount from percentage string with high decimal precision */
function calcAmountFromPercent(percentStr: string | number, totalStr: string | number, precision = 2): string {
    const pct = parseToScaledBigInt(percentStr);
    const tot = parseToScaledBigInt(totalStr);
    if (tot.val <= 0n || pct.val <= 0n) return '0';

    const denPower = BigInt(tot.decimals + pct.decimals + 2);
    const effPrecision = Math.max(precision, pct.decimals);
    const mult = 10n ** BigInt(effPrecision);
    const num = tot.val * pct.val * mult;
    const den = 10n ** denPower;
    const quotient = num / den;

    let qStr = quotient.toString();
    if (qStr.length <= effPrecision) {
        qStr = qStr.padStart(effPrecision + 1, '0');
    }
    const intPart = qStr.slice(0, -effPrecision);
    let fracPart = qStr.slice(-effPrecision);
    fracPart = fracPart.replace(/0+$/, '');
    return fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart;
}

const emptyTx: Omit<Transaction, 'id'> = {
    type: 'income', amount: 0, currency: 'BDT', category: '', description: '',
    date: new Date().toISOString().split('T')[0], payment_method: 'Bank Transfer',
    tags: [], is_recurring: 0, notes: '', recipient: '', parent_id: '',
};

function AdminFinanceTransactionsContent() {
    const navigate = useNavigate();
    const { isLight } = useFinanceTheme();
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
    const [selectedTeamForDist, setSelectedTeamForDist] = useState<string>('');

    // Distribution split percentages (for Income form) - stored as high precision strings (supporting 25+ decimal places)
    const [companyFundingPercent, setCompanyFundingPercent] = useState<string>('30');
    const [brokerPercent, setBrokerPercent] = useState<string>('10');
    const [marketingPercent, setMarketingPercent] = useState<string>('25');
    const [devPercent, setDevPercent] = useState<string>('35');

    // Explicitly tracked split Tk amounts
    const [splitAmounts, setSplitAmounts] = useState<{ company?: string; broker?: string; marketing?: string; dev?: string }>({});

    // Temporary states to hold amount & percentage inputs while editing to prevent cursor jumps and decimal truncation
    const [activeTempAmount, setActiveTempAmount] = useState<{ field: string; value: string } | null>(null);
    const [activeTempPercent, setActiveTempPercent] = useState<{ field: string; value: string } | null>(null);

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
    const [newCatParentId, setNewCatParentId] = useState('');
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
        { label: 'Nisar (nisarfeni2015@gmail.com)', value: 'nisarfeni2015@gmail.com' },
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
        setCompanyFundingPercent('30');
        setBrokerPercent('10');
        setMarketingPercent('25');
        setDevPercent('35');
        setSplitAmounts({});
        setActiveTempAmount(null);
        setActiveTempPercent(null);
        setShowModal(true);
    };

    const openEdit = async (tx: Transaction) => {
        setEditTx(tx);
        setForm({ ...tx });
        setMiscExpenseAmount(0);
        setMiscExpenseDescription('Tea/coffee & bus fare');
        setSplitAmounts({});
        setActiveTempAmount(null);
        setActiveTempPercent(null);
        setShowModal(true);

        if (tx.type === 'income') {
            try {
                const res = await fetch(`${API_BASE}/api/finance?action=transactions&parent_id=${tx.id}&limit=20&_t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                });
                if (res.ok) {
                    const json = await res.json();
                    const linked: Transaction[] = json.transactions || [];
                    const miscTx = linked.find(t => t.type === 'expense' && t.subcategory === 'Misc Income Deduction');
                    if (miscTx) {
                        setMiscExpenseAmount(miscTx.amount);
                        setMiscExpenseDescription(miscTx.description || 'Tea/coffee & bus fare');
                    }
                    const netAmt = Math.max(0, tx.amount - (miscTx ? miscTx.amount : 0));
                    if (netAmt > 0) {
                        const compTx = linked.find(t => t.type === 'distribution' && t.recipient === 'Company Funding');
                        const brokTx = linked.find(t => t.type === 'distribution' && t.recipient === 'Broker Allowance');
                        const mktTx = linked.find(t => t.type === 'distribution' && t.recipient === 'Marketing Team');
                        const devTx = linked.find(t => t.type === 'distribution' && t.recipient === 'Development Team');

                        if (compTx || brokTx || mktTx || devTx) {
                            const cAmt = compTx ? String(compTx.amount) : '0';
                            const bAmt = brokTx ? String(brokTx.amount) : '0';
                            const mAmt = mktTx ? String(mktTx.amount) : '0';
                            const dAmt = devTx ? String(devTx.amount) : '0';
                            setSplitAmounts({ company: cAmt, broker: bAmt, marketing: mAmt, dev: dAmt });
                            setCompanyFundingPercent(compTx ? calcPercentageExact(cAmt, netAmt, 28) : '0');
                            setBrokerPercent(brokTx ? calcPercentageExact(bAmt, netAmt, 28) : '0');
                            setMarketingPercent(mktTx ? calcPercentageExact(mAmt, netAmt, 28) : '0');
                            setDevPercent(devTx ? calcPercentageExact(dAmt, netAmt, 28) : '0');
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load linked transactions for edit:', e);
            }
        }
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
                if (form.type === 'income') {
                    payload.misc_amount = miscExpenseAmount;
                    payload.misc_description = miscExpenseDescription;

                    // Full income amount is retained for the parent transaction, while net split pool is distributed
                    payload.amount = form.amount;
                    const netIncomeAmount = Math.max(0, form.amount - miscExpenseAmount);

                    let companyAmt = parseFloat(parseFloat(String(companyFundingShare)).toFixed(2)) || 0;
                    let brokerAmt = parseFloat(parseFloat(String(brokerShare)).toFixed(2)) || 0;
                    let marketingAmt = parseFloat(parseFloat(String(marketingShare)).toFixed(2)) || 0;
                    const allocatedFirstThree = parseFloat((companyAmt + brokerAmt + marketingAmt).toFixed(2));
                    let devAmt = parseFloat(parseFloat(String(devShare)).toFixed(2)) || 0;
                    if (Math.abs((allocatedFirstThree + devAmt) - netIncomeAmount) <= 0.05) {
                        devAmt = parseFloat(Math.max(0, netIncomeAmount - allocatedFirstThree).toFixed(2));
                    }

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
                    color: newCatColor,
                    parent_id: newCatType === 'receiver' && newCatParentId ? newCatParentId : null
                })
            });
            if (res.ok) {
                toast.success('Entity created successfully!');
                setNewCatName('');
                setNewCatParentId('');
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

    // Split Change Logic supporting exact amounts and full 25+ digit decimal percentages
    const handleSplitChange = (field: 'company' | 'broker' | 'marketing' | 'dev', key: 'percent' | 'amount', valueStr: string | number) => {
        const netAmt = Math.max(0, (form.amount || 0) - miscExpenseAmount);
        const val = String(valueStr ?? '').trim();

        if (key === 'percent') {
            let cleanPct = val;
            const num = parseFloat(cleanPct);
            if (!isNaN(num) && num > 100) cleanPct = '100';

            if (field === 'company') setCompanyFundingPercent(cleanPct);
            else if (field === 'broker') setBrokerPercent(cleanPct);
            else if (field === 'marketing') setMarketingPercent(cleanPct);
            else if (field === 'dev') setDevPercent(cleanPct);

            // Recalculate Tk amount for this field
            if (netAmt > 0 && cleanPct !== '') {
                const calculatedAmt = calcAmountFromPercent(cleanPct, netAmt, 2);
                setSplitAmounts(prev => ({ ...prev, [field]: calculatedAmt }));
            }

            if (activeTempAmount?.field === field) {
                setActiveTempAmount(null);
            }
        } else {
            if (netAmt <= 0) {
                toast.error('Please enter valid transaction amount first!');
                return;
            }

            // Track the explicit entered Tk amount directly
            setSplitAmounts(prev => ({ ...prev, [field]: val }));

            // Auto-calculate percentage with full 25+ digits precision
            const calculatedPct = calcPercentageExact(val, netAmt, 28);

            if (field === 'company') setCompanyFundingPercent(calculatedPct);
            else if (field === 'broker') setBrokerPercent(calculatedPct);
            else if (field === 'marketing') setMarketingPercent(calculatedPct);
            else if (field === 'dev') setDevPercent(calculatedPct);

            // Clear active temp percent so the percentage input displays the newly calculated float
            if (activeTempPercent?.field === field) {
                setActiveTempPercent(null);
            }
        }
    };

    const handleAutoBalance = () => {
        const c = parseFloat(String(companyFundingPercent)) || 0;
        const b = parseFloat(String(brokerPercent)) || 0;
        const m = parseFloat(String(marketingPercent)) || 0;
        const d = parseFloat(String(devPercent)) || 0;
        const sum = c + b + m + d;
        if (sum <= 0) {
            setCompanyFundingPercent('30');
            setBrokerPercent('10');
            setMarketingPercent('25');
            setDevPercent('35');
            setSplitAmounts({});
            return;
        }
        const netAmt = Math.max(0, (form.amount || 0) - miscExpenseAmount);
        const cVal = calcPercentageExact(c, sum, 28);
        const bVal = calcPercentageExact(b, sum, 28);
        const mVal = calcPercentageExact(m, sum, 28);
        const dVal = calcPercentageExact(d, sum, 28);
        setCompanyFundingPercent(cVal);
        setBrokerPercent(bVal);
        setMarketingPercent(mVal);
        setDevPercent(dVal);
        if (netAmt > 0) {
            setSplitAmounts({
                company: calcAmountFromPercent(cVal, netAmt, 2),
                broker: calcAmountFromPercent(bVal, netAmt, 2),
                marketing: calcAmountFromPercent(mVal, netAmt, 2),
                dev: calcAmountFromPercent(dVal, netAmt, 2),
            });
        }
        setActiveTempAmount(null);
        setActiveTempPercent(null);
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({ action: 'transactions', limit: '2000' });
            if (filterType) params.set('type', filterType);
            const res = await fetch(`${API_BASE}/api/finance?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { toast.error('Export failed'); return; }
            const json = await res.json();
            let txs = json.transactions || [];
            
            if (filterCategory) {
                txs = txs.filter((t: any) => t.category === filterCategory || t.recipient === filterCategory);
            }

            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.text('Orbit SaaS Corporate Finance Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
            
            // Filters summary
            let filtersText = 'Filters applied: ';
            filtersText += filterType ? `Type=${filterType.toUpperCase()} ` : 'All Types ';
            filtersText += filterCategory ? `Entity=${filterCategory}` : '';
            doc.setFontSize(10);
            doc.text(filtersText, 14, 38);

            const tableColumn = ["Date", "Type", "Entity/Category", "Description", "Amount", "Method"];
            const tableRows: any[] = [];

            txs.forEach((t: any) => {
                const date = new Date(t.date).toLocaleDateString();
                const type = t.type.toUpperCase();
                const entity = t.recipient || t.category || '-';
                const desc = t.description || '-';
                const amount = `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, t.currency)}`;
                const method = t.payment_method || '-';
                
                tableRows.push([date, type, entity, desc, amount, method]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
                willDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const type = data.row.raw[1]; // Index 1 is Type
                        if (type === 'INCOME') {
                            doc.setTextColor(16, 185, 129); // Emerald-500
                        } else if (type === 'EXPENSE' || type === 'DISTRIBUTION') {
                            doc.setTextColor(244, 63, 94); // Rose-500
                        }
                    }
                }
            });

            doc.save(`orbit_finance_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF report exported successfully!');
        } catch (e) { 
            console.error(e);
            toast.error('Export error occurred while generating PDF'); 
        }
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
    const typeInfo = (type: string) => {
        if (isLight) {
            if (type === 'income') return { label: 'Income', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200/80' };
            if (type === 'expense') return { label: 'Expense (from Funding)', color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200/80' };
            if (type === 'distribution') return { label: 'Distribution', color: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200/80' };
            return { label: type, color: 'text-[#6e6e73]', bg: 'bg-black/[0.04] border border-black/[0.06]' };
        }
        return TYPES.find(t => t.value === type) || { label: type, color: 'text-muted-foreground', bg: 'bg-secondary' };
    };

    // Live split calculations (miscellaneous expense counted during calculation)
    const netIncomeAmount = Math.max(0, (form.amount || 0) - miscExpenseAmount);

    const companyFundingShare = splitAmounts.company ?? (netIncomeAmount > 0 ? calcAmountFromPercent(companyFundingPercent, netIncomeAmount, 2) : '0');
    const brokerShare = splitAmounts.broker ?? (netIncomeAmount > 0 ? calcAmountFromPercent(brokerPercent, netIncomeAmount, 2) : '0');
    const marketingShare = splitAmounts.marketing ?? (netIncomeAmount > 0 ? calcAmountFromPercent(marketingPercent, netIncomeAmount, 2) : '0');
    const devShare = splitAmounts.dev ?? (netIncomeAmount > 0 ? calcAmountFromPercent(devPercent, netIncomeAmount, 2) : '0');

    const numComp = parseFloat(String(companyFundingPercent)) || 0;
    const numBrok = parseFloat(String(brokerPercent)) || 0;
    const numMkt = parseFloat(String(marketingPercent)) || 0;
    const numDev = parseFloat(String(devPercent)) || 0;
    const rawTotalSplitPercent = numComp + numBrok + numMkt + numDev;
    const totalSplitPercent = parseFloat(rawTotalSplitPercent.toFixed(6));

    const numCompShare = parseFloat(String(companyFundingShare)) || 0;
    const numBrokShare = parseFloat(String(brokerShare)) || 0;
    const numMktShare = parseFloat(String(marketingShare)) || 0;
    const numDevShare = parseFloat(String(devShare)) || 0;
    const totalAllocatedAmount = parseFloat((numCompShare + numBrokShare + numMktShare + numDevShare + (miscExpenseAmount || 0)).toFixed(2));

    // Valid if percentage totals ~100% or allocated amounts total form.amount
    const isSplitValid = Math.abs(rawTotalSplitPercent - 100) <= 0.05 || Math.abs(totalAllocatedAmount - (form.amount || 0)) <= 0.5;

    // Disabled state for Save button when totals aren't properly calculated or percentages don't sum to 100%
    const isSaveDisabled = useMemo(() => {
        if (saving) return true;
        if (!form.description || !form.amount || form.amount <= 0) return true;
        if (form.type !== 'distribution' && !form.category) return true;
        if (form.type === 'distribution' && !form.recipient) return true;

        if (form.type === 'income') {
            if (miscExpenseAmount < 0 || miscExpenseAmount > form.amount) return true;
            if (!isSplitValid) return true;
        }

        return false;
    }, [saving, form, miscExpenseAmount, isSplitValid]);

    return (
        <div className={`space-y-6 -m-4 sm:-m-5 lg:-m-8 p-4 sm:p-5 lg:p-8 min-h-[100dvh] transition-colors duration-300 font-sans relative ${isLight ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-[#09090b] text-white'}`}>
            {/* Financial OTP Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`p-8 rounded-3xl w-full max-w-md relative transition-all duration-300 ${
                                isLight
                                    ? 'bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.15)] text-[#1d1d1f]'
                                    : 'bg-[#1c1c1e]/95 backdrop-blur-2xl border border-indigo-500/20 shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] text-white'
                            }`}
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

                            <button
                                type="button"
                                onClick={closeOtpModal}
                                className={`absolute top-5 right-5 p-2 rounded-full transition-all z-20 cursor-pointer ${
                                    isLight ? 'text-black/50 hover:text-black hover:bg-black/5' : 'text-muted-foreground/70 hover:text-foreground hover:bg-secondary/50'
                                }`}
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <motion.div
                                    initial={{ scale: 0.5, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                                        isLight
                                            ? 'bg-indigo-50 border-indigo-200/80 text-indigo-600'
                                            : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400'
                                    }`}
                                >
                                    <Shield className="w-8 h-8" />
                                </motion.div>

                                <div className="space-y-1.5">
                                    <h3 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>Financial Identity</h3>
                                    <p className={`text-xs ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>
                                        {!otpSent ? 'Select your email to receive an authorization code.' : 'Enter the 6-digit OTP sent to your email.'}
                                    </p>
                                </div>

                                {!otpSent ? (
                                    <div className="w-full space-y-4 mt-2">
                                        <div className="relative group text-left">
                                            <button
                                                type="button"
                                                onClick={() => setIsOtpDropdownOpen(!isOtpDropdownOpen)}
                                                className={`w-full flex items-center justify-between transition-colors rounded-xl px-4 py-3.5 text-sm outline-none font-medium cursor-pointer ${
                                                    isLight
                                                        ? 'bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.1] text-[#1d1d1f]'
                                                        : 'bg-secondary/50 hover:bg-secondary/80 border border-border/50 text-foreground'
                                                }`}
                                            >
                                                <span className="truncate pr-4">{OTP_EMAILS.find(e => e.value === selectedOtpEmail)?.label || selectedOtpEmail}</span>
                                                <div className={`transition-transform duration-200 shrink-0 ${isOtpDropdownOpen ? 'rotate-180' : ''}`}>
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
                                                        className={`absolute top-full left-0 w-full mt-2 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col ${
                                                            isLight ? 'bg-white border border-black/[0.08] text-[#1d1d1f]' : 'bg-card border border-border/50'
                                                        }`}
                                                    >
                                                        {OTP_EMAILS.map((emailObj) => (
                                                            <button
                                                                key={emailObj.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOtpEmail(emailObj.value);
                                                                    setIsOtpDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-3.5 text-sm transition-colors cursor-pointer ${
                                                                    selectedOtpEmail === emailObj.value
                                                                        ? (isLight ? 'bg-indigo-50 text-indigo-600 font-semibold border-l-2 border-indigo-600' : 'bg-indigo-500/10 text-indigo-400 font-semibold border-l-2 border-indigo-500')
                                                                        : (isLight ? 'text-[#1d1d1f] hover:bg-black/[0.04]' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')
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
                                            className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0062c4] text-white rounded-xl font-semibold disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-md cursor-pointer"
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
                                            className={`w-full text-center text-4xl tracking-[0.5em] font-mono py-4 border rounded-2xl focus:outline-none transition-all placeholder:text-neutral-400 font-bold ${
                                                isLight
                                                    ? 'bg-black/[0.03] text-[#1d1d1f] border-black/[0.1] focus:ring-2 focus:ring-[#0071e3]/30'
                                                    : 'bg-white text-indigo-950 border-border/50 focus:ring-2 focus:ring-indigo-500/50'
                                            }`}
                                            disabled={isVerifyingOtp}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleVerifyOtp}
                                            disabled={isVerifyingOtp || otpInput.length < 6}
                                            className="w-full py-3.5 bg-[#28cd41] hover:bg-[#24b73a] text-white rounded-xl font-semibold disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-md cursor-pointer"
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b transition-colors duration-300" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${isLight ? 'bg-indigo-500/10 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Corporate Transactions
                        </h1>
                    </div>
                    <p className={`text-xs mt-1 ml-11.5 font-medium ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        Track and partition SaaS income, operational funding expenses, and distribution splits.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Functional Apple Theme Toggle */}
                    <AppleThemeToggle showLabel={true} />

                    <button
                        onClick={() => navigate('/admin/finance')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1] shadow-xs'
                        }`}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={loadCompanyReport}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 border-indigo-200/70 shadow-xs'
                                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20 shadow-xs'
                        }`}
                    >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Funding Ledger</span>
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1] shadow-xs'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Entity Manager</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1] shadow-xs'
                        }`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        onClick={openCreate}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                            isLight
                                ? 'bg-[#28cd41] hover:bg-[#24b73a] text-white shadow-[#28cd4144]'
                                : 'bg-[#30d158] hover:bg-[#28cd41] text-black shadow-[#30d15833]'
                        }`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Transaction</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-3 transition-all ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`} />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search descriptions, clients, recipients..."
                        className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all ${
                            isLight
                                ? 'bg-black/[0.03] text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.08] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                                : 'bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/50'
                        }`}
                    />
                </div>
                <div className="w-[150px]">
                    <CustomSelect
                        themeMode={isLight ? 'light' : 'dark'}
                        value={filterType} onChange={v => { setFilterType(v); setPage(1); }}
                        options={[{value: '', label: 'All Types'}, ...TYPES.map(t => ({value: t.value, label: t.label}))]}
                    />
                </div>
                <div className="w-[200px]">
                    <CustomSelect
                        themeMode={isLight ? 'light' : 'dark'}
                        value={filterCategory} onChange={v => { setFilterCategory(v); setPage(1); }}
                        options={[{value: '', label: 'All Entities'}, ...categories.map(c => ({value: c.name, label: c.name}))]}
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className={`h-14 rounded-2xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />)}</div>
            ) : (
                <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${
                    isLight
                        ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                        : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                }`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className={`uppercase tracking-wider text-[11px] font-bold border-b transition-colors ${
                                isLight
                                    ? 'bg-black/[0.02] text-[#6e6e73] border-black/[0.06]'
                                    : 'bg-white/[0.03] text-[#86868b] border-white/[0.08]'
                            }`}>
                                <tr>
                                    <th className="px-4 py-3.5">Date</th>
                                    <th className="px-4 py-3.5">Type</th>
                                    <th className="px-4 py-3.5">Description</th>
                                    <th className="px-4 py-3.5">Category/Recipient</th>
                                    <th className="px-4 py-3.5">Client</th>
                                    <th className="px-4 py-3.5">Method</th>
                                    <th className="px-4 py-3.5 text-right">Amount</th>
                                    <th className="px-4 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isLight ? 'divide-black/[0.04]' : 'divide-white/[0.06]'}`}>
                                <AnimatePresence>
                                    {transactions.length === 0 ? (
                                        <tr><td colSpan={8} className={`px-4 py-16 text-center text-sm font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>No transactions found.</td></tr>
                                    ) : transactions.map(tx => {
                                        const ti = typeInfo(tx.type);
                                        return (
                                            <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`transition-colors ${isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-white/[0.03]'}`}>
                                                <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 opacity-60 shrink-0" />
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
                                                            className={`p-1 rounded-md transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                                                                isLight ? 'hover:bg-black/5 text-black/40 hover:text-indigo-600' : 'hover:bg-secondary text-muted-foreground/50 hover:text-indigo-400'
                                                            }`}
                                                        >
                                                            <HelpCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${ti.bg} ${ti.color}`}>{ti.label}</span>
                                                </td>
                                                <td className={`px-4 py-3.5 font-semibold max-w-[240px] truncate ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                                    <div>{tx.description}</div>
                                                    {tx.parent_id && <div className={`text-[10px] font-medium ${isLight ? 'text-[#0071e3]' : 'text-primary'}`}>Linked to Income Split</div>}
                                                    {tx.created_by && (
                                                        <div className={`text-[10px] mt-1 ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`}>
                                                            By: <span className={isLight ? 'text-indigo-600 font-medium' : 'text-indigo-400'}>{tx.created_by.split('@')[0]}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>
                                                    {tx.type === 'distribution' ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
                                                                <Users className="w-3.5 h-3.5" /> {tx.recipient || 'N/A'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                                                tx.subcategory === 'Distributed'
                                                                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                                                                    : (isLight ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse')
                                                            }`}>
                                                                {tx.subcategory || 'Pending'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        tx.category
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3.5 text-xs font-medium ${isLight ? 'text-[#1d1d1f]' : 'text-neutral-300'}`}>{tx.client_name || '—'}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                                        isLight
                                                            ? 'bg-black/[0.04] text-[#6e6e73] border border-black/[0.06]'
                                                            : 'bg-white/[0.06] text-neutral-300 border border-white/[0.08]'
                                                    }`}>{tx.payment_method}</span>
                                                </td>
                                                <td className={`px-4 py-3.5 text-right font-mono font-bold ${
                                                    tx.type === 'income'
                                                        ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                                                        : tx.type === 'expense'
                                                        ? (isLight ? 'text-rose-700' : 'text-rose-400')
                                                        : (isLight ? 'text-indigo-700' : 'text-indigo-400')
                                                }`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openEdit(tx)}
                                                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                                                isLight ? 'text-black/50 hover:text-black hover:bg-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                                            }`}
                                                            title="Edit Mutation"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tx.id)}
                                                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                                                isLight ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                                            }`}
                                                            title="Delete Mutation"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
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
                        <div className={`flex items-center justify-between px-5 py-3.5 border-t transition-colors ${
                            isLight ? 'border-black/[0.06] text-[#6e6e73]' : 'border-white/[0.08] text-muted-foreground'
                        }`}>
                            <span className="text-xs font-medium">{total} total transactions</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className={`p-2 rounded-full border transition-all disabled:opacity-30 cursor-pointer ${
                                        isLight ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08]' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                                    }`}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className={`text-xs font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className={`p-2 rounded-full border transition-all disabled:opacity-30 cursor-pointer ${
                                        isLight ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08]' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                                    }`}
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Category Maker Modal */}
            <AnimatePresence>
                {showCategoryModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowCategoryModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className={`rounded-3xl p-6 sm:p-7 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl custom-scrollbar transition-all ${
                                isLight
                                    ? 'bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.15)] text-[#1d1d1f]'
                                    : 'bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl text-white'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#0a84ff]/15 text-[#0a84ff]'}`}>
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    <h2 className={`text-lg font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                        Entity Manager
                                    </h2>
                                </div>
                                <button onClick={() => setShowCategoryModal(false)} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-black/50 hover:text-black hover:bg-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className={`rounded-2xl p-4 mb-5 space-y-4 transition-all ${
                                isLight ? 'bg-black/[0.02] border border-black/[0.06]' : 'bg-secondary/40 border border-border'
                            }`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#6e6e73]' : 'text-foreground'}`}>Create New Entity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                        <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Name *</label>
                                        <input
                                            type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                                            placeholder="e.g. Server Upgrades"
                                            className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${
                                                isLight
                                                    ? 'bg-white text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.1] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
                                                    : 'bg-secondary text-foreground border border-border focus:ring-2 focus:ring-primary/50'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Type *</label>
                                        <CustomSelect 
                                            themeMode={isLight ? 'light' : 'dark'}
                                            value={newCatType} 
                                            onChange={v => setNewCatType(v)}
                                            options={[
                                                {value: 'income', label: 'Income'},
                                                {value: 'expense', label: 'Expense'},
                                                {value: 'distribution', label: 'Distribution'},
                                                {value: 'both', label: 'Both (Income & Expense)'},
                                                {value: 'receiver', label: 'Receiver (Recipient)'},
                                                {value: 'client', label: 'Client'},
                                            ]}
                                        />
                                    </div>
                                    
                                    <AnimatePresence>
                                        {newCatType === 'receiver' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-3">
                                                <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Link to Parent Team (Optional)</label>
                                                <CustomSelect 
                                                    themeMode={isLight ? 'light' : 'dark'}
                                                    value={newCatParentId} 
                                                    onChange={v => setNewCatParentId(v)}
                                                    placeholder="None (Independent Team/Entity)"
                                                    options={[
                                                        {value: '', label: 'None (Independent Team/Entity)'},
                                                        ...categories.filter(c => c.type === 'receiver' && !c.parent_id).map(c => ({ value: c.id, label: c.name }))
                                                    ]}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="md:col-span-3">
                                        <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Hex Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-10 h-10 p-0 bg-transparent border-0 cursor-pointer rounded-xl" />
                                            <input
                                                type="text" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                                                className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none font-mono ${
                                                    isLight
                                                        ? 'bg-white text-[#1d1d1f] border border-black/[0.1] focus:border-[#0071e3]'
                                                        : 'bg-secondary text-foreground border border-border'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreateCategory} disabled={catSaving}
                                    className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0062c4] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                                >
                                    <PlusCircle className="w-4 h-4" /> Create Entity
                                </button>
                            </div>

                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-[#6e6e73]' : 'text-foreground'}`}>All Active Entities</h3>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                                                isLight
                                                    ? 'bg-black/[0.02] border border-black/[0.05] hover:bg-black/[0.04]'
                                                    : 'bg-secondary/20 border border-border/80 hover:bg-secondary/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color || '#10B981' }} />
                                                <div>
                                                    <p className={`text-sm font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>{cat.name}</p>
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`}>{cat.type}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                                    isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-red-400 hover:bg-red-500/10'
                                                }`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowReportModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
                            className={`rounded-3xl p-6 sm:p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar transition-all ${
                                isLight
                                    ? 'bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.15)] text-[#1d1d1f]'
                                    : 'bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.6)] text-white'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-6 pb-3 border-b transition-colors" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className={`text-lg sm:text-xl font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>Corporate Reserve & Funding Ledger</h2>
                                        <p className={`text-xs ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Comprehensive overview of company allocations, operational expenses, and custom deductions.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReportModal(false)} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-black/50 hover:text-black hover:bg-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Dynamic Timeline Selector */}
                            {!reportLoading && rawReportTxs.length > 0 && (
                                <div className="mb-6 space-y-4">
                                    <div className={`rounded-2xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                                        isLight ? 'bg-black/[0.02] border border-black/[0.05]' : 'bg-secondary/40 border border-border/80'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                                            <span className={`text-xs font-semibold ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Ledger Period:</span>
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
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                        reportTimeline === opt.id
                                                            ? (isLight ? 'bg-[#0071e3] text-white shadow-xs' : 'bg-[#0a84ff] text-white shadow-md')
                                                            : (isLight ? 'bg-black/[0.04] text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.08]' : 'bg-white/[0.06] text-[#86868b] hover:text-white hover:bg-white/[0.1]')
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
                                                <div className={`rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                                                    isLight ? 'bg-indigo-50/50 border border-indigo-200/60' : 'bg-indigo-950/20 border border-indigo-500/20'
                                                }`}>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-indigo-600 block">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={customStartDate}
                                                            onChange={e => setCustomStartDate(e.target.value)}
                                                            className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${
                                                                isLight
                                                                    ? 'bg-white border border-black/[0.1] text-[#1d1d1f]'
                                                                    : 'bg-secondary/80 border border-border/80 text-foreground'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-indigo-600 block">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={customEndDate}
                                                            onChange={e => setCustomEndDate(e.target.value)}
                                                            className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${
                                                                isLight
                                                                    ? 'bg-white border border-black/[0.1] text-[#1d1d1f]'
                                                                    : 'bg-secondary/80 border border-border/80 text-foreground'
                                                            }`}
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
                                    <p className={`text-sm ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>Generating live balance statements and operational ledger audit...</p>
                                </div>
                            ) : reportData ? (
                                <div className="space-y-6">
                                    {/* Stat Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                        <div className={`rounded-2xl p-4 space-y-1 transition-all ${
                                            isLight ? 'bg-indigo-500/[0.06] border border-indigo-500/15' : 'bg-secondary/40 border border-border'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-indigo-800' : 'text-muted-foreground'}`}>
                                                {reportTimeline === 'overall' ? 'All-Time Funding' : 'Allocated Funding'}
                                            </span>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>{formatCurrency(reportData.totalFunding)}</p>
                                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                            </div>
                                        </div>
                                        <div className={`rounded-2xl p-4 space-y-1 transition-all ${
                                            isLight ? 'bg-rose-500/[0.06] border border-rose-500/15' : 'bg-secondary/40 border border-border'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-rose-800' : 'text-muted-foreground'}`}>Operational Expenses</span>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{formatCurrency(reportData.totalExpenses)}</p>
                                                <TrendingDown className="w-4 h-4 text-rose-500" />
                                            </div>
                                        </div>
                                        <div className={`rounded-2xl p-4 space-y-1 transition-all ${
                                            isLight ? 'bg-amber-500/[0.06] border border-amber-500/15' : 'bg-secondary/40 border border-border'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-muted-foreground'}`}>Misc Deductions</span>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{formatCurrency(reportData.totalMisc)}</p>
                                                <Landmark className="w-4 h-4 text-amber-500" />
                                            </div>
                                        </div>
                                        <div className={`rounded-2xl p-4 space-y-1 transition-all ${
                                            isLight ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : 'bg-indigo-500/10 border border-indigo-500/20'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-indigo-400'}`}>
                                                {reportTimeline === 'overall' ? 'Net Available Reserve' : 'Period Net Balance'}
                                            </span>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatCurrency(reportData.netBalance)}</p>
                                                <Landmark className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed ledger table */}
                                    <div>
                                        <h3 className={`text-sm font-bold mb-3 flex items-center gap-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>
                                            📋 Corporate Ledger Audit Timeline
                                        </h3>
                                        <div className={`rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar border ${
                                            isLight ? 'border-black/[0.08] bg-white' : 'border-border/80 bg-card'
                                        }`}>
                                            <table className="w-full text-left text-xs whitespace-nowrap">
                                                <thead className={`uppercase font-bold sticky top-0 ${
                                                    isLight ? 'bg-black/[0.03] text-[#6e6e73]' : 'bg-secondary/60 text-muted-foreground'
                                                }`}>
                                                    <tr>
                                                        <th className="px-4 py-2.5">Date</th>
                                                        <th className="px-4 py-2.5">Mutation Type</th>
                                                        <th className="px-4 py-2.5">Item / Description</th>
                                                        <th className="px-4 py-2.5">Subcategory</th>
                                                        <th className="px-4 py-2.5 text-right">Impact</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${isLight ? 'divide-black/[0.04]' : 'divide-border'}`}>
                                                    {reportData.ledger.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className={`px-4 py-8 text-center text-xs ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`}>
                                                                No corporate ledger activities found for this timeline period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        reportData.ledger.map((item: any) => {
                                                            const isFunding = item.type === 'distribution';
                                                            return (
                                                                <tr key={item.id} className={`transition-colors ${isLight ? 'hover:bg-black/[0.02]' : 'hover:bg-muted/20'}`}>
                                                                    <td className={`px-4 py-2.5 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>
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
                                                                                className={`p-1 rounded-md transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                                                                                    isLight ? 'hover:bg-black/5 text-black/40 hover:text-indigo-600' : 'hover:bg-secondary text-muted-foreground/50 hover:text-indigo-400'
                                                                                }`}
                                                                            >
                                                                                <HelpCircle className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                                                            isFunding
                                                                                ? (isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/10 text-indigo-400')
                                                                                : (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/10 text-rose-400')
                                                                        }`}>
                                                                            {isFunding ? 'Funding Split Inflow' : 'Operational Expense'}
                                                                        </span>
                                                                    </td>
                                                                    <td className={`px-4 py-2.5 font-semibold max-w-[250px] truncate ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>{item.description}</td>
                                                                    <td className={`px-4 py-2.5 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>{item.subcategory || 'General'}</td>
                                                                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${
                                                                        isFunding ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')
                                                                    }`}>
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
                                <p className={`text-center py-6 text-sm ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`}>Failed to generate reports.</p>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t transition-colors" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                        isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-secondary text-foreground hover:bg-secondary/80'
                                    }`}
                                >
                                    Close Report
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Transaction Create / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 border ${
                                isLight
                                    ? 'bg-white/95 text-[#1d1d1f] border-black/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.12)]'
                                    : 'bg-[#1c1c1e]/95 text-white border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                        <CreditCard className="w-4 h-4" />
                                    </span>
                                    {editTx ? 'Edit Corporate Transaction' : 'Record Corporate Mutation'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                                        isLight ? 'hover:bg-black/5 text-[#86868b] hover:text-[#1d1d1f]' : 'hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Type Select - Apple Segmented Control */}
                                <div>
                                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                        System Type *
                                    </label>
                                    <div className={`p-1 rounded-2xl grid grid-cols-3 gap-1 border ${
                                        isLight ? 'bg-black/[0.04] border-black/[0.06]' : 'bg-black/30 border-white/[0.08]'
                                    }`}>
                                        {TYPES.map(t => {
                                            const isActive = form.type === t.value;
                                            return (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setForm((f: any) => ({ ...f, type: t.value, category: '' }))}
                                                    className={`px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                                                        isActive
                                                            ? (isLight
                                                                ? 'bg-white text-[#1d1d1f] shadow-sm'
                                                                : 'bg-white/20 text-white shadow-sm')
                                                            : (isLight
                                                                ? 'text-[#6e6e73] hover:text-[#1d1d1f]'
                                                                : 'text-white/60 hover:text-white')
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Amount + Currency */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                            Amount *
                                        </label>
                                        <input
                                            type="number"
                                            value={form.amount || ''}
                                            onChange={e => setForm((f: any) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                            className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold font-mono transition-all outline-none border ${
                                                isLight
                                                    ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                    : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                            }`}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                            Currency
                                        </label>
                                        <select
                                            value={form.currency}
                                            onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))}
                                            className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold transition-all outline-none border cursor-pointer ${
                                                isLight
                                                    ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                                                    : 'bg-[#2c2c2e] border-white/[0.1] text-white focus:border-[#0a84ff]'
                                            }`}
                                        >
                                            <option value="BDT">৳ BDT</option>
                                            <option value="USD">$ USD</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border ${
                                            isLight
                                                ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                        }`}
                                        placeholder="e.g. Agency Retainer, Cloud Server Upgrades"
                                    />
                                </div>

                                {/* Date + Payment Method */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))}
                                            className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border ${
                                                isLight
                                                    ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                                                    : 'bg-[#2c2c2e] border-white/[0.1] text-white focus:border-[#0a84ff]'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                            Payment Method
                                        </label>
                                        <select
                                            value={form.payment_method}
                                            onChange={e => setForm((f: any) => ({ ...f, payment_method: e.target.value }))}
                                            className={`w-full rounded-xl px-3 py-2.5 text-xs font-medium transition-all outline-none border cursor-pointer ${
                                                isLight
                                                    ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                                                    : 'bg-[#2c2c2e] border-white/[0.1] text-white focus:border-[#0a84ff]'
                                            }`}
                                        >
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* ──────── INCOME-SPECIFIC FIELDS AND SPLIT LIVE VISUALIZER ──────── */}
                                {form.type === 'income' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                    Category *
                                                </label>
                                                <select
                                                    value={form.category}
                                                    onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                                                    className={`w-full rounded-xl px-3 py-2.5 text-xs font-medium transition-all outline-none border cursor-pointer ${
                                                        isLight
                                                            ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                                                            : 'bg-[#2c2c2e] border-white/[0.1] text-white focus:border-[#0a84ff]'
                                                    }`}
                                                >
                                                    <option value="">Select category...</option>
                                                    {formCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                    Client / Source
                                                </label>
                                                <input
                                                    type="text"
                                                    list="clientList"
                                                    value={form.client_name || ''}
                                                    onChange={e => setForm((f: any) => ({ ...f, client_name: e.target.value }))}
                                                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border ${
                                                        isLight
                                                            ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                            : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                                    }`}
                                                    placeholder="Client Name"
                                                />
                                                <datalist id="clientList">
                                                    {categories.filter(c => c.type === 'client').map(c => (
                                                        <option key={c.id} value={c.name} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>

                                        <div className={`rounded-2xl p-4 space-y-4 border transition-all ${
                                            isLight ? 'bg-[#f5f5f7] border-black/[0.06]' : 'bg-black/30 border-white/[0.08]'
                                        }`}>
                                            {editTx && (
                                                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                                                    isLight ? 'bg-indigo-50/80 border-indigo-200 text-indigo-800' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                                                }`}>
                                                    <span>ℹ️</span> Editing this income transaction will update and synchronize its linked team distributions and deductions.
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                                    isLight ? 'text-[#0071e3]' : 'text-[#0a84ff]'
                                                }`}>
                                                    <Share2 className="w-3.5 h-3.5" /> Live Distribution Split
                                                </span>
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                    isSplitValid
                                                        ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                                                        : (isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')
                                                }`}>
                                                    Total: {parseFloat(rawTotalSplitPercent.toFixed(4))}%
                                                </span>
                                            </div>

                                            {/* Live Calculation Summary */}
                                            <div className={`rounded-xl p-3 space-y-2 border ${
                                                isLight ? 'bg-white border-black/[0.06] shadow-sm' : 'bg-white/[0.03] border-white/[0.06]'
                                            }`}>
                                                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                                                    <span className={isLight ? 'text-[#6e6e73]' : 'text-white/60'}>
                                                        Total Income: <strong className={`font-mono ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>{formatCurrency(form.amount || 0, form.currency)}</strong>
                                                    </span>
                                                    <span className={isLight ? 'text-[#6e6e73]' : 'text-white/60'}>
                                                        Misc Expense: <strong className={`font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>-{formatCurrency(miscExpenseAmount || 0, form.currency)}</strong>
                                                    </span>
                                                    <span className={isLight ? 'text-[#6e6e73]' : 'text-white/60'}>
                                                        Net Split Pool: <strong className={`font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatCurrency(netIncomeAmount, form.currency)}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between pt-1.5 border-t text-xs" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                                                    <span className={`font-medium ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>Counted Total (Misc + 4 Splits):</span>
                                                    <span className={`font-bold font-mono ${
                                                        isSplitValid && miscExpenseAmount <= (form.amount || 0)
                                                            ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                                                            : (isLight ? 'text-amber-700' : 'text-amber-400')
                                                    }`}>
                                                        {formatCurrency(totalAllocatedAmount, form.currency)} / {formatCurrency(form.amount || 0, form.currency)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Company Funding */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className={`flex items-center gap-1 ${isLight ? 'text-[#1d1d1f]' : 'text-white/80'}`}>🏢 Company Funding:</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Amt:</span>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(companyFundingShare)}
                                                                value={activeTempAmount?.field === 'company' ? activeTempAmount.value : (companyFundingShare || '')}
                                                                onFocus={e => setActiveTempAmount({ field: 'company', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempAmount({ field: 'company', value: valStr });
                                                                        handleSplitChange('company', 'amount', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempAmount(null)}
                                                                className={`w-24 md:w-28 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="any"
                                                            value={parseFloat(String(companyFundingPercent)) || 0}
                                                            onChange={e => handleSplitChange('company', 'percent', e.target.value)}
                                                            className="flex-1 accent-emerald-500 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(companyFundingPercent)}
                                                                value={activeTempPercent?.field === 'company' ? activeTempPercent.value : (companyFundingPercent !== undefined && companyFundingPercent !== null ? String(companyFundingPercent) : '')}
                                                                onFocus={e => setActiveTempPercent({ field: 'company', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempPercent({ field: 'company', value: valStr });
                                                                        handleSplitChange('company', 'percent', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempPercent(null)}
                                                                className={`w-28 md:w-36 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 overflow-x-auto ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                            <span className={`text-xs ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Broker Allowance */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className={`flex items-center gap-1 ${isLight ? 'text-[#1d1d1f]' : 'text-white/80'}`}>💼 Broker Allowance:</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Amt:</span>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(brokerShare)}
                                                                value={activeTempAmount?.field === 'broker' ? activeTempAmount.value : (brokerShare || '')}
                                                                onFocus={e => setActiveTempAmount({ field: 'broker', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempAmount({ field: 'broker', value: valStr });
                                                                        handleSplitChange('broker', 'amount', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempAmount(null)}
                                                                className={`w-24 md:w-28 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="any"
                                                            value={parseFloat(String(brokerPercent)) || 0}
                                                            onChange={e => handleSplitChange('broker', 'percent', e.target.value)}
                                                            className="flex-1 accent-indigo-500 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(brokerPercent)}
                                                                value={activeTempPercent?.field === 'broker' ? activeTempPercent.value : (brokerPercent !== undefined && brokerPercent !== null ? String(brokerPercent) : '')}
                                                                onFocus={e => setActiveTempPercent({ field: 'broker', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempPercent({ field: 'broker', value: valStr });
                                                                        handleSplitChange('broker', 'percent', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempPercent(null)}
                                                                className={`w-28 md:w-36 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 overflow-x-auto ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                            <span className={`text-xs ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Marketing Share */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className={`flex items-center gap-1 ${isLight ? 'text-[#1d1d1f]' : 'text-white/80'}`}>📢 Marketing Share:</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Amt:</span>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(marketingShare)}
                                                                value={activeTempAmount?.field === 'marketing' ? activeTempAmount.value : (marketingShare || '')}
                                                                onFocus={e => setActiveTempAmount({ field: 'marketing', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempAmount({ field: 'marketing', value: valStr });
                                                                        handleSplitChange('marketing', 'amount', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempAmount(null)}
                                                                className={`w-24 md:w-28 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="any"
                                                            value={parseFloat(String(marketingPercent)) || 0}
                                                            onChange={e => handleSplitChange('marketing', 'percent', e.target.value)}
                                                            className="flex-1 accent-pink-500 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(marketingPercent)}
                                                                value={activeTempPercent?.field === 'marketing' ? activeTempPercent.value : (marketingPercent !== undefined && marketingPercent !== null ? String(marketingPercent) : '')}
                                                                onFocus={e => setActiveTempPercent({ field: 'marketing', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempPercent({ field: 'marketing', value: valStr });
                                                                        handleSplitChange('marketing', 'percent', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempPercent(null)}
                                                                className={`w-28 md:w-36 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 overflow-x-auto ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                            <span className={`text-xs ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Development Share */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className={`flex items-center gap-1 ${isLight ? 'text-[#1d1d1f]' : 'text-white/80'}`}>🛠️ Development Share:</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Amt:</span>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(devShare)}
                                                                value={activeTempAmount?.field === 'dev' ? activeTempAmount.value : (devShare || '')}
                                                                onFocus={e => setActiveTempAmount({ field: 'dev', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempAmount({ field: 'dev', value: valStr });
                                                                        handleSplitChange('dev', 'amount', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempAmount(null)}
                                                                className={`w-24 md:w-28 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="any"
                                                            value={parseFloat(String(devPercent)) || 0}
                                                            onChange={e => handleSplitChange('dev', 'percent', e.target.value)}
                                                            className="flex-1 accent-amber-500 h-1.5 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                title={String(devPercent)}
                                                                value={activeTempPercent?.field === 'dev' ? activeTempPercent.value : (devPercent !== undefined && devPercent !== null ? String(devPercent) : '')}
                                                                onFocus={e => setActiveTempPercent({ field: 'dev', value: e.target.value })}
                                                                onChange={e => {
                                                                    const valStr = e.target.value;
                                                                    if (/^[0-9]*\.?[0-9]*$/.test(valStr)) {
                                                                        setActiveTempPercent({ field: 'dev', value: valStr });
                                                                        handleSplitChange('dev', 'percent', valStr);
                                                                    }
                                                                }}
                                                                onBlur={() => setActiveTempPercent(null)}
                                                                className={`w-28 md:w-36 text-center text-xs font-bold font-mono rounded-lg py-1 outline-none border px-1 overflow-x-auto ${
                                                                    isLight
                                                                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-[#0071e3]'
                                                                        : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-[#0a84ff]'
                                                                }`}
                                                            />
                                                            <span className={`text-xs ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleAutoBalance}
                                                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                                        isLight
                                                            ? 'bg-white hover:bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] shadow-sm'
                                                            : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                                                    }`}
                                                >
                                                    ⚖️ Auto-Balance splits to 100%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCompanyFundingPercent('25');
                                                        setBrokerPercent('25');
                                                        setMarketingPercent('25');
                                                        setDevPercent('25');
                                                        if (netIncomeAmount > 0) {
                                                            setSplitAmounts({
                                                                company: calcAmountFromPercent('25', netIncomeAmount, 2),
                                                                broker: calcAmountFromPercent('25', netIncomeAmount, 2),
                                                                marketing: calcAmountFromPercent('25', netIncomeAmount, 2),
                                                                dev: calcAmountFromPercent('25', netIncomeAmount, 2),
                                                            });
                                                        }
                                                        setActiveTempAmount(null);
                                                        setActiveTempPercent(null);
                                                    }}
                                                    className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                                                        isLight
                                                            ? 'bg-white hover:bg-black/[0.03] border-black/[0.08] text-[#6e6e73] hover:text-[#1d1d1f] shadow-sm'
                                                            : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/70 hover:text-white'
                                                    }`}
                                                >
                                                    Equal (25% each)
                                                </button>
                                            </div>
                                            {!isSplitValid && (
                                                <div className={`p-3 rounded-xl border text-xs font-medium text-center space-y-1 ${
                                                    isLight
                                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                                }`}>
                                                    <p className="font-bold flex items-center justify-center gap-1">
                                                        ⚠️ Manual Adjustment Needed (Sum is {parseFloat(rawTotalSplitPercent.toFixed(4))}%)
                                                    </p>
                                                    <p className="text-[11px] opacity-80">
                                                        The split percentages must equal 100% (or allocated amounts must equal the net pool) before you can save.
                                                    </p>
                                                </div>
                                            )}

                                            {/* ☕ Miscellaneous Expense Deduction */}
                                            <div className="border-t pt-3 mt-3 space-y-2" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                                    isLight ? 'text-amber-800' : 'text-amber-400'
                                                }`}>
                                                    ☕ Miscellaneous Expense Deduction
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-1">
                                                        <label className={`text-[10px] block mb-1 ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Deduct Amount</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={miscExpenseAmount || ''}
                                                            onChange={e => setMiscExpenseAmount(parseFloat(e.target.value) || 0)}
                                                            className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none border ${
                                                                isLight
                                                                    ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-amber-500'
                                                                    : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-amber-400'
                                                            }`}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className={`text-[10px] block mb-1 ${isLight ? 'text-[#86868b]' : 'text-white/40'}`}>Expense Remarks</label>
                                                        <input
                                                            type="text"
                                                            value={miscExpenseDescription}
                                                            onChange={e => setMiscExpenseDescription(e.target.value)}
                                                            className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border ${
                                                                isLight
                                                                    ? 'bg-white border-black/[0.1] text-[#1d1d1f] focus:border-amber-500'
                                                                    : 'bg-white/[0.08] border-white/[0.12] text-white focus:border-amber-400'
                                                            }`}
                                                            placeholder="e.g. Bus fare & tea"
                                                        />
                                                    </div>
                                                </div>
                                                {miscExpenseAmount > 0 && (
                                                    <p className={`text-[10px] leading-normal mt-1 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                        💡 <strong>{formatCurrency(miscExpenseAmount, form.currency)}</strong> will be subtracted from the income total. The net split amount will be <strong>{formatCurrency(netIncomeAmount, form.currency)}</strong>. A linked operational expense will be created in Company Funding!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ──────── EXPENSE-SPECIFIC FIELDS ──────── */}
                                {form.type === 'expense' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                Expense Category *
                                            </label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                                                className={`w-full rounded-xl px-3 py-2.5 text-xs font-medium transition-all outline-none border cursor-pointer ${
                                                    isLight
                                                        ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                                                        : 'bg-[#2c2c2e] border-white/[0.1] text-white focus:border-[#0a84ff]'
                                                }`}
                                            >
                                                <option value="">Select category...</option>
                                                {formCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                Project ID (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.project_id || ''}
                                                onChange={e => setForm((f: any) => ({ ...f, project_id: e.target.value }))}
                                                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border ${
                                                    isLight
                                                        ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                        : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                                }`}
                                                placeholder="Project tag ID"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ──────── DISTRIBUTION-SPECIFIC FIELDS ──────── */}
                                {form.type === 'distribution' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                    Recipient Identity / Team *
                                                </label>
                                                <CustomSelect 
                                                    value={selectedTeamForDist} 
                                                    onChange={v => {
                                                        setSelectedTeamForDist(v);
                                                        setForm((f: any) => ({ ...f, recipient: v, category: 'Distribution' }));
                                                    }}
                                                    placeholder="Select recipient team..."
                                                    themeMode={isLight ? 'light' : 'dark'}
                                                    options={[
                                                        {value: 'Company Funding', label: 'Company Funding'},
                                                        {value: 'Broker Allowance', label: 'Broker Allowance'},
                                                        {value: 'Marketing Team', label: 'Marketing Team'},
                                                        {value: 'Development Team', label: 'Development Team'},
                                                        ...categories.filter(c => c.type === 'receiver' && !c.parent_id).map(c => ({value: c.name, label: c.name})),
                                                        {value: 'Other Custom', label: 'Other Custom Recipient'}
                                                    ]}
                                                />
                                            </div>
                                            
                                            {selectedTeamForDist === 'Other Custom' && (
                                                <div>
                                                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                        Custom Recipient Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        onChange={e => setForm((f: any) => ({ ...f, recipient: e.target.value }))}
                                                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border ${
                                                            isLight
                                                                ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                                : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                                        }`}
                                                        placeholder="e.g. Design Vendor"
                                                    />
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {selectedTeamForDist && categories.some(c => c.name === selectedTeamForDist) && categories.filter(c => c.parent_id === categories.find(t => t.name === selectedTeamForDist)?.id).length > 0 && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2">
                                                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                            Distribute To (Entire Team or Member) *
                                                        </label>
                                                        <CustomSelect
                                                            value={form.recipient}
                                                            onChange={v => setForm((f: any) => ({ ...f, recipient: v }))}
                                                            themeMode={isLight ? 'light' : 'dark'}
                                                            options={[
                                                                {value: selectedTeamForDist, label: `Entire Team (${selectedTeamForDist})`},
                                                                ...categories.filter(c => c.parent_id === categories.find(t => t.name === selectedTeamForDist)?.id).map(c => ({value: c.name, label: `👤 ${c.name}`}))
                                                            ]}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                                Distribution Status
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm((f: any) => ({ ...f, subcategory: 'Pending' }))}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        form.subcategory !== 'Distributed'
                                                            ? (isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/40')
                                                            : (isLight ? 'bg-black/[0.03] border-black/[0.08] text-[#6e6e73] hover:text-[#1d1d1f]' : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:text-white')
                                                    }`}
                                                >
                                                    ⏳ Pending Distribution
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm((f: any) => ({ ...f, subcategory: 'Distributed' }))}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        form.subcategory === 'Distributed'
                                                            ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40')
                                                            : (isLight ? 'bg-black/[0.03] border-black/[0.08] text-[#6e6e73] hover:text-[#1d1d1f]' : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:text-white')
                                                    }`}
                                                >
                                                    ✅ Distributed (Paid Out)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-white/60'}`}>
                                        Notes & Remarks
                                    </label>
                                    <textarea
                                        value={form.notes || ''}
                                        onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                                        rows={2}
                                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none border resize-y ${
                                            isLight
                                                ? 'bg-black/[0.03] border-black/[0.08] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15'
                                                : 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-[#0a84ff] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0a84ff]/20'
                                        }`}
                                        placeholder="Additional corporate notes or reference details..."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                                        isLight ? 'text-[#6e6e73] hover:text-[#1d1d1f]' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaveDisabled}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                                        isSaveDisabled
                                            ? (isLight
                                                ? 'bg-black/10 text-[#86868b] border border-black/5 cursor-not-allowed shadow-none'
                                                : 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed shadow-none')
                                            : (isLight
                                                ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[#0071e3]/25'
                                                : 'bg-[#0a84ff] hover:bg-[#0071e3] text-white shadow-[#0a84ff]/30')
                                    }`}
                                >
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

export default function AdminFinanceTransactions() {
    return (
        <FinanceThemeProvider>
            <AdminFinanceTransactionsContent />
        </FinanceThemeProvider>
    );
}
