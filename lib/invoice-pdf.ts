/**
 * Invoice PDF Generation
 * Generates professional, legally compliant invoices
 */

import { Invoice, User } from '@prisma/client';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface InvoiceData extends Omit<Invoice, 'subtotal' | 'taxAmount' | 'taxRate' | 'companyName' | 'companyTaxNumber' | 'companyAddress' | 'companyVatNumber' | 'billingName' | 'billingAddress' | 'billingTaxNumber' | 'paymentMethod' | 'paymentReference' | 'items'> {
  user: User;
  items: InvoiceItem[] | null;
  subtotal: number | null;
  taxAmount: number | null;
  taxRate: number | null;
  companyName: string | null;
  companyTaxNumber: string | null;
  companyAddress: string | null;
  companyVatNumber: string | null;
  billingName: string | null;
  billingAddress: string | null;
  billingTaxNumber: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
}

/**
 * Generate invoice PDF using a template
 * This is a placeholder - in production, use a library like pdfkit or puppeteer
 */
export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  // TODO: Implement actual PDF generation
  // For now, return empty buffer
  // In production, use:
  // - pdfkit: https://pdfkit.org/
  // - puppeteer: https://pptr.dev/ (for HTML to PDF)
  // - @react-pdf/renderer: https://react-pdf.org/ (React-based)
  
  return Buffer.from('');
}

/**
 * Generate invoice HTML template for PDF conversion
 */
