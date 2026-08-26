import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner, scrubProject } from '@/lib/rbac';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projects = await db.project.findMany({
      include: {
        client: { select: { id: true, company: true } },
        tasks: { select: { id: true, status: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const owner = isOwner(user);
    return NextResponse.json({ success: true, projects: projects.map((p: any) => scrubProject(p, owner)) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, clientId, service, department, budget, deadline, priority } = body;

    const project = await db.project.create({
      data: {
        name,
        description,
        clientId,
        service,
        department,
        budget: budget ? parseFloat(budget) : 0,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'Medium',
        status: 'In Progress',
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
