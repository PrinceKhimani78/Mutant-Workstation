import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

async function canAccessTask(userId: string, owner: boolean, taskId: string) {
  if (owner) return true;
  const task = await db.task.findUnique({ where: { id: taskId }, select: { assigneeId: true, createdById: true } });
  if (!task) return false;
  return task.assigneeId === userId || task.createdById === userId;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const owner = isOwner(user);
    if (!(await canAccessTask(user.id, owner, id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
        timeLogs: {
          orderBy: { date: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const owner = isOwner(user);
    if (!(await canAccessTask(user.id, owner, id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ['title', 'description', 'status', 'priority', 'assigneeId', 'dueDate', 'estimatedHours'];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === 'dueDate') data[key] = body[key] ? new Date(body[key]) : null;
        else if (key === 'estimatedHours') data[key] = body[key] !== null ? parseFloat(body[key]) : null;
        else data[key] = body[key];
      }
    }

    const task = await db.task.update({ where: { id }, data });
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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
    const owner = isOwner(user);
    if (!(await canAccessTask(user.id, owner, id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task delete error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