export function generateInvoiceHTML(invoice: InvoiceData, locale: string = 'hu'): string {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'hu' ? 'hu-HU' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-US');
  };

  const companyName = process.env.COMPANY_NAME || 'ZedinGamingHosting Kft.';
  const companyAddress = process.env.COMPANY_ADDRESS || '1234 Budapest, Példa utca 1.';
  const companyTaxNumber = process.env.COMPANY_TAX_NUMBER || '12345678-1-23';
  const companyVatNumber = process.env.COMPANY_VAT_NUMBER || 'HU12345678';
  const companyBankAccount = process.env.COMPANY_BANK_ACCOUNT || '12345678-12345678-12345678';
  const companyBankName = process.env.COMPANY_BANK_NAME || 'Bank Name';

  const subtotal = invoice.subtotal || invoice.amount / (1 + (invoice.taxRate || 0) / 100);
  const taxAmount = invoice.taxAmount || (invoice.amount - subtotal);
  const taxRate = invoice.taxRate || 27;

  const items: InvoiceItem[] = invoice.items 
    ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items)
    : [{
        description: 'Gaming szerver hosting szolgáltatás',
        quantity: 1,
        unitPrice: subtotal,
        taxRate: taxRate,
        total: invoice.amount,
      }];

  const translations = {
    hu: {
      invoice: 'Számla',
      invoiceNumber: 'Számlaszám',
      issueDate: 'Kibocsátás dátuma',
      dueDate: 'Fizetési határidő',
      status: 'Státusz',
      paid: 'Fizetve',
      pending: 'Függőben',
      billingTo: 'Számlázási címzett',
      item: 'Tétel',
      description: 'Leírás',
      quantity: 'Mennyiség',
      unitPrice: 'Egységár',
      taxRate: 'ÁFA kulcs',
      subtotal: 'Nettó összeg',
      tax: 'ÁFA',
      total: 'Bruttó összeg',
      paymentMethod: 'Fizetési mód',
      paymentReference: 'Fizetési referencia',
      bankAccount: 'Bankszámlaszám',
      bankName: 'Bank neve',
      companyInfo: 'Céginformációk',
      taxNumber: 'Adószám',
      vatNumber: 'ÁFA szám',
      address: 'Cím',
    },
    en: {
      invoice: 'Invoice',
      invoiceNumber: 'Invoice Number',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      status: 'Status',
      paid: 'Paid',
      pending: 'Pending',
      billingTo: 'Bill To',
      item: 'Item',
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      taxRate: 'Tax Rate',
      subtotal: 'Subtotal',
      tax: 'Tax',
      total: 'Total',
      paymentMethod: 'Payment Method',
      paymentReference: 'Payment Reference',
      bankAccount: 'Bank Account',
      bankName: 'Bank Name',
      companyInfo: 'Company Information',
      taxNumber: 'Tax Number',
      vatNumber: 'VAT Number',
      address: 'Address',
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.invoice} #${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
      color: #e4e4e7;
      padding: 40px 20px;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      background: #1a1f2e;
      border-radius: 16px;
      border: 1px solid rgba(91, 111, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #5b6fff 0%, #e83eff 100%);
      padding: 40px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .invoice-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }
    
    .invoice-header-content {
      position: relative;
      z-index: 1;
    }
    
    .invoice-title {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }
    
    .invoice-number {
      font-size: 24px;
      opacity: 0.9;
      font-weight: 600;
    }
    
    .invoice-body {
      padding: 40px;
    }
    
    .invoice-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .info-section h3 {
      color: #5b6fff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    
    .info-section p {
      color: #a1a1aa;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .info-section strong {
      color: #e4e4e7;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-paid {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    
    .status-pending {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .items-table thead {
      background: rgba(91, 111, 255, 0.1);
    }
    
    .items-table th {
      padding: 16px;
      text-align: left;
      color: #5b6fff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border-bottom: 2px solid rgba(91, 111, 255, 0.2);
    }
    
    .items-table td {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #e4e4e7;
    }
    
    .items-table tbody tr:hover {
      background: rgba(91, 111, 255, 0.05);
    }
    
    .invoice-totals {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-box {
      width: 300px;
      background: rgba(91, 111, 255, 0.1);
      border: 1px solid rgba(91, 111, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .total-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
      font-size: 20px;
      font-weight: 700;
      color: #5b6fff;
    }
    
    .total-label {
      color: #a1a1aa;
    }
    
    .total-value {
      color: #e4e4e7;
      font-weight: 600;
    }
    
    .payment-info {
      margin-top: 40px;
      padding: 24px;
      background: rgba(91, 111, 255, 0.05);
      border-radius: 12px;
      border-left: 4px solid #5b6fff;
    }
    
    .payment-info h3 {
      color: #5b6fff;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 700;
    }
    
    .payment-info p {
      color: #a1a1aa;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #71717a;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        border: none;
      }
    }
    
    @media (max-width: 768px) {
      .invoice-info-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .invoice-body {
        padding: 20px;
      }
      
      .items-table {
        font-size: 12px;
      }
      
      .items-table th,
      .items-table td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="invoice-header-content">
        <div class="invoice-title">${t.invoice}</div>
        <div class="invoice-number">#${invoice.invoiceNumber}</div>
      </div>
    </div>
    
    <div class="invoice-body">
      <div class="invoice-info-grid">
        <div class="info-section">
          <h3>${t.companyInfo}</h3>
          <p><strong>${companyName}</strong></p>
          <p>${companyAddress}</p>
          <p>${t.taxNumber}: ${companyTaxNumber}</p>
          <p>${t.vatNumber}: ${companyVatNumber}</p>
        </div>
        
        <div class="info-section">
          <h3>${t.billingTo}</h3>
          <p><strong>${invoice.billingName || invoice.user.name || invoice.user.email}</strong></p>
          ${invoice.billingAddress ? `<p>${invoice.billingAddress}</p>` : ''}
          ${invoice.billingTaxNumber ? `<p>${t.taxNumber}: ${invoice.billingTaxNumber}</p>` : ''}
          <p>${invoice.user.email}</p>
        </div>
      </div>
      
      <div class="invoice-info-grid">
        <div class="info-section">
          <h3>${t.invoiceNumber}</h3>
          <p><strong>#${invoice.invoiceNumber}</strong></p>
          <p style="margin-top: 16px;">
            <span class="status-badge status-${invoice.status.toLowerCase()}">
              ${invoice.status === 'PAID' ? t.paid : t.pending}
            </span>
          </p>
        </div>
        
        <div class="info-section">
          <h3>Dátumok</h3>
          <p><strong>${t.issueDate}:</strong> ${formatDate(invoice.createdAt)}</p>
          ${invoice.dueDate ? `<p><strong>${t.dueDate}:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
          ${invoice.paidAt ? `<p><strong>${t.paid}:</strong> ${formatDate(invoice.paidAt)}</p>` : ''}
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>${t.item}</th>
            <th>${t.description}</th>
            <th style="text-align: right;">${t.quantity}</th>
            <th style="text-align: right;">${t.unitPrice}</th>
            <th style="text-align: right;">${t.taxRate}</th>
            <th style="text-align: right;">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.description}</td>
              <td style="text-align: right;">${item.quantity}</td>
              <td style="text-align: right;">${formatPrice(item.unitPrice, invoice.currency)}</td>
              <td style="text-align: right;">${item.taxRate}%</td>
              <td style="text-align: right; font-weight: 600;">${formatPrice(item.total, invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="invoice-totals">
        <div class="totals-box">
          <div class="total-row">
            <span class="total-label">${t.subtotal}:</span>
            <span class="total-value">${formatPrice(subtotal, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">${t.tax} (${taxRate}%):</span>
            <span class="total-value">${formatPrice(taxAmount, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">${t.total}:</span>
            <span class="total-value">${formatPrice(invoice.amount, invoice.currency)}</span>
          </div>
        </div>
      </div>
      
      ${invoice.paymentMethod || invoice.paymentReference ? `
        <div class="payment-info">
          <h3>${t.paymentMethod}</h3>
          ${invoice.paymentMethod ? `<p><strong>${t.paymentMethod}:</strong> ${invoice.paymentMethod}</p>` : ''}
          ${invoice.paymentReference ? `<p><strong>${t.paymentReference}:</strong> ${invoice.paymentReference}</p>` : ''}
          <p><strong>${t.bankAccount}:</strong> ${companyBankAccount}</p>
          <p><strong>${t.bankName}:</strong> ${companyBankName}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>${companyName} | ${companyAddress}</p>
        <p>${t.taxNumber}: ${companyTaxNumber} | ${t.vatNumber}: ${companyVatNumber}</p>
        <p style="margin-top: 16px;">Ez a számla elektronikus formában került kiállításra és jogi szempontból érvényes.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

