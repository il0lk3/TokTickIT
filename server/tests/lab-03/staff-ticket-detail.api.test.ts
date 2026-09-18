import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("IT Staff Ticket Detail API", () => {
  let requesterCookie: string;
  let staffCookie: string;
  let adminCookie: string;
  let ticketId: number;
  let requesterId: number;
  let staffId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    
    // Create users
    const pwd = await bcrypt.hash("Password123!", 10);
    
    const reqUser = await prisma.user.create({
      data: { name: "Requester", email: `req-${Date.now()}@example.com`, passwordHash: pwd, role: "REQUESTER", isActive: true, requiresPasswordChange: false }
    });
    requesterId = reqUser.id;

    const staffUser = await prisma.user.create({
      data: { name: "IT Staff", email: `staff-${Date.now()}@example.com`, passwordHash: pwd, role: "IT_STAFF", isActive: true, requiresPasswordChange: false }
    });
    staffId = staffUser.id;

    const adminUser = await prisma.user.create({
      data: { name: "Admin", email: `admin-${Date.now()}@example.com`, passwordHash: pwd, role: "ADMINISTRATOR", isActive: true, requiresPasswordChange: false }
    });

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    
    const reqToken = jwt.sign({ id: reqUser.id }, jwtSecret, { expiresIn: '1h' });
    requesterCookie = `accessToken=${reqToken}`;

    const staffToken = jwt.sign({ id: staffUser.id }, jwtSecret, { expiresIn: '1h' });
    staffCookie = `accessToken=${staffToken}`;

    const adminToken = jwt.sign({ id: adminUser.id }, jwtSecret, { expiresIn: '1h' });
    adminCookie = `accessToken=${adminToken}`;

    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "Hardware", description: "Hardware" }});
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "PC", description: "PC" }});

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `T-${Date.now()}-DTL`,
        summary: "Detail ticket",
        description: "Test",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "New",
        requesterId: reqUser.id,
        categoryId: cat.id,
        relatedSystemId: sys.id
      }
    });
    ticketId = ticket.id;
  });

  it("should return 403 Forbidden for Requester", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", requesterCookie)
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(403);
  });

  it("should return 403 Forbidden for Admin", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", adminCookie)
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(403);
  });

  it("should reject invalid ownerId", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie)
      .send({ ownerId: requesterId }); // Requester ID
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Must be an active IT Staff");
  });

  it("should successfully set ownerId", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie)
      .send({ ownerId: staffId });
    expect(res.status).toBe(200);
    expect(res.body.ownerId).toBe(staffId);
  });

  it("should reject invalid status transition", async () => {
    // Current is New, try to go straight to Closed
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie)
      .send({ status: "Closed" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid status transition");
  });

  it("should successfully transition status", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie)
      .send({ status: "Open" });
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("Open");
  });

  it("should allow any state to Cancelled", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie)
      .send({ status: "Cancelled" });
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("Cancelled");
  });

  it("should fetch staff ticket detail (GET /api/staff/tickets/:id)", async () => {
    const res = await request(app)
      .get(`/api/staff/tickets/${ticketId}`)
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBeDefined();
    expect(res.body.internalNotes).toBeDefined();
  });

  it("should claim ticket via POST /api/staff/tickets/:id/claim", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${ticketId}/claim`)
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body.ownerId).toBe(staffId);
  });

  it("should fail to post notes to cancelled ticket", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${ticketId}/notes`)
      .set("Cookie", staffCookie)
      .send({ content: "This is a note on a cancelled ticket" });
    expect(res.status).toBe(400);
  });
});
