import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function requireAuth(locale: string = 'hu') {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/admin`)}`);
  }
  
  return session;
}

export async function requireRole(role: UserRole, locale: string = 'hu') {
  const session = await requireAuth(locale);
  
  const userRole = (session.user as any)?.role;
  
  if (!userRole || userRole !== role) {
    redirect(`/${locale}/dashboard?error=unauthorized`);
  }
  
  return session;
}

export async function requireAdmin(locale: string = 'hu') {
  try {
    return await requireRole(UserRole.ADMIN, locale);
  } catch (error) {
    // Ha redirect történt, akkor az már megtörtént
    // Ha más hiba van, dobjuk tovább
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error; // Next.js redirect error, dobjuk tovább
    }
    redirect(`/${locale}/dashboard?error=unauthorized`);
  }
}

