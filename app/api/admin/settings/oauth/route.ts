import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // OAuth beállítások lekérése
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

    return NextResponse.json({ enabledProviders });
  } catch (error) {
    console.error('Error fetching OAuth settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabledProviders } = body;

    if (!Array.isArray(enabledProviders)) {
      return NextResponse.json(
        { error: 'enabledProviders must be an array' },
        { status: 400 }
      );
    }

    // OAuth beállítások mentése
    const providers = ['google', 'discord', 'credentials'];
    
    for (const provider of providers) {
      const key = `oauth_${provider}_enabled`;
      const isEnabled = enabledProviders.includes(provider);

      await prisma.setting.upsert({
        where: { key },
        update: {
          value: isEnabled ? 'true' : 'false',
          category: 'auth',
          updatedAt: new Date(),
        },
        create: {
          key,
          value: isEnabled ? 'true' : 'false',
          category: 'auth',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving OAuth settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

