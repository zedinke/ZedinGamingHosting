import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TeamMemberForm } from '@/components/admin/cms/TeamMemberForm';
import { notFound } from 'next/navigation';

export default async function EditTeamMemberPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const teamMember = await prisma.teamMember.findUnique({
    where: { id },
  });

  if (!teamMember) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Csapat Tag Szerkesztése</h1>
        <p className="text-gray-600">{teamMember.name}</p>
      </div>

      <TeamMemberForm locale={locale} teamMember={teamMember} />
    </div>
  );
}

