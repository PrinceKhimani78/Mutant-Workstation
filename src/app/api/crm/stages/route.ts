import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stages = await db.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { leads: true } } },
    });

    return NextResponse.json({ success: true, stages });
  } catch (error) {
    console.error('Stages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage pipeline stages' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Stage name is required' }, { status: 400 });
    }

    const maxOrder = await db.pipelineStage.aggregate({ _max: { order: true } });
    const stage = await db.pipelineStage.create({
      data: {
        name: name.trim(),
        color: color || '#fc6203',
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, stage });
  } catch (error) {
    console.error('Stage creation error:', error);
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 });
  }
}
