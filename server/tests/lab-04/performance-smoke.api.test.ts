import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";

describe("Performance Smoke Tests (Labsheet Section 8.5)", () => {
  const prisma = getPrisma();
  let requesterCookie: string;
  let staffCookie: string;
  let testRequesterId: number;
  let testStaffId: number;

  beforeAll(async () => {
    const requester = await prisma.user.findUnique({ where: { email: "e2e.requester@example.com" } });
    const staff = await prisma.user.findUnique({ where: { email: "e2e.staff@example.com" } });

    testRequesterId = requester!.id;
    testStaffId = staff!.id;

    const secret = process.env.JWT_SECRET!;
    const reqToken = jwt.sign({ id: testRequesterId }, secret, { expiresIn: "2h" });
    const staffToken = jwt.sign({ id: testStaffId }, secret, { expiresIn: "2h" });

    requesterCookie = `accessToken=${reqToken}`;
    staffCookie = `accessToken=${staffToken}`;

    // Prime Node.js JIT and Prisma connection pool with 3 unmeasured requests
    for (let i = 0; i < 3; i++) {
      await request(app).get("/api/dashboard/requester").set("Cookie", requesterCookie);
      await request(app).get("/api/dashboard/staff").set("Cookie", staffCookie);
      await request(app).get("/api/tickets").set("Cookie", requesterCookie);
      await request(app).get("/api/staff/tickets").set("Cookie", staffCookie);
    }
  });

  it("GET /api/dashboard/requester responds within 500ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", requesterCookie);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it("GET /api/dashboard/staff responds within 500ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffCookie);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it("GET /api/tickets responds within 500ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/tickets")
      .set("Cookie", requesterCookie);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it("GET /api/staff/tickets responds within 500ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", staffCookie);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });
});
