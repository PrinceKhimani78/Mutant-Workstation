import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tags = await db.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { leads: true } } },
    });

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Tags fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage tags' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const existing = await db.tag.findUnique({ where: { name: name.trim() } });
    if (existing) return NextResponse.json({ success: true, tag: existing });

    const tag = await db.tag.create({
      data: { name: name.trim(), color: color || '#6b7280' },
    });

    return NextResponse.json({ success: true, tag });
  } catch (error) {
    console.error('Tag creation error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
