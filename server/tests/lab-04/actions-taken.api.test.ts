import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import jwt from "jsonwebtoken";
import { TicketPriority, TicketStatus, Role } from "@prisma/client";

describe("Lab 4 Issue 3: Actions Taken API and Authorization (API-ACT-01 to API-ACT-27)", () => {
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
  let inactiveStaff: { id: number };

  let staff1Cookie: string;
  let staff2Cookie: string;
  let adminCookie: string;
  let requester1Cookie: string;
  let requester2Cookie: string;
  let inactiveStaffCookie: string;

  let testCatId: number;
  let testSysId: number;

  let activeTicketId: number;
  let requester2TicketId: number;
  let closedTicketId: number;
  let emptyTicketId: number;
  let legacyTicketId: number;

  beforeAll(async () => {
    // 1. Fetch reference Category and RelatedSystem
    const cat = await prisma.category.findFirstOrThrow();
    const sys = await prisma.relatedSystem.findFirstOrThrow();
    testCatId = cat.id;
    testSysId = sys.id;

    // 2. Fetch or create test users with requiresPasswordChange: false
    staff1 = await prisma.user.upsert({
      where: { email: "e2e.staff@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "e2e.staff@example.com",
        name: "E2E Staff Performer",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    staff2 = await prisma.user.upsert({
      where: { email: "staff2@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "staff2@example.com",
        name: "Staff Two",
        passwordHash: "hash",
        role: Role.IT_STAFF,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "e2e.admin@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "e2e.admin@example.com",
        name: "E2E Admin User",
        passwordHash: "hash",
        role: Role.ADMINISTRATOR,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requester1 = await prisma.user.upsert({
      where: { email: "cream.su@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "cream.su@example.com",
        name: "Cream Requester",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    requester2 = await prisma.user.upsert({
      where: { email: "e2e.requester@example.com" },
      update: { isActive: true, requiresPasswordChange: false },
      create: {
        email: "e2e.requester@example.com",
        name: "E2E Requester Two",
        passwordHash: "hash",
        role: Role.REQUESTER,
        isActive: true,
        requiresPasswordChange: false,
      },
    });

    inactiveStaff = await prisma.user.upsert({
      where: { email: "inactive.staff@example.com" },
      update: { isActive: false },
      create: {
        email: "inactive.staff@example.com",
        name: "Inactive Staff Member",
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
    inactiveStaffCookie = makeAuthCookie(inactiveStaff.id);

    // 3. Create dedicated test tickets
    // Active ticket owned by Staff 1, requested by Requester 1
    const tActive = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-1`,
        summary: "Active Ticket for Actions API Tests",
        description: "Initial description for testing actions taken.",
        requestedPriority: TicketPriority.MEDIUM,
        itPriority: TicketPriority.MEDIUM,
        currentStatus: TicketStatus.InProgress,
        requesterId: requester1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
        ownerId: staff1.id,
      },
    });
    activeTicketId = tActive.id;

    // Ticket owned by Requester 2
    const tReq2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-2`,
        summary: "Requester 2 Isolated Ticket",
        description: "Used to test ownership protection against Requester 1.",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requester2.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
        ownerId: staff2.id,
      },
    });
    requester2TicketId = tReq2.id;

    // Closed ticket (terminal status)
    const tClosed = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-3`,
        summary: "Closed Terminal Ticket",
        description: "Cannot add or edit actions on closed ticket.",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Closed,
        requesterId: requester1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
        ownerId: staff1.id,
      },
    });
    closedTicketId = tClosed.id;

    // Ticket with zero actions
    const tEmpty = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-4`,
        summary: "Zero Actions Ticket",
        description: "Testing empty actions taken listing.",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.New,
        requesterId: requester1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
      },
    });
    emptyTicketId = tEmpty.id;

    // Legacy ticket simulating Lab 1–3
    const tLegacy = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-5`,
        summary: "Legacy Migration Ticket",
        description: "Legacy ticket before Lab 4.",
        requestedPriority: TicketPriority.LOW,
        itPriority: TicketPriority.LOW,
        currentStatus: TicketStatus.Open,
        requesterId: requester1.id,
        categoryId: testCatId,
        relatedSystemId: testSysId,
        version: 1,
      },
    });
    legacyTicketId = tLegacy.id;
  });

  afterAll(async () => {
    const ids = [activeTicketId, requester2TicketId, closedTicketId, emptyTicketId, legacyTicketId].filter(Boolean);
    await prisma.actionTaken.deleteMany({ where: { ticketId: { in: ids } } });
    await prisma.ticket.deleteMany({ where: { id: { in: ids } } });
  });

  // ---------------------------------------------------------------------------
  // Core Creation, Validation, and Performer Identity
  // ---------------------------------------------------------------------------
  it("API-ACT-01: IT Staff creates valid action (201 Created & performer bound to session)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Inspected network interface card and replaced cable.",
        result: "Link renegotiated at 1Gbps full duplex with zero packet loss.",
        followUpRequired: false,
        attachmentNotes: "cable_tester_pass.txt",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketId).toBe(activeTicketId);
    expect(res.body.description).toBe("Inspected network interface card and replaced cable.");
    expect(res.body.result).toBe("Link renegotiated at 1Gbps full duplex with zero packet loss.");
    expect(res.body.followUpRequired).toBe(false);
    expect(res.body.followUpNote).toBeNull();
    expect(res.body.attachmentNotes).toBe("cable_tester_pass.txt");
    expect(res.body.performedById).toBe(staff1.id);
    expect(res.body.performedBy).toBeDefined();
    expect(res.body.performedBy.id).toBe(staff1.id);
    expect(res.body.performedBy.role).toBe("IT_STAFF");
  });

  it("API-ACT-02: Requester calling POST is rejected with 403 Forbidden (ROLE_NOT_PERMITTED)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", requester1Cookie)
      .send({
        description: "Requester attempt to create action",
        result: "Should be forbidden",
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ROLE_NOT_PERMITTED");
  });

  it("API-ACT-03: Requester calling PATCH is rejected with 403 Forbidden (ROLE_NOT_PERMITTED)", async () => {
    // Fetch an action first
    const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: activeTicketId } });

    const res = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", requester1Cookie)
      .send({
        description: "Requester attempt to edit action",
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ROLE_NOT_PERMITTED");
  });

  it("API-ACT-04: Requester reads actions for their own ticket (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", requester1Cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].ticketId).toBe(activeTicketId);
    expect(res.body[0].performedBy).toBeDefined();
  });

  it("API-ACT-05: followUpRequired=true without note returns 400 Bad Request (FOLLOWUP_NOTE_REQUIRED)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Replaced main logic board",
        result: "System booted into recovery mode",
        followUpRequired: true,
        followUpNote: "   ", // whitespace only
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("FOLLOWUP_NOTE_REQUIRED");
    expect(res.body.fields).toHaveProperty("followUpNote");
  });

  it("API-ACT-06: followUpRequired=false with note clears note to null", async () => {
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Replaced cooling fan assembly",
        result: "Fan RPM normal and acoustics quiet",
        followUpRequired: false,
        followUpNote: "Ignored note because followUpRequired is false",
      });

    expect(res.status).toBe(201);
    expect(res.body.followUpRequired).toBe(false);
    expect(res.body.followUpNote).toBeNull();
  });

  it("API-ACT-07: Unauthenticated request returns 401 Unauthorized", async () => {
    const resGet = await request(app).get(`/api/tickets/${activeTicketId}/actions-taken`);
    expect(resGet.status).toBe(401);

    const resPost = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .send({ description: "Test", result: "Test" });
    expect(resPost.status).toBe(401);
  });

  it("API-ACT-08: Ticket with zero actions returns 200 OK with empty array []", async () => {
    const res = await request(app)
      .get(`/api/tickets/${emptyTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("API-ACT-09: Requester A accessing Requester B's ticket actions returns 404 Not Found (ownership isolation)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${requester2TicketId}/actions-taken`)
      .set("Cookie", requester1Cookie);

    // Conforms to Lab 2-3 standard: 404 to avoid revealing existence
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("TICKET_NOT_FOUND");
  });

  it("API-ACT-10: PATCH ignores client-supplied ticketId and keeps action bound to URL ticket", async () => {
    const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: activeTicketId } });

    const res = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff1Cookie)
      .send({
        ticketId: requester2TicketId, // Malicious injection attempt to move action
        result: "Updated result confirming ticket binding preservation",
      });

    expect(res.status).toBe(200);
    expect(res.body.ticketId).toBe(activeTicketId);

    const checkDb = await prisma.actionTaken.findUniqueOrThrow({ where: { id: action.id } });
    expect(checkDb.ticketId).toBe(activeTicketId);
  });

  it("API-ACT-11: Duplicate submission within 5 seconds returns existing record (200 OK)", async () => {
    const payload = {
      description: "Deduplication benchmark action description",
      result: "First execution completed",
      followUpRequired: false,
    };

    const firstRes = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send(payload);

    expect(firstRes.status).toBe(201);
    const firstId = firstRes.body.id;

    // Immediate duplicate submission with identical description
    const secondRes = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send(payload);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.id).toBe(firstId);

    // Verify database only created 1 row
    const count = await prisma.actionTaken.count({
      where: { ticketId: activeTicketId, description: payload.description },
    });
    expect(count).toBe(1);
  });

  it("API-ACT-12: POST on Closed or Cancelled ticket is rejected with 400 Bad Request (TERMINAL_TICKET_LOCKED)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${closedTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Attempting to add action to closed ticket",
        result: "Should fail",
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("TERMINAL_TICKET_LOCKED");
  });

  it("API-ACT-13: GET returns actions ordered chronologically (actionAt asc, id asc)", async () => {
    // Create an older action explicitly in DB
    const olderDate = new Date(Date.now() - 3600000); // 1 hour ago
    await prisma.actionTaken.create({
      data: {
        ticketId: activeTicketId,
        performedById: staff2.id,
        description: "Earliest chronological action",
        result: "Initial diagnostics recorded 1 hour ago",
        actionAt: olderDate,
      },
    });

    const res = await request(app)
      .get(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < res.body.length - 1; i++) {
      const current = new Date(res.body[i].actionAt).getTime();
      const next = new Date(res.body[i + 1].actionAt).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it("API-ACT-14: Forged performedById in request body is ignored and bound to session user", async () => {
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Staff 1 creating action with forged performer ID in body",
        result: "Should record staff1.id, not 9999",
        performedById: 9999, // Forged ID
      });

    expect(res.status).toBe(201);
    expect(res.body.performedById).toBe(staff1.id);
    expect(res.body.performedBy.id).toBe(staff1.id);
  });

  // ---------------------------------------------------------------------------
  // Advanced PATCH Merged Semantics & Edge Cases
  // ---------------------------------------------------------------------------
  it("API-ACT-15: PATCH succeeds with updated fields, refreshes updatedAt, keeps performedBy intact", async () => {
    const action = await prisma.actionTaken.create({
      data: {
        ticketId: activeTicketId,
        performedById: staff1.id,
        description: "Initial description before patch",
        result: "Initial result",
        followUpRequired: false,
      },
    });

    const res = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff2Cookie) // Staff 2 edits Staff 1's action
      .send({
        description: "Updated description after patch by staff2",
        result: "Updated result after patch",
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated description after patch by staff2");
    expect(res.body.result).toBe("Updated result after patch");
    expect(res.body.performedById).toBe(staff1.id); // Performer remains original author
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(action.updatedAt).getTime());
  });

  it("API-ACT-16: PATCH validates follow-up on merged state (toggle on without note -> 400, toggle off -> clears note)", async () => {
    // 1. Create action with followUpRequired = false
    const action = await prisma.actionTaken.create({
      data: {
        ticketId: activeTicketId,
        performedById: staff1.id,
        description: "Follow-up merge test action",
        result: "Result",
        followUpRequired: false,
        followUpNote: null,
      },
    });

    // 1a. Toggle followUpRequired = true without supplying note -> 400 Bad Request
    const toggleFail = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff1Cookie)
      .send({ followUpRequired: true });

    expect(toggleFail.status).toBe(400);
    expect(toggleFail.body.code).toBe("FOLLOWUP_NOTE_REQUIRED");

    // 1b. Toggle followUpRequired = true WITH note -> 200 OK
    const togglePass = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff1Cookie)
      .send({ followUpRequired: true, followUpNote: "Newly added follow-up note" });

    expect(togglePass.status).toBe(200);
    expect(togglePass.body.followUpRequired).toBe(true);
    expect(togglePass.body.followUpNote).toBe("Newly added follow-up note");

    // 1c. Clear follow-up: toggle followUpRequired = false -> followUpNote automatically cleared to null
    const clearPass = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff1Cookie)
      .send({ followUpRequired: false });

    expect(clearPass.status).toBe(200);
    expect(clearPass.body.followUpRequired).toBe(false);
    expect(clearPass.body.followUpNote).toBeNull();
  });

  it("API-ACT-17: PATCH action on another ticket returns 404 Not Found (ACTION_NOT_FOUND)", async () => {
    // Action belongs to activeTicketId
    const action = await prisma.actionTaken.findFirstOrThrow({ where: { ticketId: activeTicketId } });

    // Request using requester2TicketId in URL
    const res = await request(app)
      .patch(`/api/tickets/${requester2TicketId}/actions-taken/${action.id}`)
      .set("Cookie", staff1Cookie)
      .send({ result: "Malicious cross-ticket patch" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTION_NOT_FOUND");
  });

  it("API-ACT-18: PATCH on Closed or Cancelled ticket returns 400 Bad Request (TERMINAL_TICKET_LOCKED)", async () => {
    // Temporarily create an action on closed ticket directly in DB for testing
    const closedAction = await prisma.actionTaken.create({
      data: {
        ticketId: closedTicketId,
        performedById: staff1.id,
        description: "Action on closed ticket",
        result: "Result",
      },
    });

    const res = await request(app)
      .patch(`/api/tickets/${closedTicketId}/actions-taken/${closedAction.id}`)
      .set("Cookie", staff1Cookie)
      .send({ result: "Attempting to patch action on closed ticket" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("TERMINAL_TICKET_LOCKED");
  });

  it("API-ACT-19: Staff who is NOT ticket owner can add actions (BR-02)", async () => {
    // Ticket owner is staff1; staff2 creates an action
    const res = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff2Cookie)
      .send({
        description: "Staff 2 collaborative assistance action",
        result: "Helped Staff 1 run packet trace",
      });

    expect(res.status).toBe(201);
    expect(res.body.performedById).toBe(staff2.id);
    expect(res.body.performedBy.id).toBe(staff2.id);
  });

  it("API-ACT-20: Administrator can perform POST and PATCH successfully", async () => {
    const postRes = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", adminCookie)
      .send({
        description: "Administrator diagnostic intervention",
        result: "Cleared DNS cache and verified route table",
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.performedBy.role).toBe("ADMINISTRATOR");

    const patchRes = await request(app)
      .patch(`/api/tickets/${activeTicketId}/actions-taken/${postRes.body.id}`)
      .set("Cookie", adminCookie)
      .send({ result: "Admin updated result notes" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.result).toBe("Admin updated result notes");
  });

  it("API-ACT-21: Non-existent ticket returns 404; non-numeric ID returns 400 (INVALID_ID_FORMAT)", async () => {
    // 1. Non-existent ticket ID
    const resNotFound = await request(app)
      .get("/api/tickets/999999/actions-taken")
      .set("Cookie", staff1Cookie);
    expect(resNotFound.status).toBe(404);
    expect(resNotFound.body.code).toBe("TICKET_NOT_FOUND");

    // 2. Malformed non-numeric ID
    const resBadId = await request(app)
      .get("/api/tickets/12abc/actions-taken")
      .set("Cookie", staff1Cookie);
    expect(resBadId.status).toBe(400);
    expect(resBadId.body.code).toBe("INVALID_ID_FORMAT");

    // 3. Negative ID
    const resNegId = await request(app)
      .get("/api/tickets/-5/actions-taken")
      .set("Cookie", staff1Cookie);
    expect(resNegId.status).toBe(400);
    expect(resNegId.body.code).toBe("INVALID_ID_FORMAT");
  });

  it("API-ACT-22: Validation boundaries (whitespace only, 1000 pass, 1001 fail, attachmentNotes 500/501, type checks)", async () => {
    // Whitespace only description
    const resWhitespace = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: "   ", result: "Valid result" });
    expect(resWhitespace.status).toBe(400);
    expect(resWhitespace.body.code).toBe("VALIDATION_ERROR");

    // Exactly 1,000 characters description (pass)
    const exact1000 = "a".repeat(1000);
    const res1000 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: exact1000, result: "Valid result" });
    expect(res1000.status).toBe(201);

    // 1,001 characters description (fail)
    const overflow1001 = "a".repeat(1001);
    const res1001 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: overflow1001, result: "Valid result" });
    expect(res1001.status).toBe(400);
    expect(res1001.body.code).toBe("VALIDATION_ERROR");

    // attachmentNotes: 500 chars (pass)
    const attach500 = "b".repeat(500);
    const resAttach500 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: "Valid action with 500 char attach", result: "Result", attachmentNotes: attach500 });
    expect(resAttach500.status).toBe(201);

    // attachmentNotes: 501 chars (fail)
    const attach501 = "b".repeat(501);
    const resAttach501 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: "Valid action with 501 char attach", result: "Result", attachmentNotes: attach501 });
    expect(resAttach501.status).toBe(400);

    // Type mismatch (number instead of string)
    const resType = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({ description: 12345, result: "Result" });
    expect(resType.status).toBe(400);
  });

  it("API-ACT-23: actionAt validation (> 10 min future rejected, valid ISO pass, invalid date rejected)", async () => {
    // Future date > 10 min (1 hour in the future)
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const resFuture = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Action with future timestamp",
        result: "Should fail",
        actionAt: futureDate,
      });
    expect(resFuture.status).toBe(400);
    expect(resFuture.body.code).toBe("FUTURE_ACTION_DATE_REJECTED");

    // Valid past ISO date
    const pastDate = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const resPast = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Action with valid past timestamp",
        result: "Passed",
        actionAt: pastDate,
      });
    expect(resPast.status).toBe(201);
    expect(new Date(resPast.body.actionAt).toISOString()).toBe(pastDate);

    // Malformed invalid date string
    const resInvalidDate = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Action with invalid date string",
        result: "Passed",
        actionAt: "invalid-not-a-date",
      });
    expect(resInvalidDate.status).toBe(400);
    expect(resInvalidDate.body.code).toBe("VALIDATION_ERROR");
  });

  it("API-ACT-24: Deduplication boundaries (after 5s window succeeds, different desc succeeds)", async () => {
    const payload = {
      description: "Deduplication window verification unique action",
      result: "Testing timing boundaries",
    };

    // First post
    const res1 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send(payload);
    expect(res1.status).toBe(201);

    // Artificially age the first action to 6 seconds ago in the database
    await prisma.actionTaken.update({
      where: { id: res1.body.id },
      data: { createdAt: new Date(Date.now() - 6000) },
    });

    // Same payload submitted after 5 seconds window -> creates second record
    const res2 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send(payload);
    expect(res2.status).toBe(201);
    expect(res2.body.id).not.toBe(res1.body.id);

    // Different description submitted within 5 seconds -> creates both
    const res3 = await request(app)
      .post(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "Different description within same second",
        result: "Testing distinct description",
      });
    expect(res3.status).toBe(201);
  });

  it("API-ACT-25: Legacy ticket from Labs 1–3 handles actions taken cleanly", async () => {
    // 1. GET actions on legacy ticket returns empty array
    const resGet = await request(app)
      .get(`/api/tickets/${legacyTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie);
    expect(resGet.status).toBe(200);
    expect(Array.isArray(resGet.body)).toBe(true);
    expect(resGet.body.length).toBe(0);

    // 2. POST action on legacy ticket succeeds
    const resPost = await request(app)
      .post(`/api/tickets/${legacyTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie)
      .send({
        description: "First action on legacy ticket",
        result: "Legacy ticket updated without error",
      });
    expect(resPost.status).toBe(201);
    expect(resPost.body.ticketId).toBe(legacyTicketId);
  });

  it("API-ACT-26: Response data hygiene (performedBy exposes only id, name, role; no passwordHash)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", staff1Cookie);

    expect(res.status).toBe(200);
    const action = res.body[0];
    expect(action).toBeDefined();
    expect(action.performedBy).toBeDefined();
    expect(action.performedBy).toHaveProperty("id");
    expect(action.performedBy).toHaveProperty("name");
    expect(action.performedBy).toHaveProperty("role");
    expect(action.performedBy).not.toHaveProperty("passwordHash");
    expect(action.performedBy).not.toHaveProperty("requiresPasswordChange");
    expect(action).not.toHaveProperty("passwordHash");
  });

  it("API-ACT-27: Inactive user account is rejected with 401 Unauthorized", async () => {
    const res = await request(app)
      .get(`/api/tickets/${activeTicketId}/actions-taken`)
      .set("Cookie", inactiveStaffCookie);

    expect(res.status).toBe(401);
  });
});
