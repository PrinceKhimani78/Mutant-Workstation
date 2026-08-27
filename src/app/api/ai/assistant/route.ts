import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isOwner } from '@/lib/rbac';

// No hardcoded fallback — a committed API key is a leaked API key the moment
// it's pushed. Set OPENROUTER_API_KEY in Vercel's environment variables.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, history } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Recent turns only (last 10), and only role+text — no point re-sending
    // suggested-action lists back as if the model said them.
    const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(history)
      ? history
          .slice(-10)
          .map((m: any) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: String(m.text || '') }))
          .filter((m: any) => m.content.trim())
      : [];

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

      const budgetLine = owner ? `\n- **Budget:** $${newLead.budget?.toLocaleString()}` : '';
      return NextResponse.json({
        success: true,
        answer: `🎉 **Lead Successfully Created!**\n\n- **Contact Name:** ${newLead.name}\n- **Company:** ${newLead.company}\n- **Email:** ${newLead.email}\n- **Pipeline Stage:** ${newLead.stage?.name || 'New'}${budgetLine}\n- **Assigned Salesperson:** ${user.name}\n\nThis lead is now live in your CRM pipeline and visible on your Kanban board!`,
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
        // Same rule as /api/tasks: Owner sees every task, everyone else only
        // sees what's assigned to or created by them.
        where: owner ? {} : { OR: [{ assigneeId: user.id }, { createdById: user.id }] },
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
      estimateType: l.estimateType,
      budget: owner && l.estimateType === 'Fixed' && l.budget ? `$${l.budget}` : 'N/A',
      hourlyRate: owner && l.estimateType === 'Hourly' && l.hourlyRate ? `$${l.hourlyRate}/hr` : 'N/A',
      estimatedWeeklyHours: l.estimatedWeeklyHours ?? 'N/A',
      assignedTo: l.assignedSalesperson?.name || 'Unassigned',
      notes: l.notes || '',
      isGhosted: l.isGhosted,
    }));

    const stageSummary = stages.map((s) => ({
      name: s.name,
      order: s.order,
      leadCount: s._count?.leads || 0,
    }));

    const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', INR: '₹' };
    const symFor = (currency: string) => CURRENCY_SYMBOL[currency] || '$';

    const weekStart = (() => {
      const d = new Date();
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? -6 : 1) - day);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Real logged hours per hourly client — not an invented "assume 160hrs/mo"
    // figure. Owner-only, same as every other money-adjacent number.
    const hourlyClients = clients.filter((c) => c.billingType === 'Hourly');
    const hoursByClient = new Map<string, { week: number; month: number }>();
    if (owner && hourlyClients.length > 0) {
      await Promise.all(
        hourlyClients.map(async (c) => {
          const [weekAgg, monthAgg] = await Promise.all([
            db.timeLog.aggregate({
              _sum: { hours: true },
              where: { date: { gte: weekStart }, OR: [{ clientId: c.id }, { task: { project: { clientId: c.id } } }] },
            }),
            db.timeLog.aggregate({
              _sum: { hours: true },
              where: { date: { gte: monthStart }, OR: [{ clientId: c.id }, { task: { project: { clientId: c.id } } }] },
            }),
          ]);
          hoursByClient.set(c.id, { week: weekAgg._sum.hours || 0, month: monthAgg._sum.hours || 0 });
        })
      );
    }

    const clientSummary = clients.map((c) => {
      const sym = symFor(c.currency);
      const hours = hoursByClient.get(c.id);
      // "Potential" monthly revenue is derived from the agreed weekly hour cap
      // (the actual committed number), not a guessed full-time figure.
      const monthlyPotential = owner && c.billingType === 'Hourly' && c.hourlyRate && c.weeklyHourLimit
        ? Math.round(c.hourlyRate * c.weeklyHourLimit * 4.33)
        : null;
      return {
        company: c.company,
        contactPerson: c.contactPerson,
        email: c.email,
        billingType: c.billingType,
        currency: c.currency,
        retainerValue: owner && c.billingType === 'Retainer' ? `${sym}${c.retainerValue}` : 'N/A',
        hourlyRate: owner && c.billingType === 'Hourly' && c.hourlyRate ? `${sym}${c.hourlyRate}/hr` : 'N/A',
        weeklyHourCap: c.weeklyHourLimit ?? 'N/A',
        hoursLoggedThisWeek: owner && c.billingType === 'Hourly' ? (hours?.week ?? 0) : 'N/A',
        hoursLoggedThisMonth: owner && c.billingType === 'Hourly' ? (hours?.month ?? 0) : 'N/A',
        monthlyPotentialRevenueBasedOnAgreedCap: monthlyPotential != null ? `${sym}${monthlyPotential.toLocaleString()}` : 'N/A',
        status: c.status,
        services: c.services || '',
      };
    });

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
          amount: `${symFor(i.currency)}${i.amount}`,
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
4. Keep a helpful, professional, executive-level tone.
4b. You are in a read-only conversation right now — you cannot create, edit, or delete anything yourself here; only a small set of exact trigger phrases (handled before you're even called) actually perform actions. Never say something was "created", "added", "updated", or "saved" unless it already existed in the data snapshot above before this message. If the user asks you to create/change something, tell them what phrase to use (e.g. "create lead") or that they can use Quick Create, rather than pretending you did it.
4c. Clients and invoices carry a currency (USD or INR, see the "currency" field). NEVER add a USD figure and an INR figure together into one blended total — $ and ₹ are different currencies, summing them produces a meaningless number. When asked for a total (e.g. "expected monthly revenue"), report USD and INR totals separately, each with its correct symbol.
4d. For hourly clients, hoursLoggedThisWeek / hoursLoggedThisMonth are the real logged hours — use them when talking about actual work done. monthlyPotentialRevenueBasedOnAgreedCap is pre-computed from the client's real hourly rate and their agreed weekly hour cap — use that exact figure when asked about potential/expected revenue from an hourly client, worded as based on their agreed weekly cap. Never invent your own hours assumption (e.g. "assuming 160 hours/month") — that number doesn't exist anywhere in this business and must not appear in your answer.
5. ${owner
      ? `This user (${user.name}, role: Owner) IS the account owner — all financial figures in the data above (budgets, retainer values, hourly rates, invoice amounts) are real and fully visible to them. Share them freely and specifically when asked; do not claim anything is restricted.`
      : `This user (role: ${user.role}) is NOT the account owner. Financial figures (budgets, retainer values, hourly rates, invoice amounts) were stripped before this data reached you and now show as "N/A" or "[Redacted]" — that's not a coincidence, it's enforced. If asked about those, say plainly that this information is restricted to the account owner. Never guess, estimate, or reconstruct a redacted number — there is nothing in the data to infer it from.`}`;

    let aiAnswer = '';

    // 4. Call OpenRouter API with LLM models (skip entirely if no key configured —
    // no point burning 4 failed requests when we already know they'll all fail)
    const modelsToTry = OPENROUTER_API_KEY
      ? [
          'google/gemini-2.0-flash-001',
          'openai/gpt-4o-mini',
          'meta-llama/llama-3.3-70b-instruct',
          'google/gemma-2-9b-it:free',
        ]
      : [];

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
              ...conversationHistory,
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
