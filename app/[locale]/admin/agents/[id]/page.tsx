import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AgentDetail } from '@/components/admin/AgentDetail';

export default async function AgentDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      machine: {
        select: {
          id: true,
          name: true,
          ipAddress: true,
          status: true,
          sshPort: true,
          sshUser: true,
          sshKeyPath: true,
        },
      },
      _count: {
        select: {
          servers: true,
          tasks: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const servers = await prisma.server.findMany({
    where: { agentId: agent.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const recentTasks = await prisma.task.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      server: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <AgentDetail
      agent={agent}
      servers={servers}
      recentTasks={recentTasks}
      locale={locale}
    />
  );
}

