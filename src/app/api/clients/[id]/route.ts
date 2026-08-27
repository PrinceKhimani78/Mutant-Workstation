import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

const MONEY_FIELDS = ['currency', 'billingType', 'retainerValue', 'hourlyRate', 'weeklyHourLimit'];
const GENERAL_FIELDS = ['company', 'contactPerson', 'email', 'phone', 'billingInformation', 'services', 'source', 'status'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const owner = isOwner(user);

    if (!owner && MONEY_FIELDS.some((f) => f in body)) {
      return NextResponse.json({ error: 'Only the owner can edit billing details' }, { status: 403 });
    }

    const data: Record<string, any> = {};
    for (const key of GENERAL_FIELDS) {
      if (key in body) data[key] = body[key];
    }
    if (owner) {
      for (const key of MONEY_FIELDS) {
        if (key in body) {
          data[key] = ['retainerValue', 'hourlyRate', 'weeklyHourLimit'].includes(key) && body[key] !== null
            ? parseFloat(body[key])
            : body[key];
        }
      }
    }

    const client = await db.client.update({ where: { id }, data });
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Client update error:', error);
    const message = error?.code === 'P2002' ? 'A client with that value already exists' : 'Failed to update client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
