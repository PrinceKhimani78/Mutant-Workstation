import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { needsOptions } from '@/lib/customFields';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage custom fields' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data: Record<string, any> = {};
    if ('name' in body) data.name = String(body.name).trim();
    if ('order' in body) data.order = body.order;
    if ('options' in body) {
      const cleanOptions = Array.isArray(body.options) ? body.options.map((o: string) => o.trim()).filter(Boolean) : [];
      const existing = await db.customFieldDefinition.findUnique({ where: { id } });
      if (needsOptions(existing?.type || '') && cleanOptions.length === 0) {
        return NextResponse.json({ error: 'This field type needs at least one option' }, { status: 400 });
      }
      data.options = cleanOptions.length ? JSON.stringify(cleanOptions) : null;
    }

    const field = await db.customFieldDefinition.update({ where: { id }, data });
    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error('Custom field update error:', error);
    return NextResponse.json({ error: 'Failed to update custom field' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage custom fields' }, { status: 403 });
    }

    const { id } = await params;
    await db.customFieldDefinition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Custom field delete error:', error);
    return NextResponse.json({ error: 'Failed to delete custom field' }, { status: 500 });
  }
}
