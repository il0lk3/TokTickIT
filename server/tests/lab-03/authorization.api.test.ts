import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("API-04 to API-06: Authorization", () => {
  const prisma = getPrisma();
  let testUserId: number;
  let authCookie: string;
  let testTicketId: number;

  beforeAll(async () => {
    const hash = await bcrypt.hash("Password123!", 10);
    const user = await prisma.user.create({
      data: {
        name: "AuthZ User",
        email: `authz-${Date.now()}@test.com`,
        passwordHash: hash,
        role: "REQUESTER",
        isActive: true,
        requiresPasswordChange: true
      }
    });
    testUserId = user.id;

    // Create a fake token directly for testing
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: "2h" });
    authCookie = `accessToken=${token}`;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-AUTHZ-000001",
        summary: "AuthZ Test Ticket",
        description: "Test",
        requesterId: user.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "New"
      }
    });
    testTicketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it("should block normal API endpoints when requiresPasswordChange is true (AC-02)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("Cookie", authCookie);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Password change required");
  });

  it("should allow /me when requiresPasswordChange is true", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", authCookie);
    expect(res.status).toBe(200);
  });

  // AC-03 is partially covered by Lab 2 regression, but we can verify it here.
  // Lab 2 endpoints use res.locals.requesterId mapped from user.id
  it("should not allow accessing another user's ticket", async () => {
    // First, clear requiresPasswordChange so we can access tickets
    await prisma.user.update({
      where: { id: testUserId },
      data: { requiresPasswordChange: false }
    });

    // Create a ticket for someone else
    const otherUser = await prisma.user.create({
      data: {
        name: "Other User",
        email: `other-${Date.now()}@test.com`,
        passwordHash: "dummy",
        role: "REQUESTER",
        isActive: true,
        requiresPasswordChange: false
      }
    });
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-AUTHZ-000002",
        summary: "Other Ticket",
        description: "Test",
        requesterId: otherUser.id,
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "New"
      }
    });

    const res = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set("Cookie", authCookie);
    
    // In Lab 2, requesting another user's ticket returns 404 (or 403)
    expect(res.status).toBe(404);

    await prisma.ticket.delete({ where: { id: ticket.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

describe("Comprehensive Authorization Sweep", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  let rToken: string;
  let sToken: string;
  let aToken: string;
  let rId: number, sId: number, aId: number;
  let ticketId: number;

  beforeAll(async () => {
    const r = await prisma.user.create({ data: { name: "R", email: `rsweep-${Date.now()}@test.com`, passwordHash: "x", role: "REQUESTER", isActive: true, requiresPasswordChange: false }});
    const s = await prisma.user.create({ data: { name: "S", email: `ssweep-${Date.now()}@test.com`, passwordHash: "x", role: "IT_STAFF", isActive: true, requiresPasswordChange: false }});
    const a = await prisma.user.create({ data: { name: "A", email: `asweep-${Date.now()}@test.com`, passwordHash: "x", role: "ADMINISTRATOR", isActive: true, requiresPasswordChange: false }});
    
    rId = r.id; sId = s.id; aId = a.id;
    rToken = `accessToken=${jwt.sign({ id: rId }, secret, { expiresIn: "1h" })}`;
    sToken = `accessToken=${jwt.sign({ id: sId }, secret, { expiresIn: "1h" })}`;
    aToken = `accessToken=${jwt.sign({ id: aId }, secret, { expiresIn: "1h" })}`;

    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "CatTest" } });
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "SysTest" } });

    const ticket = await prisma.ticket.create({
      data: { ticketNumber: `SWEEP-${Date.now()}`, summary: "Sweep", description: "Sweep", requestedPriority: "LOW", itPriority: "LOW", currentStatus: "New", requesterId: rId, categoryId: cat.id, relatedSystemId: sys.id }
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { id: ticketId } });
    await prisma.user.deleteMany({ where: { id: { in: [rId, sId, aId] } } });
  });

  const routes = [
    { path: "/api/tickets", method: "get", allowed: ["REQUESTER"] },
    { path: "/api/tickets", method: "post", allowed: ["REQUESTER"] },
    { path: `/api/tickets/1`, method: "get", allowed: ["REQUESTER", "IT_STAFF"] },
    { path: `/api/tickets/1`, method: "patch", allowed: ["REQUESTER"] },
    { path: `/api/staff/tickets`, method: "get", allowed: ["IT_STAFF"] },
    { path: `/api/staff/tickets/1`, method: "get", allowed: ["IT_STAFF"] },
    { path: `/api/staff/tickets/1`, method: "patch", allowed: ["IT_STAFF"] },
    { path: `/api/admin/users`, method: "get", allowed: ["ADMINISTRATOR"] },
    { path: `/api/admin/users`, method: "post", allowed: ["ADMINISTRATOR"] },
    { path: `/api/admin/users/1`, method: "patch", allowed: ["ADMINISTRATOR"] }
  ];

  it("should return 401 Unauthorized for all protected routes without a session", async () => {
    for (const route of routes) {
      const res = await request(app)[route.method as "get"|"post"|"patch"](route.path).send({});
      expect(res.status).toBe(401);
    }
  });

  it("should return 403 Forbidden when accessing with the wrong role", async () => {
    const roles = {
      REQUESTER: rToken,
      IT_STAFF: sToken,
      ADMINISTRATOR: aToken
    };

    for (const route of routes) {
      for (const [role, token] of Object.entries(roles)) {
        if (!route.allowed.includes(role)) {
          const res = await request(app)[route.method as "get"|"post"|"patch"](route.path)
            .set("Cookie", token)
            .send({});
          if (res.status !== 403) {
            throw new Error(`Expected 403 for ${role} on ${route.method.toUpperCase()} ${route.path}, but got ${res.status}`);
          }
        }
      }
    }
  });
});
