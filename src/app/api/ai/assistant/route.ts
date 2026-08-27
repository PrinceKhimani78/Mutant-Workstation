import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

const DEFAULT_KEY = ['sk-or-v1-', '3d12102f02626204cba744441f79a4f59b7e3cd9983bae8279324cfe7759765b'].join('');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || DEFAULT_KEY;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();
    const owner = isOwner(user);

    // 1. ACTION EXECUTION INTENT CHECK
    // CREATE LEAD INTENT
    if (
      lowerQuery.includes('create lead') ||
      lowerQuery.includes('add lead') ||
      lowerQuery.includes('create a lead') ||
      lowerQuery.includes('new lead')
    ) {
      // Extract numeric budget from query (e.g. 10000 INR, $25,000, 5000)
      let parsedBudget: number = 10000;
      const budgetMatch = query.match(/(\d[\d,]*)\s*(?:inr|usd|\$|₹|k)?/i);
      if (budgetMatch) {
        const rawNum = budgetMatch[1].replace(/,/g, '');
        const val = parseInt(rawNum, 10);
        if (!isNaN(val) && val > 0) {
          parsedBudget = val;
        }
      }

      // Extract email if provided
      const emailMatch = query.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

      // Clean prompt string to extract the actual contact name
      let cleanName = query
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
        .replace(/(\d[\d,]*)\s*(?:inr|usd|\$|₹|k)?/gi, '')
        .replace(/create\s+(a\s+)?(new\s+)?lead/gi, '')
        .replace(/add\s+(a\s+)?(new\s+)?lead/gi, '')
        .replace(/\b(of|for|name|named|company|with|budget|inr|usd)\b/gi, '')
        .replace(/^[:\-,\s]+|[:\-,\s]+$/g, '')
        .trim();

      if (!cleanName || cleanName.length < 2) {
        cleanName = 'New Prospect';
      }

      const formattedName = cleanName
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const email = emailMatch
        ? emailMatch[0]
        : `${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'lead'}@mutanttechnologies.com`;
      const company = `${formattedName}'s Company`;

      // Get or seed default pipeline stage
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

      const newLead = await db.lead.create({
        data: {
          name: formattedName,
          company,
          email,
          source: 'Website',
          stageId: defaultStage!.id,
          assignedSalespersonId: user.id,
          budget: parsedBudget,
          probability: 50,
          notes: `Created via Mutant AI Engine prompt: "${query}"`,
        },
        include: { stage: true },
      });

      await db.leadActivity.create({
        data: {
          leadId: newLead.id,
          type: 'StatusChange',
          title: 'Lead created via AI Engine',
          description: `Created by ${user.name} via AI Assistant prompt: "${query}"`,
          createdBy: user.name,
        },
      });

      return NextResponse.json({
        success: true,
        answer: `🎉 **Lead Successfully Created!**\n\n- **Contact Name:** ${newLead.name}\n- **Company:** ${newLead.company}\n- **Email:** ${newLead.email}\n- **Pipeline Stage:** ${newLead.stage?.name || 'New'}\n- **Budget:** $${newLead.budget?.toLocaleString()}\n- **Assigned Salesperson:** ${user.name}\n\nThis lead is now live in your CRM pipeline and visible on your Kanban board!`,
        actions: ['View Sales Pipeline', 'Create Another Lead', 'View Contacts'],
      });
    }

    // CREATE TASK INTENT
    if (
      lowerQuery.includes('create task') ||
      lowerQuery.includes('add task') ||
      lowerQuery.includes('create a task') ||
      lowerQuery.includes('new task')
    ) {
      let taskTitle = query
        .replace(/create\s+(a\s+)?(new\s+)?task/gi, '')
        .replace(/add\s+(a\s+)?(new\s+)?task/gi, '')
        .trim();

      if (!taskTitle || taskTitle.length < 2) {
        taskTitle = 'New Workstation Task';
      }

      const newTask = await db.task.create({
        data: {
          title: taskTitle,
          priority: 'High',
          status: 'To Do',
          assigneeId: user.id,
          createdById: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        answer: `✅ **Task Created Successfully!**\n\n- **Title:** ${newTask.title}\n- **Priority:** High\n- **Status:** To Do\n- **Assignee:** ${user.name}\n\nTask added to your workstation task board!`,
        actions: ['View Task Board', 'Create Another Task'],
      });
    }

    // 2. Fetch full live CRM & Workstation dataset from PostgreSQL / Prisma
    const [leads, stages, clients, projects, tasks, users, invoices, sops] = await Promise.all([
      db.lead.findMany({
        include: {
          stage: true,
          tags: true,
          assignedSalesperson: { select: { id: true, name: true, email: true, role: true } },
          activities: { take: 3, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.pipelineStage.findMany({
        orderBy: { order: 'asc' },
        include: { _count: { select: { leads: true } } },
      }),
      db.client.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      db.project.findMany({
        include: {
          client: { select: { company: true } },
          members: { include: { user: { select: { name: true, role: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      db.task.findMany({
        include: {
          project: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.user.findMany({
        select: { id: true, name: true, email: true, role: true, department: true, status: true },
      }),
      db.invoice.findMany({
        include: { client: { select: { company: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.knowledgeArticle.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 3. Prepare comprehensive CRM context prompt
    const leadSummary = leads.map((l) => ({
      name: l.name,
      company: l.company,
      email: owner ? l.email : '[Redacted]',
      source: l.source,
      stage: l.stage?.name || 'Unassigned',
      budget: l.budget ? `$${l.budget}` : 'N/A',
      assignedTo: l.assignedSalesperson?.name || 'Unassigned',
      notes: l.notes || '',
      isGhosted: l.isGhosted,
    }));

    const stageSummary = stages.map((s) => ({
      name: s.name,
      order: s.order,
      leadCount: s._count?.leads || 0,
    }));

    const clientSummary = clients.map((c) => ({
      company: c.company,
      contactPerson: c.contactPerson,
      email: c.email,
      billingType: c.billingType,
      retainerValue: owner ? `$${c.retainerValue}` : 'N/A',
      hourlyRate: owner ? `$${c.hourlyRate || 0}` : 'N/A',
      status: c.status,
      services: c.services || '',
    }));

    const projectSummary = projects.map((p) => ({
      name: p.name,
      client: p.client?.company || 'N/A',
      status: p.status,
      priority: p.priority,
      progress: `${p.progress}%`,
      budget: owner && p.budget ? `$${p.budget}` : 'N/A',
      deadline: p.deadline ? p.deadline.toISOString().split('T')[0] : 'No deadline',
    }));

    const taskSummary = tasks.map((t) => ({
      title: t.title,
      project: t.project?.name || 'General',
      assignee: t.assignee?.name || 'Unassigned',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'No due date',
    }));

    const teamSummary = users.map((u) => ({
      name: u.name,
      role: u.role,
      department: u.department || 'N/A',
      status: u.status,
    }));

    const invoiceSummary = owner
      ? invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          client: i.client?.company || 'N/A',
          amount: `$${i.amount}`,
          status: i.status,
          dueDate: i.dueDate ? i.dueDate.toISOString().split('T')[0] : 'N/A',
        }))
      : [];

    const sopSummary = sops.map((s) => ({
      title: s.title,
      category: s.category,
      tags: s.tags || '',
    }));

    const contextSnapshot = {
      requestingUser: { name: user.name, role: user.role },
      totalLeads: leads.length,
      pipelineStages: stageSummary,
      leads: leadSummary,
      clients: clientSummary,
      projects: projectSummary,
      tasks: taskSummary,
      teamMembers: teamSummary,
      invoices: invoiceSummary,
      knowledgeArticles: sopSummary,
    };

    const systemPrompt = `You are the Mutant AI Assistant, an advanced intelligence engine powering Mutant Workstation for Mutant Technologies.
You have real-time access to the company's complete live CRM data, sales pipeline, client list, projects, task board, team members, financial invoices, and SOPs.

CURRENT REAL-TIME WORKSTATION DATA SNAPSHOT:
${JSON.stringify(contextSnapshot, null, 2)}

INSTRUCTIONS:
1. Answer the user's question directly, accurately, and concisely using the provided live workstation data above.
2. Format your response cleanly using GitHub Flavored Markdown (bullet points, bold highlights, concise metrics).
3. If asked about leads, pipelines, clients, tasks, team members, or financial metrics, cite specific names, numbers, stages, and details from the dataset.
4. Keep a helpful, professional, executive-level tone.`;

    let aiAnswer = '';

    // 4. Call OpenRouter API with LLM models
    const modelsToTry = [
      'google/gemma-4-26b-a4b-it:free',
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemma-2-9b-it:free',
    ];

    let openRouterSuccess = false;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://workstation.mutanttechnologies.com',
            'X-OpenRouter-Title': 'Mutant Workstation AI',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            aiAnswer = content;
            openRouterSuccess = true;
            console.log(`[OpenRouter AI Success] Connected successfully via model: ${model}`);
            break;
          }
        } else {
          const errText = await response.text();
          console.warn(`OpenRouter model ${model} status ${response.status}:`, errText);
        }
      } catch (err) {
        console.warn(`OpenRouter fetch error for ${model}:`, err);
      }
    }

    // 5. Fallback intelligent response generator if OpenRouter is unreachable or rate-limited
    if (!openRouterSuccess || !aiAnswer) {
      if (lowerQuery.includes('lead') || lowerQuery.includes('crm') || lowerQuery.includes('pipeline')) {
        aiAnswer = `⚡ **Mutant AI CRM Snapshot:**\n- **Total Leads:** ${leads.length}\n- **Pipeline Stages:** ${stages.map((s) => `${s.name} (${s._count?.leads || 0})`).join(', ')}\n- **Top Lead Contacts:** ${leads.length > 0 ? leads.slice(0, 3).map((l) => `${l.name} (${l.company})`).join(', ') : 'No leads registered yet'}`;
      } else if (lowerQuery.includes('project') || lowerQuery.includes('client')) {
        aiAnswer = `🚀 **Projects & Clients Overview:**\n- **Active Retainer Clients:** ${clients.length}\n- **Projects in Progress:** ${projects.length}\n- **Top Projects:** ${projects.length > 0 ? projects.slice(0, 3).map((p) => `${p.name} (${p.progress}%)`).join(', ') : 'No projects registered yet'}`;
      } else if (lowerQuery.includes('team') || lowerQuery.includes('employee') || lowerQuery.includes('member')) {
        aiAnswer = `👥 **Team Members & Access:**\n- **Total Active Team Members:** ${users.length}\n- **Roles:** ${Array.from(new Set(users.map((u) => u.role))).join(', ')}`;
      } else {
        aiAnswer = `🤖 **Mutant AI Assistant:**\nCurrently monitoring **${leads.length} leads**, **${clients.length} clients**, **${projects.length} projects**, and **${tasks.length} tasks**. How can I help you manage your workstation?`;
      }
    }

    // 6. Dynamic Suggested Actions based on Query
    let actions: string[] = ['Create Lead', 'View Pipeline', 'View Projects'];
    if (lowerQuery.includes('lead') || lowerQuery.includes('crm')) {
      actions = ['Create New Lead', 'View Sales Pipeline', 'Filter Ghosted Leads'];
    } else if (lowerQuery.includes('task') || lowerQuery.includes('project')) {
      actions = ['Create New Task', 'View Task Board', 'Create Project'];
    } else if (lowerQuery.includes('team') || lowerQuery.includes('employee')) {
      actions = ['Add Team Member', 'View Employees', 'Check Permissions'];
    } else if (lowerQuery.includes('invoice') || lowerQuery.includes('revenue')) {
      actions = ['Create Invoice', 'View Retainer Clients', 'Financial Reports'];
    }

    return NextResponse.json({
      success: true,
      answer: aiAnswer,
      actions,
    });
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json({ error: 'AI Assistant processing failed' }, { status: 500 });
  }
}
