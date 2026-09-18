import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { getPrisma } from "../../src/prisma";
import jwt from "jsonwebtoken";

describe("IT Staff Ticket Queue API", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  let staffCookie: string;
  let requesterCookie: string;
  let adminCookie: string;

  let staffId: number;
  let requesterId: number;
  let adminId: number;

  beforeAll(async () => {
    const s = await prisma.user.create({ data: { name: "Staff", email: `s-${Date.now()}@test.com`, passwordHash: "x", role: "IT_STAFF", requiresPasswordChange: false }});
    const r = await prisma.user.create({ data: { name: "Requester", email: `r-${Date.now()}@test.com`, passwordHash: "x", role: "REQUESTER", requiresPasswordChange: false }});
    const a = await prisma.user.create({ data: { name: "Admin", email: `a-${Date.now()}@test.com`, passwordHash: "x", role: "ADMINISTRATOR", requiresPasswordChange: false }});

    staffId = s.id;
    requesterId = r.id;
    adminId = a.id;

    staffCookie = `accessToken=${jwt.sign({ id: staffId }, secret, { expiresIn: "1h" })}`;
    requesterCookie = `accessToken=${jwt.sign({ id: requesterId }, secret, { expiresIn: "1h" })}`;
    adminCookie = `accessToken=${jwt.sign({ id: adminId }, secret, { expiresIn: "1h" })}`;

    // Create tickets for testing
    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "QueueTest" } });
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "QueueTestSys" } });
    
    await prisma.ticket.create({ data: { ticketNumber: `T-1`, summary: "S1", description: "D1", currentStatus: "New", requestedPriority: "LOW", itPriority: "LOW", requesterId, categoryId: cat.id, relatedSystemId: sys.id } });
    await prisma.ticket.create({ data: { ticketNumber: `T-2`, summary: "S2", description: "D2", currentStatus: "Open", requestedPriority: "HIGH", itPriority: "HIGH", ownerId: staffId, requesterId, categoryId: cat.id, relatedSystemId: sys.id } });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { requesterId } });
    await prisma.user.deleteMany({ where: { id: { in: [staffId, requesterId, adminId] } } });
  });

  it("should return 401 Unauthorized without session", async () => {
    const res = await request(app).get("/api/staff/tickets");
    expect(res.status).toBe(401);
  });

  it("should return 403 Forbidden for Requester", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", requesterCookie);
    expect(res.status).toBe(403);
  });

  it("should return 403 Forbidden for Administrator", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(403);
  });

  it("should allow IT Staff and return paginated tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", staffCookie);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
  });

  it("should filter tickets by status and ownerId=unassigned", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=New&ownerId=unassigned")
      .set("Cookie", staffCookie);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const ticket of res.body.data) {
      expect(ticket.currentStatus).toBe("New");
      expect(ticket.ownerId).toBeNull();
    }
  });

  it("should reject limit > 50 with 400", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?limit=100")
      .set("Cookie", staffCookie);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid limit");
  });

  it("should reject invalid sortBy parameter with 400", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?sortBy=passwordHash")
      .set("Cookie", staffCookie);
    
    expect(res.status).toBe(400);
  });
});
