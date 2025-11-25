// DEBUG VERSION - Minimal dashboard to isolate the issue
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPageDebug({
  params: { locale },
}: {
  params: { locale: string };
}) {
  try {
    console.log('Dashboard debug: Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('Dashboard debug: Session retrieved', !!session);
    
    if (!session || !session.user) {
      console.log('Dashboard debug: No session, redirecting');
      redirect(`/${locale}/login`);
    }

    console.log('Dashboard debug: User email:', session.user.email);
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard Debug</h1>
        <p>Session: {session ? 'OK' : 'Missing'}</p>
        <p>User: {session?.user?.email || 'N/A'}</p>
        <p>Locale: {locale}</p>
      </div>
    );
  } catch (error: any) {
    console.error('Dashboard debug error:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-red-600">{error?.message || 'Unknown error'}</p>
        <pre className="mt-4 text-xs bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }
}

