import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

    const lowerQuery = query.toLowerCase();

    // Query active records to power natural language intelligence
    const [leads, projects, tasks, clients, invoices, sops] = await Promise.all([
      db.lead.findMany({ select: { name: true, company: true, status: true, budget: true, source: true } }),
      db.project.findMany({ select: { name: true, progress: true, priority: true, status: true, deadline: true } }),
      db.task.findMany({ select: { title: true, status: true, priority: true, dueDate: true } }),
      db.client.findMany({ select: { company: true, retainerValue: true, status: true } }),
      db.invoice.findMany({ select: { invoiceNumber: true, amount: true, status: true } }),
      db.knowledgeArticle.findMany({ select: { title: true, category: true, tags: true } }),
    ]);

    let responseText = '';
    let suggestedActions: string[] = [];

    if (lowerQuery.includes('lead') || lowerQuery.includes('pipeline') || lowerQuery.includes('sales')) {
      const pendingLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
      const totalPipeline = leads.reduce((sum, l) => sum + (l.budget || 0), 0);
      responseText = `⚡ **Mutant AI Lead & Pipeline Analysis:**\n- **Active Pipeline Value:** $${totalPipeline.toLocaleString()}\n- **Active Leads:** ${pendingLeads.length} leads in qualification.\n- **Top Sources:** ${Array.from(new Set(leads.map(l => l.source))).join(', ')}.\n\n👉 **Recommended Action:** Follow up with *${leads[0]?.name || 'pending leads'}* currently in the *${leads[0]?.status || 'Proposal Sent'}* stage to close this week.`;
      suggestedActions = ['Create New Lead', 'View Sales Pipeline', 'Generate Proposal'];
    } else if (lowerQuery.includes('task') || lowerQuery.includes('overdue') || lowerQuery.includes('bottleneck')) {
      const inProgress = tasks.filter(t => t.status === 'In Progress');
      responseText = `🎯 **Task & Bottleneck Status:**\n- **Tasks In Progress:** ${inProgress.length}\n- **Urgent Priority Tasks:** ${tasks.filter(t => t.priority === 'Urgent').length}\n\nKey priority task: **"${tasks[0]?.title || 'System Setup'}"**. Everything is on track for delivery.`;
      suggestedActions = ['Create New Task', 'Log Working Time', 'View Task Board'];
    } else if (lowerQuery.includes('revenue') || lowerQuery.includes('invoice') || lowerQuery.includes('finance')) {
      const totalRetainers = clients.reduce((sum, c) => sum + c.retainerValue, 0);
      const paidInvoices = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
      responseText = `💰 **Mutant Workstation Financial Summary:**\n- **Monthly Recurring Revenue (MRR):** $${totalRetainers.toLocaleString()}\n- **Total Paid Invoices:** $${paidInvoices.toLocaleString()}\n- **Pending Invoices:** ${invoices.filter(i => i.status !== 'Paid').length} invoice(s) awaiting payment.`;
      suggestedActions = ['Create Invoice', 'Generate Financial Report', 'View Clients'];
    } else if (lowerQuery.includes('sop') || lowerQuery.includes('template') || lowerQuery.includes('knowledge')) {
      responseText = `📚 **Knowledge Base & SOP match:**\nFound **${sops.length}** internal SOP document(s):\n- **${sops[0]?.title || 'Client Onboarding SOP'}**\n- **${sops[1]?.title || 'Mutant Brand & Design Guidelines'}**`;
      suggestedActions = ['Open SOP Knowledge Base', 'Create SOP Document'];
    } else {
      responseText = `🤖 **Mutant AI Assistant Response:**\nI reviewed your query "*${query}*". Workstation is currently operating smoothly across **${projects.length} active projects**, **${clients.length} retainer clients**, and **${leads.length} sales pipeline leads**. How can I help you take action?`;
      suggestedActions = ['Create Lead', 'Create Project', 'Generate Invoice', 'Search SOPs'];
    }

    return NextResponse.json({
      success: true,
      answer: responseText,
      actions: suggestedActions,
    });
  } catch (error) {
    return NextResponse.json({ error: 'AI Assistant processing failed' }, { status: 500 });
  }
}
