import nodemailer from 'nodemailer';

// Hestia CP SMTP konfiguráció
// A Hestia CP által kezelt mail szerver használata
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Hestia CP email cím
    pass: process.env.SMTP_PASSWORD, // Hestia CP email jelszó
  },
  tls: {
    rejectUnauthorized: false, // Hestia CP self-signed cert esetén
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@zedingaming.com',
  attachments,
}: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // HTML-t plain text-re konvertálás
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf',
      })),
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

// Előre definiált email sablonok
export async function sendVerificationEmail(email: string, token: string, locale: string = 'hu') {
  const { getVerificationEmailTemplate } = await import('./email-templates');
  const html = getVerificationEmailTemplate(token, locale);
  
  const translations = {
    hu: {
      subject: 'Email cím megerősítése - ZedinGamingHosting',
    },
    en: {
      subject: 'Verify your email - ZedinGamingHosting',
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = 'hu') {
  const { getPasswordResetEmailTemplate } = await import('./email-templates');
  const html = getPasswordResetEmailTemplate(token, locale);
  
  const translations = {
    hu: {
      subject: 'Jelszó visszaállítás - ZedinGamingHosting',
    },
    en: {
      subject: 'Password Reset - ZedinGamingHosting',
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

export async function sendInvoiceEmail(email: string, invoice: any, locale: string = 'hu') {
  const { getInvoiceEmailTemplate } = await import('./email-templates');
  const html = getInvoiceEmailTemplate(invoice, locale);
  
  const translations = {
    hu: {
      subject: `Számla #${invoice.invoiceNumber} - ZedinGamingHosting`,
    },
    en: {
      subject: `Invoice #${invoice.invoiceNumber} - ZedinGamingHosting`,
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}

