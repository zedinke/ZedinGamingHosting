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
      throw new Error('Számla beállítások hiányoznak. Kérjük, állítsa be a számlázási beállításokat az admin felületen.');
    }

    // Ellenőrizzük, hogy a szükséges beállítások megvannak-e
    if (!settings.companyName || !settings.companyTaxNumber) {
      throw new Error('Hiányoznak a kötelező számlázási beállítások (cég név, adószám).');
    }

    // HTML számla generálása
    const html = generateInvoiceHTML(invoice, settings);

    // PDF generálás Puppeteer-rel
    try {
      const pdfBuffer = await generatePDFFromHTML(html);
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation failed, falling back to HTML', error as Error, { invoiceId });
      // Fallback: HTML-t adunk vissza, ha a PDF generálás sikertelen
      return Buffer.from(html, 'utf-8');
    }
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

  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';
  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';
  
  // Szolgáltatás időszak meghatározása
  const servicePeriod = invoice.subscription
    ? `${invoice.subscription.currentPeriodStart ? new Date(invoice.subscription.currentPeriodStart).toLocaleDateString('hu-HU') : invoiceDate} - ${invoice.subscription.currentPeriodEnd ? new Date(invoice.subscription.currentPeriodEnd).toLocaleDateString('hu-HU') : dueDate}`
    : invoiceDate;
  
  // Tétel azonosítás információk
  const itemIdentifiers = getItemIdentifiers(invoice);

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
        <div style="margin-top: 20px; font-size: 12px;">
          <div><strong>Kibocsátás dátuma:</strong> ${invoiceDate}</div>
          ${dueDate ? `<div><strong>Fizetési határidő:</strong> ${dueDate}</div>` : ''}
          ${paidDate ? `<div><strong>Fizetés dátuma:</strong> ${paidDate}</div>` : ''}
          <div><strong>Állapot:</strong> ${getInvoiceStatusLabel(invoice.status)}</div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <div><strong>Számla típus:</strong> ${invoice.subscription ? 'Előfizetés' : 'Egyszeri vásárlás'}</div>
            ${invoice.paymentProvider ? `<div><strong>Fizetési mód:</strong> ${getPaymentProviderLabel(invoice.paymentProvider)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Vevő / Számlázási címzett adatai</div>
      <div class="two-columns">
        <div class="column">
          <div><strong>${invoice.billingName || invoice.user.name || 'Névtelen'}</strong></div>
          ${invoice.billingAddress ? `<div>${invoice.billingAddress}</div>` : ''}
          <div><strong>Email:</strong> ${invoice.user.email}</div>
          ${invoice.billingTaxNumber ? `<div><strong>Adószám:</strong> ${invoice.billingTaxNumber}</div>` : ''}
          <div style="margin-top: 10px; font-size: 11px; color: #666;">
            <div><strong>Felhasználó ID:</strong> ${invoice.userId}</div>
            ${invoice.user.id ? `<div><strong>Belső azonosító:</strong> ${invoice.user.id}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Számla tételek</div>
      <table>
        <thead>
          <tr>
            <th>Sorszám</th>
            <th>Megnevezés / Leírás</th>
            <th class="text-right">Mennyiség</th>
            <th class="text-right">Mértékegység</th>
            <th class="text-right">Egységár (Nettó)</th>
            <th class="text-right">Nettó összeg</th>
            <th class="text-right">ÁFA kulcs</th>
            <th class="text-right">ÁFA összeg</th>
            <th class="text-right">Bruttó összeg</th>
          </tr>
        </thead>
        <tbody>
          ${generateInvoiceItems(invoice, vatRate, itemIdentifiers)}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right"><strong>Összesen:</strong></td>
            <td class="text-right"><strong>${formatCurrency(subtotal, invoice.currency)}</strong></td>
            <td class="text-right"><strong>${vatRate}%</strong></td>
            <td class="text-right"><strong>${formatCurrency(taxAmount, invoice.currency)}</strong></td>
            <td class="text-right total-row">${formatCurrency(total, invoice.currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    ${itemIdentifiers ? `
    <div class="section">
      <div class="section-title">Tétel azonosítás</div>
      <div style="font-size: 12px; color: #666; line-height: 1.6;">
        ${itemIdentifiers}
      </div>
    </div>
    ` : ''}

    <div class="vat-info">
      <strong>ÁFA összesítés:</strong><br>
      ${vatRate}% ÁFA: ${formatCurrency(taxAmount, invoice.currency)}<br>
      Nettó összeg: ${formatCurrency(subtotal, invoice.currency)}<br>
      <strong>Bruttó összeg: ${formatCurrency(total, invoice.currency)}</strong>
    </div>

    <div class="section">
      <div class="section-title">Szolgáltatás időszaka</div>
      <div style="margin-bottom: 20px;">
        <strong>Szolgáltatás időszaka:</strong> ${servicePeriod}<br>
        ${invoice.subscription?.currentPeriodStart && invoice.subscription?.currentPeriodEnd ? `
        <strong>Előfizetés időtartama:</strong> ${Math.ceil((new Date(invoice.subscription.currentPeriodEnd).getTime() - new Date(invoice.subscription.currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24))} nap<br>
        ` : ''}
        ${dueDate ? `<strong>Fizetési határidő:</strong> ${dueDate}${invoice.status === 'PAID' && paidDate ? ` (Fizetve: ${paidDate})` : ''}` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Fizetési információk</div>
      <div>
        <strong>Fizetési mód:</strong> ${invoice.paymentMethod || getPaymentProviderLabel(invoice.paymentProvider)}<br>
        ${invoice.paymentReference ? `<strong>Fizetési referencia:</strong> ${invoice.paymentReference}<br>` : ''}
        <strong>Bank:</strong> ${settings.bankName}<br>
        <strong>Számlaszám (IBAN):</strong> ${settings.bankAccountNumber}<br>
        ${settings.bankSwift ? `<strong>SWIFT/BIC kód:</strong> ${settings.bankSwift}<br>` : ''}
        <strong>Közlemény:</strong> ${invoice.invoiceNumber}<br>
        ${invoice.stripeInvoiceId ? `<strong>Stripe számla ID:</strong> ${invoice.stripeInvoiceId}<br>` : ''}
        ${invoice.revolutOrderId ? `<strong>Revolut rendelés ID:</strong> ${invoice.revolutOrderId}<br>` : ''}
        ${invoice.paypalInvoiceId ? `<strong>PayPal számla ID:</strong> ${invoice.paypalInvoiceId}<br>` : ''}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Jogi információk</div>
      <div style="font-size: 11px; color: #666; line-height: 1.6;">
        <p><strong>Elektronikus számla:</strong> Ez a számla elektronikus formában került kiállításra és jogi szempontból érvényes.</p>
        <p><strong>Számla azonosító:</strong> ${invoice.id}</p>
        <p><strong>Kibocsátás időpontja:</strong> ${new Date(invoice.createdAt).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
        ${invoice.updatedAt && invoice.updatedAt !== invoice.createdAt ? `<p><strong>Utolsó módosítás:</strong> ${new Date(invoice.updatedAt).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
        <p><strong>ÁFA törvény:</strong> A számla az Általános Forgalmi Adóról szóló 2007. évi CXXVII. törvény szerint került kiállításra.</p>
        <p><strong>Jogorvoslat:</strong> A fogyasztó panaszt tehet a fogyasztóvédelmi hatóságnál vagy a békéltető testületnél.</p>
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
function generateInvoiceItems(invoice: any, vatRate: number, itemIdentifiers?: string): string {
  let items: any[] = [];
  
  // Ha van items JSON, próbáljuk parse-olni
  if (invoice.items) {
    try {
      items = typeof invoice.items === 'string' 
        ? JSON.parse(invoice.items) 
        : invoice.items;
    } catch (e) {
      // Ha nem sikerül parse-olni, használjuk az alapértelmezettet
    }
  }
  
  // Ha nincs items, hozzunk létre egy alapértelmezettet
  if (!items || items.length === 0) {
    const serverName = invoice.subscription?.server?.name || 'Game Server';
    const gameType = invoice.subscription?.server?.gameType || 'OTHER';
    const gameTypeLabel = getGameTypeLabel(gameType);
    
    items = [
      {
        description: `${gameTypeLabel} szerver hosting szolgáltatás${serverName !== 'Game Server' ? ` - ${serverName}` : ''}`,
        quantity: 1,
        unit: 'db',
        unitPrice: invoice.subtotal || invoice.amount / (1 + vatRate / 100),
        vatRate: vatRate,
        serverId: invoice.subscription?.serverId,
        gameType: gameType,
      },
    ];
  }

  return items
    .map((item: any, index: number) => {
      const unitPrice = item.unitPrice || item.unit_price || 0;
      const quantity = item.quantity || 1;
      const unit = item.unit || item.unitOfMeasure || 'db';
      const itemVatRate = item.vatRate || item.vat_rate || vatRate;
      const netAmount = unitPrice * quantity;
      const taxAmount = netAmount * (itemVatRate / 100);
      const grossAmount = netAmount + taxAmount;
      const description = item.description || item.name || item.itemName || 'Szolgáltatás';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${description}</strong>
            ${item.serverId ? `<br><span style="font-size: 11px; color: #666;">Szerver ID: ${item.serverId}</span>` : ''}
            ${item.gameType ? `<br><span style="font-size: 11px; color: #666;">Játék típus: ${getGameTypeLabel(item.gameType)}</span>` : ''}
            ${item.period ? `<br><span style="font-size: 11px; color: #666;">Időszak: ${item.period}</span>` : ''}
          </td>
          <td class="text-right">${quantity}</td>
          <td class="text-right">${unit}</td>
          <td class="text-right">${formatCurrency(unitPrice, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(netAmount, invoice.currency)}</td>
          <td class="text-right">${itemVatRate}%</td>
          <td class="text-right">${formatCurrency(taxAmount, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(grossAmount, invoice.currency)}</td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Tétel azonosítás információk generálása
 */
function getItemIdentifiers(invoice: any): string {
  const identifiers: string[] = [];
  
  if (invoice.subscription?.serverId) {
    identifiers.push(`<strong>Szerver azonosító:</strong> ${invoice.subscription.serverId}`);
  }
  
  if (invoice.subscription?.server?.name) {
    identifiers.push(`<strong>Szerver név:</strong> ${invoice.subscription.server.name}`);
  }
  
  if (invoice.subscription?.server?.gameType) {
    identifiers.push(`<strong>Játék típus:</strong> ${getGameTypeLabel(invoice.subscription.server.gameType)}`);
  }
  
  if (invoice.subscription?.currentPeriodStart && invoice.subscription?.currentPeriodEnd) {
    const startDate = new Date(invoice.subscription.currentPeriodStart).toLocaleDateString('hu-HU');
    const endDate = new Date(invoice.subscription.currentPeriodEnd).toLocaleDateString('hu-HU');
    identifiers.push(`<strong>Szolgáltatás időszaka:</strong> ${startDate} - ${endDate}`);
  }
  
  if (invoice.subscription?.id) {
    identifiers.push(`<strong>Előfizetés azonosító:</strong> ${invoice.subscription.id}`);
  }
  
  if (invoice.id) {
    identifiers.push(`<strong>Számla belső azonosító:</strong> ${invoice.id}`);
  }
  
  return identifiers.length > 0 ? identifiers.join('<br>') : '';
}

/**
 * Fizetési szolgáltató címke
 */
function getPaymentProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    STRIPE: 'Bankkártya (Stripe)',
    REVOLUT: 'Bankkártya (Revolut)',
    PAYPAL: 'PayPal',
  };
  return labels[provider] || provider;
}

/**
 * Játék típus címke
 */
function getGameTypeLabel(gameType: string): string {
  const labels: Record<string, string> = {
    ARK_EVOLVED: 'ARK: Survival Evolved',
    ARK_ASCENDED: 'ARK: Survival Ascended',
    MINECRAFT: 'Minecraft',
    RUST: 'Rust',
    VALHEIM: 'Valheim',
    SEVEN_DAYS_TO_DIE: '7 Days to Die',
    CONAN_EXILES: 'Conan Exiles',
    DAYZ: 'DayZ',
    PROJECT_ZOMBOID: 'Project Zomboid',
    PALWORLD: 'Palworld',
    CS2: 'Counter-Strike 2',
    CSGO: 'Counter-Strike: Global Offensive',
    OTHER: 'Egyéb játék',
  };
  return labels[gameType] || gameType.replace(/_/g, ' ');
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

/**
 * PDF generálás HTML-ből Puppeteer-rel
 */
async function generatePDFFromHTML(html: string): Promise<Buffer> {
  try {
    // Lazy loading: csak akkor töltjük be a Puppeteer-t, ha szükséges
    // @ts-ignore - puppeteer is an optional dependency
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // HTML beállítása
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // PDF generálása
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        preferCSSPageSize: false,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    logger.error('Puppeteer PDF generation error', error as Error);
    throw error;
  }
}

