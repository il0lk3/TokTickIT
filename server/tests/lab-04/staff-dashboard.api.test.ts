import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { TicketPriority, TicketStatus, Role } from "@prisma/client";

describe("Lab 4 Issue 8: Staff & Administrator Dashboard API (API-DSH-11 to API-DSH-24)", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  function makeAuthCookie(userId: number, expiresIn: any = "2h") {
    return `accessToken=${jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as any })}`;
  }

  let staff1: { id: number; name: string; email: string };
  let staff2: { id: number; name: string; email: string };
  let adminUser: { id: number; name: string; email: string };
  let requesterUser: { id: number; name: string; email: string };

  let staff1Cookie: string;
  let staff2Cookie: string;
  let adminCookie: string;
  let requesterCookie: string;

  let testCatId: number;
  let testSysId: number;

  beforeAll(async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    testCatId = cat.id;
    testSysId = sys.id;

    // Create / upsert dedicated test users
    staff1 = await prisma.user.upsert({
      where: { email: "dsh.staff.one@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.staff.one@example.com",
        name: "Staff Dashboard One",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    staff2 = await prisma.user.upsert({
      where: { email: "dsh.staff.two@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.staff.two@example.com",
        name: "Staff Dashboard Two",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "dsh.admin.lead@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.admin.lead@example.com",
        name: "Admin Dashboard Lead",
        passwordHash: "hash",
        role: Role.ADMINISTRATOR,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "dsh.requester.test@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.requester.test@example.com",
        name: "Dashboard Requester User",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    staff1Cookie = makeAuthCookie(staff1.id);
    staff2Cookie = makeAuthCookie(staff2.id);
    adminCookie = makeAuthCookie(adminUser.id);
    requesterCookie = makeAuthCookie(requesterUser.id);

    // Clean up test tickets
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TKT-STAFF-DSH-" } },
    });

    // 1. Unassigned Active Ticket (Open, HIGH)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-001",
        summary: "Staff DSH 001 Unassigned Urgent",
        description: "Urgent unassigned active ticket",
        requestedPriority: TicketPriority.HIGH,
        itPriority: TicketPriority.HIGH,
        currentStatus: TicketStatus.Open,
        requesterId: requesterUser.id,
        ownerId: null,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 2. Ticket Owned by Staff 1 (InProgress, MEDIUM)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-002",
        summary: "Staff DSH 002 Owned By Staff1",
        description: "Staff 1 active ticket",
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        currentStatus: TicketStatus.InProgress,
        requesterId: requesterUser.id,
        ownerId: staff1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 3. Ticket with appearsResolved = true (WaitingForRequester, LOW, owned by Staff 1)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-003",
        summary: "Staff DSH 003 Appears Resolved",
        description: "Ticket flagged by requester as resolved",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.WaitingForRequester,
        appearsResolved: true,
        requesterId: requesterUser.id,
        ownerId: staff1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 4. Closed Ticket with NO owner (must NOT be counted in unassigned active)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-004",
        summary: "Staff DSH 004 Closed Unassigned",
        description: "Closed ticket without owner",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Closed,
        requesterId: requesterUser.id,
        ownerId: null,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 5. Cancelled Ticket Owned by Staff 1 (must NOT be counted in ownedByMe active)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-005",
        summary: "Staff DSH 005 Cancelled Owned",
        description: "Cancelled ticket owned by staff 1",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Cancelled,
        requesterId: requesterUser.id,
        ownerId: staff1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: "TKT-STAFF-DSH-" } },
    });
  });

  // ==========================================
  // API-DSH-11: Staff Retrieves Operational Metrics
  // ==========================================
  it("API-DSH-11: Staff retrieves operational dashboard metrics with complete byStatus and byPriority maps (AC-09)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("myRecentTickets");
    expect(res.body).toHaveProperty("urgentTickets");
    expect(res.body).toHaveProperty("generatedAt");

    const { metrics } = res.body;

    // Verify byStatus map completeness (all 8 lifecycle statuses present)
    const allStatuses = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Reopened", "Closed", "Cancelled"];
    for (const st of allStatuses) {
      expect(metrics.byStatus).toHaveProperty(st);
      expect(typeof metrics.byStatus[st]).toBe("number");
      expect(metrics.byStatus[st]).toBeGreaterThanOrEqual(0);
    }

    // Verify byPriority map completeness (LOW, MEDIUM, HIGH present)
    const allPriorities = ["LOW", "MEDIUM", "HIGH"];
    for (const pr of allPriorities) {
      expect(metrics.byPriority).toHaveProperty(pr);
      expect(typeof metrics.byPriority[pr]).toBe("number");
      expect(metrics.byPriority[pr]).toBeGreaterThanOrEqual(0);
    }
  });

  // ==========================================
  // API-DSH-12: Unassigned Excludes Terminal Tickets
  // ==========================================
  it("API-DSH-12: Closed and Cancelled tickets without owner are NOT counted in unassigned active metric (BR-14)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { metrics } = res.body;

    // Check direct database active unassigned count
    const activeUnassignedCount = await prisma.ticket.count({
      where: {
        ownerId: null,
        currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] },
      },
    });

    expect(metrics.unassigned.count).toBe(activeUnassignedCount);
    expect(metrics.unassigned.drillDown).toEqual({
      path: "/queue",
      query: { ownerId: "unassigned", active: "true" },
    });
  });

  // ==========================================
  // API-DSH-13: byPriority Completeness
  // ==========================================
  it("API-DSH-13: byPriority contains LOW, MEDIUM, and HIGH keys (all >= 0) even when counts are 0", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { byPriority } = res.body.metrics;

    expect(typeof byPriority.LOW).toBe("number");
    expect(typeof byPriority.MEDIUM).toBe("number");
    expect(typeof byPriority.HIGH).toBe("number");

    // Total active tickets must equal the sum of byPriority
    const activeTotal = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] },
      },
    });

    const sumPriorities = byPriority.LOW + byPriority.MEDIUM + byPriority.HIGH;
    expect(sumPriorities).toBe(activeTotal);
  });

  // ==========================================
  // API-DSH-14: Rolling 24-Hour Boundary Precision
  // ==========================================
  it("API-DSH-14: Rolling 24-hour boundary precision for recentlyUpdated (23h included, 25h excluded)", async () => {
    const now = Date.now();
    const twentyThreeHoursAgo = new Date(now - 23 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000);

    const tInside = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-24H-IN",
        summary: "Inside 24h ticket",
        description: "Test boundary inside",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requesterUser.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({ where: { id: tInside.id }, data: { updatedAt: twentyThreeHoursAgo } });

    const tOutside = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-24H-OUT",
        summary: "Outside 24h ticket",
        description: "Test boundary outside",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requesterUser.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({ where: { id: tOutside.id }, data: { updatedAt: twentyFiveHoursAgo } });

    const expectedCount = await prisma.ticket.count({
      where: {
        currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.metrics.recentlyUpdated.count).toBe(expectedCount);

    await prisma.ticket.deleteMany({
      where: { id: { in: [tInside.id, tOutside.id] } },
    });
  });

  // ==========================================
  // API-DSH-15: appearsResolved Metric Counter
  // ==========================================
  it("API-DSH-15: Staff sees appearsResolved metric counting active tickets flagged by requester", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { appearsResolved } = res.body.metrics;

    const expectedAppearsResolved = await prisma.ticket.count({
      where: {
        appearsResolved: true,
        currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] },
      },
    });

    expect(appearsResolved.count).toBe(expectedAppearsResolved);
    expect(appearsResolved.drillDown).toEqual({
      path: "/queue",
      query: { appearsResolved: "true", active: "true" },
    });
  });

  // ==========================================
  // API-DSH-16: Staff Recent Lists (myRecentTickets & urgentTickets)
  // ==========================================
  it("API-DSH-16: Recent lists include myRecentTickets (owned by staff) and urgentTickets (HIGH priority active)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { myRecentTickets, urgentTickets } = res.body;

    expect(Array.isArray(myRecentTickets)).toBe(true);
    for (const t of myRecentTickets) {
      expect(t.owner?.id).toBe(staff1.id);
      expect(t.owner?.name).toBeDefined();
      expect(t.category?.id).toBeDefined();
      expect(t.category?.name).toBeDefined();
      expect(t.requester?.id).toBeDefined();
      expect(t.requester?.name).toBeDefined();
      expect(["Closed", "Cancelled"]).not.toContain(t.currentStatus);
    }

    expect(Array.isArray(urgentTickets)).toBe(true);
    for (let i = 0; i < urgentTickets.length; i++) {
      const t = urgentTickets[i];
      expect(t.itPriority).toBe("HIGH");
      expect(t.category?.id).toBeDefined();
      expect(t.category?.name).toBeDefined();
      expect(t.requester?.id).toBeDefined();
      expect(t.requester?.name).toBeDefined();
      expect(["Closed", "Cancelled"]).not.toContain(t.currentStatus);

      // Verify recency ordering: updatedAt DESC, id DESC
      if (i > 0) {
        const prev = urgentTickets[i - 1];
        const prevTime = new Date(prev.updatedAt).getTime();
        const currTime = new Date(t.updatedAt).getTime();
        expect(prevTime >= currTime).toBe(true);
        if (prevTime === currTime) {
          expect(prev.id > t.id).toBe(true);
        }
      }
    }
  });

  it("API-DSH-16b: Composition of status and active=true filters does not overwrite status", async () => {
    // Calling with both status=Open and active=true must return only Open tickets
    const res = await request(app)
      .get("/api/staff/tickets?status=Open&active=true")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    for (const t of res.body.data) {
      expect(t.currentStatus).toBe("Open");
    }

    // Calling with status=Closed and active=true must return 0 tickets (empty subset)
    const resClosed = await request(app)
      .get("/api/staff/tickets?status=Closed&active=true")
      .set("Cookie", staff1Cookie);

    expect(resClosed.status).toBe(200);
    expect(resClosed.body.meta.total).toBe(0);
    expect(resClosed.body.data).toEqual([]);
  });

  // ==========================================
  // API-DSH-17: Administrator Receives adminUserCounts
  // ==========================================
  it("API-DSH-17: Administrator receives adminUserCounts breakdown, while IT_STAFF receives null (BR-13)", async () => {
    // 1. Staff response -> adminUserCounts must be null
    const resStaff = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(resStaff.status).toBe(200);
    expect(resStaff.body.metrics.adminUserCounts).toBeNull();

    // 2. Admin response -> adminUserCounts must be fully populated
    const resAdmin = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", adminCookie);

    expect(resAdmin.status).toBe(200);
    const { adminUserCounts } = resAdmin.body.metrics;
    expect(adminUserCounts).not.toBeNull();
    expect(typeof adminUserCounts.total).toBe("number");
    expect(typeof adminUserCounts.active).toBe("number");
    expect(typeof adminUserCounts.requesters).toBe("number");
    expect(typeof adminUserCounts.staff).toBe("number");
    expect(typeof adminUserCounts.admins).toBe("number");

    expect(adminUserCounts.total).toBe(adminUserCounts.requesters + adminUserCounts.staff + adminUserCounts.admins);
  });

  // ==========================================
  // API-DSH-18: Role Guard (Requester -> 403)
  // ==========================================
  it("API-DSH-18: Requester calling /api/dashboard/staff receives 403 Forbidden (BR-15)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Forbidden");
  });

  // ==========================================
  // API-DSH-19: Unauthenticated / Expired -> 401
  // ==========================================
  it("API-DSH-19: Unauthenticated or expired token request receives 401 Unauthorized", async () => {
    const resNoAuth = await request(app).get("/api/dashboard/staff");
    expect(resNoAuth.status).toBe(401);

    const expiredCookie = makeAuthCookie(staff1.id, "-1s");
    const resExpired = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", expiredCookie);
    expect(resExpired.status).toBe(401);
  });

  // ==========================================
  // API-DSH-20: 1-to-1 Card to List Consistency (Queue)
  // ==========================================
  it("API-DSH-20: Calling GET /api/staff/tickets with drillDown.query params matches card count for every metric", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { unassigned, ownedByMe, appearsResolved, recentlyUpdated } = res.body.metrics;

    const cards = [
      { name: "unassigned", card: unassigned },
      { name: "ownedByMe", card: ownedByMe },
      { name: "appearsResolved", card: appearsResolved },
      { name: "recentlyUpdated", card: recentlyUpdated },
    ];

    for (const { card } of cards) {
      const { path, query } = card.drillDown;
      expect(path).toBe("/queue");

      const listRes = await request(app)
        .get("/api/staff/tickets")
        .query(query)
        .set("Cookie", staff1Cookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.meta.total).toBe(card.count);
    }
  });

  // ==========================================
  // API-DSH-21: Direct SQL Query Equivalence (Rubric Part 5)
  // ==========================================
  it("API-DSH-21: Direct SQL comparison: staff metric values match raw SQL prisma.$queryRaw results", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const { metrics } = res.body;

    // 1. Raw SQL for unassigned active tickets
    const sqlUnassigned: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "ownerId" IS NULL
        AND "currentStatus" NOT IN ('Closed', 'Cancelled')
    `;
    expect(metrics.unassigned.count).toBe(Number(sqlUnassigned[0].count));

    // 2. Raw SQL for ownedByMe active tickets
    const sqlOwnedByMe: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "ownerId" = ${staff1.id}
        AND "currentStatus" NOT IN ('Closed', 'Cancelled')
    `;
    expect(metrics.ownedByMe.count).toBe(Number(sqlOwnedByMe[0].count));

    // 3. Raw SQL for appearsResolved active tickets
    const sqlAppearsResolved: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "appearsResolved" = true
        AND "currentStatus" NOT IN ('Closed', 'Cancelled')
    `;
    expect(metrics.appearsResolved.count).toBe(Number(sqlAppearsResolved[0].count));

    // 4. Raw SQL for byPriority HIGH active tickets
    const sqlHighPriority: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "itPriority" = 'HIGH'
        AND "currentStatus" NOT IN ('Closed', 'Cancelled')
    `;
    expect(metrics.byPriority.HIGH).toBe(Number(sqlHighPriority[0].count));
  });

  // ==========================================
  // API-DSH-22: Deterministic Tiebreaker Ordering
  // ==========================================
  it("API-DSH-22: When updatedAt is identical, recent ticket items sort consistently by id DESC", async () => {
    const fixedTime = new Date();
    const tA = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-TIE-A",
        summary: "Tie A",
        description: "Tie test A",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requesterUser.id,
        ownerId: staff2.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    const tB = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-STAFF-DSH-TIE-B",
        summary: "Tie B",
        description: "Tie test B",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requesterUser.id,
        ownerId: staff2.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    await prisma.ticket.update({ where: { id: tA.id }, data: { updatedAt: fixedTime } });
    await prisma.ticket.update({ where: { id: tB.id }, data: { updatedAt: fixedTime } });

    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff2Cookie);

    expect(res.status).toBe(200);
    const ids = res.body.myRecentTickets.map((t: any) => t.id);
    const idxA = ids.indexOf(tA.id);
    const idxB = ids.indexOf(tB.id);

    // tB has higher id than tA, so tB should appear before tA
    expect(idxB).toBeLessThan(idxA);

    await prisma.ticket.deleteMany({
      where: { id: { in: [tA.id, tB.id] } },
    });
  });

  // ==========================================
  // API-DSH-23: Cache-Control Header
  // ==========================================
  it("API-DSH-23: Endpoint returns Cache-Control: no-store header", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/no-store/i);
  });

  // ==========================================
  // API-DSH-24: Public Security Projection
  // ==========================================
  it("API-DSH-24: Response objects expose only public user fields (id, name), omitting emails, roles, and passwordHash", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    for (const t of res.body.myRecentTickets) {
      if (t.owner) {
        expect(t.owner).toHaveProperty("id");
        expect(t.owner).toHaveProperty("name");
        expect(t.owner).not.toHaveProperty("email");
        expect(t.owner).not.toHaveProperty("passwordHash");
      }
      if (t.requester) {
        expect(t.requester).toHaveProperty("name");
        expect(t.requester).not.toHaveProperty("email");
        expect(t.requester).not.toHaveProperty("passwordHash");
      }
    }
  });
});
