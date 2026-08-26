import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { FIELD_TYPES, needsOptions } from '@/lib/customFields';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fields = await db.customFieldDefinition.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ success: true, fields });
  } catch (error) {
    console.error('Custom fields fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user.role, 'CRM_WRITE')) {
      return NextResponse.json({ error: 'You do not have permission to manage custom fields' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, options } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: 'Field name is required' }, { status: 400 });
    if (!FIELD_TYPES.some((t) => t.value === type)) {
      return NextResponse.json({ error: 'Invalid field type' }, { status: 400 });
    }
    const cleanOptions = Array.isArray(options) ? options.map((o: string) => o.trim()).filter(Boolean) : [];
    if (needsOptions(type) && cleanOptions.length === 0) {
      return NextResponse.json({ error: 'This field type needs at least one option' }, { status: 400 });
    }

    const maxOrder = await db.customFieldDefinition.aggregate({ _max: { order: true } });
    const field = await db.customFieldDefinition.create({
      data: {
        name: name.trim(),
        type,
        options: cleanOptions.length ? JSON.stringify(cleanOptions) : null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error('Custom field creation error:', error);
    return NextResponse.json({ error: 'Failed to create custom field' }, { status: 500 });
  }
}
