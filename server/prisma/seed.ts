import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketPriority, TicketStatus } from "@prisma/client";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Seed Related Systems
  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
    "Student Registration",
    "Library Portal"
  ];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Seed Users
  const defaultPassword = "Password123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const users = [
    // Requesters (existing ones from Lab 2)
    { email: "cream.su@example.com", name: "Cream Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "bew.su@example.com", name: "Bew Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "kanta.su@example.com", name: "Kanta Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "je.su@example.com", name: "Je Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "bewnoi.su@example.com", name: "Bewnoi Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "grace.su@example.com", name: "Grace Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "phrao.su@example.com", name: "Phrao Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "pueng.su@example.com", name: "Pueng Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "inactive.user@example.com", name: "Inactive TestUser", role: Role.REQUESTER, isActive: false, requiresPasswordChange: true },
    // E2E Fixture Users
    { email: "e2e.requester@example.com", name: "E2E Requester", role: Role.REQUESTER, isActive: true, requiresPasswordChange: false },
    // IT Staff
    { email: "staff1@example.com", name: "IT Staff 1", role: Role.IT_STAFF, isActive: true, requiresPasswordChange: true },
    { email: "staff2@example.com", name: "IT Staff 2", role: Role.IT_STAFF, isActive: true, requiresPasswordChange: true },
    { email: "staff3@example.com", name: "IT Staff 3", role: Role.IT_STAFF, isActive: true, requiresPasswordChange: true },
    { email: "e2e.staff@example.com", name: "E2E Staff", role: Role.IT_STAFF, isActive: true, requiresPasswordChange: false },
    { email: "inactive.staff@example.com", name: "Inactive Staff", role: Role.IT_STAFF, isActive: false, requiresPasswordChange: true },
    // Administrator
    { email: "admin@example.com", name: "System Admin", role: Role.ADMINISTRATOR, isActive: true, requiresPasswordChange: true },
    // E2E User
    { email: "e2e.admin@example.com", name: "E2E Admin", role: Role.ADMINISTRATOR, isActive: true, requiresPasswordChange: false },
  ];

  for (const u of users) {
    const { requiresPasswordChange, ...rest } = u;
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: u.isActive, requiresPasswordChange, passwordHash },
      create: { ...rest, passwordHash, requiresPasswordChange },
    });
  }

  // 4. Seed Example Tickets
  const reqUser = await prisma.user.findUnique({ where: { email: "cream.su@example.com" } });
  const reqUser2 = await prisma.user.findUnique({ where: { email: "bew.su@example.com" } });
  const staffUser = await prisma.user.findUnique({ where: { email: "staff1@example.com" } });
  
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const catSoftware = await prisma.category.findUnique({ where: { name: "Software" } });
  const sysPrinter = await prisma.relatedSystem.findUnique({ where: { name: "Printer" } });
  const sysEmail = await prisma.relatedSystem.findUnique({ where: { name: "Email" } });

  if (reqUser && reqUser2 && staffUser && catHardware && catSoftware && sysPrinter && sysEmail) {
    // Ticket 1: In Progress, assigned
    const t1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000001",
        summary: "Printer not working",
        description: "The printer in the main office is jammed.",
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        currentStatus: TicketStatus.InProgress,
        requesterId: reqUser.id,
        categoryId: catHardware.id,
        relatedSystemId: sysPrinter.id,
        ownerId: staffUser.id,
      },
    });

    await prisma.publicComment.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, content: "I am looking into this.", authorId: staffUser.id, ticketId: t1.id }
    });
    await prisma.internalNote.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, content: "Needs new toner.", authorId: staffUser.id, ticketId: t1.id }
    });

    // Ticket 2: New, unassigned
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {
        currentStatus: TicketStatus.New,
        ownerId: null,
        itPriority: TicketPriority.LOW,
      },
      create: {
        ticketNumber: "TKT-2026-000002",
        summary: "Email sync issue",
        description: "Emails are not syncing on my phone.",
        requestedPriority: TicketPriority.HIGH,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.New,
        requesterId: reqUser2.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysEmail.id,
      },
    });

    // Ticket 3: Resolved, assigned
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000003" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000003",
        summary: "Need a new mouse",
        description: "My mouse is broken.",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Resolved,
        requesterId: reqUser.id,
        categoryId: catHardware.id,
        relatedSystemId: sysPrinter.id, // Just using printer as placeholder system
        ownerId: staffUser.id,
      },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
