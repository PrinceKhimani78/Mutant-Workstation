import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, amount, currency } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (amount) updateData.amount = parseFloat(amount);
    if (currency) updateData.currency = currency;

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { client: { select: { company: true } } },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
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
    await db.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice delete error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
