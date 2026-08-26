import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const timer = await db.activeTimer.findUnique({
      where: { userId: user.id },
      include: { task: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ success: true, timer });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timer' }, { status: 500 });
  }
}
