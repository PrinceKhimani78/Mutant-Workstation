import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tasks = await db.task.findMany({
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, projectId, assigneeId, dueDate, priority, estimatedHours, labels } = body;

    const task = await db.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Medium',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        labels: labels ? JSON.stringify(labels) : null,
        status: 'To Do',
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
