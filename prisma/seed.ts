import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mutant Workstation Database...');

  // Clean existing demo records for idempotent seed execution
  await prisma.leadActivity.deleteMany({});
  await prisma.timeLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.pipelineStage.deleteMany({});
  await prisma.knowledgeArticle.deleteMany({});

  // 0. Create default pipeline stages
  const STAGE_DEFS: { name: string; color: string }[] = [
    { name: 'New', color: '#2563eb' },
    { name: 'Contacted', color: '#7c3aed' },
    { name: 'Discovery', color: '#d97706' },
    { name: 'Proposal Sent', color: '#fc6203' },
    { name: 'Negotiation', color: '#db2777' },
    { name: 'Won', color: '#059669' },
    { name: 'Lost', color: '#6b7280' },
  ];
  const stageByName: Record<string, string> = {};
  for (let i = 0; i < STAGE_DEFS.length; i++) {
    const stage = await prisma.pipelineStage.create({
      data: { name: STAGE_DEFS[i].name, color: STAGE_DEFS[i].color, order: i },
    });
    stageByName[stage.name] = stage.id;
  }

  // Hash standard password: "password123"
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Key Users
  const prince = await prisma.user.upsert({
    where: { email: 'prince@mutanttechnologies.com' },
    update: {},
    create: {
      email: 'prince@mutanttechnologies.com',
      name: 'Prince Khimani',
      passwordHash,
      role: 'Owner',
      department: 'Executive',
      avatarUrl: '/logo.png',
      phone: '+91 9876543210',
    },
  });

  const het = await prisma.user.upsert({
    where: { email: 'het@mutanttechnologies.com' },
    update: {},
    create: {
      email: 'het@mutanttechnologies.com',
      name: 'Het Patel',
      passwordHash,
      role: 'Sales Manager',
      department: 'Sales',
      avatarUrl: '/logo.png',
      phone: '+91 9876543211',
    },
  });

  const aman = await prisma.user.upsert({
    where: { email: 'aman@mutanttechnologies.com' },
    update: {},
    create: {
      email: 'aman@mutanttechnologies.com',
      name: 'Aman Sharma',
      passwordHash,
      role: 'Project Manager',
      department: 'Operations',
      avatarUrl: '/logo.png',
      phone: '+91 9876543212',
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@mutanttechnologies.com' },
    update: {},
    create: {
      email: 'dev@mutanttechnologies.com',
      name: 'Senior Developer',
      passwordHash,
      role: 'Developer',
      department: 'Engineering',
      avatarUrl: '/logo.png',
      phone: '+91 9876543213',
    },
  });

  // 2. Create Clients
  const client1 = await prisma.client.create({
    data: {
      company: 'Acme Global Ventures',
      contactPerson: 'Sarah Jenkins',
      email: 'sarah@acmeglobal.com',
      phone: '+1 (555) 234-5678',
      currency: 'USD',
      billingType: 'Retainer',
      retainerValue: 12500,
      renewalDate: new Date('2026-11-15'),
      services: 'Full Stack Web App, SEO, Meta Ads',
      assignedPmId: aman.id,
      status: 'Active',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      company: 'Apex Health Systems',
      contactPerson: 'Dr. Robert Vance',
      email: 'vance@apexhealth.io',
      phone: '+1 (555) 876-5432',
      currency: 'USD',
      billingType: 'Retainer',
      retainerValue: 8500,
      renewalDate: new Date('2026-09-30'),
      services: 'Next.js Platform, UI/UX Redesign',
      assignedPmId: aman.id,
      status: 'Active',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      company: 'Nexus Logistics India',
      contactPerson: 'Rohan Mehta',
      email: 'rohan@nexuslogistics.in',
      phone: '+91 98765 43220',
      currency: 'INR',
      billingType: 'Hourly',
      hourlyRate: 1500,
      weeklyHourLimit: 20,
      services: 'Upwork Hourly Contract — Backend & DevOps',
      assignedPmId: aman.id,
      status: 'Active',
    },
  });

  // 3. Create CRM Leads
  await prisma.lead.createMany({
    data: [
      {
        name: 'Michael Scott',
        company: 'Dunder Mifflin Tech',
        email: 'michael@dundermifflin.com',
        phone: '+1 (555) 019-2831',
        source: 'Upwork Profile 1 Prince',
        assignedSalespersonId: prince.id,
        stageId: stageByName['Proposal Sent'],
        budget: 25000,
        probability: 80,
        proposalValue: 25000,
        notes: 'Needs custom CRM and order tracking system built with Next.js & Supabase.',
      },
      {
        name: 'Elena Rostova',
        company: 'Vanguard AI Capital',
        email: 'elena@vanguardai.co',
        phone: '+44 20 7946 0912',
        source: 'LinkedIn',
        assignedSalespersonId: het.id,
        stageId: stageByName['Discovery'],
        budget: 45000,
        probability: 60,
        proposalValue: 40000,
        notes: 'Fintech dashboard overhaul with high speed charts and live agent analytics.',
      },
      {
        name: 'David Miller',
        company: 'Solaris Cloud Solutions',
        email: 'dmiller@solariscloud.com',
        phone: '+1 (555) 345-6789',
        source: 'Upwork Profile 2 Het',
        assignedSalespersonId: het.id,
        stageId: stageByName['Negotiation'],
        budget: 18000,
        probability: 90,
        proposalValue: 18000,
        notes: 'Monthly retainer for Google Ads optimization and landing page redesign.',
      },
      {
        name: 'Sophia Chen',
        company: 'Nexus Logistics',
        email: 'sophia@nexuslogistics.io',
        phone: '+65 6789 1234',
        source: 'Website',
        assignedSalespersonId: prince.id,
        stageId: stageByName['New'],
        budget: 30000,
        probability: 50,
        proposalValue: 30000,
        notes: 'Inbound lead from website contact form asking for custom warehouse management UI.',
      },
      {
        name: 'Arthur Pendelton',
        company: 'Starlight E-commerce',
        email: 'arthur@starlight.store',
        phone: '+1 (555) 998-1122',
        source: 'Upwork Profile 3 Aman',
        assignedSalespersonId: aman.id,
        stageId: stageByName['Won'],
        budget: 15000,
        probability: 100,
        proposalValue: 15000,
        notes: 'Contract signed! Onboarding phase starting next week.',
      },
    ],
  });

  // 4. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Acme SaaS Workstation Portal',
      description: 'Internal operations dashboard and custom client portal with real-time sync.',
      clientId: client1.id,
      service: 'Web Development',
      department: 'Engineering',
      budget: 25000,
      deadline: new Date('2026-10-31'),
      priority: 'High',
      status: 'In Progress',
      progress: 65,
      estimatedHours: 160,
      timeSpent: 98,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Apex Health UI Redesign & Mobile App',
      description: 'Complete UI/UX overhaul and React Native cross-platform patient app.',
      clientId: client2.id,
      service: 'UI/UX & Mobile',
      department: 'Design',
      budget: 18000,
      deadline: new Date('2026-09-20'),
      priority: 'Urgent',
      status: 'In Progress',
      progress: 40,
      estimatedHours: 120,
      timeSpent: 45,
    },
  });

  // 5. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Dark Mode Design System',
        description: 'Build Figma tokens and export CSS variables matching Mutant brand palette.',
        projectId: project1.id,
        assigneeId: dev.id,
        dueDate: new Date('2026-08-30'),
        priority: 'High',
        status: 'Completed',
        estimatedHours: 12,
        timeLogged: 12,
        labels: JSON.stringify(['Design', 'Frontend']),
      },
      {
        title: 'Set up Prisma PostgreSQL Schema & RBAC JWT Auth',
        description: 'Configure JWT tokens, refresh rotation, and permission guards for Next.js API routes.',
        projectId: project1.id,
        assigneeId: dev.id,
        dueDate: new Date('2026-09-02'),
        priority: 'Urgent',
        status: 'In Progress',
        estimatedHours: 20,
        timeLogged: 14,
        labels: JSON.stringify(['Backend', 'Security']),
      },
      {
        title: 'Apex Health Patient Dashboard Wireframes',
        description: 'Create interactive Figma prototypes for appointment booking flow.',
        projectId: project2.id,
        assigneeId: prince.id,
        dueDate: new Date('2026-09-05'),
        priority: 'Medium',
        status: 'To Do',
        estimatedHours: 16,
        timeLogged: 4,
        labels: JSON.stringify(['UI/UX', 'Prototypes']),
      },
    ],
  });

  // 6. Create Invoices
  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: 'INV-2026-001',
        clientId: client1.id,
        amount: 12500,
        tax: 0,
        discount: 0,
        status: 'Paid',
        issueDate: new Date('2026-08-01'),
        dueDate: new Date('2026-08-15'),
        itemsJson: JSON.stringify([{ description: 'August Retainer - Full Development & SEO', qty: 1, rate: 12500 }]),
      },
      {
        invoiceNumber: 'INV-2026-002',
        clientId: client2.id,
        amount: 8500,
        tax: 0,
        discount: 500,
        status: 'Sent',
        issueDate: new Date('2026-08-20'),
        dueDate: new Date('2026-09-05'),
        itemsJson: JSON.stringify([{ description: 'UI/UX Redesign Milestone 1', qty: 1, rate: 8500 }]),
      },
    ],
  });

  // 7. Create Knowledge Articles & SOPs
  await prisma.knowledgeArticle.createMany({
    data: [
      {
        title: 'Client Onboarding SOP & Checklist',
        category: 'SOP',
        content: '# Client Onboarding Standard Operating Procedure\n\n1. Receive signed proposal & retainer payment.\n2. Create Client record in Mutant Workstation CRM.\n3. Setup private Slack channel and Google Drive workspace.\n4. Conduct 45-minute discovery kick-off meeting.',
        tags: 'Onboarding, SOP, Sales',
        author: 'Prince Khimani',
      },
      {
        title: 'Mutant Technologies Brand & Design System Guidelines',
        category: 'Guide',
        content: '# Brand Guidelines\n- Primary Accent: #FC6203 (Mutant Orange)\n- Dark Surface: #0B0F17\n- Card Background: #131B2E\n- Font: Plus Jakarta Sans / Inter',
        tags: 'Design, Branding, UI',
        author: 'Prince Khimani',
      },
    ],
  });

  console.log('Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
