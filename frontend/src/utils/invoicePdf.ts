import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface InvoiceData {
    id?: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    service_type: string;
    project_name?: string;
    issue_date: string;
    due_date: string;
    items: InvoiceItem[] | string;
    subtotal: number;
    discount?: number;
    tax?: number;
    total_amount: number;
    paid_amount?: number;
    due_amount: number;
    currency?: string;
    status?: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
    payment_instructions?: string;
    notes?: string;
    created_at?: string;
}

export function formatCurrency(amount: number, currency: string = 'BDT'): string {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    switch (currency.toUpperCase()) {
        case 'USD': return `$${formatted}`;
        case 'EUR': return `€${formatted}`;
        case 'GBP': return `£${formatted}`;
        case 'BDT':
        default: return `৳${formatted} BDT`;
    }
}

// PDF-safe currency formatter — avoids glyphs jsPDF Helvetica can't render cleanly
function pdfCurrency(amount: number, currency: string = 'BDT'): string {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    switch (currency.toUpperCase()) {
        case 'USD': return `$ ${formatted}`;
        case 'EUR': return `EUR ${formatted}`;
        case 'GBP': return `GBP ${formatted}`;
        case 'BDT':
        default: return `BDT ${formatted}`;
    }
}

// ─── PDF-Safe Text Sanitizer (strips emojis & non-Latin symbols that break jsPDF Helvetica) ───
export function sanitizePdfText(str: string): string {
    if (!str) return '';
    return str
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '') // Emojis
        .replace(/[\u2014\u2013]/g, '-') // Em-dash and En-dash to hyphen
        .replace(/[\u2018\u2019]/g, "'") // Curly single quotes
        .replace(/[\u201C\u201D]/g, '"') // Curly double quotes
        .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // Bullet symbols
        .replace(/[^\x20-\x7E\n\r\t]/g, '') // Strip remaining non-ASCII glyphs
        .replace(/[ \t]+/g, ' ') // Collapse multiple spaces
        .replace(/\n +/g, '\n') // Remove leading space after newline
        .trim();
}

// ─── Design Tokens (Apple HIG–inspired) ───
const C = {
    // Brand
    brand:       [88, 72, 206] as [number, number, number],   // #5848CE – refined indigo
    brandLight:  [118, 102, 220] as [number, number, number], // lighter variant

    // Neutrals — high contrast hierarchy
    black:       [17, 17, 21] as [number, number, number],    // near-black for headings
    heading:     [28, 28, 38] as [number, number, number],    // primary headings
    body:        [55, 55, 68] as [number, number, number],    // body text – 7:1 on white
    secondary:   [100, 100, 118] as [number, number, number], // secondary text – 4.6:1
    tertiary:    [140, 140, 155] as [number, number, number], // labels/captions
    muted:       [175, 175, 188] as [number, number, number], // subtle hints

    // Semantic
    success:     [30, 150, 100] as [number, number, number],  // green
    warning:     [200, 140, 20] as [number, number, number],  // amber
    danger:      [210, 35, 60] as [number, number, number],   // rose-red
    dangerBg:    [254, 245, 245] as [number, number, number], // rose bg
    dangerBorder:[252, 215, 215] as [number, number, number],

    // Surfaces
    white:       [255, 255, 255] as [number, number, number],
    surfaceBg:   [248, 249, 252] as [number, number, number], // light gray bg
    surfaceBorder:[228, 230, 240] as [number, number, number],
    tableHeaderBg:[28, 28, 42] as [number, number, number],
    tableAltRow: [250, 251, 255] as [number, number, number],
    divider:     [225, 228, 238] as [number, number, number],

    statusPaid:          { bg: [220, 252, 235], text: [20, 130, 85] },
    statusPartiallyPaid: { bg: [254, 243, 199], text: [180, 83, 9] }, // amber
    statusSent:          { bg: [228, 232, 255], text: [67, 56, 202] },
    statusOverdue:       { bg: [255, 232, 235], text: [210, 35, 60] },
    statusDraft:         { bg: [238, 238, 245], text: [90, 90, 110] },
};

