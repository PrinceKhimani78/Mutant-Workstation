import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owner = isOwner(user);

    const tasks = await db.task.findMany({
      // Owner/CEO sees everything. Everyone else only sees what's assigned to
      // them or what they created themselves.
      where: owner
        ? {}
        : { OR: [{ assigneeId: user.id }, { createdById: user.id }] },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, projectId, assigneeId, dueDate, priority, estimatedHours, labels } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        projectId: projectId || null,
        assigneeId: assigneeId || user.id,
        createdById: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Medium',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        labels: labels ? JSON.stringify(labels) : null,
        status: 'To Do',
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
