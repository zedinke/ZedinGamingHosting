import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email és jelszó megadása kötelező');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Hibás email cím vagy jelszó');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Hibás email cím vagy jelszó');
        }

        if (!user.emailVerified) {
          throw new Error('Kérjük, erősítsd meg az email címedet');
        }

        // Karbantartási mód ellenőrzése
        const { isMaintenanceMode } = await import('./maintenance');
        const maintenance = await isMaintenanceMode();
        
        if (maintenance && user.role !== 'ADMIN') {
          throw new Error('Jelenleg karbantartás alatt vagyunk. Csak adminisztrátorok jelentkezhetnek be.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // OAuth bejelentkezés esetén automatikusan ellenőrizzük az email verifikációt
      if (account?.provider === 'google' || account?.provider === 'discord') {
        // OAuth esetén automatikusan verified-re állítjuk az email-t
        if (user.email) {
          await prisma.user.updateMany({
            where: { email: user.email },
            data: { emailVerified: new Date() },
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Ha a URL relatív, hozzáadjuk a baseUrl-t
      if (url.startsWith('/')) {
        // Ha a URL nem tartalmaz locale-t, hozzáadjuk az alapértelmezettet
        if (!url.match(/^\/(hu|en)\//)) {
          return `${baseUrl}/hu${url}`;
        }
        return `${baseUrl}${url}`;
      }
      // Ha a URL teljes URL, ellenőrizzük, hogy a saját domain-ünk
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Külső URL esetén a baseUrl-re irányítunk
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        // token.sub vagy token.id tartalmazza az ID-t
        (session.user as any).id = (token as any).id || token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // A /login oldal átirányít a megfelelő locale-re
    signOut: '/',
    error: '/auth/error', // Az /auth/error oldal átirányít a megfelelő locale-re
    verifyRequest: '/hu/auth/verify-email',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 nap (biztonsági okokból csökkentve 30 napról)
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

