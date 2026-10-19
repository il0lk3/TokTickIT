import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { TicketPriority, TicketStatus, Role } from "@prisma/client";

describe("Lab 4 Issue 8: Requester Dashboard API (API-DSH-01 to API-DSH-10)", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  function makeAuthCookie(userId: number, expiresIn: any = "2h") {
    return `accessToken=${jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as any })}`;
  }

  let requesterA: { id: number; name: string; email: string };
  let requesterB: { id: number; name: string; email: string };
  let emptyRequester: { id: number; name: string; email: string };
  let staffUser: { id: number; name: string; email: string };
  let adminUser: { id: number; name: string; email: string };

  let requesterACookie: string;
  let requesterBCookie: string;
  let emptyRequesterCookie: string;
  let staffCookie: string;
  let adminCookie: string;

  let testCatId: number;
  let testSysId: number;

  beforeAll(async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    testCatId = cat.id;
    testSysId = sys.id;

    // Create / upsert dedicated test users
    requesterA = await prisma.user.upsert({
      where: { email: "dsh.reqA@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.reqA@example.com",
        name: "Dashboard Requester A",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requesterB = await prisma.user.upsert({
      where: { email: "dsh.reqB@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.reqB@example.com",
        name: "Dashboard Requester B",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    emptyRequester = await prisma.user.upsert({
      where: { email: "dsh.reqEmpty@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.reqEmpty@example.com",
        name: "Dashboard Requester Empty",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    staffUser = await prisma.user.upsert({
      where: { email: "dsh.staff1@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.staff1@example.com",
        name: "Dashboard Staff One",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "dsh.admin1@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "dsh.admin1@example.com",
        name: "Dashboard Admin One",
        passwordHash: "hash",
        role: Role.ADMINISTRATOR,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requesterACookie = makeAuthCookie(requesterA.id);
    requesterBCookie = makeAuthCookie(requesterB.id);
    emptyRequesterCookie = makeAuthCookie(emptyRequester.id);
    staffCookie = makeAuthCookie(staffUser.id);
    adminCookie = makeAuthCookie(adminUser.id);

    // Clean up any pre-existing tickets for test users
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [requesterA.id, requesterB.id, emptyRequester.id] } },
    });

    // Seed specific tickets for Requester A
    // 1. New ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-001`,
        summary: "ReqA New Ticket",
        description: "New ticket description",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.New,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 2. Open ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-002`,
        summary: "ReqA Open Ticket",
        description: "Open ticket description",
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        currentStatus: TicketStatus.Open,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 3. Reopened ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-003`,
        summary: "ReqA Reopened Ticket",
        description: "Reopened ticket description",
        requestedPriority: TicketPriority.HIGH,
        itPriority: TicketPriority.HIGH,
        currentStatus: TicketStatus.Reopened,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 4. InProgress ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-004`,
        summary: "ReqA InProgress Ticket",
        description: "InProgress ticket description",
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        currentStatus: TicketStatus.InProgress,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 5. WaitingForRequester ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-005`,
        summary: "ReqA Waiting Ticket",
        description: "Waiting ticket description",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.WaitingForRequester,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // 6. Recently Resolved ticket (updated 2 days ago)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const resolvedRecent = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-006`,
        summary: "ReqA Recently Resolved Ticket",
        description: "Resolved ticket description",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Resolved,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({
      where: { id: resolvedRecent.id },
      data: { updatedAt: twoDaysAgo },
    });

    // 7. Old Resolved ticket (updated 10 days ago -> outside 7-day rolling window)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const resolvedOld = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-007`,
        summary: "ReqA Old Resolved Ticket",
        description: "Old resolved ticket description",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Resolved,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({
      where: { id: resolvedOld.id },
      data: { updatedAt: tenDaysAgo },
    });

    // 8. Closed ticket
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-008`,
        summary: "ReqA Closed Ticket",
        description: "Closed ticket description",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Closed,
        requesterId: requesterA.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });

    // Seed tickets for Requester B (Isolation verification)
    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-009`,
        summary: "ReqB Open Ticket",
        description: "ReqB ticket description",
        requestedPriority: TicketPriority.HIGH,
        itPriority: TicketPriority.HIGH,
        currentStatus: TicketStatus.Open,
        requesterId: requesterB.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [requesterA.id, requesterB.id, emptyRequester.id] } },
    });
  });

  // ==========================================
  // API-DSH-01: Requester Retrieves Metrics
  // ==========================================
  it("API-DSH-01: Requester retrieves dashboard metrics with structured drill-down and normalized counters", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("metrics");
    expect(res.body).toHaveProperty("recentTickets");
    expect(res.body).toHaveProperty("attentionTickets");
    expect(res.body).toHaveProperty("generatedAt");

    const { metrics } = res.body;
    // openRequests = New(1) + Open(1) + Reopened(1) = 3
    expect(metrics.openRequests.count).toBe(3);
    expect(metrics.openRequests.drillDown).toEqual({
      path: "/tickets",
      query: { status: "New,Open,Reopened" },
    });

    // inProgress = 1
    expect(metrics.inProgress.count).toBe(1);
    expect(metrics.inProgress.drillDown).toEqual({
      path: "/tickets",
      query: { status: "InProgress" },
    });

    // waitingForRequester = 1
    expect(metrics.waitingForRequester.count).toBe(1);
    expect(metrics.waitingForRequester.drillDown).toEqual({
      path: "/tickets",
      query: { status: "WaitingForRequester" },
    });

    // recentlyResolved = 1 (TKT-DSH-006 is 2 days old; TKT-DSH-007 is 10 days old)
    expect(metrics.recentlyResolved.count).toBe(1);
    expect(metrics.recentlyResolved.drillDown.path).toBe("/tickets");
    expect(metrics.recentlyResolved.drillDown.query.status).toBe("Resolved");
    expect(metrics.recentlyResolved.drillDown.query).toHaveProperty("updatedSince");

    // closed = 1
    expect(metrics.closed.count).toBe(1);
    expect(metrics.closed.drillDown).toEqual({
      path: "/tickets",
      query: { status: "Closed" },
    });

    // Assert shape: category includes id and name
    expect(res.body.recentTickets.length).toBeGreaterThan(0);
    for (const t of res.body.recentTickets) {
      expect(t.category).toHaveProperty("id");
      expect(t.category).toHaveProperty("name");
    }
    expect(res.body.attentionTickets.length).toBeGreaterThan(0);
    for (const t of res.body.attentionTickets) {
      expect(t.category).toHaveProperty("id");
      expect(t.category).toHaveProperty("name");
    }
  });

  // ==========================================
  // API-DSH-02: Tenant Isolation
  // ==========================================
  it("API-DSH-02: Tenant isolation - Requester A receives zero metrics or tickets belonging to Requester B (AC-02)", async () => {
    const resA = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterACookie);
    expect(resA.status).toBe(200);

    const resB = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterBCookie);
    expect(resB.status).toBe(200);

    // Requester B has exactly 1 Open ticket
    expect(resB.body.metrics.openRequests.count).toBe(1);
    expect(resB.body.metrics.inProgress.count).toBe(0);
    expect(resB.body.metrics.recentlyResolved.count).toBe(0);
    expect(resB.body.recentTickets.length).toBe(1);
    expect(resB.body.recentTickets[0].ticketNumber).toBe("TKT-DSH-009");

    // Requester A's recent tickets should not contain ReqB's ticket
    const resATicketNumbers = resA.body.recentTickets.map((t: any) => t.ticketNumber);
    expect(resATicketNumbers).not.toContain("TKT-DSH-009");
  });

  // ==========================================
  // API-DSH-03: Zero Tickets Empty State
  // ==========================================
  it("API-DSH-03: Requester with zero tickets receives all metric counts equal to 0, empty lists, and no nulls (AC-08)", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", emptyRequesterCookie);

    expect(res.status).toBe(200);
    const { metrics, recentTickets, attentionTickets } = res.body;

    expect(metrics.openRequests.count).toBe(0);
    expect(metrics.inProgress.count).toBe(0);
    expect(metrics.waitingForRequester.count).toBe(0);
    expect(metrics.recentlyResolved.count).toBe(0);
    expect(metrics.closed.count).toBe(0);

    expect(recentTickets).toEqual([]);
    expect(attentionTickets).toEqual([]);
  });

  // ==========================================
  // API-DSH-04: Rolling 7-day Boundary Precision
  // ==========================================
  it("API-DSH-04: Rolling 7-day boundary precision for recentlyResolved (6d 23h included, 7d 1h excluded)", async () => {
    const now = Date.now();
    const justInside7d = new Date(now - (7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000)); // 6d 23h ago
    const justOutside7d = new Date(now - (7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)); // 7d 1h ago

    const tInside = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-BND-INSIDE`,
        summary: "Inside 7d ticket",
        description: "Test boundary",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Resolved,
        requesterId: emptyRequester.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({ where: { id: tInside.id }, data: { updatedAt: justInside7d } });

    const tOutside = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DSH-BND-OUTSIDE`,
        summary: "Outside 7d ticket",
        description: "Test boundary",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Resolved,
        requesterId: emptyRequester.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    await prisma.ticket.update({ where: { id: tOutside.id }, data: { updatedAt: justOutside7d } });

    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", emptyRequesterCookie);

    expect(res.status).toBe(200);
    // Only the tInside ticket should be counted
    expect(res.body.metrics.recentlyResolved.count).toBe(1);

    // Clean up boundary test tickets
    await prisma.ticket.deleteMany({
      where: { id: { in: [tInside.id, tOutside.id] } },
    });
  });

  // ==========================================
  // API-DSH-05: Requester Attention Tickets List
  // ==========================================
  it("API-DSH-05: attentionTickets list contains active tickets in WaitingForRequester status", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.attentionTickets)).toBe(true);
    expect(res.body.attentionTickets.length).toBeGreaterThanOrEqual(1);

    for (const t of res.body.attentionTickets) {
      expect(t.currentStatus).toBe("WaitingForRequester");
      expect(t).toHaveProperty("ticketNumber");
      expect(t).toHaveProperty("summary");
      expect(t).toHaveProperty("category.name");
    }
  });

  // ==========================================
  // API-DSH-06: Role Guard (Staff/Admin -> 403)
  // ==========================================
  it("API-DSH-06: IT Staff and Administrator calling /api/dashboard/requester receive 403 Forbidden (BR-15)", async () => {
    const resStaff = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", staffCookie);
    expect(resStaff.status).toBe(403);
    expect(resStaff.body.error).toContain("Forbidden");

    const resAdmin = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", adminCookie);
    expect(resAdmin.status).toBe(403);
    expect(resAdmin.body.error).toContain("Forbidden");
  });

  // ==========================================
  // API-DSH-07: Unauthenticated / Expired -> 401
  // ==========================================
  it("API-DSH-07: Unauthenticated or expired token request receives 401 Unauthorized", async () => {
    const resNoToken = await request(app).get("/api/dashboard/requester");
    expect(resNoToken.status).toBe(401);

    const expiredCookie = makeAuthCookie(requesterA.id, "-1s");
    const resExpired = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", expiredCookie);
    expect(resExpired.status).toBe(401);
  });

  // ==========================================
  // API-DSH-08: Query Parameter userId Ignored
  // ==========================================
  it("API-DSH-08: Isolation check: query parameter ?userId=<other> is strictly ignored", async () => {
    const res = await request(app)
      .get(`/api/dashboard/requester?userId=${requesterB.id}`)
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    // Must return Requester A metrics (3 open requests), not Requester B (1 open request)
    expect(res.body.metrics.openRequests.count).toBe(3);
  });

  // ==========================================
  // API-DSH-09: 1-to-1 Card to List Consistency
  // ==========================================
  it("API-DSH-09: Calling GET /api/tickets with drillDown.query params matches card count for every metric", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    const { metrics } = res.body;

    for (const [key, card] of Object.entries(metrics) as [string, any][]) {
      const { path, query } = card.drillDown;
      expect(path).toBe("/tickets");

      const listRes = await request(app)
        .get("/api/tickets")
        .query(query)
        .set("Cookie", requesterACookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body.meta.total).toBe(card.count);
    }
  });

  it("API-DSH-09b: Composition of status and active=true filters does not overwrite status on GET /api/tickets", async () => {
    const res = await request(app)
      .get("/api/tickets?status=Open&active=true")
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    for (const t of res.body.data) {
      expect(t.currentStatus).toBe("Open");
    }

    const resClosed = await request(app)
      .get("/api/tickets?status=Closed&active=true")
      .set("Cookie", requesterACookie);

    expect(resClosed.status).toBe(200);
    expect(resClosed.body.meta.total).toBe(0);
    expect(resClosed.body.data).toEqual([]);
  });

  // ==========================================
  // API-DSH-10: Direct SQL Query Equivalence (Rubric Part 5)
  // ==========================================
  it("API-DSH-10: Direct SQL comparison: metric values match raw SQL prisma.$queryRaw results", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterACookie);

    expect(res.status).toBe(200);
    const { metrics } = res.body;

    // 1. Raw SQL for openRequests: status in ('New', 'Open', 'Reopened')
    const sqlOpen: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "requesterId" = ${requesterA.id}
        AND "currentStatus" IN ('New', 'Open', 'Reopened')
    `;
    expect(metrics.openRequests.count).toBe(Number(sqlOpen[0].count));

    // 2. Raw SQL for inProgress (Postgres enum value is 'In Progress')
    const sqlProgress: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "requesterId" = ${requesterA.id}
        AND "currentStatus" = 'In Progress'
    `;
    expect(metrics.inProgress.count).toBe(Number(sqlProgress[0].count));

    // 3. Raw SQL for waitingForRequester (Postgres enum value is 'Waiting for Requester')
    const sqlWaiting: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "requesterId" = ${requesterA.id}
        AND "currentStatus" = 'Waiting for Requester'
    `;
    expect(metrics.waitingForRequester.count).toBe(Number(sqlWaiting[0].count));

    // 4. Raw SQL for recentlyResolved (within rolling 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sqlResolved: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "requesterId" = ${requesterA.id}
        AND "currentStatus" = 'Resolved'
        AND "updatedAt" >= ${sevenDaysAgo}
    `;
    expect(metrics.recentlyResolved.count).toBe(Number(sqlResolved[0].count));

    // 5. Raw SQL for closed
    const sqlClosed: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "requesterId" = ${requesterA.id}
        AND "currentStatus" = 'Closed'
    `;
    expect(metrics.closed.count).toBe(Number(sqlClosed[0].count));
  });
});
