import { formatCurrency, InvoiceData, InvoiceItem } from './invoicePdf';

export function buildInvoiceEmailTemplate(invoice: InvoiceData, customMessage?: string): string {
    const items: InvoiceItem[] = typeof invoice.items === 'string'
        ? JSON.parse(invoice.items)
        : (invoice.items || []);

    const currency = invoice.currency || 'BDT';
    const clientName = invoice.client_name || 'Valued Customer';
    const invoiceNum = invoice.invoice_number || 'INV-0000';
    const issueDate = invoice.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = invoice.due_date || invoice.issue_date;
    const serviceType = invoice.service_type || 'Digital Services';
    const totalFormatted = formatCurrency(Number(invoice.total_amount || 0), currency);
    const paidFormatted = formatCurrency(Number(invoice.paid_amount || 0), currency);
    const dueFormatted = formatCurrency(Number(invoice.due_amount || 0), currency);

    // Items rows
    const itemsHtml = items.map((item) => `
        <tr style="border-bottom: 1px solid #232338;">
            <td style="padding: 12px 16px; color: #f1f1f6; font-size: 14px; text-align: left;">
                <div style="font-weight: 600;">${item.description || 'Service Item'}</div>
            </td>
            <td style="padding: 12px 16px; color: #a0a0b8; font-size: 14px; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 12px 16px; color: #a0a0b8; font-size: 14px; text-align: right;">${formatCurrency(Number(item.unit_price || 0), currency)}</td>
            <td style="padding: 12px 16px; color: #f1f1f6; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(Number(item.amount || (item.quantity * item.unit_price) || 0), currency)}</td>
        </tr>
    `).join('');

    const personalMessageBlock = customMessage ? `
        <div style="background: rgba(108, 92, 231, 0.08); border-left: 4px solid #6c5ce7; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a29bfe; margin-bottom: 6px;">Message from Orbit SaaS</div>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #e2e2ec; white-space: pre-wrap;">${customMessage}</p>
        </div>
    ` : '';

    const paymentInstructionsBlock = invoice.payment_instructions ? `
        <div style="background: #151522; border: 1px solid #26263a; border-radius: 10px; padding: 18px 20px; margin-top: 24px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #e2e2ec;">Payment Instructions</h4>
            <div style="font-size: 13px; line-height: 1.6; color: #a0a0b8; white-space: pre-wrap;">${invoice.payment_instructions}</div>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNum} - Orbit SaaS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e2ec;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0b12; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; background-color: #12121c; border: 1px solid #232338; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 36px; background: linear-gradient(135deg, #181828 0%, #12121c 100%); border-bottom: 1px solid #232338;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td valign="middle">
                                        <div style="display: inline-block;">
                                            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">ORBIT <span style="color: #6c5ce7;">SaaS</span></span>
                                            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #8888a0; margin-top: 2px;">Engineering Digital Excellence</div>
                                        </div>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="display: inline-block; background: rgba(108, 92, 231, 0.15); border: 1px solid rgba(108, 92, 231, 0.4); color: #a29bfe; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                                            INVOICE
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px;">
                            
                            <!-- Greeting -->
                            <h2 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: #ffffff;">
                                Hello, ${clientName} 👋
                            </h2>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a0a0b8;">
                                Thank you for partnering with <strong>ORBIT SaaS</strong>. Here is the official invoice for your <strong>${serviceType}</strong> project.
                            </p>

                            ${personalMessageBlock}

                            <!-- Invoice Details Box -->
                            <div style="background: #171724; border: 1px solid #26263c; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50%" valign="top" style="padding-right: 15px;">
                                            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-bottom: 3px;">Invoice Number</div>
                                            <div style="font-size: 15px; font-weight: 700; color: #ffffff; font-family: monospace;">${invoiceNum}</div>
                                            
                                            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-top: 14px; margin-bottom: 3px;">Service Type</div>
                                            <div style="font-size: 13px; font-weight: 600; color: #a29bfe;">${serviceType}</div>
                                        </td>
                                        <td width="50%" valign="top" style="padding-left: 15px; border-left: 1px solid #232338;">
                                            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-bottom: 3px;">Issue Date</div>
                                            <div style="font-size: 13px; color: #e2e2ec;">${issueDate}</div>
                                            
                                            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-top: 14px; margin-bottom: 3px;">Payment Due Date</div>
                                            <div style="font-size: 13px; font-weight: 700; color: #f43f5e;">${dueDate}</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Line Items Table -->
                            <div style="margin-bottom: 24px; border: 1px solid #232338; border-radius: 12px; overflow: hidden;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #181828; border-bottom: 2px solid #2c2c44;">
                                            <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Description</th>
                                            <th style="padding: 10px 14px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Qty</th>
                                            <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Rate</th>
                                            <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Totals Breakdown -->
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="35%"></td>
                                        <td width="65%">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size: 13px;">
                                                <tr>
                                                    <td style="color: #8888a0;">Subtotal:</td>
                                                    <td align="right" style="color: #e2e2ec; font-weight: 600;">${formatCurrency(Number(invoice.subtotal || 0), currency)}</td>
                                                </tr>
                                                ${Number(invoice.discount || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #10b981;">Discount:</td>
                                                    <td align="right" style="color: #10b981; font-weight: 600;">-${formatCurrency(Number(invoice.discount || 0), currency)}</td>
                                                </tr>` : ''}
                                                ${Number(invoice.tax || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #8888a0;">Tax / VAT:</td>
                                                    <td align="right" style="color: #e2e2ec; font-weight: 600;">+${formatCurrency(Number(invoice.tax || 0), currency)}</td>
                                                </tr>` : ''}
                                                <tr style="border-top: 1px solid #232338;">
                                                    <td style="font-weight: 700; color: #ffffff; padding-top: 8px;">Total Amount:</td>
                                                    <td align="right" style="font-weight: 800; font-size: 15px; color: #ffffff; padding-top: 8px;">${totalFormatted}</td>
                                                </tr>
                                                ${Number(invoice.paid_amount || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #10b981;">Paid / Advance:</td>
                                                    <td align="right" style="color: #10b981; font-weight: 600;">${paidFormatted}</td>
                                                </tr>` : ''}
                                                <tr style="border-top: 2px solid #6c5ce7;">
                                                    <td style="font-weight: 800; font-size: 15px; color: #a29bfe; padding-top: 10px;">Amount Due:</td>
                                                    <td align="right" style="font-weight: 900; font-size: 18px; color: ${Number(invoice.due_amount || 0) > 0 ? '#f43f5e' : '#10b981'}; padding-top: 10px;">${dueFormatted}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            ${paymentInstructionsBlock}

                            ${invoice.notes ? `
                            <div style="margin-top: 20px; padding: 14px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid #232338;">
                                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #8888a0; margin-bottom: 3px;">Terms & Notes</div>
                                <div style="font-size: 12px; color: #a0a0b8; line-height: 1.5;">${invoice.notes}</div>
                            </div>` : ''}

                            <!-- Footer Notice -->
                            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #232338; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #8888a0; line-height: 1.6;">
                                    The full PDF invoice is attached to this email.<br>
                                    Have questions? Reply directly to this email or contact us at <a href="mailto:contact@orbitsaas.cloud" style="color: #6c5ce7; text-decoration: none;">contact@orbitsaas.cloud</a>.
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Branding Footer -->
                    <tr>
                        <td style="background: #0d0d14; padding: 20px 36px; text-align: center; border-top: 1px solid #1c1c2b;">
                            <div style="font-size: 11px; color: #60607a;">
                                © ${new Date().getFullYear()} ORBIT SaaS. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
