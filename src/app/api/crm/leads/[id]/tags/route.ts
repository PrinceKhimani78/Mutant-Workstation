import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { tagId } = await request.json();
    if (!tagId) return NextResponse.json({ error: 'tagId is required' }, { status: 400 });

    const lead = await db.lead.update({
      where: { id },
      data: { tags: { connect: { id: tagId } } },
      include: { tags: true },
    });

    return NextResponse.json({ success: true, tags: lead.tags });
  } catch (error) {
    console.error('Tag assign error:', error);
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    if (!tagId) return NextResponse.json({ error: 'tagId is required' }, { status: 400 });

    const lead = await db.lead.update({
      where: { id },
      data: { tags: { disconnect: { id: tagId } } },
      include: { tags: true },
    });

    return NextResponse.json({ success: true, tags: lead.tags });
  } catch (error) {
    console.error('Tag remove error:', error);
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
  }
}
