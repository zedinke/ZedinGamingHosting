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
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@zedingaming.com',
}: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // HTML-t plain text-re konvertálás
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
  const verifyUrl = `${process.env.NEXTAUTH_URL}/${locale}/verify-email?token=${token}`;
  
  const translations = {
    hu: {
      subject: 'Email cím megerősítése - ZedinGamingHosting',
      html: `
        <h1>Üdvözöljük a ZedinGamingHosting-nél!</h1>
        <p>Kérjük, erősítse meg az email címét a következő linkre kattintva:</p>
        <a href="${verifyUrl}">Email cím megerősítése</a>
        <p>Ha nem Ön kérte ezt a megerősítést, kérjük, hagyja figyelmen kívül ezt az emailt.</p>
      `,
    },
    en: {
      subject: 'Verify your email - ZedinGamingHosting',
      html: `
        <h1>Welcome to ZedinGamingHosting!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}">Verify Email Address</a>
        <p>If you didn't request this verification, please ignore this email.</p>
      `,
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html: t.html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = 'hu') {
  const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/reset-password?token=${token}`;
  
  const translations = {
    hu: {
      subject: 'Jelszó visszaállítás - ZedinGamingHosting',
      html: `
        <h1>Jelszó visszaállítás</h1>
        <p>Kattintson az alábbi linkre a jelszó visszaállításához:</p>
        <a href="${resetUrl}">Jelszó visszaállítása</a>
        <p>Ez a link 1 órán belül lejár.</p>
        <p>Ha nem Ön kérte a jelszó visszaállítását, kérjük, hagyja figyelmen kívül ezt az emailt.</p>
      `,
    },
    en: {
      subject: 'Password Reset - ZedinGamingHosting',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `,
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html: t.html,
  });
}

export async function sendInvoiceEmail(email: string, invoice: any, locale: string = 'hu') {
  const invoiceUrl = `${process.env.NEXTAUTH_URL}/${locale}/dashboard/billing/invoices/${invoice.id}`;
  
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'hu' ? 'hu-HU' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const translations = {
    hu: {
      subject: `Számla #${invoice.invoiceNumber} - ZedinGamingHosting`,
      html: `
        <h1>Szia!</h1>
        <p>Küldjük számládat:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Számla #${invoice.invoiceNumber}</h2>
          <p><strong>Összeg:</strong> ${formatPrice(invoice.amount, invoice.currency)}</p>
          <p><strong>Státusz:</strong> ${invoice.status === 'PAID' ? 'Fizetve' : invoice.status === 'PENDING' ? 'Függőben' : invoice.status}</p>
          ${invoice.dueDate ? `<p><strong>Fizetési határidő:</strong> ${new Date(invoice.dueDate).toLocaleDateString('hu-HU')}</p>` : ''}
        </div>
        <p><a href="${invoiceUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Számla megtekintése</a></p>
        ${invoice.pdfUrl ? `<p><a href="${invoice.pdfUrl}">Számla letöltése (PDF)</a></p>` : ''}
      `,
    },
    en: {
      subject: `Invoice #${invoice.invoiceNumber} - ZedinGamingHosting`,
      html: `
        <h1>Hello!</h1>
        <p>Here is your invoice:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Invoice #${invoice.invoiceNumber}</h2>
          <p><strong>Amount:</strong> ${formatPrice(invoice.amount, invoice.currency)}</p>
          <p><strong>Status:</strong> ${invoice.status === 'PAID' ? 'Paid' : invoice.status === 'PENDING' ? 'Pending' : invoice.status}</p>
          ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-US')}</p>` : ''}
        </div>
        <p><a href="${invoiceUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a></p>
        ${invoice.pdfUrl ? `<p><a href="${invoice.pdfUrl}">Download Invoice (PDF)</a></p>` : ''}
      `,
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.hu;

  return sendEmail({
    to: email,
    subject: t.subject,
    html: t.html,
  });
}

