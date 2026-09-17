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
