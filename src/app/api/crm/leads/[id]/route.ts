import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner, scrubLead } from '@/lib/rbac';

let schemaChecked = false;
async function ensureLeadSchema() {
  if (schemaChecked) return;
  try {
    // Postgres / Supabase
    await db.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "contacts" TEXT;`);
    schemaChecked = true;
  } catch {
    try {
      await db.$executeRawUnsafe(`ALTER TABLE Lead ADD COLUMN contacts TEXT;`);
      schemaChecked = true;
    } catch {
      schemaChecked = true;
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureLeadSchema();

    const { id } = await params;
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        stage: true,
        tags: true,
        customFieldValues: { include: { field: true } },
        assignedSalesperson: { select: { id: true, name: true, avatarUrl: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({ success: true, lead: scrubLead(lead, isOwner(user)) });
  } catch (error: any) {
    console.error('Lead fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureLeadSchema();

    const { id } = await params;
    const body = await request.json();

    const existingLead = await db.lead.findUnique({ where: { id }, include: { stage: true } });
    if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const allowed = [
      'name', 'company', 'email', 'phone', 'whatsapp', 'website', 'linkedin',
      'country', 'industry', 'source', 'contacts', 'estimateType', 'budget', 'hourlyRate',
      'estimatedWeeklyHours', 'probability', 'proposalValue',
      'notes', 'assignedSalespersonId', 'stageId', 'isGhosted', 'expectedCloseDate',
    ];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === 'contacts') {
          if (Array.isArray(body.contacts)) {
            const filtered = body.contacts.filter((c: any) => c && (c.name || c.designation || c.linkedin || c.email || c.phone));
            data.contacts = filtered.length > 0 ? JSON.stringify(filtered) : null;
          } else if (typeof body.contacts === 'string') {
            data.contacts = body.contacts.trim() || null;
          } else {
            data.contacts = null;
          }
        } else if (['budget', 'proposalValue', 'hourlyRate', 'estimatedWeeklyHours'].includes(key)) {
          data[key] = body[key] === '' || body[key] === null ? null : parseFloat(body[key]);
        } else if (key === 'probability') {
          data[key] = body[key] === '' || body[key] === null ? null : parseInt(body[key]);
        } else if (key === 'expectedCloseDate') {
          data[key] = body[key] ? new Date(body[key]) : null;
        } else {
          data[key] = body[key];
        }
      }
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data,
      include: {
        stage: true,
        tags: true,
        customFieldValues: { include: { field: true } },
        assignedSalesperson: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (data.stageId && data.stageId !== existingLead.stageId) {
      const newStage = await db.pipelineStage.findUnique({ where: { id: data.stageId } });
      await db.leadActivity.create({
        data: {
          leadId: id,
          type: 'StatusChange',
          title: `Moved to ${newStage?.name || 'a new stage'}`,
          description: `Changed from ${existingLead.stage.name} to ${newStage?.name} by ${user.name}`,
          createdBy: user.name,
        },
      });
    }

    return NextResponse.json({ success: true, lead: scrubLead(updatedLead, isOwner(user)) });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await db.lead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
