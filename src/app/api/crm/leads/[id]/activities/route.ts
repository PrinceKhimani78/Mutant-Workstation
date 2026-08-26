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
    const body = await request.json();
    const { type, title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'A short title is required' }, { status: 400 });
    }

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const activity = await db.leadActivity.create({
      data: {
        leadId: id,
        type: type || 'Note',
        title: title.trim(),
        description: description || null,
        createdBy: user.name,
      },
    });

    // Logging real contact resets the ghosted flag — the whole point of ghosting
    // is "gone quiet"; a fresh call/email/meeting means they're not.
    if (['Call', 'Email', 'Meeting'].includes(activity.type) && lead.isGhosted) {
      await db.lead.update({ where: { id }, data: { isGhosted: false, lastContactedAt: new Date() } });
    } else {
      await db.lead.update({ where: { id }, data: { lastContactedAt: new Date() } });
    }

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('Activity creation error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
