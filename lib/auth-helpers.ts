import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireRole(role: UserRole, locale: string = 'hu') {
  const session = await requireAuth();
  
  if ((session.user as any).role !== role) {
    redirect(`/${locale}/dashboard`);
  }
  
  return session;
}

export async function requireAdmin(locale: string = 'hu') {
  return requireRole(UserRole.ADMIN, locale);
}

