import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("POST /api/tickets", () => {
  let validRequesterId: number;

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
  });
});
