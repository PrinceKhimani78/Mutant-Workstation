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
    if (!isOwner(user)) return NextResponse.json({ error: 'Only the owner can edit billing details' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const allowed = ['currency', 'billingType', 'retainerValue', 'hourlyRate', 'weeklyHourLimit', 'status'];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) {
        data[key] = ['retainerValue', 'hourlyRate', 'weeklyHourLimit'].includes(key) && body[key] !== null
          ? parseFloat(body[key])
          : body[key];
      }
    }

    const client = await db.client.update({ where: { id }, data });
    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
