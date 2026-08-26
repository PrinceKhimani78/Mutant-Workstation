import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage pipeline stages' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const allowed = ['name', 'color', 'order'];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) data[key] = key === 'name' ? String(body[key]).trim() : body[key];
    }

    const stage = await db.pipelineStage.update({ where: { id }, data });
    return NextResponse.json({ success: true, stage });
  } catch (error) {
    console.error('Stage update error:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage pipeline stages' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reassignToId = searchParams.get('reassignToId');

    const stageCount = await db.pipelineStage.count();
    if (stageCount <= 1) {
      return NextResponse.json({ error: 'You need at least one pipeline stage' }, { status: 400 });
    }

    const leadCount = await db.lead.count({ where: { stageId: id } });

    if (leadCount > 0) {
      if (!reassignToId) {
        return NextResponse.json(
          { error: 'This stage still has leads in it', leadCount, needsReassign: true },
          { status: 409 }
        );
      }
      if (reassignToId === id) {
        return NextResponse.json({ error: 'Pick a different stage to move these leads to' }, { status: 400 });
      }
      await db.lead.updateMany({ where: { stageId: id }, data: { stageId: reassignToId } });
    }

    await db.pipelineStage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stage delete error:', error);
    return NextResponse.json({ error: 'Failed to delete stage' }, { status: 500 });
  }
}
