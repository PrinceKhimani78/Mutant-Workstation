import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner, scrubLead } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const stageId = searchParams.get('stageId') || '';
    const source = searchParams.get('source') || '';
    const ghosted = searchParams.get('ghosted') || '';

    const leads = await db.lead.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search } },
              { company: { contains: search } },
              { email: { contains: search } },
            ],
          } : {},
          stageId ? { stageId } : {},
          source ? { source } : {},
          ghosted ? { isGhosted: ghosted === 'true' } : {},
        ],
      },
      include: {
        stage: true,
        tags: true,
        customFieldValues: { include: { field: true } },
        assignedSalesperson: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const owner = isOwner(user);
    return NextResponse.json({ success: true, leads: leads.map((l: any) => scrubLead(l, owner)) });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, company, email, phone, whatsapp, website, linkedin, country, industry, source, budget, probability, proposalValue, notes, assignedSalespersonId, stageId } = body;

    if (!name || !company || !email || !source) {
      return NextResponse.json({ error: 'Name, company, email, and source are required' }, { status: 400 });
    }

    let resolvedStageId = stageId;
    if (!resolvedStageId) {
      const defaultStage = await db.pipelineStage.findFirst({ orderBy: { order: 'asc' } });
      if (!defaultStage) {
        return NextResponse.json({ error: 'No pipeline stages exist yet — create one first' }, { status: 400 });
      }
      resolvedStageId = defaultStage.id;
    }

    const lead = await db.lead.create({
      data: {
        name,
        company,
        email,
        phone,
        whatsapp,
        website,
        linkedin,
        country,
        industry,
        source,
        budget: budget ? parseFloat(budget) : null,
        probability: probability ? parseInt(probability) : 50,
        proposalValue: proposalValue ? parseFloat(proposalValue) : null,
        notes,
        assignedSalespersonId: assignedSalespersonId || user.id,
        stageId: resolvedStageId,
      },
      include: { stage: true },
    });

    // Create activity record
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'StatusChange',
        title: 'Lead created',
        description: `Lead created by ${user.name} via ${source}`,
        createdBy: user.name,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
