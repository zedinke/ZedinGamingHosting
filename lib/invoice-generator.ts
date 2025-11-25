/**
 * Magyarországi hatósági követelményeknek megfelelő számla generálás
 * PDF formátumban
 */

import { prisma } from './prisma';
import { logger } from './logger';

export interface InvoiceSettings {
  // Céginformációk
  companyName: string;
  companyTaxNumber: string; // Adószám
  companyVatNumber: string; // ÁFA szám
  companyAddress: string;
  companyCity: string;
  companyZipCode: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  // Bank információk
  bankName: string;
  bankAccountNumber: string; // IBAN
  bankSwift: string; // SWIFT/BIC kód
  
  // Számlázási információk
  invoicePrefix: string; // Számla előtag (pl. "INV")
  invoiceNumberFormat: string; // Számla szám formátum (pl. "YYYYMMDD-XXXX")
  defaultVatRate: number; // Alapértelmezett ÁFA kulcs (pl. 27)
  defaultCurrency: string; // Alapértelmezett pénznem (pl. "HUF")
  
  // Egyéb
  invoiceFooter: string; // Számla lábléc szövege
  invoiceTerms: string; // Fizetési feltételek
}

/**
 * Számla beállítások lekérdezése
 */
export async function getInvoiceSettings(): Promise<InvoiceSettings | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'invoice_',
        },
      },
    });

    if (settings.length === 0) {
      return null;
    }

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      companyName: settingsMap['invoice_company_name'] || '',
      companyTaxNumber: settingsMap['invoice_company_tax_number'] || '',
      companyVatNumber: settingsMap['invoice_company_vat_number'] || '',
      companyAddress: settingsMap['invoice_company_address'] || '',
      companyCity: settingsMap['invoice_company_city'] || '',
      companyZipCode: settingsMap['invoice_company_zip_code'] || '',
      companyCountry: settingsMap['invoice_company_country'] || 'Magyarország',
      companyPhone: settingsMap['invoice_company_phone'] || '',
      companyEmail: settingsMap['invoice_company_email'] || '',
      companyWebsite: settingsMap['invoice_company_website'] || '',
      bankName: settingsMap['invoice_bank_name'] || '',
      bankAccountNumber: settingsMap['invoice_bank_account'] || '',
      bankSwift: settingsMap['invoice_bank_swift'] || '',
      invoicePrefix: settingsMap['invoice_prefix'] || 'INV',
      invoiceNumberFormat: settingsMap['invoice_number_format'] || 'YYYYMMDD-XXXX',
      defaultVatRate: parseFloat(settingsMap['invoice_default_vat_rate'] || '27'),
      defaultCurrency: settingsMap['invoice_default_currency'] || 'HUF',
      invoiceFooter: settingsMap['invoice_footer'] || '',
      invoiceTerms: settingsMap['invoice_terms'] || 'Fizetési határidő: 8 nap',
    };
  } catch (error) {
    logger.error('Failed to get invoice settings', error as Error);
    return null;
  }
}

/**
 * Számla beállítások mentése
 */
