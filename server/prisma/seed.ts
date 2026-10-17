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
    // Requesters
    { email: "cream.su@example.com", name: "Cream Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "bew.su@example.com", name: "Bew Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "kanta.su@example.com", name: "Kanta Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "je.su@example.com", name: "Je Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "bewnoi.su@example.com", name: "Bewnoi Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "grace.su@example.com", name: "Grace Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    { email: "phrao.su@example.com", name: "Phrao Su", role: Role.REQUESTER, isActive: true, requiresPasswordChange: true },
    // Dedicated Requester with ZERO tickets to test empty dashboard state
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
    // E2E Admin
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

  // 4. Reference Entities for Tickets
  const catHardware = await prisma.category.findUniqueOrThrow({ where: { name: "Hardware" } });
  const catSoftware = await prisma.category.findUniqueOrThrow({ where: { name: "Software" } });
  const catNetwork = await prisma.category.findUniqueOrThrow({ where: { name: "Network" } });
  const catAccount = await prisma.category.findUniqueOrThrow({ where: { name: "Account and Access" } });

  const sysPrinter = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Printer" } });
  const sysEmail = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Email" } });
  const sysVpn = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "VPN" } });
  const sysWifi = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Campus Wi-Fi" } });
  const sysRegistration = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Student Registration" } });
  const sysLeb2 = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "LEB2 App" } });
  const sysLaptop = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Corporate Laptop" } });
  const sysGrade = await prisma.relatedSystem.findUniqueOrThrow({ where: { name: "Grade Submission App" } });

  const reqCream = await prisma.user.findUniqueOrThrow({ where: { email: "cream.su@example.com" } });
  const reqBew = await prisma.user.findUniqueOrThrow({ where: { email: "bew.su@example.com" } });
  const reqKanta = await prisma.user.findUniqueOrThrow({ where: { email: "kanta.su@example.com" } });
  const reqGrace = await prisma.user.findUniqueOrThrow({ where: { email: "grace.su@example.com" } });
  const reqPhrao = await prisma.user.findUniqueOrThrow({ where: { email: "phrao.su@example.com" } });
  const reqE2E = await prisma.user.findUniqueOrThrow({ where: { email: "e2e.requester@example.com" } });

  const staff1 = await prisma.user.findUniqueOrThrow({ where: { email: "staff1@example.com" } });
  const staff2 = await prisma.user.findUniqueOrThrow({ where: { email: "staff2@example.com" } });
  const staff3 = await prisma.user.findUniqueOrThrow({ where: { email: "staff3@example.com" } });

  // Helper for idempotent ActionTaken creation
  async function upsertActionTaken(data: {
    ticketId: number;
    description: string;
    result: string;
    performedById: number;
    followUpRequired?: boolean;
    followUpNote?: string | null;
    attachmentNotes?: string | null;
    actionAt?: Date;
  }) {
    const existing = await prisma.actionTaken.findFirst({
      where: { ticketId: data.ticketId, description: data.description },
    });

    if (existing) {
      return prisma.actionTaken.update({
        where: { id: existing.id },
        data: {
          result: data.result,
          performedById: data.performedById,
          followUpRequired: data.followUpRequired ?? false,
          followUpNote: data.followUpNote ?? null,
          attachmentNotes: data.attachmentNotes ?? null,
          ...(data.actionAt ? { actionAt: data.actionAt } : {}),
        },
      });
    }

    return prisma.actionTaken.create({
      data: {
        ticketId: data.ticketId,
        description: data.description,
        result: data.result,
        performedById: data.performedById,
        followUpRequired: data.followUpRequired ?? false,
        followUpNote: data.followUpNote ?? null,
        attachmentNotes: data.attachmentNotes ?? null,
        ...(data.actionAt ? { actionAt: data.actionAt } : {}),
      },
    });
  }

  // Helper for idempotent PublicComment creation without hardcoded IDs
  async function upsertPublicComment(data: { ticketId: number; authorId: number; content: string }) {
    const existing = await prisma.publicComment.findFirst({
      where: { ticketId: data.ticketId, authorId: data.authorId, content: data.content },
    });
    if (existing) {
      return existing;
    }
    return prisma.publicComment.create({ data });
  }

  // Helper for idempotent InternalNote creation without hardcoded IDs
  async function upsertInternalNote(data: { ticketId: number; authorId: number; content: string }) {
    const existing = await prisma.internalNote.findFirst({
      where: { ticketId: data.ticketId, authorId: data.authorId, content: data.content },
    });
    if (existing) {
      return existing;
    }
    return prisma.internalNote.create({ data });
  }

  // Helper for idempotent Attachment creation
  async function upsertAttachment(data: {
    ticketId: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    isRemoved?: boolean;
  }) {
    return prisma.attachment.upsert({
      where: { filename: data.filename },
      update: {
        ticketId: data.ticketId,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        isRemoved: data.isRemoved ?? false,
      },
      create: {
        ticketId: data.ticketId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        isRemoved: data.isRemoved ?? false,
      },
    });
  }

  // 5. Seed Tickets covering all 8 statuses, all priorities, owned & unassigned

  // Ticket 1: In Progress, Assigned to Staff 1, Multiple Actions (from Staff 1 and Staff 2)
  const t1 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000001" },
    update: {
      currentStatus: TicketStatus.InProgress,
      ownerId: staff1.id,
      itPriority: TicketPriority.MEDIUM,
    },
    create: {
      ticketNumber: "TKT-2026-000001",
      summary: "Printer not working in main office",
      description: "The printer in the main office is jammed and showing error 50.1.",
      requestedPriority: TicketPriority.MEDIUM,
      itPriority: TicketPriority.MEDIUM,
      currentStatus: TicketStatus.InProgress,
      requesterId: reqCream.id,
      categoryId: catHardware.id,
      relatedSystemId: sysPrinter.id,
      ownerId: staff1.id,
    },
  });

  await upsertPublicComment({
    ticketId: t1.id,
    authorId: staff1.id,
    content: "I am looking into this.",
  });

  await upsertInternalNote({
    ticketId: t1.id,
    authorId: staff1.id,
    content: "Needs new toner and paper roller assembly.",
  });

  await upsertAttachment({
    ticketId: t1.id,
    filename: "seed-duplexer-gear-photo.png",
    originalName: "duplexer-gear.png",
    mimeType: "image/png",
    size: 102400,
  });

  await upsertActionTaken({
    ticketId: t1.id,
    performedById: staff1.id,
    description: "Inspected paper feed roller and cleared physical paper jam in tray 2.",
    result: "Roller cleaned; test print passed single sheet but jammed on double-sided duplexing.",
    followUpRequired: true,
    followUpNote: "Need to replace duplexer unit assembly.",
    attachmentNotes: "Photo of worn duplexer gear in maintenance folder.",
    actionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  });

  await upsertActionTaken({
    ticketId: t1.id,
    performedById: staff2.id,
    description: "Ordered replacement duplexer unit from hardware vendor.",
    result: "PO-99421 confirmed by vendor; delivery ETA tomorrow morning.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  });

  // Ticket 2: New, Unassigned, HIGH requested priority, ZERO actions taken
  await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000002" },
    update: {
      currentStatus: TicketStatus.New,
      ownerId: null,
      itPriority: TicketPriority.LOW,
    },
    create: {
      ticketNumber: "TKT-2026-000002",
      summary: "Email sync issue on mobile client",
      description: "Emails are not syncing on Outlook mobile app since password change.",
      requestedPriority: TicketPriority.HIGH,
      itPriority: TicketPriority.LOW,
      currentStatus: TicketStatus.New,
      requesterId: reqE2E.id,
      categoryId: catSoftware.id,
      relatedSystemId: sysEmail.id,
    },
  });

  // Ticket 3: Closed, Assigned to Staff 1, 1 Action Taken (Resolution Gate satisfied)
  const t3 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000003" },
    update: {
      currentStatus: TicketStatus.Closed,
      ownerId: staff1.id,
      itPriority: TicketPriority.LOW,
    },
    create: {
      ticketNumber: "TKT-2026-000003",
      summary: "Need a new mouse for workstation",
      description: "Left click button is unresponsive.",
      requestedPriority: TicketPriority.LOW,
      itPriority: TicketPriority.LOW,
      currentStatus: TicketStatus.Closed,
      requesterId: reqCream.id,
      categoryId: catHardware.id,
      relatedSystemId: sysPrinter.id,
      ownerId: staff1.id,
    },
  });

  await upsertActionTaken({
    ticketId: t3.id,
    performedById: staff1.id,
    description: "Issued standard optical USB mouse from IT inventory.",
    result: "New mouse delivered to user desk; verified working and old unit disposed.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  });

  // Ticket 4: Open, Assigned to Staff 2, 1 Action Taken
  const t4 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000004" },
    update: {
      currentStatus: TicketStatus.Open,
      ownerId: staff2.id,
      itPriority: TicketPriority.MEDIUM,
    },
    create: {
      ticketNumber: "TKT-2026-000004",
      summary: "VPN connection terminates after 5 minutes",
      description: "GlobalProtect VPN disconnects with error 403 TLS handshake timeout.",
      requestedPriority: TicketPriority.HIGH,
      itPriority: TicketPriority.MEDIUM,
      currentStatus: TicketStatus.Open,
      requesterId: reqBew.id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVpn.id,
      ownerId: staff2.id,
    },
  });

  await upsertActionTaken({
    ticketId: t4.id,
    performedById: staff2.id,
    description: "Initial triage and verification of user VPN certificate validity.",
    result: "User certificate expired yesterday; root CA re-issue required.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  });

  // Ticket 5: WaitingForRequester, Assigned to Staff 3, 1 Action with Follow-Up
  const t5 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000005" },
    update: {
      currentStatus: TicketStatus.WaitingForRequester,
      ownerId: staff3.id,
      itPriority: TicketPriority.HIGH,
    },
    create: {
      ticketNumber: "TKT-2026-000005",
      summary: "Campus Wi-Fi authentication loop",
      description: "Repeatedly prompted for 802.1x credentials when connecting in Building 4.",
      requestedPriority: TicketPriority.HIGH,
      itPriority: TicketPriority.HIGH,
      currentStatus: TicketStatus.WaitingForRequester,
      requesterId: reqKanta.id,
      categoryId: catNetwork.id,
      relatedSystemId: sysWifi.id,
      ownerId: staff3.id,
    },
  });

  await upsertActionTaken({
    ticketId: t5.id,
    performedById: staff3.id,
    description: "Requested client device MAC address and screenshot of 802.1x profile.",
    result: "Awaiting user response with hardware MAC address to inspect RADIUS logs.",
    followUpRequired: true,
    followUpNote: "Check RADIUS audit log if user does not reply within 24 hours.",
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  });

  // Ticket 6: Resolved, Assigned to Staff 1, 1 Action Taken (Recently Resolved in 7-day window)
  const t6 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000006" },
    update: {
      currentStatus: TicketStatus.Resolved,
      ownerId: staff1.id,
      itPriority: TicketPriority.LOW,
      appearsResolved: false,
    },
    create: {
      ticketNumber: "TKT-2026-000006",
      summary: "Student Registration Portal permission denied",
      description: "Unable to access course evaluation tab during enrollment period.",
      requestedPriority: TicketPriority.MEDIUM,
      itPriority: TicketPriority.LOW,
      currentStatus: TicketStatus.Resolved,
      requesterId: reqCream.id,
      categoryId: catAccount.id,
      relatedSystemId: sysRegistration.id,
      ownerId: staff1.id,
      appearsResolved: false,
    },
  });

  await upsertActionTaken({
    ticketId: t6.id,
    performedById: staff1.id,
    description: "Reset Kerberos authentication token and synchronized LDAP role attributes.",
    result: "User successfully accessed course evaluation tab; confirmed working.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  });

  // Ticket 7: Reopened, Assigned to Staff 2, Multiple Actions
  const t7 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000007" },
    update: {
      currentStatus: TicketStatus.Reopened,
      ownerId: staff2.id,
      itPriority: TicketPriority.HIGH,
    },
    create: {
      ticketNumber: "TKT-2026-000007",
      summary: "LEB2 assignment upload button disabled",
      description: "Cannot submit lab report on LEB2; submit button stays greyed out.",
      requestedPriority: TicketPriority.HIGH,
      itPriority: TicketPriority.HIGH,
      currentStatus: TicketStatus.Reopened,
      requesterId: reqGrace.id,
      categoryId: catSoftware.id,
      relatedSystemId: sysLeb2.id,
      ownerId: staff2.id,
    },
  });

  await upsertActionTaken({
    ticketId: t7.id,
    performedById: staff2.id,
    description: "Cleared local browser storage and re-tested file upload in Chrome.",
    result: "Upload worked in Chrome desktop, ticket previously marked resolved.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    actionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  });

  await upsertActionTaken({
    ticketId: t7.id,
    performedById: staff3.id,
    description: "User reported submission still failing on mobile Safari. Collected console logs.",
    result: "Mobile Safari WebKit flexbox bug identified preventing touch submit.",
    followUpRequired: true,
    followUpNote: "Coordinate frontend fix with web development team.",
    attachmentNotes: "safari_debug_console.log",
    actionAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  });

  // Ticket 8: Cancelled, Unassigned, Priority LOW, 0 actions taken
  await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000008" },
    update: {
      currentStatus: TicketStatus.Cancelled,
      ownerId: null,
      itPriority: TicketPriority.LOW,
    },
    create: {
      ticketNumber: "TKT-2026-000008",
      summary: "Duplicate request for grade submission access",
      description: "Accidentally submitted twice; please cancel this duplicate.",
      requestedPriority: TicketPriority.LOW,
      itPriority: TicketPriority.LOW,
      currentStatus: TicketStatus.Cancelled,
      requesterId: reqPhrao.id,
      categoryId: catSoftware.id,
      relatedSystemId: sysGrade.id,
    },
  });

  // Ticket 9: In Progress, Assigned to Staff 3, Advisory Resolved = true, 1 Action
  const t9 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-2026-000009" },
    update: {
      currentStatus: TicketStatus.InProgress,
      ownerId: staff3.id,
      itPriority: TicketPriority.HIGH,
      appearsResolved: true,
    },
    create: {
      ticketNumber: "TKT-2026-000009",
      summary: "Corporate laptop battery draining under 1 hour",
      description: "Battery controller reports failure warning and dies suddenly without AC adapter.",
      requestedPriority: TicketPriority.HIGH,
      itPriority: TicketPriority.HIGH,
      currentStatus: TicketStatus.InProgress,
      requesterId: reqCream.id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ownerId: staff3.id,
      appearsResolved: true,
    },
  });

  await upsertActionTaken({
    ticketId: t9.id,
    performedById: staff3.id,
    description: "Hardware diagnostics executed on internal power management bus.",
    result: "Battery cell 3 voltage mismatch detected; battery replacement kit requested.",
    followUpRequired: true,
    followUpNote: "Schedule battery installation when parts arrive from Dell.",
    attachmentNotes: "battery_diagnostic_report.pdf",
    actionAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  });

  // Align PostgreSQL auto-increment sequences with seeded IDs to prevent sequence collisions
  const tables = ["PublicComment", "InternalNote", "ActionTaken", "Attachment", "Ticket", "User"];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${table}";`
    );
  }

  console.log("Database seeded successfully with Lab 4 idempotent test fixtures.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
