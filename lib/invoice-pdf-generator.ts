import puppeteer from 'puppeteer';
import { SaaSOrder } from '@prisma/client';
import { SaaSPlan } from '@prisma/client';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

interface InvoiceData {
  order: SaaSOrder;
  plan: SaaSPlan;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
}

/**
 * PDF számla generálás Puppeteer-rel
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Számla HTML sablon
    const html = generateInvoiceHTML(invoiceData);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // PDF generálás
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * Számla HTML sablon generálás
 */
function generateInvoiceHTML(data: InvoiceData): string {
  const { order, plan, invoiceNumber, issueDate, dueDate } = data;
  
  // ÁFA számítás (27% ha nincs megadva)
  const taxRate = 0.27;
  const subtotal = order.amount / (1 + taxRate);
  const taxAmount = order.amount - subtotal;
  
  const formatCurrency = (amount: number, currency: string = 'HUF') => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Számla - ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .company-info {
      flex: 1;
    }
    .invoice-info {
      text-align: right;
    }
    h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 20px;
      color: #374151;
      margin-bottom: 20px;
    }
    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .billing-box {
      flex: 1;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .billing-box:first-child {
      margin-right: 20px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th,
    .items-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    .items-table td {
      color: #6b7280;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .total-row.final {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #1f2937;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>ZedinGamingHosting</h1>
        <p>Gaming Server Hosting Platform</p>
        <p style="margin-top: 10px; color: #6b7280;">
          Email: info@zedingaming.com<br>
          Web: https://zedingaming.com
        </p>
      </div>
      <div class="invoice-info">
        <h2>SZÁMLA</h2>
        <p><strong>Sorszám:</strong> ${invoiceNumber}</p>
        <p><strong>Kibocsátás:</strong> ${formatDate(issueDate)}</p>
        <p><strong>Fizetési határidő:</strong> ${formatDate(dueDate)}</p>
      </div>
    </div>

    <div class="billing-section">
      <div class="billing-box">
        <h3 style="margin-bottom: 10px; color: #374151;">Szolgáltató</h3>
        <p><strong>ZedinGamingHosting</strong></p>
        <p>Gaming Server Hosting Platform</p>
      </div>
      <div class="billing-box">
        <h3 style="margin-bottom: 10px; color: #374151;">Vevő</h3>
        <p><strong>${order.customerName || order.customerEmail}</strong></p>
        ${order.customerCompany ? `<p>${order.customerCompany}</p>` : ''}
        <p>${order.customerEmail}</p>
        ${order.billingAddress ? `<p style="margin-top: 5px;">${order.billingAddress}</p>` : ''}
        ${order.billingTaxNumber ? `<p>Adószám: ${order.billingTaxNumber}</p>` : ''}
      </div>
    </div>

    <h2>Számla tételek</h2>
    <table class="items-table">
      <thead>
        <tr>
          <th>Leírás</th>
          <th class="text-right">Mennyiség</th>
          <th class="text-right">Egységár</th>
          <th class="text-right">Összeg</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${plan.displayName}</strong><br>
            ${plan.description || 'Gaming Server Hosting Platform SaaS licenc'}
            ${order.licenseKey ? `<br><small style="color: #6b7280;">License Key: ${order.licenseKey}</small>` : ''}
          </td>
          <td class="text-right">1</td>
          <td class="text-right">${formatCurrency(subtotal, order.currency)}</td>
          <td class="text-right">${formatCurrency(subtotal, order.currency)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span>Nettó összeg:</span>
        <span>${formatCurrency(subtotal, order.currency)}</span>
      </div>
      <div class="total-row">
        <span>ÁFA (27%):</span>
        <span>${formatCurrency(taxAmount, order.currency)}</span>
      </div>
      <div class="total-row final">
        <span>Fizetendő összeg:</span>
        <span>${formatCurrency(order.amount, order.currency)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Ez a számla elektronikus úton készült és érvényes nyomtatott formában is.</p>
      <p style="margin-top: 10px;">Fizetési mód: ${order.paymentProvider}</p>
      ${order.paymentStatus === 'PAID' ? '<p style="color: #10b981; font-weight: 600; margin-top: 5px;">✓ FIZETVE</p>' : ''}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Számla fájl mentése
 */
export async function saveInvoicePDF(
  invoiceData: InvoiceData,
  outputPath: string
): Promise<string> {
  const pdfBuffer = await generateInvoicePDF(invoiceData);
  
  // Mappa létrehozása ha nem létezik
  const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(outputPath, pdfBuffer);
  return outputPath;
}

