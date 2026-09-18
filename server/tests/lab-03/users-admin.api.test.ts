import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

describe("Admin User Management API", () => {
  let adminToken: string;
  let staffToken: string;
  let requesterToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    
    // Create dedicated test users
    const adminUser = await prisma.user.create({
      data: { name: "Test API Admin", email: "test-admin-api-auth@example.com", role: "ADMINISTRATOR", isActive: true, requiresPasswordChange: false, passwordHash }
    });
    const staffUser = await prisma.user.create({
      data: { name: "Test API Staff", email: "test-staff-api-auth@example.com", role: "IT_STAFF", isActive: true, requiresPasswordChange: false, passwordHash }
    });
    const reqUser = await prisma.user.create({
      data: { name: "Test API Req", email: "test-req-api-auth@example.com", role: "REQUESTER", isActive: true, requiresPasswordChange: false, passwordHash }
    });

    const adminRes = await request(app).post("/api/auth/login").send({ email: "test-admin-api-auth@example.com", password: "Password123!" });
    adminToken = adminRes.headers["set-cookie"][0].split(";")[0].split("=")[1];
    adminUserId = adminUser.id;

    const staffRes = await request(app).post("/api/auth/login").send({ email: "test-staff-api-auth@example.com", password: "Password123!" });
    staffToken = staffRes.headers["set-cookie"][0].split(";")[0].split("=")[1];

    const reqRes = await request(app).post("/api/auth/login").send({ email: "test-req-api-auth@example.com", password: "Password123!" });
    requesterToken = reqRes.headers["set-cookie"][0].split(";")[0].split("=")[1];
  });

  afterAll(async () => {
    // Cleanup users created during testing
    await prisma.user.deleteMany({
      where: { email: { contains: "test-admin-api" } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "test-staff-api" } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "test-req-api" } }
    });
  });

  describe("Access Control (401/403)", () => {
    it("should return 401 for unauthenticated access", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("should return 403 for IT_STAFF access", async () => {
      const res = await request(app).get("/api/admin/users").set("Cookie", `accessToken=${staffToken}`);
      expect(res.status).toBe(403);
    });

    it("should return 403 for REQUESTER access", async () => {
      const res = await request(app).get("/api/admin/users").set("Cookie", `accessToken=${requesterToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should list users", async () => {
      const res = await request(app).get("/api/admin/users").set("Cookie", `accessToken=${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0]).not.toHaveProperty("passwordHash");
    });

    it("should filter users by role", async () => {
      const res = await request(app).get("/api/admin/users?role=ADMINISTRATOR").set("Cookie", `accessToken=${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items.every((u: any) => u.role === "ADMINISTRATOR")).toBe(true);
      expect(res.body.filtersApplied.role).toBe("ADMINISTRATOR");
    });

    it("should search users by name or email (case-insensitive)", async () => {
      const res = await request(app).get("/api/admin/users?search=CREAM").set("Cookie", `accessToken=${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items.some((u: any) => u.name.toLowerCase().includes("cream") || u.email.toLowerCase().includes("cream"))).toBe(true);
    });
  });

  describe("POST /api/admin/users", () => {
    it("should create a new user with valid initial password", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Test Admin API User",
          email: "test-admin-api-create@example.com",
          role: "IT_STAFF",
          active: true,
          initialPassword: "StrongPassword1!"
        });
      
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Admin API User");
      expect(res.body.email).toBe("test-admin-api-create@example.com");
      expect(res.body.role).toBe("IT_STAFF");
      expect(res.body.requiresPasswordChange).toBe(true);
    });

    it("should reject creation with weak initial password", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Weak Pass User",
          email: "test-admin-api-weak@example.com",
          role: "REQUESTER",
          active: true,
          initialPassword: "weak"
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("complexity requirements");
    });

    it("should reject creation with duplicate email", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Duplicate Email User",
          email: "admin@example.com", // existing seed admin
          role: "REQUESTER",
          active: true,
          initialPassword: "StrongPassword1!"
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already in use");
    });
  });

  describe("PATCH /api/admin/users/:id", () => {
    let testUserId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Test User Edit",
          email: "test-admin-api-edit@example.com",
          role: "REQUESTER",
          active: true,
          initialPassword: "StrongPassword1!"
        });
      testUserId = res.body.id;
    });

    it("should update user details", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${testUserId}`)
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Updated Name",
          role: "IT_STAFF"
        });
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.role).toBe("IT_STAFF");
    });

    it("should prevent updating to a duplicate email", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${testUserId}`)
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          email: "admin@example.com"
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already in use");
    });

    it("should prevent self-deactivation", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUserId}`)
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          active: false
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Cannot deactivate your own account");
    });

    it("should prevent removing the last active administrator", async () => {
      // Find all active admins
      const activeAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", isActive: true }
      });
      
      const otherAdmins = activeAdmins.filter(a => a.id !== adminUserId);
      
      try {
        // Temporarily deactivate all admins EXCEPT the current one
        for (const admin of otherAdmins) {
          await prisma.user.update({ where: { id: admin.id }, data: { isActive: false } });
        }

        // Now attempt to change role of self (the only admin left)
        const lastAdminRes = await request(app)
          .patch(`/api/admin/users/${adminUserId}`)
          .set("Cookie", `accessToken=${adminToken}`)
          .send({ role: "REQUESTER" });
        
        expect(lastAdminRes.status).toBe(400);
      } finally {
        // Restore other admins (always executes, even if assertions fail)
        for (const admin of otherAdmins) {
          await prisma.user.update({ where: { id: admin.id }, data: { isActive: true } });
        }
      }
    });
  });

  describe("POST /api/admin/users/:id/initial-password", () => {
    let testUserId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          name: "Test Password Reset",
          email: "test-admin-api-reset@example.com",
          role: "REQUESTER",
          active: true,
          initialPassword: "StrongPassword1!"
        });
      testUserId = res.body.id;
    });

    it("should set new initial password and force change on next login", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/initial-password`)
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          newInitialPassword: "NewStrongPassword2@"
        });
      
      expect(res.status).toBe(200);
      expect(res.body.user.requiresPasswordChange).toBe(true);

      // Verify login works with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "test-admin-api-reset@example.com",
        password: "NewStrongPassword2@"
      });
      expect(loginRes.status).toBe(200);
    });

    it("should reject weak new initial password", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/initial-password`)
        .set("Cookie", `accessToken=${adminToken}`)
        .send({
          newInitialPassword: "weak"
        });
      
      expect(res.status).toBe(400);
    });
  });
});
