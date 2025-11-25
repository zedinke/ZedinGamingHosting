import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { TeamMemberForm } from '@/components/admin/cms/TeamMemberForm';

export default async function NewTeamMemberPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Csapat Tag</h1>
        <p className="text-gray-700">Csapat tag hozzáadása</p>
      </div>

      <TeamMemberForm locale={locale} />
    </div>
  );
}

