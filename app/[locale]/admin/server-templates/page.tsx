import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { ServerTemplates } from '@/components/admin/ServerTemplates';

export default async function ServerTemplatesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Szerver Sablonok</h1>
        <p className="text-gray-700">Szerver konfigurációs sablonok kezelése</p>
      </div>
      <ServerTemplates locale={locale} />
    </>
  );
}

