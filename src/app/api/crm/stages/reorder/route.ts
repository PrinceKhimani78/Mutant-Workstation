import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// Body: { orderedIds: string[] } — the full stage id list in its new order.
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage pipeline stages' }, { status: 403 });
    }

    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 });
    }

    await db.$transaction(
      orderedIds.map((id: string, index: number) =>
        db.pipelineStage.update({ where: { id }, data: { order: index } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stage reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder stages' }, { status: 500 });
  }
}
