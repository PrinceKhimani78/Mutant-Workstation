import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const timer = await db.activeTimer.findUnique({ where: { userId: user.id } });
    if (!timer) return NextResponse.json({ error: 'No running timer' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const description = body?.description || null;

    const elapsedMs = Date.now() - new Date(timer.startedAt).getTime();
    const hours = Math.max(elapsedMs / (1000 * 60 * 60), 1 / 60); // floor at 1 minute

    const [log] = await db.$transaction([
      db.timeLog.create({
        data: {
          taskId: timer.taskId,
          userId: user.id,
          hours: Math.round(hours * 100) / 100,
          description,
          isBillable: true,
        },
      }),
      db.activeTimer.delete({ where: { userId: user.id } }),
      db.task.update({
        where: { id: timer.taskId },
        data: { timeLogged: { increment: Math.round(hours * 100) / 100 } },
      }),
    ]);

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Timer stop error:', error);
    return NextResponse.json({ error: 'Failed to stop timer' }, { status: 500 });
  }
}
