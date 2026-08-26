import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await request.json();
    if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Only one running timer per user — starting a new one replaces any existing
    // one (its elapsed time is just dropped, matching a "switch task" click).
    const timer = await db.activeTimer.upsert({
      where: { userId: user.id },
      update: { taskId, startedAt: new Date() },
      create: { userId: user.id, taskId },
      include: { task: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ success: true, timer });
  } catch (error) {
    console.error('Timer start error:', error);
    return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 });
  }
}
