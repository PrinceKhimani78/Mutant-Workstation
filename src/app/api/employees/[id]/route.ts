import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isOwner(user)) return NextResponse.json({ error: 'Only the owner can edit team members' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const allowed = ['name', 'role', 'department', 'status', 'phone'];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, status: true },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Employee update error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isOwner(user)) return NextResponse.json({ error: 'Only the owner can remove team members' }, { status: 403 });

    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
    }

    // Deactivate rather than hard-delete — tasks/leads/comments reference this user.
    const updated = await db.user.update({
      where: { id },
      data: { status: 'Inactive' },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error('Employee delete error:', error);
    return NextResponse.json({ error: 'Failed to remove employee' }, { status: 500 });
  }
}
