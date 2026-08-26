import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';
import { serializeValue } from '@/lib/customFields';

// Bulk upsert: { values: [{ fieldId, value }] }. `value` arrives already shaped
// for the field's type (string, number, boolean, or string[]) — we just serialize it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const values: { fieldId: string; value: any }[] = body.values || [];

    if (!isOwner(user)) {
      const monetaryFieldIds = new Set(
        (await db.customFieldDefinition.findMany({ where: { type: 'monetary' }, select: { id: true } })).map((f) => f.id)
      );
      if (values.some((v) => monetaryFieldIds.has(v.fieldId))) {
        return NextResponse.json({ error: 'Only the owner can set monetary field values' }, { status: 403 });
      }
    }

    const results = await db.$transaction(
      values.map(({ fieldId, value }) =>
        db.customFieldValue.upsert({
          where: { fieldId_leadId: { fieldId, leadId: id } },
          update: { value: serializeValue(value) },
          create: { fieldId, leadId: id, value: serializeValue(value) },
        })
      )
    );

    return NextResponse.json({ success: true, values: results });
  } catch (error) {
    console.error('Custom field value save error:', error);
    return NextResponse.json({ error: 'Failed to save field values' }, { status: 500 });
  }
}
