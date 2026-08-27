import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch recent lead activities, recent tasks, and recent invoices
    const [activities, recentTasks, recentInvoices] = await Promise.all([
      db.leadActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { lead: { select: { name: true, company: true } } },
      }),
      db.task.findMany({
        where: { assigneeId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { project: { select: { name: true } } },
      }),
      db.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { client: { select: { company: true } } },
      }),
    ]);

    const notifications: any[] = [];

    // Format lead activities
    activities.forEach((act) => {
      notifications.push({
        id: `act-${act.id}`,
        title: act.title,
        text: `${act.lead?.name || 'Lead'} (${act.lead?.company || ''}): ${act.description || ''}`,
        time: timeAgo(act.createdAt),
        rawDate: new Date(act.createdAt).getTime(),
        type: 'lead',
      });
    });

    // Format task updates
    recentTasks.forEach((t) => {
      notifications.push({
        id: `task-${t.id}`,
        title: `Task Update: ${t.status}`,
        text: `"${t.title}" ${t.project?.name ? `in ${t.project.name}` : ''}`,
        time: timeAgo(t.updatedAt),
        rawDate: new Date(t.updatedAt).getTime(),
        type: 'task',
      });
    });

    // Format invoice updates
    recentInvoices.forEach((inv) => {
      notifications.push({
        id: `inv-${inv.id}`,
        title: `Invoice ${inv.invoiceNumber} (${inv.status})`,
        text: `${inv.client?.company || 'Client'} · ${inv.currency} ${inv.amount.toLocaleString()}`,
        time: timeAgo(inv.createdAt),
        rawDate: new Date(inv.createdAt).getTime(),
        type: 'invoice',
      });
    });

    // Sort by rawDate descending
    notifications.sort((a, b) => b.rawDate - a.rawDate);

    return NextResponse.json({ success: true, notifications: notifications.slice(0, 8) });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
