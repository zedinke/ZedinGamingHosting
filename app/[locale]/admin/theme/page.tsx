import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ThemeEditor } from '@/components/admin/ThemeEditor';

export default async function AdminThemePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  // Get theme settings
  const themeSettings = await prisma.themeSetting.findMany();
  const themeMap: Record<string, any> = {};
  themeSettings.forEach((setting) => {
    themeMap[setting.key] = setting.value;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Téma Szerkesztő</h1>
        <p className="text-gray-700">Weboldal színek, betűtípusok és stílusok testreszabása</p>
      </div>

      <ThemeEditor themeSettings={themeMap} locale={locale} />
    </div>
  );
}

