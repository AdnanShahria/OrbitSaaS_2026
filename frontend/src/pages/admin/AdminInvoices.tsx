import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Receipt, Plus, Search, Mail, Download, Eye, Edit, Trash2,
    CheckCircle2, Clock, AlertTriangle, Send, RefreshCw, DollarSign,
    Layers, User, Phone, MapPin, Calendar, FileText, ArrowRight,
    Copy, X, Sparkles, Check, ChevronDown, ExternalLink, ShieldAlert
} from 'lucide-react';
import { generateInvoicePdf, formatCurrency, loadLogoBase64, InvoiceData, InvoiceItem } from '@/utils/invoicePdf';
import { buildInvoiceEmailTemplate } from '@/utils/invoiceEmailTemplate';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SERVICE_TYPE_OPTIONS = [
    'Web Development',
    'Mobile App Development',
    'Cloud Hosting & Infrastructure',
    'UI/UX & Product Design',
    'SaaS Architecture & Consulting',
    'Maintenance & Security Support',
    'Custom Service',
];

const CURRENCIES = [
    { code: 'BDT', symbol: '৳', label: 'BDT (৳)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const DEFAULT_PAYMENT_INSTRUCTIONS = `Bank Transfer:
Bank: City Bank PLC / Dutch-Bangla Bank
Account Name: ORBIT SaaS Solutions
Account Number: 1502-XXXXXXXXX-001
Routing Number: 22527XXXX

Mobile Banking (bKash / Nagad Merchant):
01700-000000 (Make Payment)

International: Wire / Stripe payment link available upon request.`;

const DEFAULT_NOTES = `1. Payment is due within the specified due date.
2. In case of inquiries regarding this invoice, please reach us at contact@orbitsaas.cloud.
3. Thank you for choosing ORBIT SaaS for your digital innovation!`;

function formatLedgerCurrency(amount: number, currency = 'BDT') {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    switch (currency?.toUpperCase()) {
        case 'USD': return `$${formatted}`;
        case 'EUR': return `€${formatted}`;
        case 'GBP': return `£${formatted}`;
        case 'BDT':
        default: return `৳${formatted}`;
    }
}

interface StatusConfig {
    label: string;
    lightBg: string;
    lightText: string;
    lightBorder: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    dot: string;
    icon: any;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    paid: {
        label: 'Paid',
        lightBg: 'bg-emerald-50',
        lightText: 'text-emerald-700',
        lightBorder: 'border-emerald-200/80',
        darkBg: 'bg-emerald-500/10',
        darkText: 'text-emerald-400',
        darkBorder: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    partially_paid: {
        label: 'Partially Paid',
        lightBg: 'bg-amber-50',
        lightText: 'text-amber-700',
        lightBorder: 'border-amber-200/80',
        darkBg: 'bg-amber-500/10',
        darkText: 'text-amber-400',
        darkBorder: 'border-amber-500/20',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
    },
    sent: {
        label: 'Sent',
        lightBg: 'bg-indigo-50',
        lightText: 'text-indigo-700',
        lightBorder: 'border-indigo-200/80',
        darkBg: 'bg-indigo-500/10',
        darkText: 'text-indigo-400',
        darkBorder: 'border-indigo-500/20',
        dot: 'bg-indigo-500',
        icon: Send,
    },
    draft: {
        label: 'Draft',
        lightBg: 'bg-black/[0.04]',
        lightText: 'text-[#6e6e73]',
        lightBorder: 'border-black/[0.08]',
        darkBg: 'bg-white/[0.06]',
        darkText: 'text-neutral-400',
        darkBorder: 'border-white/[0.08]',
        dot: 'bg-neutral-400',
        icon: Clock,
    },
    overdue: {
        label: 'Overdue',
        lightBg: 'bg-rose-50',
        lightText: 'text-rose-700',
        lightBorder: 'border-rose-200/80',
        darkBg: 'bg-rose-500/10',
        darkText: 'text-rose-400',
        darkBorder: 'border-rose-500/20',
        dot: 'bg-rose-500',
        icon: AlertTriangle,
    },
    cancelled: {
        label: 'Cancelled',
        lightBg: 'bg-red-50',
        lightText: 'text-red-700',
        lightBorder: 'border-red-200/80',
        darkBg: 'bg-red-500/10',
        darkText: 'text-red-400',
        darkBorder: 'border-red-500/20',
        dot: 'bg-red-500',
        icon: X,
    },
};

interface InvoiceStatCardProps {
    title: string;
    value: string;
    badgeText?: string;
    badgeType?: 'neutral' | 'success' | 'warning' | 'danger';
    icon: any;
    accentColor: string;
    lightTint: string;
    darkTint: string;
    isLight: boolean;
}

const InvoiceStatCard = ({
    title,
    value,
    badgeText,
    badgeType = 'neutral',
    icon: Icon,
    accentColor,
    lightTint,
    darkTint,
    isLight,
}: InvoiceStatCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.18 } }}
            className={`rounded-3xl p-5 relative overflow-hidden transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.07)] hover:border-black/[0.12]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-white/[0.16]'
            }`}
        >
            {/* Subtle Apple ambient glow on card corner */}
            <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity duration-500"
                style={{ backgroundColor: isLight ? lightTint : darkTint }}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <div>
                        <p className={`text-[11px] font-semibold tracking-wider uppercase ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            {title}
                        </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                        {value}
                    </p>
                    {badgeText && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                                    badgeType === 'success'
                                        ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30')
                                        : badgeType === 'warning'
                                        ? (isLight ? 'bg-amber-50 text-amber-700 border border-amber-200/80' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30')
                                        : badgeType === 'danger'
                                        ? (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200/80' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30')
                                        : (isLight ? 'bg-black/[0.04] text-[#6e6e73] border border-black/[0.06]' : 'bg-white/[0.06] text-neutral-300 border border-white/[0.08]')
                                }`}
                            >
                                {badgeText}
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 ${
                        isLight
                            ? 'bg-black/[0.03] border border-black/[0.04]'
                            : 'bg-white/[0.06] border border-white/[0.08]'
                    }`}
                >
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
            </div>
        </motion.div>
    );
};

