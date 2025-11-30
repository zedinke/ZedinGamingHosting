import { prisma } from './prisma';

export async function getEnabledOAuthProviders(): Promise<string[]> {
  try {
    const oauthSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['oauth_google_enabled', 'oauth_discord_enabled', 'oauth_credentials_enabled'],
        },
      },
    });

    const enabledProviders: string[] = [];
    
    oauthSettings.forEach((setting) => {
      if (setting.value === 'true') {
        if (setting.key === 'oauth_google_enabled') {
          enabledProviders.push('google');
        } else if (setting.key === 'oauth_discord_enabled') {
          enabledProviders.push('discord');
        } else if (setting.key === 'oauth_credentials_enabled') {
          enabledProviders.push('credentials');
        }
      }
    });

    // Ha nincs beállítás, alapértelmezetten minden provider engedélyezve
    if (enabledProviders.length === 0) {
      return ['google', 'discord', 'credentials'];
    }

    return enabledProviders;
  } catch (error) {
    console.error('Error fetching OAuth providers:', error);
    // Hiba esetén alapértelmezett: minden provider engedélyezve
    return ['google', 'discord', 'credentials'];
  }
}

