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
    { email: "cream.su@example.com", name: "Cream Su", role: Role.REQUESTER, isActive: true },
    { email: "bew.su@example.com", name: "Bew Su", role: Role.REQUESTER, isActive: true },
    { email: "kanta.su@example.com", name: "Kanta Su", role: Role.REQUESTER, isActive: true },
    { email: "je.su@example.com", name: "Je Su", role: Role.REQUESTER, isActive: true },
    { email: "bewnoi.su@example.com", name: "Bewnoi Su", role: Role.REQUESTER, isActive: true },
    { email: "grace.su@example.com", name: "Grace Su", role: Role.REQUESTER, isActive: true },
    { email: "phrao.su@example.com", name: "Phrao Su", role: Role.REQUESTER, isActive: true },
    { email: "pueng.su@example.com", name: "Pueng Su", role: Role.REQUESTER, isActive: true },
    { email: "inactive.user@example.com", name: "Inactive TestUser", role: Role.REQUESTER, isActive: false },
    // IT Staff
    { email: "staff1@example.com", name: "IT Staff 1", role: Role.IT_STAFF, isActive: true },
    { email: "staff2@example.com", name: "IT Staff 2", role: Role.IT_STAFF, isActive: true },
    { email: "staff3@example.com", name: "IT Staff 3", role: Role.IT_STAFF, isActive: true },
    { email: "inactive.staff@example.com", name: "Inactive Staff", role: Role.IT_STAFF, isActive: false },
    // Administrator
    { email: "admin@example.com", name: "System Admin", role: Role.ADMINISTRATOR, isActive: true },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: u.isActive },
      create: { ...u, passwordHash, mustChangePassword: true },
    });
  }

  // 4. Seed Example Tickets (Safe create, avoid duplicate errors with findFirst)
  const reqUser = await prisma.user.findUnique({ where: { email: "cream.su@example.com" } });
  const staffUser = await prisma.user.findUnique({ where: { email: "staff1@example.com" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const sysPrinter = await prisma.relatedSystem.findUnique({ where: { name: "Printer" } });

  if (reqUser && staffUser && catHardware && sysPrinter) {
    const existingTicket = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-2026-000001" } });
    if (!existingTicket) {
      const ticket = await prisma.ticket.create({
        data: {
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

      // Seed comments safely
      await prisma.publicComment.create({
        data: { content: "I am looking into this.", authorId: staffUser.id, ticketId: ticket.id },
      });
      await prisma.internalNote.create({
        data: { content: "Needs new toner.", authorId: staffUser.id, ticketId: ticket.id },
      });
    }
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
