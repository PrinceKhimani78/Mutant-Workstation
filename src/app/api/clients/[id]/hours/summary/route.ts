import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Aggregates a client's logged hours (direct + via task/project chain) into
// the last 12 weeks and the last 12 months, so trends are visible instead of
// only ever seeing "this week".
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const client = await db.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    since.setHours(0, 0, 0, 0);

    const logs = await db.timeLog.findMany({
      where: {
        date: { gte: since },
        OR: [{ clientId: id }, { task: { project: { clientId: id } } }],
      },
      select: { hours: true, date: true },
      orderBy: { date: 'asc' },
    });

    // Weekly buckets — last 12 ISO (Monday-start) weeks, oldest first.
    const weekBuckets: { weekStart: string; hours: number }[] = [];
    const currentWeekStart = mondayOf(new Date());
    for (let i = 11; i >= 0; i--) {
      const ws = new Date(currentWeekStart);
      ws.setDate(ws.getDate() - i * 7);
      weekBuckets.push({ weekStart: ws.toISOString().slice(0, 10), hours: 0 });
    }
    for (const log of logs) {
      const ws = mondayOf(new Date(log.date)).toISOString().slice(0, 10);
      const bucket = weekBuckets.find((b) => b.weekStart === ws);
      if (bucket) bucket.hours += log.hours;
    }

    // Monthly buckets — last 12 calendar months, oldest first.
    const monthBuckets: { month: string; hours: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({ month: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, hours: 0 });
    }
    for (const log of logs) {
      const d = new Date(log.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthBuckets.find((b) => b.month === key);
      if (bucket) bucket.hours += log.hours;
    }

    weekBuckets.forEach((b) => (b.hours = Math.round(b.hours * 100) / 100));
    monthBuckets.forEach((b) => (b.hours = Math.round(b.hours * 100) / 100));

    return NextResponse.json({ success: true, weekly: weekBuckets, monthly: monthBuckets });
  } catch (error) {
    console.error('Client hours summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch hours summary' }, { status: 500 });
  }
}
