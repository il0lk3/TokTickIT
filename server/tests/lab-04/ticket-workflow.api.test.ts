import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { TicketPriority, TicketStatus, Role } from "@prisma/client";

describe("Lab 4 Issue 4: Ticket Workflow Rules and Conflict Handling (API-WKF)", () => {
  const prisma = getPrisma();
  const secret = process.env.JWT_SECRET || "supersecretdevkey";

  function makeAuthCookie(userId: number) {
    return `accessToken=${jwt.sign({ id: userId }, secret, { expiresIn: "2h" })}`;
  }

  let staff1: { id: number; name: string; role: Role };
  let staff2: { id: number; name: string; role: Role };
  let adminUser: { id: number; name: string; role: Role };
  let requester1: { id: number; name: string; role: Role };
  let requester2: { id: number; name: string; role: Role };
  let inactiveStaff: { id: number; name: string; role: Role };

  let staff1Cookie: string;
  let staff2Cookie: string;
  let adminCookie: string;
  let requester1Cookie: string;
  let requester2Cookie: string;

  let testCatId: number;
  let testSysId: number;

  beforeAll(async () => {
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    testCatId = cat.id;
    testSysId = sys.id;

    staff1 = await prisma.user.upsert({
      where: { email: "wkf.staff1@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "wkf.staff1@example.com",
        name: "WKF Staff One",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    staff2 = await prisma.user.upsert({
      where: { email: "wkf.staff2@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "wkf.staff2@example.com",
        name: "WKF Staff Two",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "wkf.admin@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "wkf.admin@example.com",
        name: "WKF Admin User",
        passwordHash: "hash",
        role: Role.ADMINISTRATOR,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requester1 = await prisma.user.upsert({
      where: { email: "wkf.req1@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "wkf.req1@example.com",
        name: "WKF Requester One",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requester2 = await prisma.user.upsert({
      where: { email: "wkf.req2@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "wkf.req2@example.com",
        name: "WKF Requester Two",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    inactiveStaff = await prisma.user.upsert({
      where: { email: "wkf.inactive.staff@example.com" },
      update: { isActive: false, requiresPasswordChange: false },
      create: {
        email: "wkf.inactive.staff@example.com",
        name: "WKF Inactive Staff",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: false,
        requiresPasswordChange: false,
      },
    });

    staff1Cookie = makeAuthCookie(staff1.id);
    staff2Cookie = makeAuthCookie(staff2.id);
    adminCookie = makeAuthCookie(adminUser.id);
    requester1Cookie = makeAuthCookie(requester1.id);
    requester2Cookie = makeAuthCookie(requester2.id);
  });

  // Helper to create tickets in any initial state
  async function createTestTicket(status: TicketStatus = TicketStatus.Open, ownerId: number | null = null, version = 1) {
    return await prisma.ticket.create({
      data: {
        ticketNumber: `WKF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        summary: `Workflow Test Ticket ${status}`,
        description: "Test description for workflow rules",
        currentStatus: status,
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        categoryId: testCatId,
        relatedSystemId: testSysId,
        requesterId: requester1.id,
        ownerId,
        version,
      },
    });
  }

  // Helper to attach Action Taken
  async function addActionTaken(ticketId: number, performedById: number, result = "Functional diagnostic complete") {
    return await prisma.actionTaken.create({
      data: {
        ticketId,
        performedById,
        actionAt: new Date(),
        description: "Checked hardware and executed diagnostics",
        result,
        followUpRequired: false,
      },
    });
  }

  // ==========================================
  // 1. Authentication & Authorization (AUTH)
  // ==========================================
  describe("1. Authentication & Authorization", () => {
    it("API-WKF-AUTH-01: unauthenticated request returns 401 Unauthorized", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });
      expect(res.status).toBe(401);
    });

    it("API-WKF-AUTH-02: Requester calling PATCH /api/staff/tickets/:id returns 403 Forbidden", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", requester1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });
      expect(res.status).toBe(403);
    });

    it("API-WKF-AUTH-03: IT Staff calling PATCH /api/staff/tickets/:id succeeds (200 OK)", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });
      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("HIGH");
    });

    it("API-WKF-AUTH-04: Administrator calling PATCH /api/staff/tickets/:id succeeds per BR-13 (200 OK)", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", adminCookie)
        .send({ expectedVersion: ticket.version, itPriority: "LOW" });
      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("LOW");
    });

    it("API-WKF-AUTH-05: Requester calling PATCH /appears-resolved on another's ticket returns 403 Forbidden", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress);
      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/appears-resolved`)
        .set("Cookie", requester2Cookie); // requester2 does not own ticket
      expect(res.status).toBe(403);
    });

    it("API-WKF-AUTH-06: IT Staff calling PATCH /appears-resolved returns 403 Forbidden", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress);
      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/appears-resolved`)
        .set("Cookie", staff1Cookie);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 2. Input Validation (VAL)
  // ==========================================
  describe("2. Input Validation", () => {
    it("API-WKF-VAL-01: non-numeric ticket ID returns 400 Bad Request", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/not-a-number")
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: 1, itPriority: "HIGH" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_ID_FORMAT");
    });

    it("API-WKF-VAL-02: non-existent ticket ID returns 404 Not Found", async () => {
      const res = await request(app)
        .patch("/api/staff/tickets/999999")
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: 1, itPriority: "HIGH" });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("TICKET_NOT_FOUND");
    });

    it("API-WKF-VAL-03: missing expectedVersion returns 400 Bad Request (VERSION_REQUIRED)", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ itPriority: "HIGH" }); // no expectedVersion
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VERSION_REQUIRED");
    });

    it("API-WKF-VAL-04: non-integer or negative expectedVersion returns 400 Bad Request (INVALID_VERSION_FORMAT)", async () => {
      const ticket = await createTestTicket();
      for (const badVer of ["1", -1, 1.5, null]) {
        const res = await request(app)
          .patch(`/api/staff/tickets/${ticket.id}`)
          .set("Cookie", staff1Cookie)
          .send({ expectedVersion: badVer, itPriority: "HIGH" });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("INVALID_VERSION_FORMAT");
      }
    });

    it("API-WKF-VAL-05: invalid status string not in enum returns 400 Bad Request (INVALID_STATUS_VALUE)", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "FlyingUnicorn" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATUS_VALUE");
    });

    it("API-WKF-VAL-06: invalid itPriority string returns 400 Bad Request (INVALID_PRIORITY)", async () => {
      const ticket = await createTestTicket();
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "CRITICAL" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_PRIORITY");
    });
  });

  // ==========================================
  // 3. 8x8 Status Transition Matrix (MAT)
  // ==========================================
  describe("3. 8x8 Status Transition Matrix (Table-Driven)", () => {
    const ALL_STATUSES: TicketStatus[] = [
      TicketStatus.New,
      TicketStatus.Open,
      TicketStatus.InProgress,
      TicketStatus.WaitingForRequester,
      TicketStatus.Resolved,
      TicketStatus.Closed,
      TicketStatus.Reopened,
      TicketStatus.Cancelled,
    ];

    const PERMITTED_MATRIX: Record<TicketStatus, TicketStatus[]> = {
      New: [TicketStatus.Open, TicketStatus.Cancelled],
      Open: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
      InProgress: [TicketStatus.WaitingForRequester, TicketStatus.Resolved, TicketStatus.Cancelled],
      WaitingForRequester: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
      Resolved: [TicketStatus.Closed, TicketStatus.Reopened, TicketStatus.Cancelled],
      Closed: [TicketStatus.Reopened],
      Reopened: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
      Cancelled: [],
    };

    it("API-WKF-MAT-01: validates all 64 status transition pairs against server matrix", async () => {
      for (const fromStatus of ALL_STATUSES) {
        for (const toStatus of ALL_STATUSES) {
          if (fromStatus === toStatus) continue; // Same status handled as no-op or ignored

          const isPermitted = PERMITTED_MATRIX[fromStatus].includes(toStatus);
          const ticket = await createTestTicket(fromStatus, staff1.id);

          // If target is Resolved, ensure gate conditions are satisfied so we strictly test the matrix rule
          if (toStatus === TicketStatus.Resolved) {
            await addActionTaken(ticket.id, staff1.id, "Validated hardware");
          }

          const res = await request(app)
            .patch(`/api/staff/tickets/${ticket.id}`)
            .set("Cookie", staff1Cookie)
            .send({ expectedVersion: ticket.version, status: toStatus });

          if (isPermitted) {
            expect(
              res.status,
              `Expected transition ${fromStatus} -> ${toStatus} to succeed (200), got ${res.status}: ${JSON.stringify(res.body)}`
            ).toBe(200);
            expect(res.body.currentStatus).toBe(toStatus);
          } else {
            expect(
              res.status,
              `Expected transition ${fromStatus} -> ${toStatus} to be rejected (400), got ${res.status}`
            ).toBe(400);
            expect(["INVALID_STATUS_TRANSITION", "TERMINAL_TICKET_LOCKED"]).toContain(res.body.code);
          }
        }
      }
    });
  });

  // ==========================================
  // 4. Resolution Gate Enforcement (GATE)
  // ==========================================
  describe("4. Resolution Gate Enforcement", () => {
    it("API-WKF-GATE-01: transition to Resolved fails if ownerId is null (RESOLUTION_GATE_FAILED)", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, null);
      await addActionTaken(ticket.id, staff1.id, "Action completed");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
    });

    it("API-WKF-GATE-02: transition to Resolved fails if ticket has 0 actions taken (RESOLUTION_GATE_FAILED)", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
    });

    it("API-WKF-GATE-03: transition to Resolved fails if action has empty/whitespace result (RESOLUTION_GATE_FAILED)", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);
      await addActionTaken(ticket.id, staff1.id, "   "); // whitespace-only result

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
    });

    it("API-WKF-GATE-04: transition to Resolved fails if existing owner is inactive (RESOLUTION_GATE_FAILED)", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, inactiveStaff.id);
      await addActionTaken(ticket.id, staff1.id, "Action completed");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
    });

    it("API-WKF-GATE-05: transition to Resolved succeeds when supplying active owner in same payload + valid action", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, null);
      await addActionTaken(ticket.id, staff1.id, "Cleaned thermal compound");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({
          expectedVersion: ticket.version,
          status: "Resolved",
          ownerId: staff1.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Resolved");
      expect(res.body.ownerId).toBe(staff1.id);
    });

    it("API-WKF-GATE-06: transition to Resolved succeeds with existing active owner + valid action", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);
      await addActionTaken(ticket.id, staff1.id, "Replaced network cable");

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Resolved");
    });
  });

  // ==========================================
  // 5. Optimistic Concurrency Control (CONC)
  // ==========================================
  describe("5. Optimistic Concurrency Control", () => {
    it("API-WKF-CONC-01: stale expectedVersion returns 409 Conflict (STALE_VERSION_CONFLICT) with metadata", async () => {
      const ticket = await createTestTicket(TicketStatus.Open, staff1.id, 2);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: 1, itPriority: "HIGH" }); // Stale version (1 != 2)

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("STALE_VERSION_CONFLICT");
      expect(res.body.currentVersion).toBe(2);
      expect(res.body.currentStatus).toBe("Open");
      expect(res.body.updatedAt).toBeDefined();

      // Database record remains untouched
      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.version).toBe(2);
      expect(fresh?.itPriority).toBe("MEDIUM");
    });

    it("API-WKF-CONC-02: matching expectedVersion atomically updates ticket and increments version", async () => {
      const ticket = await createTestTicket(TicketStatus.Open, staff1.id, 2);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: 2, itPriority: "HIGH" });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(3);
      expect(res.body.itPriority).toBe("HIGH");

      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.version).toBe(3);
    });

    it("API-WKF-CONC-03: concurrent race condition via Promise.all returns exactly one 200 and one 409", async () => {
      const ticket = await createTestTicket(TicketStatus.Open, staff1.id, 1);

      const reqA = request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: 1, itPriority: "HIGH" });

      const reqB = request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff2Cookie)
        .send({ expectedVersion: 1, itPriority: "LOW" });

      const [resA, resB] = await Promise.all([reqA, reqB]);
      const statusCodes = [resA.status, resB.status].sort();

      expect(statusCodes).toEqual([200, 409]);

      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.version).toBe(2);
    });
  });

  // ==========================================
  // 6. Assignee Eligibility & Inactive Guard (OWN)
  // ==========================================
  describe("6. Assignee Eligibility & Inactive Guard", () => {
    it("API-WKF-OWN-01: assigning owner to inactive user returns 400 Bad Request (INACTIVE_ASSIGNEE_REJECTED)", async () => {
      const ticket = await createTestTicket(TicketStatus.Open);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, ownerId: inactiveStaff.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INACTIVE_ASSIGNEE_REJECTED");
    });

    it("API-WKF-OWN-02: assigning owner to user with REQUESTER role returns 400 Bad Request (ASSIGNEE_NOT_ELIGIBLE)", async () => {
      const ticket = await createTestTicket(TicketStatus.Open);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, ownerId: requester1.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("ASSIGNEE_NOT_ELIGIBLE");
    });

    it("API-WKF-OWN-03: assigning owner to active IT Staff succeeds and increments version", async () => {
      const ticket = await createTestTicket(TicketStatus.Open);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, ownerId: staff2.id });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe(staff2.id);
      expect(res.body.version).toBe(ticket.version + 1);
    });
  });

  // ==========================================
  // 7. Terminal / Locked Ticket Guard (LOCK)
  // ==========================================
  describe("7. Terminal / Locked Ticket Guard", () => {
    it("API-WKF-LOCK-01: modifying priority or owner on Closed ticket returns 400 Bad Request (TERMINAL_TICKET_LOCKED)", async () => {
      const ticket = await createTestTicket(TicketStatus.Closed, staff1.id);

      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });
      expect(res1.status).toBe(400);
      expect(res1.body.code).toBe("TERMINAL_TICKET_LOCKED");

      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, ownerId: staff2.id });
      expect(res2.status).toBe(400);
      expect(res2.body.code).toBe("TERMINAL_TICKET_LOCKED");
    });

    it("API-WKF-LOCK-02: modifying priority or owner on Cancelled ticket returns 400 Bad Request (TERMINAL_TICKET_LOCKED)", async () => {
      const ticket = await createTestTicket(TicketStatus.Cancelled, staff1.id);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("TERMINAL_TICKET_LOCKED");
    });

    it("API-WKF-LOCK-03: Closed -> Reopened succeeds, Closed -> Cancelled is rejected", async () => {
      const ticket1 = await createTestTicket(TicketStatus.Closed, staff1.id);
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket1.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket1.version, status: "Reopened" });
      expect(res1.status).toBe(200);
      expect(res1.body.currentStatus).toBe("Reopened");

      const ticket2 = await createTestTicket(TicketStatus.Closed, staff1.id);
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket2.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket2.version, status: "Cancelled" });
      expect(res2.status).toBe(400);
      expect(res2.body.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  // ==========================================
  // 8. All-or-Nothing Multi-field Transaction (AON)
  // ==========================================
  describe("8. All-or-Nothing Multi-field Transaction", () => {
    it("API-WKF-AON-01: invalid status + valid priority in same request rejects and alters nothing in DB", async () => {
      const ticket = await createTestTicket(TicketStatus.New, null);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({
          expectedVersion: ticket.version,
          status: "Resolved", // Invalid transition New -> Resolved
          itPriority: "HIGH",  // Valid priority
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATUS_TRANSITION");

      // Verify in DB that itPriority was NOT updated
      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.itPriority).toBe("MEDIUM");
      expect(fresh?.currentStatus).toBe("New");
      expect(fresh?.version).toBe(ticket.version);
    });

    it("API-WKF-AON-02: valid status + ineligible owner in same request rejects and alters nothing in DB", async () => {
      const ticket = await createTestTicket(TicketStatus.New, null);

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({
          expectedVersion: ticket.version,
          status: "Open", // Valid transition
          ownerId: requester1.id, // Ineligible owner (Requester)
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("ASSIGNEE_NOT_ELIGIBLE");

      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.currentStatus).toBe("New");
      expect(fresh?.ownerId).toBeNull();
      expect(fresh?.version).toBe(ticket.version);
    });
  });

  // ==========================================
  // 9. Server Response Enrichment (META)
  // ==========================================
  describe("9. Server Response Enrichment (allowedTransitions & resolutionGate)", () => {
    it("API-WKF-META-01: GET and PATCH return allowedTransitions array and resolutionGate status", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);

      const resGet = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie);

      expect(resGet.status).toBe(200);
      expect(Array.isArray(resGet.body.allowedTransitions)).toBe(true);
      expect(resGet.body.allowedTransitions).toContain("WaitingForRequester");
      expect(resGet.body.allowedTransitions).toContain("Resolved");
      expect(resGet.body.allowedTransitions).toContain("Cancelled");
      expect(resGet.body.resolutionGate).toBeDefined();
      expect(resGet.body.resolutionGate.hasActiveOwner).toBe(true);
      expect(resGet.body.resolutionGate.validActionCount).toBe(0);
      expect(resGet.body.resolutionGate.met).toBe(false);

      // Add Action Taken and test PATCH
      await addActionTaken(ticket.id, staff1.id, "Verified disk health");
      const resPatch = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, itPriority: "HIGH" });

      expect(resPatch.status).toBe(200);
      expect(resPatch.body.resolutionGate.met).toBe(true);
      expect(resPatch.body.resolutionGate.validActionCount).toBe(1);
    });
  });

  // ==========================================
  // 10. Advisory Resolution Signal (/appears-resolved) (ADV)
  // ==========================================
  describe("10. Advisory Resolution Signal (/appears-resolved)", () => {
    it("API-WKF-ADV-01: calling /appears-resolved on New ticket returns 400 Bad Request", async () => {
      const ticket = await createTestTicket(TicketStatus.New);
      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/appears-resolved`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("CANNOT_SIGNAL_ON_NEW_TICKET");
    });

    it("API-WKF-ADV-02: calling /appears-resolved on InProgress ticket flags ticket and creates comment", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress);
      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/appears-resolved`)
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.ticket.appearsResolved).toBe(true);
      expect(res.body.ticket.currentStatus).toBe("InProgress"); // Status not changed!
      expect(res.body.comment.content).toContain("appears to be resolved");

      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.appearsResolved).toBe(true);
    });

    it("API-WKF-ADV-03: concurrent /appears-resolved calls via Promise.all results in only one comment", async () => {
      const ticket = await createTestTicket(TicketStatus.Open);

      const [res1, res2] = await Promise.all([
        request(app).patch(`/api/tickets/${ticket.id}/appears-resolved`).set("Cookie", requester1Cookie),
        request(app).patch(`/api/tickets/${ticket.id}/appears-resolved`).set("Cookie", requester1Cookie),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 400]);

      // Exactly one public comment posted
      const comments = await prisma.publicComment.findMany({
        where: { ticketId: ticket.id, content: "The problem appears to be resolved." },
      });
      expect(comments.length).toBe(1);
    });

    it("API-WKF-ADV-04: subsequent status transition resets appearsResolved to false", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { appearsResolved: true },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}`)
        .set("Cookie", staff1Cookie)
        .send({ expectedVersion: ticket.version, status: "WaitingForRequester" });

      expect(res.status).toBe(200);
      expect(res.body.appearsResolved).toBe(false);

      const fresh = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(fresh?.appearsResolved).toBe(false);
    });
  });

  // ==========================================
  // 11. Append-Only ActionTaken Guarantee (APP)
  // ==========================================
  describe("11. Append-Only ActionTaken Guarantee", () => {
    it("API-WKF-APP-01: DELETE /api/tickets/:id/actions-taken/:actionId returns 404 or 405 (no hard delete)", async () => {
      const ticket = await createTestTicket(TicketStatus.InProgress, staff1.id);
      const action = await addActionTaken(ticket.id, staff1.id);

      const res = await request(app)
        .delete(`/api/tickets/${ticket.id}/actions-taken/${action.id}`)
        .set("Cookie", staff1Cookie);

      expect([404, 405]).toContain(res.status);
    });
  });
});
