import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner, scrubClient } from '@/lib/rbac';

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

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

    const owner = isOwner(user);
    const weekStart = startOfWeek(new Date());

    const enriched = await Promise.all(
      clients.map(async (client: any) => {
        let hoursThisWeek = 0;
        if (client.billingType === 'Hourly') {
          // Hours can come from a direct log against the client (no project
          // needed — the common case for informal hourly/B2B work) or from
          // TimeLogs against tasks under one of the client's projects.
          const [direct, viaTasks] = await Promise.all([
            db.timeLog.aggregate({
              _sum: { hours: true },
              where: { date: { gte: weekStart }, clientId: client.id },
            }),
            db.timeLog.aggregate({
              _sum: { hours: true },
              where: { date: { gte: weekStart }, task: { project: { clientId: client.id } } },
            }),
          ]);
          hoursThisWeek = (direct._sum.hours || 0) + (viaTasks._sum.hours || 0);
        }
        const withHours = { ...client, hoursThisWeek };
        return scrubClient(withHours, owner);
      })
    );

    return NextResponse.json({ success: true, clients: enriched });
  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      company,
      contactPerson,
      email,
      phone,
      billingInformation,
      services,
      source,
      currency,
      billingType,
      retainerValue,
      hourlyRate,
      weeklyHourLimit,
      renewalDate,
      assignedPmId,
    } = body;

    if (!company?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Company name and billing email are required' }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        company,
        contactPerson,
        email,
        phone,
        billingInformation,
        services,
        source: source || null,
        currency: currency || 'USD',
        billingType: billingType || 'Retainer',
        retainerValue: retainerValue ? parseFloat(retainerValue) : 0,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        weeklyHourLimit: weeklyHourLimit ? parseFloat(weeklyHourLimit) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        assignedPmId: assignedPmId || user.id,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Client creation error:', error);
    const message = error?.code === 'P2002' ? 'A client with that value already exists' : 'Failed to create client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
