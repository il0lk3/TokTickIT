import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

describe("Lab 4 Issue 9: Staff Queue UNSET Priority Support (SRV-UNSET)", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  function makeAuthCookie(userId: number) {
    return `accessToken=${jwt.sign({ id: userId }, secret, { expiresIn: "2h" })}`;
  }

  let staffUser: { id: number; email: string };
  let staffCookie: string;
  let testCatId: number;
  let testSysId: number;
  let requesterId: number;

  beforeAll(async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    testCatId = cat.id;
    testSysId = sys.id;

    staffUser = await prisma.user.upsert({
      where: { email: "queue.unset.staff@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "queue.unset.staff@example.com",
        name: "Queue Unset Staff",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });
    staffCookie = makeAuthCookie(staffUser.id);

    const requester = await prisma.user.upsert({
      where: { email: "queue.unset.req@example.com" },
      update: { isActive: true },
      create: {
        email: "queue.unset.req@example.com",
        name: "Queue Unset Requester",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
      },
    });
    requesterId = requester.id;

    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-UNSET-TEST-${Date.now()}`,
        summary: "Ticket for queue priority testing",
        description: "Testing UNSET query filter in queue",
        currentStatus: "Open",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        requesterId,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
  });

  it("SRV-UNSET-01: GET /api/staff/tickets?itPriority=UNSET&active=true accepts UNSET without 400 and returns valid list response", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?itPriority=UNSET&active=true")
      .set("Cookie", staffCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(typeof res.body.meta.total).toBe("number");
    for (const ticket of res.body.data) {
      expect(ticket.itPriority).toBeNull();
    }
  });

  it("SRV-UNSET-02: GET /api/staff/tickets?itPriority=INVALID returns 400 INVALID_PRIORITY", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?itPriority=INVALID")
      .set("Cookie", staffCookie);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PRIORITY");
  });
});