export default function AdminInvoices() {
    const token = localStorage.getItem('admin_token') || '';
    const { isLight } = useAdminTheme();

    // Data State
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_invoices: 0,
        total_invoiced: 0,
        total_collected: 0,
        total_due: 0,
        draft_count: 0,
        sent_count: 0,
        paid_count: 0,
        overdue_count: 0,
    });

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');

    // Modals
    const [builderOpen, setBuilderOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [builderPreviewOpen, setBuilderPreviewOpen] = useState(false);
    const [builderPreviewUrl, setBuilderPreviewUrl] = useState<string | null>(null);

    // Selected Invoice States
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceData | null>(null);

    // Cached logo for PDF generation
    const logoRef = useRef<string | null>(null);

    // Invoice Builder Form
    const [formData, setFormData] = useState<InvoiceData>({
        invoice_number: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        service_type: 'Web Development',
        project_name: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items: [{ description: 'Core System Development & Engineering', quantity: 1, unit_price: 50000, amount: 50000 }],
        subtotal: 50000,
        discount: 0,
        tax: 0,
        total_amount: 50000,
        paid_amount: 0,
        due_amount: 50000,
        currency: 'BDT',
        status: 'draft',
        payment_instructions: DEFAULT_PAYMENT_INSTRUCTIONS,
        notes: DEFAULT_NOTES,
    });

    const [customServiceInput, setCustomServiceInput] = useState('');
    const [saving, setSaving] = useState(false);

    // Email Composer Form
    const [emailForm, setEmailForm] = useState({
        recipient: '',
        subject: '',
        message: '',
        attachPdf: true,
    });
    const [emailSending, setEmailSending] = useState(false);
    const [activeEmailTab, setActiveEmailTab] = useState<'html' | 'pdf'>('html');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    // Load Invoices
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ action: 'list' });
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (serviceFilter !== 'all') params.set('service_type', serviceFilter);

            const res = await fetch(`${API_BASE}/api/invoices?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch invoices');
            const data = await res.json();
            setInvoices(data.invoices || []);
            if (data.stats) setStats(data.stats);
        } catch (err: any) {
            toast.error(err.message || 'Error loading invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        // Pre-load logo for PDF generation (runs once, cached)
        if (!logoRef.current) {
            loadLogoBase64().then(b64 => { logoRef.current = b64; });
        }
    }, [search, statusFilter, serviceFilter]);

    // Helper to get fallback invoice number in INV-YYYY-MM-0001 format
    const getFallbackInvoiceNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `INV-${year}-${month}-0001`;
    };

    // Fetch next invoice number for creation
    const fetchNextNumber = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/invoices?action=next_number`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data.next_number || getFallbackInvoiceNumber();
        } catch {
            return getFallbackInvoiceNumber();
        }
    };

    // Open Builder for Create
    const handleOpenCreate = async () => {
        const nextNum = await fetchNextNumber();
        setFormData({
            invoice_number: nextNum,
            client_name: '',
            client_email: '',
            client_phone: '',
            client_address: '',
            service_type: 'Web Development',
            project_name: '',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            items: [{ description: 'Full-stack Platform Development & Architecture', quantity: 1, unit_price: 60000, amount: 60000 }],
            subtotal: 60000,
            discount: 0,
            tax: 0,
            total_amount: 60000,
            paid_amount: 0,
            due_amount: 60000,
            currency: 'BDT',
            status: 'draft',
            payment_instructions: DEFAULT_PAYMENT_INSTRUCTIONS,
            notes: DEFAULT_NOTES,
        });
        setCustomServiceInput('');
        setBuilderOpen(true);
    };

    // Open Builder for Edit
    const handleOpenEdit = (inv: InvoiceData) => {
        const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
        const isCustom = !SERVICE_TYPE_OPTIONS.includes(inv.service_type);
        setFormData({
            ...inv,
            items: items.length > 0 ? items : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
            service_type: isCustom ? 'Custom Service' : inv.service_type,
        });
        setCustomServiceInput(isCustom ? inv.service_type : '');
        setBuilderOpen(true);
    };

    // Handle Item Changes & Recalculate
    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const items = Array.isArray(formData.items) ? [...formData.items] : [];
        const item = { ...items[index], [field]: value };
        
        if (field === 'quantity' || field === 'unit_price') {
            const q = field === 'quantity' ? Number(value) : Number(item.quantity);
            const p = field === 'unit_price' ? Number(value) : Number(item.unit_price);
            item.amount = (isNaN(q) ? 0 : q) * (isNaN(p) ? 0 : p);
        }

        items[index] = item;
        recalculateTotals(items, formData.discount, formData.tax, formData.paid_amount);
    };

    const addItem = () => {
        const items = Array.isArray(formData.items) ? [...formData.items] : [];
        items.push({ description: '', quantity: 1, unit_price: 0, amount: 0 });
        recalculateTotals(items, formData.discount, formData.tax, formData.paid_amount);
    };

    const removeItem = (index: number) => {
        const items = Array.isArray(formData.items) ? [...formData.items] : [];
        if (items.length <= 1) {
            toast.error('Invoice must have at least one item');
            return;
        }
        items.splice(index, 1);
        recalculateTotals(items, formData.discount, formData.tax, formData.paid_amount);
    };

    const recalculateTotals = (items: InvoiceItem[], discountVal?: number, taxVal?: number, paidVal?: number) => {
        const subtotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const discount = Number(discountVal !== undefined ? discountVal : formData.discount) || 0;
        const tax = Number(taxVal !== undefined ? taxVal : formData.tax) || 0;
        const total = Math.max(0, subtotal - discount + tax);
        const paid = Number(paidVal !== undefined ? paidVal : formData.paid_amount) || 0;
        const due = Math.max(0, total - paid);

        let status = formData.status;
        if (paid >= total && total > 0) {
            status = 'paid';
        } else if (paid > 0 && paid < total) {
            status = 'partially_paid';
        }

        setFormData(prev => ({
            ...prev,
            items,
            subtotal,
            discount,
            tax,
            total_amount: total,
            paid_amount: paid,
            due_amount: due,
            status,
        }));
    };

    // Save Invoice (Create or Update)
    const handleSaveInvoice = async (andCompose: boolean = false) => {
        if (!formData.client_name.trim()) {
            toast.error('Client Name is required');
            return;
        }
        if (!formData.client_email.trim() || !formData.client_email.includes('@')) {
            toast.error('A valid Client Email is required');
            return;
        }

        const effectiveServiceType = formData.service_type === 'Custom Service'
            ? (customServiceInput.trim() || 'Custom Service')
            : formData.service_type;

        const payload = {
            ...formData,
            service_type: effectiveServiceType,
            items: JSON.stringify(formData.items),
        };

        setSaving(true);
        try {
            const isEdit = !!formData.id;
            const url = `${API_BASE}/api/invoices?action=${isEdit ? 'update' : 'create'}`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save invoice');

            toast.success(isEdit ? 'Invoice updated successfully' : 'Invoice created successfully');
            setBuilderOpen(false);
            fetchInvoices();

            if (andCompose) {
                handleOpenEmailModal(data.invoice || formData);
            }
        } catch (err: any) {
            toast.error(err.message || 'Error saving invoice');
        } finally {
            setSaving(false);
        }
    };

    // Delete Invoice
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/invoices?action=delete&id=${invoiceToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
            toast.success('Invoice deleted successfully');
            setDeleteModalOpen(false);
            setInvoiceToDelete(null);
            fetchInvoices();
        } catch (err: any) {
            toast.error(err.message || 'Error deleting invoice');
        }
    };

    // Open Email Modal & Generate Live PDF Preview
    const handleOpenEmailModal = (inv: InvoiceData) => {
        setSelectedInvoice(inv);
        const defaultMsg = `Dear ${inv.client_name},\n\nPlease find attached the official invoice (${inv.invoice_number}) for your ${inv.service_type} project.\nTotal Amount: ${formatCurrency(inv.total_amount, inv.currency)}\nDue Balance: ${formatCurrency(inv.due_amount, inv.currency)}\nDue Date: ${inv.due_date}\n\nKindly review and process the payment at your earliest convenience.\n\nBest regards,\nORBIT SaaS Billing Team`;

        setEmailForm({
            recipient: inv.client_email,
            subject: `Invoice ${inv.invoice_number} for ${inv.service_type} - ORBIT SaaS`,
            message: defaultMsg,
            attachPdf: true,
        });

        // Generate PDF blob preview
        try {
            const pdfRes = generateInvoicePdf(inv, logoRef.current);
            setPdfPreviewUrl(pdfRes.getBlobUrl());
        } catch (e) {
            console.error('PDF preview error:', e);
        }

        if (!logoRef.current) {
            loadLogoBase64().then(b64 => {
                if (b64) {
                    logoRef.current = b64;
                    try {
                        const pdfRes = generateInvoicePdf(inv, b64);
                        setPdfPreviewUrl(pdfRes.getBlobUrl());
                    } catch {}
                }
            });
        }

        setEmailModalOpen(true);
    };

    // Send Invoice Email to Customer
    const handleSendInvoiceEmail = async () => {
        if (!selectedInvoice) return;
        if (!emailForm.recipient || !emailForm.recipient.includes('@')) {
            toast.error('Please specify a valid recipient email address');
            return;
        }

        setEmailSending(true);
        const toastId = toast.loading(`Generating invoice PDF and dispatching to ${emailForm.recipient}...`);

        // Yield to the main thread so React can render the spinner before synchronous PDF generation blocks it
        await new Promise(resolve => setTimeout(resolve, 20));

        try {
            let pdfBase64 = '';
            if (emailForm.attachPdf) {
                // Ensure logo is loaded before generating PDF
                if (!logoRef.current) {
                    logoRef.current = await loadLogoBase64();
                }
                const pdfRes = generateInvoicePdf(selectedInvoice, logoRef.current);
                pdfBase64 = pdfRes.getBase64();
            }

            const payload = {
                id: selectedInvoice.id,
                invoice: selectedInvoice,
                to_email: emailForm.recipient,
                subject: emailForm.subject,
                message: emailForm.message,
                pdf_base64: pdfBase64,
            };

            const res = await fetch(`${API_BASE}/api/invoices?action=send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to dispatch email');
            }

            toast.success(`Invoice email sent successfully to ${emailForm.recipient}!`, { id: toastId });
            setEmailModalOpen(false);
            fetchInvoices();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to send invoice email', { id: toastId });
        } finally {
            setEmailSending(false);
        }
    };

    // Direct PDF Download
    const handleDownloadPdf = (inv: InvoiceData) => {
        try {
            const pdfRes = generateInvoicePdf(inv, logoRef.current);
            pdfRes.downloadPdf();
            toast.success(`Downloaded ${inv.invoice_number}.pdf`);
        } catch (e: any) {
            toast.error('Failed to generate PDF: ' + e.message);
        }
    };

    // Preview PDF from Builder Form (unsaved)
    const handleBuilderPreview = () => {
        try {
            const effectiveServiceType = formData.service_type === 'Custom Service'
                ? (customServiceInput.trim() || 'Custom Service')
                : formData.service_type;

            const previewData: InvoiceData = {
                ...formData,
                service_type: effectiveServiceType,
            };

            const pdfRes = generateInvoicePdf(previewData, logoRef.current);
            setBuilderPreviewUrl(pdfRes.getBlobUrl());
            setBuilderPreviewOpen(true);

            if (!logoRef.current) {
                loadLogoBase64().then(b64 => {
                    if (b64) {
                        logoRef.current = b64;
                        try {
                            const updatedRes = generateInvoicePdf(previewData, b64);
                            setBuilderPreviewUrl(updatedRes.getBlobUrl());
                        } catch {}
                    }
                });
            }
        } catch (e: any) {
            toast.error('Failed to generate preview: ' + e.message);
        }
    };

    // Quick Status Update (Mark Paid / Partially Paid)
    const handleQuickStatus = async (inv: InvoiceData, newStatus: string) => {
        try {
            const payload: any = { id: inv.id, status: newStatus };
            if (newStatus === 'paid') {
                payload.paid_amount = inv.total_amount;
                payload.due_amount = 0;
            }

            const res = await fetch(`${API_BASE}/api/invoices?action=update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Status update failed');
            toast.success(`Invoice marked as ${newStatus.toUpperCase()}`);
            fetchInvoices();
        } catch (err: any) {
            toast.error(err.message || 'Error updating invoice');
        }
    };

    // Duplicate Invoice
    const handleDuplicate = async (inv: InvoiceData) => {
        const nextNum = await fetchNextNumber();
        const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
        setFormData({
            ...inv,
            id: undefined,
            invoice_number: nextNum,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            items,
            status: 'draft',
            paid_amount: 0,
            due_amount: inv.total_amount,
        });
        setBuilderOpen(true);
        toast.info(`Duplicated as new draft ${nextNum}`);
    };

    // Direct Live Preview of existing invoice
    const handleOpenPreview = (inv: InvoiceData) => {
        try {
            const pdfRes = generateInvoicePdf(inv, logoRef.current);
            setBuilderPreviewUrl(pdfRes.getBlobUrl());
            setFormData(inv);
            setBuilderPreviewOpen(true);
        } catch (e: any) {
            toast.error('Failed to preview invoice: ' + e.message);
        }
    };

    // Live HTML Email Content in Preview
    const emailPreviewHtml = useMemo(() => {
        if (!selectedInvoice) return '';
        return buildInvoiceEmailTemplate(selectedInvoice, emailForm.message);
    }, [selectedInvoice, emailForm.message]);

    return (
        <div className={`min-h-full space-y-6 p-1 md:p-2 transition-colors duration-300 ${isLight ? 'text-[#1d1d1f]' : 'text-foreground'}`}>
            <Helmet>
                <title>Customer Invoices & Billing — Admin | ORBIT SaaS</title>
            </Helmet>

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* ─── Header & Top Actions (Apple HIG Style) ─── */}
                <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b transition-colors duration-300"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
                >
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                                isLight ? 'bg-indigo-500/10 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                                <Receipt className="w-5 h-5" />
                            </div>
                            <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'} flex items-center gap-2.5`}>
                                Customer Invoices
                                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                                    isLight
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                    Direct Billing
                                </span>
                            </h1>
                        </div>
                        <p className={`text-xs mt-1 ml-11.5 font-medium ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Generate branded invoices, review live HTML/PDF previews, and dispatch directly to customer inboxes.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                            onClick={fetchInvoices}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                                isLight
                                    ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs'
                                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1] shadow-xs'
                            }`}
                            title="Refresh Invoices"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={handleOpenCreate}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                                isLight
                                    ? 'bg-[#0071e3] hover:bg-[#0062c4] text-white shadow-[#0071e333]'
                                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[#0071e344]'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Invoice</span>
                        </button>
                    </div>
                </div>

                {/* ─── Dashboard Metrics (Apple Translucent Cards) ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InvoiceStatCard
                        title="Total Invoiced"
                        value={formatLedgerCurrency(stats.total_invoiced, 'BDT')}
                        badgeText={`${stats.total_invoices} total invoices logged`}
                        icon={Receipt}
                        accentColor={isLight ? '#0071e3' : '#0a84ff'}
                        lightTint="#0071e333"
                        darkTint="#0a84ff22"
                        isLight={isLight}
                    />
                    <InvoiceStatCard
                        title="Collected Revenue"
                        value={formatLedgerCurrency(stats.total_collected, 'BDT')}
                        badgeText={`${stats.paid_count} fully settled invoices`}
                        badgeType="success"
                        icon={CheckCircle2}
                        accentColor={isLight ? '#28cd41' : '#30d158'}
                        lightTint="#28cd4133"
                        darkTint="#30d15822"
                        isLight={isLight}
                    />
                    <InvoiceStatCard
                        title="Outstanding Balance"
                        value={formatLedgerCurrency(stats.total_due, 'BDT')}
                        badgeText="Pending customer payments"
                        badgeType={stats.total_due > 0 ? 'danger' : 'neutral'}
                        icon={DollarSign}
                        accentColor={isLight ? '#ff3b30' : '#ff453a'}
                        lightTint="#ff3b3033"
                        darkTint="#ff453a22"
                        isLight={isLight}
                    />
                    <InvoiceStatCard
                        title="Dispatched & Activity"
                        value={`${stats.sent_count} Sent`}
                        badgeText={stats.overdue_count > 0 ? `${stats.overdue_count} overdue attention` : `${stats.draft_count} drafts saved`}
                        badgeType={stats.overdue_count > 0 ? 'warning' : 'neutral'}
                        icon={Send}
                        accentColor={isLight ? '#5856d6' : '#5e5ce6'}
                        lightTint="#5856d633"
                        darkTint="#5e5ce622"
                        isLight={isLight}
                    />
                </div>

                {/* ─── Search & Filters Bar (Apple Style) ─── */}
                <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-2.5 transition-all relative z-20 border shadow-none ${
                    isLight
                        ? 'bg-white/90 border-black/[0.08]'
                        : 'bg-[#161618] border-white/[0.08]'
                }`}>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-[#86868b]' : 'text-muted-foreground'}`} />
                        <input
                            type="text"
                            placeholder="Search by invoice #, client, email, project..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full rounded-xl pl-10 pr-4 py-2 text-[13px] outline-none transition-all ${
                                isLight
                                    ? 'bg-black/[0.03] text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.08] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20'
                                    : 'bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-1 focus:ring-primary/50'
                            }`}
                        />
                    </div>

                    <div className="w-[170px] min-w-[170px]">
                        <CustomSelect
                            themeMode={isLight ? 'light' : 'dark'}
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            options={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'sent', label: 'Sent to Customer' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'partially_paid', label: 'Partially Paid' },
                                { value: 'overdue', label: 'Overdue' },
                            ]}
                        />
                    </div>

                    <div className="w-[220px] min-w-[220px]">
                        <CustomSelect
                            themeMode={isLight ? 'light' : 'dark'}
                            value={serviceFilter}
                            onChange={(v) => setServiceFilter(v)}
                            options={[
                                { value: 'all', label: 'All Services' },
                                ...SERVICE_TYPE_OPTIONS.map((opt) => ({ value: opt, label: opt })),
                            ]}
                        />
                    </div>
                </div>

                {/* ─── Invoices Index Table (Admin Finance Ledger Style) ─── */}
                {loading ? (
                    <div className="space-y-1.5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className={`h-[44px] rounded-xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                        ))}
                    </div>
                ) : (
                    <div className={`rounded-2xl overflow-hidden transition-all duration-300 relative z-10 border shadow-none ${
                        isLight
                            ? 'bg-white border-black/[0.08]'
                            : 'bg-[#161618] border-white/[0.08]'
                    }`}>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-[13px] whitespace-nowrap">
                                <thead className={`uppercase tracking-wider text-[11px] font-semibold border-b transition-colors select-none ${
                                    isLight
                                        ? 'bg-black/[0.02] text-[#86868b] border-black/[0.06]'
                                        : 'bg-white/[0.02] text-[#86868b] border-white/[0.08]'
                                }`}>
                                    <tr className="h-[36px]">
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium w-[160px]">Invoice #</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium min-w-[220px]">Customer / Identity</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium min-w-[170px]">Service Type</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium min-w-[150px]">Dates</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium text-right min-w-[140px]">Amount / Due</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium text-center w-[130px]">Status</th>
                                        <th className="px-3.5 py-0 h-[36px] align-middle font-medium text-right w-[160px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y text-[13px] ${isLight ? 'divide-black/[0.04]' : 'divide-white/[0.05]'}`}>
                                    <AnimatePresence>
                                        {invoices.length === 0 ? (
                                            <tr className="h-[90px]">
                                                <td colSpan={7} className={`px-4 text-center text-[13px] font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                                                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                                                        <Receipt className="w-8 h-8 opacity-30" />
                                                        <span>No customer invoices found matching your filters.</span>
                                                        <button
                                                            onClick={handleOpenCreate}
                                                            className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                                                                isLight ? 'bg-black/[0.05] hover:bg-black/10 text-[#1d1d1f]' : 'bg-white/[0.08] hover:bg-white/[0.12] text-white'
                                                            }`}
                                                        >
                                                            + Create New Invoice
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((inv) => {
                                                const st = STATUS_CONFIG[inv.status || 'draft'] || STATUS_CONFIG.draft;
                                                return (
                                                    <tr
                                                        key={inv.id || inv.invoice_number}
                                                        onClick={() => handleOpenPreview(inv)}
                                                        className={`h-[48px] cursor-pointer transition-colors group select-none ${
                                                            isLight
                                                                ? 'hover:bg-black/[0.03]'
                                                                : 'hover:bg-white/[0.04]'
                                                        }`}
                                                    >
                                                        {/* Invoice # */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle text-[13px] font-mono tabular-nums">
                                                            <div className="flex items-center gap-2 leading-none">
                                                                <div className={`p-1.5 rounded-lg shrink-0 ${isLight ? 'bg-black/[0.04] text-black/60' : 'bg-white/[0.06] text-white/70'}`}>
                                                                    <Receipt className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div>
                                                                    <span className={`font-bold tracking-tight block ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                                                        {inv.invoice_number}
                                                                    </span>
                                                                    {inv.project_name && (
                                                                        <span className={`text-[11px] font-sans font-medium block truncate max-w-[130px] mt-0.5 ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                                                                            Proj: {inv.project_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Customer / Identity */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle">
                                                            <div className="leading-tight">
                                                                <div className={`font-medium text-[13px] truncate max-w-[240px] ${isLight ? 'text-[#1d1d1f]' : 'text-neutral-100'}`}>
                                                                    {inv.client_name || 'Anonymous Client'}
                                                                </div>
                                                                <div className={`text-[11px] font-mono truncate max-w-[240px] mt-0.5 ${isLight ? 'text-[#6e6e73]' : 'text-neutral-400'}`}>
                                                                    {inv.client_email || '—'}
                                                                    {inv.client_phone && <span className="ml-1 opacity-70">· {inv.client_phone}</span>}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Service Type */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                                                                isLight
                                                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                                                    : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                                            }`}>
                                                                {inv.service_type || 'Digital Services'}
                                                            </span>
                                                        </td>

                                                        {/* Dates */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle text-[12px] font-mono tabular-nums">
                                                            <div className="leading-tight space-y-0.5">
                                                                <div className={`flex items-center gap-1.5 ${isLight ? 'text-[#6e6e73]' : 'text-muted-foreground'}`}>
                                                                    <Calendar className="w-3 h-3 text-[#86868b] shrink-0" />
                                                                    <span>{inv.issue_date}</span>
                                                                </div>
                                                                <div className={`flex items-center gap-1.5 font-medium ${
                                                                    inv.status === 'paid'
                                                                        ? (isLight ? 'text-[#86868b]' : 'text-[#636366]')
                                                                        : 'text-rose-500 dark:text-rose-400'
                                                                }`}>
                                                                    <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                                                    <span className="text-[10px] uppercase font-sans font-semibold opacity-70">Due</span>
                                                                    <span>{inv.due_date}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Amount / Due */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle text-right font-mono tabular-nums whitespace-nowrap">
                                                            <div className="leading-tight">
                                                                <span className={`text-[13px] font-bold block ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                                                    {formatLedgerCurrency(inv.total_amount, inv.currency)}
                                                                </span>
                                                                {Number(inv.due_amount) > 0 ? (
                                                                    <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 block mt-0.5">
                                                                        Due: {formatLedgerCurrency(inv.due_amount, inv.currency)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                                                        Paid in full
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${
                                                                isLight
                                                                    ? `${st.lightBg} ${st.lightText} ${st.lightBorder} border`
                                                                    : `${st.darkBg} ${st.darkText} ${st.darkBorder} border`
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`} />
                                                                {st.label}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="h-[48px] py-0 px-3.5 align-middle text-right w-[160px]">
                                                            <div className="flex items-center justify-end gap-1 leading-none" onClick={(e) => e.stopPropagation()}>
                                                                {/* Send Mail */}
                                                                <button
                                                                    onClick={() => handleOpenEmailModal(inv)}
                                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                        isLight
                                                                            ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                                                                            : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                                                                    }`}
                                                                    title="Compose & Send Email"
                                                                >
                                                                    <Mail className="w-4 h-4" />
                                                                </button>

                                                                {/* Download PDF */}
                                                                <button
                                                                    onClick={() => handleDownloadPdf(inv)}
                                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                        isLight
                                                                            ? 'text-sky-600 hover:text-sky-700 hover:bg-sky-50'
                                                                            : 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
                                                                    }`}
                                                                    title="Download PDF"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>

                                                                {/* Edit */}
                                                                <button
                                                                    onClick={() => handleOpenEdit(inv)}
                                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                        isLight
                                                                            ? 'text-black/50 hover:text-black hover:bg-black/5'
                                                                            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.08]'
                                                                    }`}
                                                                    title="Edit Invoice"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>

                                                                {/* Duplicate */}
                                                                <button
                                                                    onClick={() => handleDuplicate(inv)}
                                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex ${
                                                                        isLight
                                                                            ? 'text-black/50 hover:text-black hover:bg-black/5'
                                                                            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.08]'
                                                                    }`}
                                                                    title="Duplicate Invoice"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>

                                                                {/* Quick Mark Paid Toggle */}
                                                                {inv.status !== 'paid' && (
                                                                    <button
                                                                        onClick={() => handleQuickStatus(inv, 'paid')}
                                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                            isLight
                                                                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                                                        }`}
                                                                        title="Mark Paid in full"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                {/* Delete */}
                                                                <button
                                                                    onClick={() => { setInvoiceToDelete(inv); setDeleteModalOpen(true); }}
                                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                        isLight
                                                                            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                                                            : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                                                                    }`}
                                                                    title="Delete Invoice"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL 1: INVOICE BUILDER / EDITOR MODAL
               ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {builderOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">
                                            {formData.id ? `Edit Invoice (${formData.invoice_number})` : 'Create Customer Invoice'}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Fill in client identity, itemized services, pricing, and payment instructions.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleBuilderPreview}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 text-sm font-medium transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setBuilderOpen(false)}
                                        className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Section 1: Customer Identity */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <User className="w-4 h-4" /> 1. Customer Identity & Project
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Client / Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Acme Corp / John Doe"
                                            value={formData.client_name}
                                            onChange={(e) => setFormData(f => ({ ...f, client_name: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Client Email *
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="client@company.com"
                                            value={formData.client_email}
                                            onChange={(e) => setFormData(f => ({ ...f, client_email: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Client Phone (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="+880 1700-000000"
                                            value={formData.client_phone || ''}
                                            onChange={(e) => setFormData(f => ({ ...f, client_phone: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Service Type *
                                        </label>
                                        <select
                                            value={formData.service_type}
                                            onChange={(e) => setFormData(f => ({ ...f, service_type: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-card text-foreground border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        >
                                            {SERVICE_TYPE_OPTIONS.map(opt => (
                                                <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {formData.service_type === 'Custom Service' ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                                Custom Service Name *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. AI Workflow Integration"
                                                value={customServiceInput}
                                                onChange={(e) => setCustomServiceInput(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                                Project / Product Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Orbit Platform v2"
                                                value={formData.project_name || ''}
                                                onChange={(e) => setFormData(f => ({ ...f, project_name: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Client Address (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Dhaka, Bangladesh / Global"
                                            value={formData.client_address || ''}
                                            onChange={(e) => setFormData(f => ({ ...f, client_address: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Invoice Metadata */}
                            <div className="space-y-4 pt-2 border-t border-border">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> 2. Invoice Dates & Currency
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.invoice_number}
                                            onChange={(e) => setFormData(f => ({ ...f, invoice_number: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm font-mono focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Issue Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.issue_date}
                                            onChange={(e) => setFormData(f => ({ ...f, issue_date: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-card text-foreground border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Payment Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData(f => ({ ...f, due_date: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-card text-foreground border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-card text-foreground border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        >
                                            {CURRENCIES.map(c => (
                                                <option key={c.code} value={c.code} className="bg-card text-foreground">{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Line Items */}
                            <div className="space-y-3 pt-2 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> 3. Billable Items & Services
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Row
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(Array.isArray(formData.items) ? formData.items : []).map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-card p-2.5 rounded-xl border border-border/50">
                                            <div className="w-full sm:flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Item / Deliverable description"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white placeholder:text-muted-foreground/60"
                                                />
                                            </div>
                                            <div className="w-full sm:w-20">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-center focus:border-indigo-500 focus:outline-none text-white"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Rate"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-right focus:border-indigo-500 focus:outline-none text-white"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32 text-right font-mono font-bold text-sm text-white px-2">
                                                {formatCurrency(item.amount || (item.quantity * item.unit_price), formData.currency)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="p-2 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Calculations & Financials */}
                            <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Payment instructions & Notes */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-semibold text-muted-foreground">
                                                Payment Methods & Instructions
                                            </label>
                                            <div className="flex items-center gap-1 flex-wrap justify-end">
                                                {[
                                                    {
                                                        label: 'Default',
                                                        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20',
                                                        text: `Bank Transfer:\nBank: City Bank PLC / Dutch-Bangla Bank\nAccount Name: ORBIT SaaS Solutions\nAccount Number: 1502-XXXXXXXXX-001\nRouting Number: 22527XXXX\n\nMobile Banking (bKash / Nagad Merchant):\n01700-000000 (Make Payment)\n\nInternational: Wire / Stripe payment link available upon request.`,
                                                    },
                                                    {
                                                        label: 'Paid ✓',
                                                        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
                                                        text: `PAYMENT RECEIVED - Thank you!\n\nThis invoice has been fully paid. No further action is required.\nIf you need a receipt or have questions, contact us at contact@orbitsaas.cloud.`,
                                                    },
                                                    {
                                                        label: 'Partial',
                                                        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                                                        text: `PARTIAL PAYMENT RECEIVED - Balance Remaining\n\nThank you for your partial payment! Please remit the remaining balance before the due date.\n\nBank Transfer:\nBank: City Bank PLC / Dutch-Bangla Bank\nAccount Name: ORBIT SaaS Solutions\nAccount Number: 1502-XXXXXXXXX-001\nRouting Number: 22527XXXX\n\nMobile Banking (bKash / Nagad Merchant):\n01700-000000 (Make Payment)\n\nInternational: Wire / Stripe payment link available upon request.`,
                                                    },
                                                    {
                                                        label: 'Due ⚠',
                                                        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                                                        text: `PAYMENT DUE - Please remit before the due date.\n\nBank Transfer:\nBank: City Bank PLC / Dutch-Bangla Bank\nAccount Name: ORBIT SaaS Solutions\nAccount Number: 1502-XXXXXXXXX-001\n\nMobile Banking (bKash / Nagad Merchant):\n01700-000000 (Make Payment)\n\nInternational: Wire / Stripe payment link available upon request.`,
                                                    },
                                                    {
                                                        label: 'Overdue',
                                                        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
                                                        text: `OVERDUE - Immediate payment required.\n\nThis invoice is past its due date. Please process payment immediately to avoid service interruption.\n\nBank Transfer:\nBank: City Bank PLC / Dutch-Bangla Bank\nAccount Name: ORBIT SaaS Solutions\nAccount Number: 1502-XXXXXXXXX-001\n\nMobile Banking (bKash / Nagad): 01700-000000\n\nContact us urgently at contact@orbitsaas.cloud if you have any concerns.`,
                                                    },
                                                    {
                                                        label: 'Discontinued',
                                                        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
                                                        text: `SERVICE DISCONTINUED\n\nThis project/service has been discontinued. Any outstanding balance shown above remains payable.\nPlease settle the remaining amount via the methods below:\n\nMobile Banking (bKash / Nagad): 01700-000000\nBank Transfer available on request.\n\nFor questions, reach us at contact@orbitsaas.cloud.`,
                                                    },
                                                ].map((preset) => (
                                                    <button
                                                        key={preset.label}
                                                        type="button"
                                                        onClick={() => setFormData(f => ({ ...f, payment_instructions: preset.text }))}
                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${preset.color}`}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            rows={4}
                                            value={formData.payment_instructions || ''}
                                            onChange={(e) => setFormData(f => ({ ...f, payment_instructions: e.target.value }))}
                                            className="w-full p-3 rounded-xl bg-secondary border border-border text-xs focus:border-indigo-500 focus:outline-none text-white resize-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-semibold text-muted-foreground">
                                                 Terms & Friendly Notes
                                            </label>
                                            <div className="flex items-center gap-1 flex-wrap justify-end">
                                                {[
                                                    {
                                                        label: 'Default',
                                                        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20',
                                                        text: `1. Payment is due within the specified due date.\n2. In case of inquiries regarding this invoice, please reach us at contact@orbitsaas.cloud.\n3. Thank you for choosing ORBIT SaaS for your digital innovation!`,
                                                    },
                                                    {
                                                        label: 'Paid ✓',
                                                        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
                                                        text: `1. Payment has been received in full - thank you!\n2. This invoice is now closed. No further action needed.\n3. We appreciate your trust in ORBIT SaaS. Looking forward to continuing our partnership!`,
                                                    },
                                                    {
                                                        label: 'Partial',
                                                        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                                                        text: `1. A partial payment has been received. The remaining balance is shown above.\n2. Please clear the outstanding amount before the due date to avoid service delays.\n3. Contact contact@orbitsaas.cloud for payment plans or questions.`,
                                                    },
                                                    {
                                                        label: 'Overdue',
                                                        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
                                                        text: `1. This invoice is past its due date. Please process payment immediately.\n2. Continued non-payment may result in service suspension or additional late fees.\n3. If you have already paid, please disregard this notice and contact us with your payment reference.`,
                                                    },
                                                    {
                                                        label: 'Discontinued',
                                                        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
                                                        text: `1. This service/project has been discontinued as per mutual agreement.\n2. Any outstanding balance remains payable and must be settled within 15 business days.\n3. For queries regarding final settlement, contact contact@orbitsaas.cloud.`,
                                                    },
                                                ].map((preset) => (
                                                    <button
                                                        key={preset.label}
                                                        type="button"
                                                        onClick={() => setFormData(f => ({ ...f, notes: preset.text }))}
                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${preset.color}`}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={formData.notes || ''}
                                            onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                                            className="w-full p-3 rounded-xl bg-secondary border border-border text-xs focus:border-indigo-500 focus:outline-none text-white resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Live Calculations Box */}
                                <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-semibold text-white">{formatCurrency(formData.subtotal, formData.currency)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Discount ({formData.currency}):</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.discount || 0}
                                            onChange={(e) => recalculateTotals(formData.items as InvoiceItem[], Number(e.target.value), formData.tax, formData.paid_amount)}
                                            className="w-28 px-2 py-1 text-right rounded-lg bg-secondary border border-border text-sm text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Tax / VAT ({formData.currency}):</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.tax || 0}
                                            onChange={(e) => recalculateTotals(formData.items as InvoiceItem[], formData.discount, Number(e.target.value), formData.paid_amount)}
                                            className="w-28 px-2 py-1 text-right rounded-lg bg-secondary border border-border text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="border-t border-border pt-2 flex justify-between items-center">
                                        <span className="font-bold text-white text-base">Grand Total:</span>
                                        <span className="font-bold text-white text-lg font-mono">
                                            {formatCurrency(formData.total_amount, formData.currency)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Paid / Advance:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.paid_amount || 0}
                                            onChange={(e) => recalculateTotals(formData.items as InvoiceItem[], formData.discount, formData.tax, Number(e.target.value))}
                                            className="w-28 px-2 py-1 text-right rounded-lg bg-secondary border border-border text-sm text-emerald-600 dark:text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="border-t border-rose-500/30 pt-2.5 flex justify-between items-center bg-rose-500/10 p-3 rounded-xl border">
                                        <span className="font-bold text-rose-300 text-sm">Balance Due:</span>
                                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-lg font-mono">
                                            {formatCurrency(formData.due_amount, formData.currency)}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Status:</span>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as any }))}
                                        className="px-2.5 py-1 rounded-lg bg-card text-foreground border border-border text-xs font-semibold text-white focus:outline-none"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="sent">Sent</option>
                                        <option value="paid">Paid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setBuilderOpen(false)}
                                        className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => handleSaveInvoice(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white border border-border transition-all disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                        {saving ? 'Saving...' : 'Save Invoice'}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => handleSaveInvoice(true)}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="w-4 h-4" />
                                                Save & Compose Email
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL 2: EMAIL COMPOSER & INTERACTIVE LIVE PREVIEW
               ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {emailModalOpen && selectedInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            Send Invoice {selectedInvoice.invoice_number}
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                To: {selectedInvoice.client_name}
                                            </span>
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Customize the message and preview the customer's email and attached PDF before dispatching.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEmailModalOpen(false)}
                                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Split Grid: Left = Composer, Right = Live Preview */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                                
                                {/* LEFT: Email Composer Form (5 cols) */}
                                <div className="lg:col-span-5 p-6 border-r border-border overflow-y-auto space-y-4 bg-secondary/20">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Recipient Email
                                        </label>
                                        <input
                                            type="email"
                                            value={emailForm.recipient}
                                            onChange={(e) => setEmailForm(f => ({ ...f, recipient: e.target.value }))}
                                            className="w-full px-3.5 py-2 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                            Email Subject Line
                                        </label>
                                        <input
                                            type="text"
                                            value={emailForm.subject}
                                            onChange={(e) => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                                            className="w-full px-3.5 py-2 rounded-xl bg-secondary border border-border text-sm focus:border-indigo-500 focus:outline-none text-white"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">
                                                Personal Message / Composal Body
                                            </label>
                                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400">Renders directly in email body</span>
                                        </div>
                                        <textarea
                                            rows={8}
                                            value={emailForm.message}
                                            onChange={(e) => setEmailForm(f => ({ ...f, message: e.target.value }))}
                                            placeholder="Write a custom note or payment instructions to the customer..."
                                            className="w-full p-3.5 rounded-xl bg-secondary border border-border text-xs font-sans leading-relaxed focus:border-indigo-500 focus:outline-none text-white resize-none"
                                        />
                                    </div>

                                    {/* Attachment Toggle */}
                                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <div>
                                                <div className="text-xs font-bold text-white">Attach High-Res PDF</div>
                                                <div className="text-[11px] text-indigo-300/80">{selectedInvoice.invoice_number}.pdf</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailForm.attachPdf}
                                            onChange={(e) => setEmailForm(f => ({ ...f, attachPdf: e.target.checked }))}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-white/10"
                                        />
                                    </div>

                                    {/* Send Action */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            disabled={emailSending}
                                            onClick={handleSendInvoiceEmail}
                                            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
                                        >
                                            {emailSending ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Sending to Customer...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send Invoice to Customer Now
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT: Live Interactive Preview (7 cols) */}
                                <div className="lg:col-span-7 flex flex-col h-full bg-secondary/30">
                                    
                                    {/* Preview Tab Selector */}
                                    <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setActiveEmailTab('html')}
                                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                    activeEmailTab === 'html'
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                        : 'text-muted-foreground hover:text-white'
                                                }`}
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                Live Email HTML Preview
                                            </button>

                                            <button
                                                onClick={() => setActiveEmailTab('pdf')}
                                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                    activeEmailTab === 'pdf'
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                        : 'text-muted-foreground hover:text-white'
                                                }`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Live PDF Document Preview
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {activeEmailTab === 'pdf' && pdfPreviewUrl && (
                                                <a
                                                    href={pdfPreviewUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-muted-foreground hover:text-white transition-all"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDownloadPdf(selectedInvoice)}
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-muted-foreground hover:text-white transition-all"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download PDF
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Container */}
                                    <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
                                        {activeEmailTab === 'html' ? (
                                            <div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-secondary/20 shadow-inner">
                                                <iframe
                                                    title="Email Preview"
                                                    srcDoc={emailPreviewHtml}
                                                    className="w-full h-full border-0"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-secondary/20 shadow-inner">
                                                {pdfPreviewUrl ? (
                                                    <iframe
                                                        title="PDF Preview"
                                                        src={pdfPreviewUrl}
                                                        className="w-full h-full border-0"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                                        Rendering PDF document...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: BUILDER PDF PREVIEW
               ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {builderPreviewOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-card border border-border rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            {/* Preview Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            Invoice Preview
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                Unsaved Draft
                                            </span>
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {formData.invoice_number} — {formData.client_name || 'No client'} — {formatCurrency(formData.total_amount, formData.currency)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {builderPreviewUrl && (
                                        <a
                                            href={builderPreviewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-muted-foreground hover:text-white border border-border transition-all"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const effectiveServiceType = formData.service_type === 'Custom Service'
                                                ? (customServiceInput.trim() || 'Custom Service')
                                                : formData.service_type;
                                            handleDownloadPdf({ ...formData, service_type: effectiveServiceType });
                                        }}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-muted-foreground hover:text-white border border-border transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setBuilderPreviewOpen(false)}
                                        className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* PDF Embed */}
                            <div className="flex-1 p-4 overflow-hidden">
                                <div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-secondary/20 shadow-inner">
                                    {builderPreviewUrl ? (
                                        <iframe
                                            title="Invoice PDF Preview"
                                            src={builderPreviewUrl}
                                            className="w-full h-full border-0"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Rendering PDF document...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL 3: DELETE CONFIRMATION MODAL
               ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {deleteModalOpen && invoiceToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-rose-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Delete Invoice?</h3>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete invoice <strong className="text-white font-mono">{invoiceToDelete.invoice_number}</strong> for <strong className="text-white">{invoiceToDelete.client_name}</strong>? This action cannot be undone.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-muted-foreground hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteInvoice}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-600/30"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
