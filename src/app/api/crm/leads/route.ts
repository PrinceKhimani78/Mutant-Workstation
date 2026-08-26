import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';

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
          status ? { status } : {},
          source ? { source } : {},
        ],
      },
      include: {
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

    return NextResponse.json({ success: true, leads });
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
    const { name, company, email, phone, whatsapp, website, linkedin, country, industry, source, budget, probability, proposalValue, notes, assignedSalespersonId } = body;

    if (!name || !company || !email || !source) {
      return NextResponse.json({ error: 'Name, company, email, and source are required' }, { status: 400 });
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
        status: 'New',
      },
    });

    // Create activity record
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'StatusChange',
        title: 'Lead Created',
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
