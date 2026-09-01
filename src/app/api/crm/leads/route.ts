import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner, scrubLead } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const CRM_READ_ROLES = ['Owner', 'Sales Manager', 'Sales Executive'];
    if (!CRM_READ_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Access restricted to Sales team & Owner' }, { status: 403 });
    }

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
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { contacts: { contains: search, mode: 'insensitive' } },
              { linkedin: { contains: search, mode: 'insensitive' } },
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
    const {
      name, company, email, phone, whatsapp, website, linkedin, country, industry,
      source, contacts, estimateType, budget, hourlyRate, estimatedWeeklyHours,
      probability, proposalValue, notes, assignedSalespersonId, stageId,
    } = body;

    // Contacts can be passed as an array of decision makers or a JSON string
    let parsedContacts: any[] = [];
    let contactsJson: string | null = null;

    if (Array.isArray(contacts)) {
      parsedContacts = contacts.filter((c: any) => c && (c.name || c.designation || c.linkedin || c.email || c.phone));
      contactsJson = parsedContacts.length > 0 ? JSON.stringify(parsedContacts) : null;
    } else if (typeof contacts === 'string' && contacts.trim()) {
      try {
        parsedContacts = JSON.parse(contacts);
        contactsJson = contacts.trim();
      } catch {
        contactsJson = null;
      }
    }

    const firstContact = parsedContacts[0] || {};

    // All fields are optional: provide friendly fallbacks
    const resolvedCompany = (company || '').trim() || (firstContact.name ? `${firstContact.name}'s Company` : 'Untitled Prospect');
    const resolvedName = (name || '').trim() || firstContact.name || resolvedCompany;
    const resolvedEmail = (email || '').trim() || firstContact.email || '';
    const resolvedPhone = phone || firstContact.phone || null;
    const resolvedSource = (source || '').trim() || 'LinkedIn';

    let resolvedStageId = stageId;
    if (!resolvedStageId) {
      let defaultStage = await db.pipelineStage.findFirst({ orderBy: { order: 'asc' } });
      if (!defaultStage) {
        const STAGE_DEFS = [
          { name: 'New', color: '#2563eb', order: 0 },
          { name: 'Contacted', color: '#7c3aed', order: 1 },
          { name: 'Discovery', color: '#d97706', order: 2 },
          { name: 'Proposal Sent', color: '#fc6203', order: 3 },
          { name: 'Negotiation', color: '#db2777', order: 4 },
          { name: 'Won', color: '#059669', order: 5 },
          { name: 'Lost', color: '#6b7280', order: 6 },
        ];
        await db.pipelineStage.createMany({ data: STAGE_DEFS });
        defaultStage = await db.pipelineStage.findFirst({ orderBy: { order: 'asc' } });
      }
      resolvedStageId = defaultStage?.id || '';
    }

    const lead = await db.lead.create({
      data: {
        name: resolvedName,
        company: resolvedCompany,
        email: resolvedEmail,
        phone: resolvedPhone,
        whatsapp: whatsapp || null,
        website: website || null,
        linkedin: linkedin || null,
        country: country || null,
        industry: industry || null,
        source: resolvedSource,
        contacts: contactsJson,
        estimateType: estimateType || 'Fixed',
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        estimatedWeeklyHours: estimatedWeeklyHours ? parseFloat(estimatedWeeklyHours) : null,
        probability: probability ? parseInt(probability) : 50,
        proposalValue: proposalValue ? parseFloat(proposalValue) : null,
        notes: notes || null,
        assignedSalespersonId: assignedSalespersonId || user.id,
        stageId: resolvedStageId,
      },
      include: {
        stage: true,
        tags: true,
        customFieldValues: { include: { field: true } },
        assignedSalesperson: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    // Create activity record
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'StatusChange',
        title: 'Lead added to sheet',
        description: `Lead created by ${user.name} via ${resolvedSource}`,
        createdBy: user.name,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
