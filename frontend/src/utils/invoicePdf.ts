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

export function generateInvoicePdf(invoice: InvoiceData) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const currency = invoice.currency || 'BDT';
    const items: InvoiceItem[] = typeof invoice.items === 'string'
        ? JSON.parse(invoice.items)
        : (invoice.items || []);

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 15;

    // ─── Header Gradient / Accent Bar ───
    doc.setFillColor(108, 92, 231); // #6c5ce7 Primary Indigo/Purple
    doc.rect(0, 0, pageWidth, 5, 'F');

    // ─── Company Brand & Logo ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 38);
    doc.text('ORBIT', margin, 20);

    doc.setTextColor(108, 92, 231);
    doc.text('SaaS', margin + 26, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 140);
    doc.text('DIGITAL PRODUCT & CLOUD ENGINEERING', margin, 25);
    doc.text('contact@orbitsaas.cloud  |  www.orbitsaas.cloud', margin, 29);

    // ─── INVOICE Badge & Metadata (Top Right) ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 38);
    doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(108, 92, 231);
    doc.text(invoice.invoice_number || 'INV-0000', pageWidth - margin, 26, { align: 'right' });

    // Status Pill
    const statusText = (invoice.status || 'draft').toUpperCase();
    let statusBg = [230, 230, 240];
    let statusColor = [80, 80, 100];
    if (invoice.status === 'paid') {
        statusBg = [209, 250, 229]; // emerald-100
        statusColor = [5, 150, 105]; // emerald-600
    } else if (invoice.status === 'sent') {
        statusBg = [224, 231, 255]; // indigo-100
        statusColor = [67, 56, 202]; // indigo-700
    } else if (invoice.status === 'overdue') {
        statusBg = [255, 228, 230]; // rose-100
        statusColor = [225, 29, 72]; // rose-600
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(pageWidth - margin - 26, 29, 26, 5.5, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, pageWidth - margin - 13, 33, { align: 'center' });

    // ─── Divider ───
    doc.setDrawColor(230, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 38, pageWidth - margin, 38);

    // ─── Invoice Info Grid ───
    const infoStartY = 45;

    // LEFT: Billed To Customer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 160);
    doc.text('BILLED TO:', margin, infoStartY);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 38);
    doc.text(invoice.client_name || 'Valued Client', margin, infoStartY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 90);
    let customerY = infoStartY + 10;
    if (invoice.client_email) {
        doc.text(invoice.client_email, margin, customerY);
        customerY += 4.2;
    }
    if (invoice.client_phone) {
        doc.text(invoice.client_phone, margin, customerY);
        customerY += 4.2;
    }
    if (invoice.client_address) {
        doc.text(invoice.client_address, margin, customerY);
        customerY += 4.2;
    }

    // RIGHT: Service Type & Dates Box
    const boxX = pageWidth - margin - 75;
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(boxX, infoStartY - 3, 75, 26, 2, 2, 'F');
    doc.setDrawColor(230, 232, 242);
    doc.roundedRect(boxX, infoStartY - 3, 75, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 160);
    doc.text('SERVICE TYPE:', boxX + 4, infoStartY + 2);
    doc.setFontSize(8.5);
    doc.setTextColor(108, 92, 231);
    doc.text(invoice.service_type || 'Digital Services', boxX + 4, infoStartY + 6);

    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 160);
    doc.text('ISSUE DATE:', boxX + 4, infoStartY + 11.5);
    doc.text('DUE DATE:', boxX + 40, infoStartY + 11.5);

    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 45);
    doc.text(invoice.issue_date || '-', boxX + 4, infoStartY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // Rose red for due date
    doc.text(invoice.due_date || '-', boxX + 40, infoStartY + 16);

    if (invoice.project_name) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 140);
        doc.text(`Project: ${invoice.project_name}`, boxX + 4, infoStartY + 21);
    }

    // ─── Table of Items ───
    const tableColumns = [
        { header: '#', dataKey: 'index' },
        { header: 'DESCRIPTION', dataKey: 'description' },
        { header: 'QTY', dataKey: 'quantity' },
        { header: 'UNIT RATE', dataKey: 'rate' },
        { header: 'AMOUNT', dataKey: 'amount' },
    ];

    const tableRows = items.map((item, idx) => ({
        index: (idx + 1).toString(),
        description: item.description || 'Service Description',
        quantity: (item.quantity || 1).toString(),
        rate: formatCurrency(item.unit_price, currency),
        amount: formatCurrency(item.amount || (item.quantity * item.unit_price), currency),
    }));

    const startTableY = Math.max(customerY + 4, infoStartY + 28);

    autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: startTableY,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 3.5,
            textColor: [40, 40, 55],
            valign: 'middle',
        },
        headStyles: {
            fillColor: [24, 24, 38], // Dark Charcoal Header
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 4,
        },
        columnStyles: {
            index: { cellWidth: 10, halign: 'center' },
            description: { cellWidth: 'auto', halign: 'left' },
            quantity: { cellWidth: 16, halign: 'center' },
            rate: { cellWidth: 28, halign: 'right' },
            amount: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: {
            fillColor: [250, 251, 255],
        },
        didDrawPage: (data) => {
            // Draw a subtle border below header
            doc.setDrawColor(220, 222, 235);
            doc.setLineWidth(0.3);
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // ─── Financial Summary Table (Bottom Right) ───
    const summaryWidth = 80;
    const summaryX = pageWidth - margin - summaryWidth;

    let currentSummaryY = finalY;

    // Helper row drawer
    const drawSummaryRow = (label: string, value: string, isBold: boolean = false, textColor: number[] = [40, 40, 55]) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(label, summaryX, currentSummaryY);
        doc.text(value, pageWidth - margin, currentSummaryY, { align: 'right' });
        currentSummaryY += 5;
    };

    drawSummaryRow('Subtotal:', formatCurrency(invoice.subtotal || 0, currency));

    if (Number(invoice.discount || 0) > 0) {
        drawSummaryRow('Discount:', `-${formatCurrency(invoice.discount || 0, currency)}`, false, [16, 185, 129]);
    }

    if (Number(invoice.tax || 0) > 0) {
        drawSummaryRow('Tax / VAT:', `+${formatCurrency(invoice.tax || 0, currency)}`);
    }

    // Total Amount Box
    doc.setDrawColor(220, 222, 235);
    doc.setLineWidth(0.4);
    doc.line(summaryX, currentSummaryY - 2, pageWidth - margin, currentSummaryY - 2);

    drawSummaryRow('Total Amount:', formatCurrency(invoice.total_amount || 0, currency), true, [24, 24, 38]);

    if (Number(invoice.paid_amount || 0) > 0) {
        drawSummaryRow('Paid Advance:', formatCurrency(invoice.paid_amount || 0, currency), false, [16, 185, 129]);
    }

    // Due Balance Highlight Box
    currentSummaryY += 2;
    doc.setFillColor(254, 242, 242); // Light red/rose
    doc.roundedRect(summaryX - 2, currentSummaryY - 4, summaryWidth + 2, 10, 1.5, 1.5, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(summaryX - 2, currentSummaryY - 4, summaryWidth + 2, 10, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(190, 18, 60); // Rose-700
    doc.text('Balance Due:', summaryX + 2, currentSummaryY + 2.5);
    doc.setFontSize(10.5);
    doc.text(formatCurrency(invoice.due_amount || 0, currency), pageWidth - margin - 2, currentSummaryY + 2.5, { align: 'right' });

    // ─── Payment Instructions & Notes (Bottom Left) ───
    const notesWidth = summaryX - margin - 10;
    let notesY = finalY;

    if (invoice.payment_instructions) {
        doc.setFillColor(248, 249, 252);
        doc.roundedRect(margin, notesY, notesWidth, 26, 2, 2, 'F');
        doc.setDrawColor(230, 232, 242);
        doc.roundedRect(margin, notesY, notesWidth, 26, 2, 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(108, 92, 231);
        doc.text('PAYMENT METHODS & INSTRUCTIONS:', margin + 4, notesY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(70, 70, 90);
        const splitInstructions = doc.splitTextToSize(invoice.payment_instructions, notesWidth - 8);
        doc.text(splitInstructions, margin + 4, notesY + 10);

        notesY += 30;
    }

    if (invoice.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 140);
        doc.text('TERMS & NOTES:', margin, notesY + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(90, 90, 110);
        const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
        doc.text(splitNotes, margin, notesY + 7.5);
    }

    // ─── Footer with Signature / Thank You ───
    const footerY = pageHeight - 18;

    doc.setDrawColor(230, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text('Thank you for your business and trust in ORBIT SaaS!', margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 180);
    doc.text('Generated via Orbit SaaS Billing System', pageWidth - margin, footerY, { align: 'right' });

    return {
        doc,
        downloadPdf: () => {
            doc.save(`${invoice.invoice_number || 'invoice'}.pdf`);
        },
        getBase64: () => {
            return doc.output('datauristring');
        },
        getBlobUrl: (): string => {
            const out = doc.output('bloburl');
            return typeof out === 'string' ? out : out.toString();
        },
    };
}