// ─── Logo Loader ───
// Call once at app init or before first PDF generation; caches the result.
let _cachedLogoBase64: string | null = null;

export async function loadLogoBase64(): Promise<string | null> {
    if (_cachedLogoBase64) return _cachedLogoBase64;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/favicon.png';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Downscale to 200x200 canvas thumbnail — reduces embedded image size from 5.14MB to ~15KB
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, 200, 200);
            _cachedLogoBase64 = canvas.toDataURL('image/png');
        } else {
            _cachedLogoBase64 = img.src;
        }
        return _cachedLogoBase64;
    } catch (e) {
        console.warn('[InvoicePDF] Could not load/downscale logo for PDF:', e);
        return null;
    }
}

export function generateInvoicePdf(invoice: InvoiceData, logoBase64?: string | null) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const currency = invoice.currency || 'BDT';
    const items: InvoiceItem[] = typeof invoice.items === 'string'
        ? JSON.parse(invoice.items)
        : (invoice.items || []);

    const pw = doc.internal.pageSize.getWidth();   // 210mm
    const ph = doc.internal.pageSize.getHeight();   // 297mm
    const m = 18; // generous margin (HIG: give essential info sufficient space)
    const contentW = pw - m * 2;

    // ─── Accent Bar ───
    doc.setFillColor(...C.brand);
    doc.rect(0, 0, pw, 4, 'F');

    // ─── Company Brand (Logo + Text) ───
    let y = 18;
    const logoSize = 12; // mm — compact, professional
    let textOffsetX = m;

    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', m, y - 8, logoSize, logoSize);
            textOffsetX = m + logoSize + 3; // shift text right of logo
        } catch {
            // Fallback: render without logo if addImage fails
        }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...C.heading);
    doc.text('ORBIT', textOffsetX, y);

    const orbitW = doc.getTextWidth('ORBIT');
    doc.setTextColor(...C.brand);
    doc.text('SaaS', textOffsetX + orbitW + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.secondary);
    doc.text('DIGITAL PRODUCT & CLOUD ENGINEERING', textOffsetX, y + 5);
    doc.text('contact@orbitsaas.cloud  |  www.orbitsaas.cloud', textOffsetX, y + 9);

    // ─── INVOICE Title (Right) ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C.heading);
    doc.text('INVOICE', pw - m, y, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(...C.brand);
    doc.text(invoice.invoice_number || 'INV-0000', pw - m, y + 6, { align: 'right' });

    // Status Pill
    const rawStatus = invoice.status || 'draft';
    const statusText = rawStatus === 'partially_paid' ? 'PARTIAL' : rawStatus.toUpperCase();
    let statusStyle = C.statusDraft;
    if (rawStatus === 'paid') statusStyle = C.statusPaid;
    else if (rawStatus === 'partially_paid') statusStyle = C.statusPartiallyPaid;
    else if (rawStatus === 'sent') statusStyle = C.statusSent;
    else if (rawStatus === 'overdue') statusStyle = C.statusOverdue;

    const pillW = Math.max(doc.getTextWidth(statusText) + 8, 22);
    const pillX = pw - m - pillW;
    doc.setFillColor(statusStyle.bg[0], statusStyle.bg[1], statusStyle.bg[2]);
    doc.roundedRect(pillX, y + 9, pillW, 5.5, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusStyle.text[0], statusStyle.text[1], statusStyle.text[2]);
    doc.text(statusText, pillX + pillW / 2, y + 13, { align: 'center' });

    // ─── Divider ───
    y = 36;
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(m, y, pw - m, y);

    // ─── Client Info (Left) & Invoice Meta (Right) ───
    y = 42;

    // LEFT: Billed To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.tertiary);
    doc.text('BILLED TO', m, y);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.heading);
    doc.text(invoice.client_name || 'Valued Client', m, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.body);
    let clientY = y + 11;
    if (invoice.client_email) {
        doc.text(invoice.client_email, m, clientY);
        clientY += 4.5;
    }
    if (invoice.client_phone) {
        doc.text(invoice.client_phone, m, clientY);
        clientY += 4.5;
    }
    if (invoice.client_address) {
        doc.text(invoice.client_address, m, clientY);
        clientY += 4.5;
    }

    // RIGHT: Service & Dates Box
    const boxW = 72;
    const boxX = pw - m - boxW;
    const boxH = invoice.project_name ? 28 : 23;
    doc.setFillColor(...C.surfaceBg);
    doc.roundedRect(boxX, y - 3, boxW, boxH, 2.5, 2.5, 'F');
    doc.setDrawColor(...C.surfaceBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(boxX, y - 3, boxW, boxH, 2.5, 2.5, 'S');

    const bx = boxX + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.tertiary);
    doc.text('SERVICE TYPE', bx, y + 1);
    doc.setFontSize(9);
    doc.setTextColor(...C.brand);
    doc.text(invoice.service_type || 'Digital Services', bx, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.tertiary);
    doc.text('ISSUE DATE', bx, y + 11);
    doc.text('DUE DATE', bx + 36, y + 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.body);
    doc.text(invoice.issue_date || '-', bx, y + 15.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.danger);
    doc.text(invoice.due_date || '-', bx + 36, y + 15.5);

    if (invoice.project_name) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.secondary);
        doc.text(`Project: ${invoice.project_name}`, bx, y + 21);
    }

    // ─── Items Table ───
    const tableStartY = Math.max(clientY + 6, y + boxH + 4);

    autoTable(doc, {
        columns: [
            { header: '#', dataKey: 'index' },
            { header: 'Description', dataKey: 'description' },
            { header: 'Qty', dataKey: 'quantity' },
            { header: 'Unit Rate', dataKey: 'rate' },
            { header: 'Amount', dataKey: 'amount' },
        ],
        body: items.map((item, idx) => ({
            index: String(idx + 1),
            description: item.description || 'Service',
            quantity: String(item.quantity || 1),
            rate: pdfCurrency(item.unit_price, currency),
            amount: pdfCurrency(item.amount || (item.quantity * item.unit_price), currency),
        })),
        startY: tableStartY,
        theme: 'plain',
        margin: { left: m, right: m },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
            textColor: C.body,
            lineColor: C.divider,
            lineWidth: 0.15,
            valign: 'middle',
        },
        headStyles: {
            fillColor: C.tableHeaderBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        },
        columnStyles: {
            index:       { cellWidth: 10, halign: 'center' },
            description: { cellWidth: 'auto', halign: 'left' },
            quantity:    { cellWidth: 14, halign: 'center' },
            rate:        { cellWidth: 34, halign: 'right' },
            amount:      { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: {
            fillColor: C.tableAltRow,
        },
    });

    const tableEndY = (doc as any).lastAutoTable.finalY + 8;

    // ─── Two-Column Bottom: Payment Info (Left) + Financial Summary (Right) ───
    const summaryW = 82;
    const summaryX = pw - m - summaryW;
    const notesW = summaryX - m - 8;
    let sY = tableEndY;

    // ── Right Column: Financial Summary ──
    const drawRow = (label: string, value: string, opts: {
        bold?: boolean;
        labelColor?: number[];
        valueColor?: number[];
        fontSize?: number;
    } = {}) => {
        const fs = opts.fontSize || 9;
        doc.setFontSize(fs);
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        doc.setTextColor(...(opts.labelColor || C.secondary) as [number, number, number]);
        doc.text(label, summaryX, sY);
        doc.setTextColor(...(opts.valueColor || C.body) as [number, number, number]);
        doc.text(value, pw - m, sY, { align: 'right' });
        sY += 6;
    };

    drawRow('Subtotal', pdfCurrency(invoice.subtotal || 0, currency));

    if (Number(invoice.discount || 0) > 0) {
        drawRow('Discount', `- ${pdfCurrency(invoice.discount || 0, currency)}`, {
            valueColor: C.success,
        });
    }

    if (Number(invoice.tax || 0) > 0) {
        drawRow('Tax / VAT', `+ ${pdfCurrency(invoice.tax || 0, currency)}`);
    }

    // Separator line before total
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(summaryX, sY - 3, pw - m, sY - 3);
    sY += 1;

    drawRow('Total Amount', pdfCurrency(invoice.total_amount || 0, currency), {
        bold: true,
        labelColor: C.heading,
        valueColor: C.heading,
    });

    if (Number(invoice.paid_amount || 0) > 0) {
        drawRow('Paid / Advance', pdfCurrency(invoice.paid_amount || 0, currency), {
            valueColor: C.success,
            labelColor: C.success,
        });
    }

    // Balance Due highlight box
    sY += 1;
    const dueBoxH = 10;
    doc.setFillColor(...C.dangerBg);
    doc.roundedRect(summaryX - 2, sY - 5, summaryW + 4, dueBoxH, 2, 2, 'F');
    doc.setDrawColor(...C.dangerBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(summaryX - 2, sY - 5, summaryW + 4, dueBoxH, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C.danger);
    doc.text('Balance Due', summaryX + 2, sY + 1);
    doc.text(pdfCurrency(invoice.due_amount || 0, currency), pw - m, sY + 1, { align: 'right' });

    // ── Left Column: Payment Instructions & Notes ──
    let nY = tableEndY;

    if (invoice.payment_instructions) {
        const cleanInstructions = sanitizePdfText(invoice.payment_instructions);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const lines: string[] = doc.splitTextToSize(cleanInstructions, notesW - 10);
        const lineH = 3.6;
        const topPadding = 10;
        const bottomPadding = 4;
        const bxH = topPadding + (lines.length * lineH) + bottomPadding;

        doc.setFillColor(...C.surfaceBg);
        doc.roundedRect(m, nY, notesW, bxH, 2.5, 2.5, 'F');
        doc.setDrawColor(...C.surfaceBorder);
        doc.setLineWidth(0.2);
        doc.roundedRect(m, nY, notesW, bxH, 2.5, 2.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.brand);
        doc.text('Payment Methods & Instructions', m + 5, nY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.body);
        lines.forEach((line, idx) => {
            doc.text(line, m + 5, nY + topPadding + (idx * lineH));
        });

        nY += bxH + 5;
    }

    if (invoice.notes) {
        const cleanNotes = sanitizePdfText(invoice.notes);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.tertiary);
        doc.text('Terms & Notes', m, nY + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.secondary);
        const noteLines: string[] = doc.splitTextToSize(cleanNotes, notesW);
        const noteLineH = 3.6;
        noteLines.forEach((line, idx) => {
            doc.text(line, m, nY + 7.5 + (idx * noteLineH));
        });
    }

    // ─── Footer ───
    const footerY = ph - 16;
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.2);
    doc.line(m, footerY - 4, pw - m, footerY - 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.tertiary);
    doc.text('Thank you for your business and trust in ORBIT SaaS!', m, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text('Generated via Orbit SaaS Billing System', pw - m, footerY, { align: 'right' });

    return {
        doc,
        downloadPdf: () => {
            doc.save(`${invoice.invoice_number || 'invoice'}.pdf`);
        },
        getBase64: (): string => {
            const dataUri = doc.output('datauristring');
            const commaIndex = dataUri.indexOf(',');
            return commaIndex !== -1 ? dataUri.substring(commaIndex + 1).trim() : dataUri.trim();
        },
        getBlobUrl: (): string => {
            const out = doc.output('bloburl');
            return typeof out === 'string' ? out : out.toString();
        },
    };
}
