import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoices = await db.invoice.findMany({
      include: {
        client: { select: { id: true, company: true, contactPerson: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { clientId, invoiceNumber, currency, amount, status, issueDate, dueDate } = body;

    if (!clientId || !amount) {
      return NextResponse.json({ error: 'Client and amount are required' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid positive amount' }, { status: 400 });
    }

    // Generate invoice number if not provided
    let num = invoiceNumber;
    if (!num || !num.trim()) {
      const count = await db.invoice.count();
      num = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: num.trim(),
        clientId,
        currency: currency || 'USD',
        amount: parsedAmount,
        status: status || 'Sent',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      include: {
        client: { select: { id: true, company: true } },
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Invoice create error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
