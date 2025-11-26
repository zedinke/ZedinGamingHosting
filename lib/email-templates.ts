/**
 * Modern, responsive email templates
 * Gaming-themed, professional design
 */

export interface EmailTemplateOptions {
  locale?: string;
  [key: string]: any;
}

/**
 * Base email template wrapper
 */
function getEmailWrapper(content: string, locale: string = 'hu'): string {
  const companyName = process.env.COMPANY_NAME || 'ZedinGamingHosting';
  const primaryColor = '#5b6fff';
  const secondaryColor = '#e83eff';
  
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
      padding: 20px;
      line-height: 1.6;
      color: #e4e4e7;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #1a1f2e;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }
    
    .email-header-content {
      position: relative;
      z-index: 1;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: white;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      margin-bottom: 10px;
      letter-spacing: -1px;
    }
    
    .email-body {
      padding: 40px 30px;
    }
    
    .email-content {
      color: #e4e4e7;
      font-size: 16px;
    }
    
    .email-content h1 {
      color: #ffffff;
      font-size: 28px;
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    .email-content h2 {
      color: ${primaryColor};
      font-size: 22px;
      margin: 24px 0 16px;
      font-weight: 600;
    }
    
    .email-content p {
      margin-bottom: 16px;
      color: #a1a1aa;
    }
    
    .email-content a {
      color: ${primaryColor};
      text-decoration: none;
      font-weight: 600;
    }
    
    .email-content a:hover {
      color: ${secondaryColor};
      text-decoration: underline;
    }
    
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 15px rgba(91, 111, 255, 0.4);
      transition: all 0.3s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(91, 111, 255, 0.6);
    }
    
    .info-box {
      background: rgba(91, 111, 255, 0.1);
      border: 1px solid rgba(91, 111, 255, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .info-box p {
      margin-bottom: 8px;
    }
    
    .info-box strong {
      color: ${primaryColor};
    }
    
    .email-footer {
      background: rgba(0, 0, 0, 0.3);
      padding: 30px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .email-footer p {
      color: #71717a;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .email-footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      
      .email-body {
        padding: 30px 20px;
      }
      
      .email-content h1 {
        font-size: 24px;
      }
      
      .button {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-header-content">
        <div class="logo">${companyName}</div>
      </div>
    </div>
    
    <div class="email-body">
      <div class="email-content">
        ${content}
      </div>
    </div>
    
    <div class="email-footer">
      <p><strong>${companyName}</strong></p>
      <p>Gaming Server Hosting Platform</p>
      <p style="margin-top: 16px;">
        <a href="${process.env.NEXTAUTH_URL}">Weboldal</a> | 
        <a href="${process.env.NEXTAUTH_URL}/support">Támogatás</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #52525b;">
        Ez egy automatikus email. Kérjük, ne válaszolj erre az emailre.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Verification email template
 */
export function getVerificationEmailTemplate(token: string, locale: string = 'hu'): string {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/${locale}/verify-email?token=${token}`;
  
  const translations = {
    hu: {
      title: 'Üdvözöljük a ZedinGamingHosting-nél! 🎮',
      greeting: 'Kedves Felhasználó!',
      message: 'Köszönjük, hogy regisztráltál nálunk! Az email címed megerősítéséhez kérjük, kattints az alábbi gombra:',
      button: 'Email cím megerősítése',
      alternative: 'Vagy másold be ezt a linket a böngésződbe:',
      warning: 'Ha nem te regisztráltál nálunk, kérjük, hagyd figyelmen kívül ezt az emailt.',
      expires: 'Ez a link 24 órán belül lejár.',
    },
    en: {
      title: 'Welcome to ZedinGamingHosting! 🎮',
      greeting: 'Dear User!',
      message: 'Thank you for registering with us! To verify your email address, please click the button below:',
      button: 'Verify Email Address',
      alternative: 'Or copy this link into your browser:',
      warning: 'If you did not register with us, please ignore this email.',
      expires: 'This link will expire in 24 hours.',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button">${t.button}</a>
    </div>
    
    <div class="info-box">
      <p><strong>${t.alternative}</strong></p>
      <p style="word-break: break-all; font-size: 14px; color: #71717a;">${verifyUrl}</p>
    </div>
    
    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
      ${t.warning}
    </p>
    <p style="color: #71717a; font-size: 14px;">
      ${t.expires}
    </p>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailTemplate(token: string, locale: string = 'hu'): string {
  const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/reset-password?token=${token}`;
  
  const translations = {
    hu: {
      title: 'Jelszó visszaállítás 🔐',
      greeting: 'Kedves Felhasználó!',
      message: 'Kaptunk egy kérést a jelszavad visszaállításához. Ha te kérted, kattints az alábbi gombra:',
      button: 'Jelszó visszaállítása',
      alternative: 'Vagy másold be ezt a linket a böngésződbe:',
      warning: 'Ha nem te kérted a jelszó visszaállítását, kérjük, hagyd figyelmen kívül ezt az emailt. A jelszavad nem változik meg.',
      expires: 'Ez a link 1 órán belül lejár.',
      security: 'Biztonsági tipp: Ha nem te kérted ezt a visszaállítást, változtasd meg a jelszavadat azonnal!',
    },
    en: {
      title: 'Password Reset 🔐',
      greeting: 'Dear User!',
      message: 'We received a request to reset your password. If you requested this, please click the button below:',
      button: 'Reset Password',
      alternative: 'Or copy this link into your browser:',
      warning: 'If you did not request a password reset, please ignore this email. Your password will not change.',
      expires: 'This link will expire in 1 hour.',
      security: 'Security tip: If you did not request this reset, change your password immediately!',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">${t.button}</a>
    </div>
    
    <div class="info-box">
      <p><strong>${t.alternative}</strong></p>
      <p style="word-break: break-all; font-size: 14px; color: #71717a;">${resetUrl}</p>
    </div>
    
    <div class="info-box" style="background: rgba(251, 191, 36, 0.1); border-color: rgba(251, 191, 36, 0.3);">
      <p style="color: #fbbf24;"><strong>${t.warning}</strong></p>
      <p style="color: #fbbf24; font-size: 14px; margin-top: 8px;">${t.security}</p>
    </div>
    
    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
      ${t.expires}
    </p>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Invoice email template
 */
export function getInvoiceEmailTemplate(invoice: any, locale: string = 'hu'): string {
  const invoiceUrl = `${process.env.NEXTAUTH_URL}/${locale}/dashboard/billing/invoices/${invoice.id}`;
  
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'hu' ? 'hu-HU' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  const translations = {
    hu: {
      title: 'Új számla érkezett 💳',
      greeting: 'Kedves Felhasználó!',
      message: 'Küldjük számládat. A részleteket az alábbi gombra kattintva tekintheted meg:',
      button: 'Számla megtekintése',
      details: 'Számla részletek',
      invoiceNumber: 'Számlaszám',
      amount: 'Összeg',
      status: 'Státusz',
      dueDate: 'Fizetési határidő',
      paid: 'Fizetve',
      pending: 'Függőben',
      download: 'Számla letöltése (PDF)',
      questions: 'Kérdésed van?',
      support: 'Látogass el a támogatási oldalunkra',
    },
    en: {
      title: 'New Invoice Received 💳',
      greeting: 'Dear User!',
      message: 'Here is your invoice. You can view the details by clicking the button below:',
      button: 'View Invoice',
      details: 'Invoice Details',
      invoiceNumber: 'Invoice Number',
      amount: 'Amount',
      status: 'Status',
      dueDate: 'Due Date',
      paid: 'Paid',
      pending: 'Pending',
      download: 'Download Invoice (PDF)',
      questions: 'Have questions?',
      support: 'Visit our support page',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">${t.details}</h2>
      <p><strong>${t.invoiceNumber}:</strong> #${invoice.invoiceNumber}</p>
      <p><strong>${t.amount}:</strong> ${formatPrice(invoice.amount, invoice.currency)}</p>
      <p><strong>${t.status}:</strong> 
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; 
          background: ${invoice.status === 'PAID' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)'}; 
          color: ${invoice.status === 'PAID' ? '#22c55e' : '#fbbf24'};">
          ${invoice.status === 'PAID' ? t.paid : t.pending}
        </span>
      </p>
      ${invoice.dueDate ? `<p><strong>${t.dueDate}:</strong> ${new Date(invoice.dueDate).toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-US')}</p>` : ''}
    </div>
    
    <div style="text-align: center;">
      <a href="${invoiceUrl}" class="button">${t.button}</a>
    </div>
    
    ${invoice.pdfUrl ? `
      <div style="text-align: center; margin-top: 16px;">
        <a href="${invoice.pdfUrl}" style="color: #5b6fff; text-decoration: none; font-weight: 600;">
          📄 ${t.download}
        </a>
      </div>
    ` : ''}
    
    <div class="info-box" style="margin-top: 32px;">
      <p><strong>${t.questions}</strong></p>
      <p><a href="${process.env.NEXTAUTH_URL}/${locale}/dashboard/support">${t.support}</a></p>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server status change notification email template
 */
export function getServerStatusEmailTemplate(
  serverName: string,
  oldStatus: string,
  newStatus: string,
  serverId: string,
  userName: string,
  locale: string = 'hu'
): string {
  const serverUrl = `${process.env.NEXTAUTH_URL}/dashboard/servers/${serverId}`;
  
  const translations = {
    hu: {
      title: 'Szerver állapot változás 🔄',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>${serverName}</strong> szerver állapota megváltozott:`,
      oldStatus: 'Régi állapot',
      newStatus: 'Új állapot',
      details: 'Szerver részletek',
      button: 'Szerver megtekintése',
    },
    en: {
      title: 'Server Status Change 🔄',
      greeting: `Dear ${userName}!`,
      message: `The status of your server <strong>${serverName}</strong> has changed:`,
      oldStatus: 'Old Status',
      newStatus: 'New Status',
      details: 'Server Details',
      button: 'View Server',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return '#22c55e';
      case 'OFFLINE':
        return '#71717a';
      case 'ERROR':
        return '#ef4444';
      default:
        return '#71717a';
    }
  };
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box">
      <p><strong>${t.oldStatus}:</strong> 
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; 
          background: rgba(113, 113, 122, 0.2); 
          color: ${getStatusColor(oldStatus)};">
          ${oldStatus}
        </span>
      </p>
      <p><strong>${t.newStatus}:</strong> 
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; 
          background: rgba(34, 197, 94, 0.2); 
          color: ${getStatusColor(newStatus)};">
          ${newStatus}
        </span>
      </p>
    </div>
    
    <div style="text-align: center;">
      <a href="${serverUrl}" class="button">${t.button}</a>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Task completion notification email template
 */
export function getTaskCompletionEmailTemplate(
  taskType: string,
  serverName: string,
  serverId: string,
  userName: string,
  error: string | null,
  locale: string = 'hu'
): string {
  const serverUrl = `${process.env.NEXTAUTH_URL}/dashboard/servers/${serverId}`;
  
  const translations = {
    hu: {
      title: 'Feladat sikertelen ⚠️',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>${serverName}</strong> szerveren végrehajtott <strong>${taskType}</strong> feladat sikertelen volt.`,
      error: 'Hibaüzenet',
      details: 'Szerver részletek',
      button: 'Szerver megtekintése',
      support: 'Ha további segítségre van szükséged, kérjük, lépj kapcsolatba az ügyfélszolgálattal.',
    },
    en: {
      title: 'Task Failed ⚠️',
      greeting: `Dear ${userName}!`,
      message: `The <strong>${taskType}</strong> task on your server <strong>${serverName}</strong> has failed.`,
      error: 'Error Message',
      details: 'Server Details',
      button: 'View Server',
      support: 'If you need further assistance, please contact our support team.',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    ${error ? `
      <div class="info-box" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
        <p><strong>${t.error}:</strong></p>
        <p style="color: #ef4444; word-break: break-word;">${error}</p>
      </div>
    ` : ''}
    
    <div style="text-align: center;">
      <a href="${serverUrl}" class="button">${t.button}</a>
    </div>
    
    <div class="info-box" style="margin-top: 32px;">
      <p>${t.support}</p>
      <p><a href="${process.env.NEXTAUTH_URL}/${locale}/dashboard/support">Ügyfélszolgálat</a></p>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server provisioning failed email template
 */
export function getServerProvisioningFailedEmailTemplate(
  serverName: string,
  userName: string,
  error: string,
  locale: string = 'hu'
): string {
  const translations = {
    hu: {
      title: 'Szerver telepítési hiba ⚠️',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>"${serverName}"</strong> szerver telepítése sikertelen volt.`,
      error: 'Hiba',
      support: 'Kérjük, lépjen kapcsolatba az ügyfélszolgálattal a probléma megoldásához.',
      button: 'Ügyfélszolgálat',
    },
    en: {
      title: 'Server Provisioning Failed ⚠️',
      greeting: `Dear ${userName}!`,
      message: `The installation of your server <strong>"${serverName}"</strong> has failed.`,
      error: 'Error',
      support: 'Please contact our support team to resolve this issue.',
      button: 'Contact Support',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
      <p><strong>${t.error}:</strong></p>
      <p style="color: #ef4444; word-break: break-word;">${error}</p>
    </div>
    
    <p>${t.support}</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/${locale}/dashboard/support" class="button">${t.button}</a>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server installation failed email template
 */
export function getServerInstallationFailedEmailTemplate(
  serverName: string,
  userName: string,
  error: string,
  locale: string = 'hu'
): string {
  const translations = {
    hu: {
      title: 'Játékszerver telepítési hiba ⚠️',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>"${serverName}"</strong> játékszerver telepítése sikertelen volt.`,
      error: 'Hiba',
      support: 'Kérjük, lépjen kapcsolatba az ügyfélszolgálattal a probléma megoldásához.',
      button: 'Ügyfélszolgálat',
    },
    en: {
      title: 'Game Server Installation Failed ⚠️',
      greeting: `Dear ${userName}!`,
      message: `The installation of your game server <strong>"${serverName}"</strong> has failed.`,
      error: 'Error',
      support: 'Please contact our support team to resolve this issue.',
      button: 'Contact Support',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
      <p><strong>${t.error}:</strong></p>
      <p style="color: #ef4444; word-break: break-word;">${error}</p>
    </div>
    
    <p>${t.support}</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/${locale}/dashboard/support" class="button">${t.button}</a>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server installation success email template
 */
export function getServerInstallationSuccessEmailTemplate(
  serverName: string,
  gameType: string,
  ipAddress: string,
  port: number,
  maxPlayers: number,
  userName: string,
  serverId: string,
  locale: string = 'hu'
): string {
  const serverUrl = `${process.env.NEXTAUTH_URL}/dashboard/servers/${serverId}`;
  
  const translations = {
    hu: {
      title: 'Szerver sikeresen telepítve! 🎉',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>"${serverName}"</strong> szervered sikeresen telepítve és elindítva.`,
      info: 'Szerver információk',
      name: 'Név',
      game: 'Játék',
      ip: 'IP cím',
      port: 'Port',
      maxPlayers: 'Max játékosok',
      connect: 'Most már csatlakozhatsz a szerverhez!',
      button: 'Szerver megtekintése',
    },
    en: {
      title: 'Server Successfully Installed! 🎉',
      greeting: `Dear ${userName}!`,
      message: `Your server <strong>"${serverName}"</strong> has been successfully installed and started.`,
      info: 'Server Information',
      name: 'Name',
      game: 'Game',
      ip: 'IP Address',
      port: 'Port',
      maxPlayers: 'Max Players',
      connect: 'You can now connect to your server!',
      button: 'View Server',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">${t.info}</h2>
      <p><strong>${t.name}:</strong> ${serverName}</p>
      <p><strong>${t.game}:</strong> ${gameType}</p>
      <p><strong>${t.ip}:</strong> <code style="background: rgba(91, 111, 255, 0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${ipAddress}</code></p>
      <p><strong>${t.port}:</strong> <code style="background: rgba(91, 111, 255, 0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${port}</code></p>
      <p><strong>${t.maxPlayers}:</strong> ${maxPlayers}</p>
    </div>
    
    <p style="text-align: center; font-size: 18px; font-weight: 600; color: #22c55e; margin: 24px 0;">
      ${t.connect}
    </p>
    
    <div style="text-align: center;">
      <a href="${serverUrl}" class="button">${t.button}</a>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server deleted email template (for user)
 */
export function getServerDeletedUserEmailTemplate(
  serverName: string,
  userName: string,
  reason: string,
  locale: string = 'hu'
): string {
  const translations = {
    hu: {
      title: 'Szerver törölve 🗑️',
      greeting: `Kedves ${userName}!`,
      message: `A(z) <strong>"${serverName}"</strong> szervered törölve lett.`,
      reason: 'Indoklás',
      support: 'Ha kérdésed van, kérjük, lépj kapcsolatba az ügyfélszolgálattal.',
      button: 'Ügyfélszolgálat',
    },
    en: {
      title: 'Server Deleted 🗑️',
      greeting: `Dear ${userName}!`,
      message: `Your server <strong>"${serverName}"</strong> has been deleted.`,
      reason: 'Reason',
      support: 'If you have any questions, please contact our support team.',
      button: 'Contact Support',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box">
      <p><strong>${t.reason}:</strong></p>
      <p>${reason}</p>
    </div>
    
    <p>${t.support}</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/${locale}/dashboard/support" class="button">${t.button}</a>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

/**
 * Server deleted email template (for admin)
 */
export function getServerDeletedAdminEmailTemplate(
  serverName: string,
  userName: string,
  userEmail: string,
  reason: string,
  deletedBy: string,
  locale: string = 'hu'
): string {
  const translations = {
    hu: {
      title: 'Szerver törölve 🗑️',
      greeting: `Kedves Admin!`,
      message: `A(z) <strong>"${serverName}"</strong> szerver törölve lett.`,
      user: 'Felhasználó',
      reason: 'Indoklás',
      deletedBy: 'Törölte',
    },
    en: {
      title: 'Server Deleted 🗑️',
      greeting: `Dear Admin!`,
      message: `The server <strong>"${serverName}"</strong> has been deleted.`,
      user: 'User',
      reason: 'Reason',
      deletedBy: 'Deleted By',
    },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.hu;
  
  const content = `
    <h1>${t.title}</h1>
    <p>${t.greeting}</p>
    <p>${t.message}</p>
    
    <div class="info-box">
      <p><strong>${t.user}:</strong> ${userName} (${userEmail})</p>
      <p><strong>${t.reason}:</strong> ${reason}</p>
      <p><strong>${t.deletedBy}:</strong> ${deletedBy}</p>
    </div>
  `;
  
  return getEmailWrapper(content, locale);
}

