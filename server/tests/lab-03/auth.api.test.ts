import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("API-01 to API-03, API-17: Authentication Endpoints", () => {
  const prisma = getPrisma();
  let testUserId: number;
  const testPassword = "Password123!";
  let authCookie: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: "Test Auth User",
        email: `auth-${Date.now()}@test.com`,
        passwordHash: hash,
        role: "REQUESTER",
        isActive: true,
        requiresPasswordChange: true
      }
    });
    testUserId = user.id;

    // Create an inactive user for AC-07
    await prisma.user.create({
      data: {
        name: "Inactive User",
        email: `inactive-${Date.now()}@test.com`,
        passwordHash: hash,
        role: "REQUESTER",
        isActive: false,
        requiresPasswordChange: false
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "auth-" } }
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "inactive-" } }
    });
  });

  it("should fail login with invalid credentials", async () => {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    const res = await request(app).post("/api/auth/login").send({
      email: user!.email,
      password: "wrongpassword"
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("should fail login for inactive account (AC-07)", async () => {
    const inactiveUser = await prisma.user.findFirst({ where: { isActive: false } });
    const res = await request(app).post("/api/auth/login").send({
      email: inactiveUser!.email,
      password: testPassword
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password"); // generic error
  });

  it("should successfully login (AC-01)", async () => {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    const res = await request(app).post("/api/auth/login").send({
      email: user!.email,
      password: testPassword
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: "REQUESTER",
      requiresPasswordChange: true
    });
    
    // Cookie should be set
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/accessToken=.*HttpOnly.*SameSite=Strict/);
    authCookie = cookies[0].split(";")[0];
  });

  it("should get current user /me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", authCookie);
    expect(res.status).toBe(200);
    expect(res.body.requiresPasswordChange).toBe(true);
  });

  it("should reject change-password if passwords do not match", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", authCookie)
      .send({
        currentPassword: testPassword,
        newPassword: "NewStrongPassword123!",
        confirmPassword: "DifferentPassword123!"
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("New passwords do not match");
  });

  it("should reject change-password if complex requirements not met", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", authCookie)
      .send({
        currentPassword: testPassword,
        newPassword: "weak",
        confirmPassword: "weak"
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password does not meet complexity requirements");
  });

  it("should change password and clear flag", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", authCookie)
      .send({
        currentPassword: testPassword,
        newPassword: "NewStrongPassword123!",
        confirmPassword: "NewStrongPassword123!"
      });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.requiresPasswordChange).toBe(false);
  });

  it("should invalidate session on logout (AC-11)", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", authCookie);
    expect(res.status).toBe(200);
    
    // Cookie should be cleared (Expires or Max-Age in the past/empty)
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/accessToken=;/);
  });
});
