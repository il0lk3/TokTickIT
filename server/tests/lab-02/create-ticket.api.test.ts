import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("POST /api/tickets", () => {
  let validRequesterId: number;
  const createdTicketNumbers: string[] = [];

  beforeAll(async () => {
    // Find a valid active requester from the seed
    const requester = await getPrisma().requesterUser.findFirst({
      where: { isActive: true },
    });
    if (requester) {
      validRequesterId = requester.id;
    } else {
      throw new Error("No active requester found in the database. Did you run the seed script?");
    }
  });

  afterAll(async () => {
    // Clean up created tickets so tests don't permanently alter DB state
    if (createdTicketNumbers.length > 0) {
      await getPrisma().ticket.deleteMany({
        where: { ticketNumber: { in: createdTicketNumbers } }
      });
    }
  });

  it("returns 401 Unauthorized if X-Requester-Id is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "MEDIUM",
        summary: "Test Summary",
        description: "Test Description"
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Requester not found or missing X-Requester-Id header");
  });

  it("returns 400 Bad Request if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", validRequesterId.toString())
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "MEDIUM",
        // missing summary and description
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("returns 400 Bad Request if FK references are invalid", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", validRequesterId.toString())
      .send({
        categoryId: 999999, // non-existent
        relatedSystemId: 1,
        requestedPriority: "MEDIUM",
        summary: "Test",
        description: "Test"
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Category or Related System does not exist");
  });

  it("returns 400 Bad Request if summary exceeds 150 chars", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", validRequesterId.toString())
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "MEDIUM",
        summary: "A".repeat(151),
        description: "Test"
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Summary must be between 1 and 150 characters");
  });

  it("creates a ticket and returns 201 with ticketNumber", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", validRequesterId.toString())
      .send({
        categoryId: 1,
        relatedSystemId: 2,
        requestedPriority: "HIGH",
        summary: "Laptop is on fire",
        description: "Literally."
      });
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.summary).toBe("Laptop is on fire");
    expect(res.body.currentStatus).toBe("New");
    
    createdTicketNumbers.push(res.body.ticketNumber);
  });

  it("returns 400 Bad Request for duplicate submission", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", validRequesterId.toString())
      .send({
        categoryId: 1,
        relatedSystemId: 2,
        requestedPriority: "HIGH",
        summary: "Laptop is on fire", // Same summary within 10 seconds
        description: "Different description."
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Duplicate submission detected");
  });
});
