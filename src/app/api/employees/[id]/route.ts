import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
    const { name, email, role, department, status, phone, password } = body;

    const data: Record<string, any> = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (department !== undefined) data.department = department;
    if (status) data.status = status;
    if (phone !== undefined) data.phone = phone;

    // Email update check
    if (email) {
      const existing = await db.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Another user is already using this email address' }, { status: 409 });
      }
      data.email = email;
    }

    // Password reset check
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, status: true, phone: true },
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
      return NextResponse.json({ error: "You can't delete your own owner account" }, { status: 400 });
    }

    try {
      // Try hard delete first
      await db.user.delete({ where: { id } });
    } catch {
      // If foreign keys exist, deactivate account
      await db.user.update({
        where: { id },
        data: { status: 'Inactive' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Employee delete error:', error);
    return NextResponse.json({ error: 'Failed to remove employee' }, { status: 500 });
  }
}
