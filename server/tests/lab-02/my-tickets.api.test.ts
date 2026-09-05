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
    // Create isolated requesters for this test to avoid conflicts with seeded DB data
    const testUser1 = await prisma.requesterUser.create({ data: { name: "Test MyTickets 1", email: `test1-${Date.now()}@test.com` }});
    const testUser2 = await prisma.requesterUser.create({ data: { name: "Test MyTickets 2", email: `test2-${Date.now()}@test.com` }});
    testRequesterId = testUser1.id;
    otherRequesterId = testUser2.id;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    testCategoryId = cat!.id;
    testSystemId = sys!.id;

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
    // Clean up
    await prisma.ticket.deleteMany({
      where: { requesterId: { in: [testRequesterId, otherRequesterId] } }
    });
    await prisma.requesterUser.deleteMany({
      where: { id: { in: [testRequesterId, otherRequesterId] } }
    });
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

  it("should filter tickets by categoryId", async () => {
    const res = await request(app)
      .get(`/api/tickets?categoryId=${testCategoryId}`)
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it("should filter tickets by requestedPriority", async () => {
    const res = await request(app)
      .get("/api/tickets?requestedPriority=HIGH")
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].requestedPriority).toBe("HIGH");
  });

  it("should sort tickets", async () => {
    const res = await request(app)
      .get("/api/tickets?sortBy=requestedPriority&sortOrder=asc")
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.data[0].requestedPriority).toBe("LOW"); // Sorts by ENUM definition order or DB rule
    expect(res.body.data[1].requestedPriority).toBe("MEDIUM");
    expect(res.body.data[2].requestedPriority).toBe("HIGH");
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
