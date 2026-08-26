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

export async function POST(
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
    const { text } = body;
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: { taskId: id, authorId: user.id, text: text.trim() },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