export async function saveInvoiceSettings(settings: Partial<InvoiceSettings>): Promise<void> {
  try {
    const settingsToSave = [
      { key: 'invoice_company_name', value: settings.companyName || '' },
      { key: 'invoice_company_tax_number', value: settings.companyTaxNumber || '' },
      { key: 'invoice_company_vat_number', value: settings.companyVatNumber || '' },
      { key: 'invoice_company_address', value: settings.companyAddress || '' },
      { key: 'invoice_company_city', value: settings.companyCity || '' },
      { key: 'invoice_company_zip_code', value: settings.companyZipCode || '' },
      { key: 'invoice_company_country', value: settings.companyCountry || 'Magyarország' },
      { key: 'invoice_company_phone', value: settings.companyPhone || '' },
      { key: 'invoice_company_email', value: settings.companyEmail || '' },
      { key: 'invoice_company_website', value: settings.companyWebsite || '' },
      { key: 'invoice_bank_name', value: settings.bankName || '' },
      { key: 'invoice_bank_account', value: settings.bankAccountNumber || '' },
      { key: 'invoice_bank_swift', value: settings.bankSwift || '' },
      { key: 'invoice_prefix', value: settings.invoicePrefix || 'INV' },
      { key: 'invoice_number_format', value: settings.invoiceNumberFormat || 'YYYYMMDD-XXXX' },
      { key: 'invoice_default_vat_rate', value: (settings.defaultVatRate || 27).toString() },
      { key: 'invoice_default_currency', value: settings.defaultCurrency || 'HUF' },
      { key: 'invoice_footer', value: settings.invoiceFooter || '' },
      { key: 'invoice_terms', value: settings.invoiceTerms || 'Fizetési határidő: 8 nap' },
    ];

    for (const setting of settingsToSave) {
      if (setting.value) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          create: {
            key: setting.key,
            value: setting.value,
            category: 'invoice',
          },
          update: {
            value: setting.value,
          },
        });
      }
    }

    logger.info('Invoice settings saved');
  } catch (error) {
    logger.error('Failed to save invoice settings', error as Error);
    throw error;
  }
}

/**
 * Számla szám generálása
 */
export function generateInvoiceNumber(
  prefix: string,
  format: string,
  sequenceNumber: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(sequenceNumber).padStart(4, '0');

  let invoiceNumber = format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('XXXX', sequence);

  return `${prefix}-${invoiceNumber}`;
}

/**
 * PDF számla generálása (HTML alapú, majd PDF-re konvertálás)
 */
export async function generateInvoicePDF(invoiceId: string): Promise<Buffer | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true,
        subscription: {
          include: {
            server: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Számla nem található');
    }

    const settings = await getInvoiceSettings();
    if (!settings) {
      throw new Error('Számla beállítások hiányoznak');
    }

    // HTML számla generálása
    const html = generateInvoiceHTML(invoice, settings);

    // PDF generálás (puppeteer vagy hasonló)
    // TODO: Puppeteer telepítése és használata
    // Most csak HTML-t adunk vissza, a PDF generálás később implementálható
    
    // Ideiglenesen HTML-t adunk vissza Buffer-ként
    return Buffer.from(html, 'utf-8');
  } catch (error) {
    logger.error('Failed to generate invoice PDF', error as Error, { invoiceId });
    return null;
  }
}

/**
 * HTML számla generálása (magyarországi követelményeknek megfelelő)
 */
