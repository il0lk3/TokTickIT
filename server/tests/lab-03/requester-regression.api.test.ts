import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

describe("API-16: Requester Regression & Isolation", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  let r1Id: number;
  let r2Id: number;
  let r1Token: string;
  let r2Token: string;
  
  let catId: number;
  let sysId: number;
  let r1TicketId: number;
  let r2TicketId: number;

  beforeAll(async () => {
    // 1. Create two isolated requesters
    const r1 = await prisma.user.create({ data: { name: "R1", email: `r1-${Date.now()}@reg.com`, passwordHash: "x", role: "REQUESTER", requiresPasswordChange: false }});
    const r2 = await prisma.user.create({ data: { name: "R2", email: `r2-${Date.now()}@reg.com`, passwordHash: "x", role: "REQUESTER", requiresPasswordChange: false }});
    r1Id = r1.id;
    r2Id = r2.id;
    
    r1Token = `accessToken=${jwt.sign({ id: r1Id }, secret, { expiresIn: "1h" })}`;
    r2Token = `accessToken=${jwt.sign({ id: r2Id }, secret, { expiresIn: "1h" })}`;

    const cat = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "CatReg" } });
    const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({ data: { name: "SysReg" } });
    catId = cat.id;
    sysId = sys.id;

    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REG-${Date.now()}`,
        summary: "R2 Ticket",
        description: "R2 Description",
        requestedPriority: "LOW",
        requesterId: r2Id,
        categoryId: catId,
        relatedSystemId: sysId
      }
    });
    r2TicketId = t2.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { ticketId: { in: [r1TicketId, r2TicketId].filter(id => id != null) } } });
    await prisma.ticket.deleteMany({ where: { requesterId: { in: [r1Id, r2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [r1Id, r2Id] } } });
  });

  it("AC-03: Create Ticket ignores client-supplied requesterId", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Cookie", r1Token)
      .send({
        categoryId: catId,
        relatedSystemId: sysId,
        requestedPriority: "HIGH",
        summary: "R1 Ticket",
        description: "R1 Desc",
        requesterId: r2Id // Malicious injection attempt
      });

    expect(res.status).toBe(201);
    expect(res.body.requesterId).toBe(r1Id); // Must be bound to R1, not R2!
    r1TicketId = res.body.id;
  });

  it("Ownership Isolation: R1 cannot read R2's ticket", async () => {
    const res = await request(app)
      .get(`/api/tickets/${r2TicketId}`)
      .set("Cookie", r1Token);
    expect(res.status).toBe(404); // Not Found to hide existence
  });

  it("Ownership Isolation: R1 cannot list R2's tickets", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("Cookie", r1Token);
    expect(res.status).toBe(200);
    // R1 should only see their own tickets
    const tickets = res.body.data;
    expect(tickets.length).toBe(1);
    expect(tickets[0].id).toBe(r1TicketId);
  });

  it("AC-14: Lab 2 Attachment Flow continuation", async () => {
    // 1. Upload attachment
    const testFilePath = path.join(process.cwd(), 'test-upload.pdf');
    fs.writeFileSync(testFilePath, "test file content");

    const uploadRes = await request(app)
      .post(`/api/tickets/${r1TicketId}/attachments`)
      .set("Cookie", r1Token)
      .attach('file', testFilePath);
    
    fs.unlinkSync(testFilePath);
    
    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.id;

    // 2. R2 cannot download R1's attachment
    const r2Download = await request(app)
      .get(`/api/tickets/${r1TicketId}/attachments/${attachmentId}/download`)
      .set("Cookie", r2Token);
    expect(r2Download.status).toBe(404);

    // 3. R2 cannot delete R1's attachment
    const r2Delete = await request(app)
      .delete(`/api/tickets/${r1TicketId}/attachments/${attachmentId}`)
      .set("Cookie", r2Token)
      .send({ reason: "Malicious delete" });
    expect(r2Delete.status).toBe(404);

    // 4. R1 can delete their own attachment
    const r1Delete = await request(app)
      .delete(`/api/tickets/${r1TicketId}/attachments/${attachmentId}`)
      .set("Cookie", r1Token)
      .send({ reason: "Done testing" });
    expect(r1Delete.status).toBe(200);
  });
});
