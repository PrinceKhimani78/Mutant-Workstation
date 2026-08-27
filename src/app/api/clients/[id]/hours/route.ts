import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Direct hour logging against a client — no project/task required. Meant for
// hourly/B2B clients where the work isn't tracked through a formal project.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { hours, date, description } = body;

    const parsedHours = parseFloat(hours);
    if (!parsedHours || parsedHours <= 0) {
      return NextResponse.json({ error: 'Enter a positive number of hours' }, { status: 400 });
    }

    const client = await db.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const log = await db.timeLog.create({
      data: {
        clientId: id,
        userId: user.id,
        hours: parsedHours,
        date: date ? new Date(date) : new Date(),
        description: description || null,
        isBillable: true,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Client hour log error:', error);
    return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
  }
}

// Recent direct hour logs for this client (for a small history list in the UI).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const logs = await db.timeLog.findMany({
      where: { clientId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Client hour logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch hour logs' }, { status: 500 });
  }
}
