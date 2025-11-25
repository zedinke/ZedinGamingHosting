import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const blogPostSchema = z.object({
  slug: z.string().min(1, 'Slug megadása kötelező'),
  title: z.string().min(1, 'Cím megadása kötelező'),
  excerpt: z.string().optional(),
  content: z.any(),
  coverImage: z.string().url().optional().or(z.literal('')),
  authorId: z.string().min(1, 'Szerző megadása kötelező'),
  isPublished: z.boolean(),
  publishedAt: z.string().optional(),
  locale: z.enum(['hu', 'en']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a blog bejegyzések lekérése során' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = blogPostSchema.parse(body);

    // Check if slug+locale combination already exists
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug: data.slug,
        locale: data.locale,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik ezen a nyelven' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || null,
        content: data.content,
        coverImage: data.coverImage || null,
        authorId: data.authorId,
        isPublished: data.isPublished,
        publishedAt: data.isPublished && data.publishedAt ? new Date(data.publishedAt) : null,
        locale: data.locale,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Blog post create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a blog bejegyzés létrehozása során' },
      { status: 500 }
    );
  }
}

