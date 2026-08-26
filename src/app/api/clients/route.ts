import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clients = await db.client.findMany({
      include: {
        projects: { select: { id: true, name: true, status: true } },
        invoices: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { company, contactPerson, email, phone, billingInformation, services, retainerValue, renewalDate, assignedPmId } = body;

    const client = await db.client.create({
      data: {
        company,
        contactPerson,
        email,
        phone,
        billingInformation,
        services,
        retainerValue: retainerValue ? parseFloat(retainerValue) : 0,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        assignedPmId: assignedPmId || user.id,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
