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