function generateInvoiceHTML(invoice: any, settings: InvoiceSettings): string {
  const vatRate = invoice.taxRate || settings.defaultVatRate;
  const subtotal = invoice.subtotal || invoice.amount / (1 + vatRate / 100);
  const taxAmount = invoice.taxAmount || invoice.amount - subtotal;
  const total = invoice.amount;

  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('hu-HU');
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('hu-HU')
    : '';

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Számla - ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #000;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .company-info {
      flex: 1;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .two-columns {
      display: flex;
      justify-content: space-between;
    }
    .column {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 12px;
      color: #666;
    }
    .vat-info {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="invoice-title">${settings.companyName}</div>
        <div>${settings.companyAddress}</div>
        <div>${settings.companyZipCode} ${settings.companyCity}</div>
        <div>${settings.companyCountry}</div>
        <div style="margin-top: 10px;">
          <strong>Adószám:</strong> ${settings.companyTaxNumber}<br>
          <strong>ÁFA szám:</strong> ${settings.companyVatNumber}<br>
          <strong>Telefon:</strong> ${settings.companyPhone}<br>
          <strong>Email:</strong> ${settings.companyEmail}<br>
          ${settings.companyWebsite ? `<strong>Web:</strong> ${settings.companyWebsite}` : ''}
        </div>
      </div>
      <div class="invoice-info">
        <div class="invoice-title">Számla</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 20px;">
          <div><strong>Kibocsátás dátuma:</strong> ${invoiceDate}</div>
          ${dueDate ? `<div><strong>Fizetési határidő:</strong> ${dueDate}</div>` : ''}
          <div><strong>Állapot:</strong> ${getInvoiceStatusLabel(invoice.status)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Vevő adatai</div>
      <div class="two-columns">
        <div class="column">
          <div><strong>${invoice.user.name || 'Névtelen'}</strong></div>
          ${invoice.billingAddress ? `<div>${invoice.billingAddress}</div>` : ''}
          <div>${invoice.user.email}</div>
          ${invoice.billingTaxNumber ? `<div><strong>Adószám:</strong> ${invoice.billingTaxNumber}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Számla tételek</div>
      <table>
        <thead>
          <tr>
            <th>Megnevezés</th>
            <th class="text-right">Mennyiség</th>
            <th class="text-right">Egységár</th>
            <th class="text-right">Nettó összeg</th>
            <th class="text-right">ÁFA</th>
            <th class="text-right">Bruttó összeg</th>
          </tr>
        </thead>
        <tbody>
          ${generateInvoiceItems(invoice, vatRate)}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right"><strong>Összesen:</strong></td>
            <td class="text-right"><strong>${formatCurrency(subtotal, invoice.currency)}</strong></td>
            <td class="text-right"><strong>${formatCurrency(taxAmount, invoice.currency)}</strong></td>
            <td class="text-right total-row">${formatCurrency(total, invoice.currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="vat-info">
      <strong>ÁFA összesítés:</strong><br>
      ${vatRate}% ÁFA: ${formatCurrency(taxAmount, invoice.currency)}<br>
      Nettó összeg: ${formatCurrency(subtotal, invoice.currency)}<br>
      <strong>Bruttó összeg: ${formatCurrency(total, invoice.currency)}</strong>
    </div>

    <div class="section">
      <div class="section-title">Fizetési információk</div>
      <div>
        <strong>Bank:</strong> ${settings.bankName}<br>
        <strong>Számlaszám:</strong> ${settings.bankAccountNumber}<br>
        ${settings.bankSwift ? `<strong>SWIFT:</strong> ${settings.bankSwift}<br>` : ''}
        <strong>Közlemény:</strong> ${invoice.invoiceNumber}
      </div>
    </div>

    ${settings.invoiceFooter ? `
    <div class="footer">
      ${settings.invoiceFooter}
    </div>
    ` : ''}

    ${settings.invoiceTerms ? `
    <div class="footer">
      <strong>Fizetési feltételek:</strong> ${settings.invoiceTerms}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Számla tételek generálása
 */
function generateInvoiceItems(invoice: any, vatRate: number): string {
  const items = invoice.items || [
    {
      name: invoice.subscription?.server?.name || 'Game Server Subscription',
      quantity: 1,
      unitPrice: invoice.subtotal || invoice.amount / (1 + vatRate / 100),
      vatRate: vatRate,
    },
  ];

  return items
    .map((item: any) => {
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 1;
      const itemVatRate = item.vatRate || vatRate;
      const netAmount = unitPrice * quantity;
      const taxAmount = netAmount * (itemVatRate / 100);
      const grossAmount = netAmount + taxAmount;

      return `
        <tr>
          <td>${item.name || 'Tétel'}</td>
          <td class="text-right">${quantity}</td>
          <td class="text-right">${formatCurrency(unitPrice, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(netAmount, invoice.currency)}</td>
          <td class="text-right">${itemVatRate}%</td>
          <td class="text-right">${formatCurrency(grossAmount, invoice.currency)}</td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Pénznem formázás
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: currency || 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Számla státusz címke
 */
function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Függőben',
    PAID: 'Fizetve',
    FAILED: 'Sikertelen',
    REFUNDED: 'Visszatérítve',
    CANCELED: 'Törölve',
  };
  return labels[status] || status;
}

