import { requireAdmin } from '@/lib/auth-helpers';
import { AIChatPanel } from '@/components/admin/AIChatPanel';

export default async function AdminAIChatPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);

  return (
    <div className="h-[calc(100vh-8rem)] -m-6 lg:-m-8">
      <AIChatPanel />
    </div>
  );
}










