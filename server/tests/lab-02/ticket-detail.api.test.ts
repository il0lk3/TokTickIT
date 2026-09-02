import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import path from "path";
import fs from "fs";

describe("Ticket Detail & Attachments API", () => {
  const prisma = getPrisma();
  let testRequesterId: number;
  let testTicketId: number;
  let otherRequesterId: number;

  beforeAll(async () => {
    const requesters = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    testRequesterId = requesters[0].id;
    otherRequesterId = requesters[1].id;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TKT-2026-DETAIL",
        requesterId: testRequesterId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        summary: "Test Detail",
        description: "Test Description",
        requestedPriority: "MEDIUM",
        currentStatus: "New"
      }
    });
    testTicketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});
  });

  it("should get ticket details for owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe("Test Detail");
    expect(res.body.category).toBeDefined();
    expect(res.body.attachments).toBeDefined();
  });

  it("should deny ticket details for non-owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("X-Requester-Id", otherRequesterId.toString());
    
    expect(res.status).toBe(404);
  });

  it("should upload an attachment", async () => {
    // create a dummy file
    const filePath = path.join(process.cwd(), "test-file.txt");
    fs.writeFileSync(filePath, "Hello World");

    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set("X-Requester-Id", testRequesterId.toString())
      // Multer file filter allows only image/jpeg, image/png, image/webp, application/pdf
      // We will pretend it's a PDF to bypass the filter
      .attach("file", filePath, { contentType: "application/pdf" });
    
    fs.unlinkSync(filePath);

    expect(res.status).toBe(201);
    expect(res.body.originalName).toBe("test-file.txt");
    expect(res.body.mimeType).toBe("application/pdf");
  });

  it("should reject invalid file types", async () => {
    const filePath = path.join(process.cwd(), "test-file2.txt");
    fs.writeFileSync(filePath, "Hello World");

    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set("X-Requester-Id", testRequesterId.toString())
      .attach("file", filePath, { contentType: "text/plain" }); // Invalid mime type
    
    fs.unlinkSync(filePath);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type/);
  });

  it("should allow soft removal of attachment", async () => {
    // First, fetch the ticket to get the attachment ID
    const getRes = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("X-Requester-Id", testRequesterId.toString());
    
    const attachmentId = getRes.body.attachments[0].id;

    const delRes = await request(app)
      .delete(`/api/tickets/${testTicketId}/attachments/${attachmentId}`)
      .set("X-Requester-Id", testRequesterId.toString())
      .send({ reason: "Accidental upload" });
    
    expect(delRes.status).toBe(200);

    // Verify it is removed
    const checkRes = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(checkRes.body.attachments[0].isRemoved).toBe(true);
    expect(checkRes.body.attachments[0].removedReason).toBe("Accidental upload");

    // Verify download is blocked
    const dlRes = await request(app)
      .get(`/api/tickets/${testTicketId}/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", testRequesterId.toString());
    
    expect(dlRes.status).toBe(410);
  });
});
