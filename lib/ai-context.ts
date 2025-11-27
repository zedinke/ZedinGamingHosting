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

    let context = 'Felhasználó információk:\n';

    if (servers.length > 0) {
      context += `\nSzerverei (${servers.length} db):\n`;
      servers.forEach((server) => {
        context += `- ${server.name} (${server.gameType}): ${server.status}, Port: ${server.port || 'N/A'}, Max játékosok: ${server.maxPlayers}\n`;
      });
    } else {
      context += '\nNincs aktív szervere.\n';
    }

    if (subscriptions.length > 0) {
      context += `\nElőfizetései (${subscriptions.length} db):\n`;
      subscriptions.forEach((sub) => {
        context += `- ${sub.server?.name || 'N/A'} (${sub.server?.gameType || 'N/A'}): ${sub.status}`;
        if (sub.currentPeriodEnd) {
          context += `, Lejárat: ${sub.currentPeriodEnd.toLocaleDateString('hu-HU')}`;
        }
        context += '\n';
      });
    }

    if (invoices.length > 0) {
      context += `\nLegutóbbi számlák (${invoices.length} db):\n`;
      invoices.forEach((invoice) => {
        context += `- #${invoice.invoiceNumber}: ${invoice.amount} ${invoice.currency} (${invoice.status}), ${invoice.createdAt.toLocaleDateString('hu-HU')}\n`;
      });
    }

    return context;
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
          { question: { contains: query, mode: 'insensitive' as const } },
          { answer: { contains: query, mode: 'insensitive' as const } },
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
        take: 3,
        orderBy: { order: 'asc' },
      });

      if (generalFaqs.length === 0) {
        return '';
      }

      let context = 'Gyakran ismételt kérdések (FAQ):\n';
      generalFaqs.forEach((faq) => {
        context += `\nK: ${faq.question}\nV: ${faq.answer}\n`;
      });
      return context;
    }

    let context = 'Releváns gyakran ismételt kérdések (FAQ):\n';
    faqs.forEach((faq) => {
      context += `\nK: ${faq.question}\nV: ${faq.answer}\n`;
    });

    return context;
  } catch (error) {
    console.error('Hiba a FAQ kontextus generálása során:', error);
    return '';
  }
}

// Dokumentáció kontextus (játék specifikus információk)
export function getDocumentationContext(gameType?: string): string {
  const gameDocs: Record<string, string> = {
    MINECRAFT: `
Minecraft szerver információk:
- Alapértelmezett port: 25565
- Java Edition szerverek támogatottak
- Pluginek és modok telepíthetők
- Vanilla és Bukkit/Spigot/Paper szerverek
- Konfigurációs fájlok: server.properties, bukkit.yml, spigot.yml
- Backup: World fájlok mentése ajánlott
`,
    ARK_EVOLVED: `
ARK: Survival Evolved szerver információk:
- Alapértelmezett port: 7777 (Game), 27015 (Query)
- SteamCMD szükséges a telepítéshez
- Modok támogatottak Steam Workshop-ból
- Konfigurációs fájlok: GameUserSettings.ini, Game.ini
- Admin parancsok: enablecheats <password>
- Backup: Save fájlok mentése ajánlott
`,
    ARK_ASCENDED: `
ARK: Survival Ascended szerver információk:
- Unreal Engine 5 alapú, újabb verzió
- Alapértelmezett port: 7777 (Game), 27015 (Query)
- Modok támogatottak
- Konfigurációs fájlok: GameUserSettings.ini, Game.ini
- Jobb teljesítmény és grafikus minőség
`,
    RUST: `
Rust szerver információk:
- Alapértelmezett port: 28015 (Game), 28016 (RCon)
- Oxide plugin támogatás
- Konfigurációs fájlok: server.cfg, oxide/config/
- Wipe: Térkép törlése és újraindítás
- Admin parancsok: F1 konzolban
`,
    VALHEIM: `
Valheim szerver információk:
- Alapértelmezett port: 2456-2458
- Dedicated szerver támogatott
- Konfigurációs fájl: start_server.sh
- World fájlok: .db és .fwl fájlok
- Backup: World fájlok mentése ajánlott
`,
    PALWORLD: `
Palworld szerver információk:
- Alapértelmezett port: 8211 (UDP)
- Dedicated szerver támogatott
- Konfigurációs fájl: DefaultPalWorldSettings.ini
- Multiplayer támogatás
- Backup: Save fájlok mentése ajánlott
`,
  };

  if (gameType && gameDocs[gameType]) {
    return `Játék specifikus dokumentáció:\n${gameDocs[gameType]}`;
  }

  return `Általános gaming szerver információk:
- Szerverek kezelése: Start, Stop, Restart műveletek
- Konzol hozzáférés: Valós idejű logok és parancsok
- Fájlkezelő: FTP vagy webes felület
- Backup: Rendszeres mentések ajánlottak
- Monitoring: CPU, RAM, Disk használat követése
- Portok: Automatikus port kiosztás
- Konfiguráció: Játék specifikus beállítások
`;
}

// Teljes kontextus generálása
export async function generateAIContext(
  userId: string,
  query: string,
  locale: string = 'hu',
  gameType?: string
): Promise<string> {
  const [userContext, faqContext, docContext] = await Promise.all([
    getUserContext(userId),
    getFAQContext(query, locale),
    Promise.resolve(getDocumentationContext(gameType)),
  ]);

  let fullContext = '';

  if (userContext) {
    fullContext += userContext + '\n\n';
  }

  if (faqContext) {
    fullContext += faqContext + '\n\n';
  }

  if (docContext) {
    fullContext += docContext;
  }

  return fullContext.trim();
}

