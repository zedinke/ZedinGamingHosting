'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const blogPostSchema = z.object({
  slug: z.string().min(1, 'Slug megadása kötelező'),
  title: z.string().min(1, 'Cím megadása kötelező'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Tartalom megadása kötelező'),
  coverImage: z.string().url().optional().or(z.literal('')),
  authorId: z.string().min(1, 'Szerző megadása kötelező'),
  isPublished: z.boolean(),
  publishedAt: z.string().optional(),
  locale: z.enum(['hu', 'en']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: any;
  coverImage: string | null;
  authorId: string;
  isPublished: boolean;
  publishedAt: Date | null;
  locale: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface BlogPostFormProps {
  locale: string;
  post?: BlogPost;
  authorId?: string;
}

export function BlogPostForm({ locale, post, authorId }: BlogPostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getContentString = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      if (content.blocks && Array.isArray(content.blocks)) {
        return content.blocks.map((block: any) => block.text || '').join('\n\n');
      }
      return JSON.stringify(content, null, 2);
    }
    return '';
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: post
      ? {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || '',
          content: getContentString(post.content),
          coverImage: post.coverImage || '',
          authorId: post.authorId,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt
            ? new Date(post.publishedAt).toISOString().split('T')[0]
            : '',
          locale: post.locale as 'hu' | 'en',
          seoTitle: post.seoTitle || '',
          seoDescription: post.seoDescription || '',
        }
      : {
          slug: '',
          title: '',
          excerpt: '',
          content: '',
          coverImage: '',
          authorId: authorId || '',
          isPublished: false,
          publishedAt: '',
          locale: 'hu',
          seoTitle: '',
          seoDescription: '',
        },
  });

  const onSubmit = async (data: BlogPostFormData) => {
    setIsLoading(true);
    try {
      const contentJson = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.content,
              },
            ],
          },
        ],
      };

      const payload = {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || null,
        content: contentJson,
        coverImage: data.coverImage || null,
        authorId: data.authorId,
        isPublished: data.isPublished,
        publishedAt: data.isPublished && data.publishedAt ? data.publishedAt : null,
        locale: data.locale,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      };

      const url = post
        ? `/api/admin/cms/blog/${post.id}`
        : '/api/admin/cms/blog';
      const method = post ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success(post ? 'Blog bejegyzés frissítve' : 'Blog bejegyzés létrehozva');
      router.push(`/${locale}/admin/cms/blog`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <input
              {...register('slug')}
              type="text"
              placeholder="pl: my-first-post"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cím *</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rövid leírás</label>
            <textarea
              {...register('excerpt')}
              rows={3}
              placeholder="Rövid összefoglaló..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Borítókép URL</label>
            <input
              {...register('coverImage')}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {watch('coverImage') && (
              <img
                src={watch('coverImage')}
                alt="Cover preview"
                className="mt-2 w-full max-w-md rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tartalom *</label>
            <textarea
              {...register('content')}
              rows={15}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="Blog bejegyzés tartalma..."
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">SEO Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">SEO Cím</label>
            <input
              {...register('seoTitle')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Leírás</label>
            <textarea
              {...register('seoDescription')}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nyelv *</label>
            <select
              {...register('locale')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="hu">Magyar</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Közzététel dátuma</label>
            <input
              {...register('publishedAt')}
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('isPublished')}
              type="checkbox"
              id="isPublished"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Közzétéve
            </label>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {post ? 'Frissítés' : 'Létrehozás'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          size="lg"
        >
          Mégse
        </Button>
      </div>
    </form>
  );
}

