// AI kontextus generálás - RAG és felhasználói adatok
import { prisma } from './prisma';

export interface AIContext {
  userContext?: string;
  faqContext?: string;
  documentationContext?: string;
}

// Felhasználó kontextus generálása
export async function getUserContext(userId: string): Promise<string> {
  try {
    const [servers, subscriptions, invoices] = await Promise.all([
      prisma.server.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          gameType: true,
          status: true,
          port: true,
          maxPlayers: true,
        },
        take: 10,
      }),
      prisma.subscription.findMany({
        where: { userId },
        include: {
          server: {
            select: {
              name: true,
              gameType: true,
            },
          },
        },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          invoiceNumber: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Rövidebb, egyszerűbb kontextus
    let context = '';

    if (servers.length > 0) {
      context += `Szerverei: ${servers.map(s => `${s.name} (${s.gameType}, ${s.status})`).join(', ')}.\n`;
    }

    if (subscriptions.length > 0) {
      context += `Előfizetései: ${subscriptions.map(s => `${s.server?.name || 'N/A'} (${s.status})`).join(', ')}.\n`;
    }

    if (invoices.length > 0) {
      const unpaid = invoices.filter(i => i.status === 'PENDING').length;
      if (unpaid > 0) {
        context += `Függő számlák: ${unpaid} db.\n`;
      }
    }

    return context.trim();
  } catch (error) {
    console.error('Hiba a felhasználó kontextus generálása során:', error);
    return '';
  }
}

// FAQ kontextus generálása (RAG)
export async function getFAQContext(query: string, locale: string = 'hu'): Promise<string> {
  try {
    // Keresés a FAQ-ban releváns válaszokért
    const faqs = await prisma.fAQ.findMany({
      where: {
        isActive: true,
        locale: locale,
        OR: [
          { question: { contains: query } },
          { answer: { contains: query } },
        ],
      },
      take: 5,
      orderBy: { order: 'asc' },
    });

    if (faqs.length === 0) {
      // Ha nincs pontos találat, néhány általános FAQ-t is visszaadunk
      const generalFaqs = await prisma.fAQ.findMany({
        where: {
          isActive: true,
          locale: locale,
        },
        take: 2,
        orderBy: { order: 'asc' },
      });

      if (generalFaqs.length === 0) {
        return '';
      }

      let context = 'FAQ:\n';
      generalFaqs.forEach((faq) => {
        context += `${faq.question}: ${faq.answer.substring(0, 150)}...\n`;
      });
      return context;
    }

    // Csak a legrelevánsabb FAQ-kat adjuk vissza, röviden
    let context = 'FAQ:\n';
    faqs.slice(0, 3).forEach((faq) => {
      context += `${faq.question}: ${faq.answer.substring(0, 150)}...\n`;
    });

    return context;
  } catch (error) {
    console.error('Hiba a FAQ kontextus generálása során:', error);
    return '';
  }
}

// Dokumentáció kontextus (játék specifikus információk) - röviden
export function getDocumentationContext(gameType?: string): string {
  const gameDocs: Record<string, string> = {
    MINECRAFT: `Minecraft: Port 25565, Java Edition, pluginek telepíthetők, server.properties fájl.`,
    ARK_EVOLVED: `ARK Evolved: Port 7777, SteamCMD, modok, GameUserSettings.ini fájl.`,
    ARK_ASCENDED: `ARK Ascended: Port 7777, Unreal Engine 5, modok, GameUserSettings.ini fájl.`,
    RUST: `Rust: Port 28015, Oxide plugin, server.cfg fájl.`,
    VALHEIM: `Valheim: Port 2456-2458, dedicated szerver, .db fájlok.`,
    PALWORLD: `Palworld: Port 8211, dedicated szerver, DefaultPalWorldSettings.ini fájl.`,
  };

  if (gameType && gameDocs[gameType]) {
    return gameDocs[gameType];
  }

  return `Gaming szerver: Start/Stop/Restart, konzol, fájlkezelő, backup, monitoring.`;
}

// Teljes kontextus generálása - röviden, csak a legfontosabb információk
export async function generateAIContext(
  userId: string,
  query: string,
  locale: string = 'hu',
  gameType?: string
): Promise<string> {
  // Csak a legrelevánsabb kontextust generáljuk
  const [userContext, faqContext, docContext] = await Promise.all([
    getUserContext(userId),
    getFAQContext(query, locale),
    Promise.resolve(getDocumentationContext(gameType)),
  ]);

  // Összefűzzük röviden
  const parts = [userContext, faqContext, docContext].filter(Boolean);
  return parts.join('\n').trim();
}

