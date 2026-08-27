import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const articles = await db.knowledgeArticle.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { content: { contains: search, mode: 'insensitive' } },
                  { tags: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, category, content, tags } = body;

    if (!title?.trim() || !category?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title, category, and content are required' }, { status: 400 });
    }

    const article = await db.knowledgeArticle.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        content: content.trim(),
        tags: tags || null,
        author: user.name,
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error('Knowledge creation error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
