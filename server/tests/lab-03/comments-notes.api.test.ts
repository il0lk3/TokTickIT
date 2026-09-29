import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

describe("API-07, API-08, API-19: Comments & Notes", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  let requester1Id: number;
  let requester2Id: number;
  let staffId: number;
  let adminId: number;
  let ticketId: number;

  let req1Token: string;
  let req2Token: string;
  let staffToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // 1. Create users
    const r1 = await prisma.user.create({ data: { name: "R1", email: `r1-${Date.now()}@test.com`, passwordHash: "x", role: "REQUESTER", requiresPasswordChange: false }});
    const r2 = await prisma.user.create({ data: { name: "R2", email: `r2-${Date.now()}@test.com`, passwordHash: "x", role: "REQUESTER", requiresPasswordChange: false }});
    const s = await prisma.user.create({ data: { name: "Staff", email: `s-${Date.now()}@test.com`, passwordHash: "x", role: "IT_STAFF", requiresPasswordChange: false }});
    const a = await prisma.user.create({ data: { name: "Admin", email: `a-${Date.now()}@test.com`, passwordHash: "x", role: "ADMINISTRATOR", requiresPasswordChange: false }});

    requester1Id = r1.id;
    requester2Id = r2.id;
    staffId = s.id;
    adminId = a.id;

    req1Token = `accessToken=${jwt.sign({ id: requester1Id }, secret, { expiresIn: "1h" })}`;
    req2Token = `accessToken=${jwt.sign({ id: requester2Id }, secret, { expiresIn: "1h" })}`;
    staffToken = `accessToken=${jwt.sign({ id: staffId }, secret, { expiresIn: "1h" })}`;
    adminToken = `accessToken=${jwt.sign({ id: adminId }, secret, { expiresIn: "1h" })}`;

    // 2. Create category/system and ticket
    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "CatTest" } });
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "SysTest" } });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TEST-${Date.now()}`,
        summary: "Comment test ticket",
        description: "Test",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "New",
        requesterId: requester1Id,
        categoryId: cat.id,
        relatedSystemId: sys.id
      }
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.internalNote.deleteMany({ where: { ticketId } });
    await prisma.publicComment.deleteMany({ where: { ticketId } });
    await prisma.ticket.deleteMany({ where: { id: ticketId } });
    await prisma.user.deleteMany({ where: { id: { in: [requester1Id, requester2Id, staffId, adminId] } } });
  });

  describe("API-07: Public comment access", () => {
    it("Requester can post comment on own ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", req1Token)
        .send({ content: "Hello from R1" });
      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Hello from R1");
      expect(res.body.authorId).toBe(requester1Id);
    });

    it("IT Staff can post comment on any ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", staffToken)
        .send({ content: "Hello from Staff" });
      expect(res.status).toBe(201);
      expect(res.body.authorId).toBe(staffId);
    });

    it("Requester gets 404/403 when posting on someone else's ticket", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", req2Token)
        .send({ content: "Sneaky comment" });
      expect(res.status).toBe(404); // Hidden
    });

    it("Admin gets 403 when posting comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", adminToken)
        .send({ content: "Admin here" });
      expect(res.status).toBe(403);
    });
  });

  describe("API-08: Internal Notes", () => {
    it("IT Staff can post internal note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", staffToken)
        .send({ content: "Staff private note" });
      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Staff private note");
    });

    it("Requester gets 403 when trying to post internal note (AC-04)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", req1Token)
        .send({ content: "Requester sneaking in" });
      expect(res.status).toBe(403);
    });

    it("Admin gets 403 when trying to post internal note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", adminToken)
        .send({ content: "Admin note" });
      expect(res.status).toBe(403);
    });
  });

  describe("API-19: Validation (AC-13)", () => {
    it("Rejects empty comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", req1Token)
        .send({ content: "   " });
      expect(res.status).toBe(400);
    });

    it("Rejects over-length note", async () => {
      const longText = "a".repeat(1001);
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", staffToken)
        .send({ content: longText });
      expect(res.status).toBe(400);
    });
  });

  describe("Terminal Status Guards & Appears Resolved", () => {
    it("Requester can mark ticket as appears resolved", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticketId}/appears-resolved`)
        .set("Cookie", req1Token)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.ticket.appearsResolved).toBe(true);
      expect(res.body.comment.content).toBe("The problem appears to be resolved.");
    });

    it("Rejects repeated marking of appears resolved", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticketId}/appears-resolved`)
        .set("Cookie", req1Token)
        .send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Ticket is already marked as appears resolved");
    });

    it("Sets ticket to Resolved manually (by IT staff) to test terminal guards", async () => {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { currentStatus: "Resolved" }
      });
    });

    it("Rejects posting comments on Resolved tickets", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", req1Token)
        .send({ content: "Too late" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot add comments to a closed or resolved ticket");
    });

    it("Rejects posting notes on Resolved tickets", async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", staffToken)
        .send({ content: "Too late note" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot add notes to a closed or resolved ticket");
    });

    it("Rejects appears-resolved on Resolved tickets", async () => {
      // First unmark appearsResolved so we can test the terminal status guard
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { appearsResolved: false }
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticketId}/appears-resolved`)
        .set("Cookie", req1Token)
        .send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Ticket is already closed or resolved");
    });
  });
});
