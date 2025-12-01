import { sendEmail } from './email';
import { SaaSOrder } from '@prisma/client';
import { SaaSPlan } from '@prisma/client';
import { generateInvoicePDF } from './invoice-pdf-generator';

interface InvoiceEmailData {
  order: SaaSOrder;
  plan: SaaSPlan;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
}

/**
 * Számla email küldése PDF csatolmánnyal
 */
export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: any }> {
  try {
    const { order, plan, invoiceNumber, issueDate, dueDate } = data;
    
    // PDF generálás
    const pdfBuffer = await generateInvoicePDF(data);
    
    // Email tartalom
    const subject = `Számla - ${invoiceNumber} - ${plan.displayName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Köszönjük a megrendelését!</h1>
  </div>
  
  <div class="content">
    <p>Tisztelt ${order.customerName || 'Ügyfelünk'}!</p>
    
    <p>Köszönjük, hogy a <strong>${plan.displayName}</strong> csomagot választotta!</p>
    
    ${order.licenseKey ? `
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #065f46;">License Key:</p>
      <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #047857;">${order.licenseKey}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #059669;">Kérjük, mentsd el ezt a kulcsot biztonságos helyen!</p>
    </div>
    ` : ''}
    
    <p>A számlát PDF formátumban csatolva küldjük.</p>
    
    <p><strong>Számla adatok:</strong></p>
    <ul>
      <li>Sorszám: ${invoiceNumber}</li>
      <li>Összeg: ${new Intl.NumberFormat('hu-HU', { style: 'currency', currency: order.currency }).format(order.amount)}</li>
      <li>Kibocsátás: ${new Intl.DateTimeFormat('hu-HU').format(issueDate)}</li>
      <li>Fizetési határidő: ${new Intl.DateTimeFormat('hu-HU').format(dueDate)}</li>
    </ul>
    
    ${order.paymentStatus === 'PAID' ? `
    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-weight: 600;">✓ Fizetés sikeresen megérkezett!</p>
    </div>
    ` : `
    <p style="color: #dc2626; font-weight: 600;">Fizetés státusza: ${order.paymentStatus}</p>
    `}
    
    <p>Ha bármilyen kérdése van, kérjük, lépjen velünk kapcsolatba!</p>
    
    <p>Üdvözlettel,<br>
    <strong>ZedinGamingHosting Csapat</strong></p>
  </div>
  
  <div class="footer">
    <p>Ez egy automatikusan generált email. Kérjük, ne válaszoljon erre az emailre.</p>
    <p>ZedinGamingHosting - Gaming Server Hosting Platform</p>
  </div>
</body>
</html>
    `;
    
    const text = `
Köszönjük a megrendelését!

Tisztelt ${order.customerName || 'Ügyfelünk'}!

Köszönjük, hogy a ${plan.displayName} csomagot választotta!

${order.licenseKey ? `License Key: ${order.licenseKey}\nKérjük, mentsd el ezt a kulcsot biztonságos helyen!\n` : ''}

Számla adatok:
- Sorszám: ${invoiceNumber}
- Összeg: ${new Intl.NumberFormat('hu-HU', { style: 'currency', currency: order.currency }).format(order.amount)}
- Kibocsátás: ${new Intl.DateTimeFormat('hu-HU').format(issueDate)}
- Fizetési határidő: ${new Intl.DateTimeFormat('hu-HU').format(dueDate)}

A számlát PDF formátumban csatolva küldjük.

Üdvözlettel,
ZedinGamingHosting Csapat
    `;
    
    // Email küldés PDF csatolmánnyal
    const result = await sendEmail({
      to: order.customerEmail,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    
    return result;
  } catch (error: any) {
    console.error('Invoice email sending failed:', error);
    return { success: false, error };
  }
}

/**
 * Email küldés PDF csatolmánnyal (segédfüggvény)
 */
export async function sendEmailWithPDF(
  to: string,
  subject: string,
  html: string,
  text: string,
  pdfBuffer: Buffer,
  filename: string = 'invoice.pdf'
): Promise<{ success: boolean; error?: any }> {
  return sendEmail({
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

