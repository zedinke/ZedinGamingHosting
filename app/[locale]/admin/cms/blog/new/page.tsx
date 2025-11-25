import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BlogPostForm } from '@/components/admin/cms/BlogPostForm';

export default async function NewBlogPostPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const session = await getServerSession(authOptions);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új Blog Bejegyzés</h1>
        <p className="text-gray-600">Blog bejegyzés hozzáadása</p>
      </div>

      <BlogPostForm locale={locale} authorId={(session?.user as any)?.id} />
    </div>
  );
}

