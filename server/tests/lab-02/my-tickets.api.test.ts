import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("GET /api/tickets (My Tickets API)", () => {
  const prisma = getPrisma();
  let testRequesterId: number;
  let otherRequesterId: number;
  let testCategoryId: number;
  let testSystemId: number;

  beforeAll(async () => {
    // We assume the DB is seeded from setup.ts or seed.ts
    // Let's grab the first two active requesters
    const requesters = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    testRequesterId = requesters[0].id;
    otherRequesterId = requesters[1].id;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    testCategoryId = cat!.id;
    testSystemId = sys!.id;

    // Clear tickets before test
    await prisma.ticket.deleteMany({});

    // Seed some tickets for testRequester
    await prisma.ticket.createMany({
      data: [
        { ticketNumber: "TKT-2026-000001", requesterId: testRequesterId, categoryId: testCategoryId, relatedSystemId: testSystemId, summary: "Fix WiFi", description: "WiFi is down", requestedPriority: "HIGH", currentStatus: "New" },
        { ticketNumber: "TKT-2026-000002", requesterId: testRequesterId, categoryId: testCategoryId, relatedSystemId: testSystemId, summary: "Mouse broken", description: "Mouse clicks twice", requestedPriority: "LOW", currentStatus: "InProgress" },
        { ticketNumber: "TKT-2026-000003", requesterId: testRequesterId, categoryId: testCategoryId, relatedSystemId: testSystemId, summary: "Email issue", description: "Cannot send email", requestedPriority: "MEDIUM", currentStatus: "Resolved" },
        { ticketNumber: "TKT-2026-000004", requesterId: otherRequesterId, categoryId: testCategoryId, relatedSystemId: testSystemId, summary: "Printer jam", description: "Paper jam", requestedPriority: "LOW", currentStatus: "New" }
      ]
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
  });

  it("should return 401 if X-Requester-Id is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });

  it("should return only the requester's own tickets (AC-03)", async () => {
    const res = await request(app).get("/api/tickets").set("X-Requester-Id", testRequesterId.toString());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    
    // Make sure otherRequester's ticket is NOT here
    const hasOtherTicket = res.body.data.some((t: any) => t.ticketNumber === "TKT-2026-000004");
    expect(hasOtherTicket).toBe(false);
  });

  it("should filter tickets by search keyword (AC-07)", async () => {
    const res = await request(app)
      .get("/api/tickets?search=mouse")
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].summary).toBe("Mouse broken");
  });

  it("should filter tickets by status", async () => {
    const res = await request(app)
      .get("/api/tickets?status=Resolved")
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].currentStatus).toBe("Resolved");
  });

  it("should support pagination", async () => {
    const res = await request(app)
      .get("/api/tickets?limit=2&page=1")
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
  });
});
