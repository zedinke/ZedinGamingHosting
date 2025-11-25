import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TeamMemberManagement } from '@/components/admin/cms/TeamMemberManagement';

export default async function AdminTeamPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const teamMembers = await prisma.teamMember.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Csapat Tagok</h1>
          <p className="text-gray-700">Team member profilok kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/team/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Új csapat tag
        </a>
      </div>

      <TeamMemberManagement teamMembers={teamMembers} locale={locale} />
    </div>
  );
}

