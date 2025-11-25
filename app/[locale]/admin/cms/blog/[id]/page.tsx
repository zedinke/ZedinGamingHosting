import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { BlogPostForm } from '@/components/admin/cms/BlogPostForm';
import { notFound } from 'next/navigation';

export default async function EditBlogPostPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blog Bejegyzés Szerkesztése</h1>
        <p className="text-gray-600">{post.title}</p>
      </div>

      <BlogPostForm locale={locale} post={post} />
    </div>
  );
}

