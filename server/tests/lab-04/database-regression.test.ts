import { describe, it, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { execSync } from "child_process";
import { TicketPriority, TicketStatus } from "@prisma/client";

describe("Lab 4 Database & Migration Regression (API-MIG-01, API-MIG-02 / AC-11)", () => {
  const prisma = getPrisma();

  describe("API-MIG-01: Schema Integrity & Legacy Data Preservation (AC-11)", () => {
    it("should preserve all core models and records from Labs 1–3", async () => {
      const userCount = await prisma.user.count();
      const categoryCount = await prisma.category.count();
      const systemCount = await prisma.relatedSystem.count();
      const ticketCount = await prisma.ticket.count();
      const commentCount = await prisma.publicComment.count();
      const noteCount = await prisma.internalNote.count();
      const attachmentCount = await prisma.attachment.count();

      expect(userCount).toBeGreaterThanOrEqual(18);
      expect(categoryCount).toBeGreaterThanOrEqual(4);
      expect(systemCount).toBeGreaterThanOrEqual(9);
      expect(ticketCount).toBeGreaterThanOrEqual(4);
      expect(commentCount).toBeGreaterThanOrEqual(1);
      expect(noteCount).toBeGreaterThanOrEqual(1);
      expect(attachmentCount).toBeGreaterThanOrEqual(1);
    });

    it("should ensure every Ticket has the integer 'version' column initialized to >= 1", async () => {
      const tickets = await prisma.ticket.findMany({ select: { id: true, version: true } });
      expect(tickets.length).toBeGreaterThan(0);
      for (const t of tickets) {
        expect(t.version).toBeDefined();
        expect(typeof t.version).toBe("number");
        expect(t.version).toBeGreaterThanOrEqual(1);
      }
    });

    it("should ensure every Ticket has the boolean 'appearsResolved' column", async () => {
      const tickets = await prisma.ticket.findMany({ select: { id: true, appearsResolved: true } });
      expect(tickets.length).toBeGreaterThan(0);
      for (const t of tickets) {
        expect(t.appearsResolved).toBeDefined();
        expect(typeof t.appearsResolved).toBe("boolean");
      }
    });

    it("should support creating, reading, and querying ActionTaken with proper relationships", async () => {
      // Find a staff member and an existing ticket
      const staff = await prisma.user.findFirstOrThrow({ where: { role: "IT_STAFF", isActive: true } });
      const ticket = await prisma.ticket.findFirstOrThrow();

      // Create a temporary test action
      const testAction = await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performedById: staff.id,
          description: "Temporary unit test diagnostic action",
          result: "Diagnostics completed successfully with exit code 0",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "test_output.log",
        },
        include: {
          ticket: true,
          performedBy: true,
        },
      });

      expect(testAction.id).toBeDefined();
      expect(testAction.ticket.id).toBe(ticket.id);
      expect(testAction.performedBy.id).toBe(staff.id);
      expect(testAction.actionAt).toBeInstanceOf(Date);
      expect(testAction.followUpRequired).toBe(false);

      // Clean up test action
      await prisma.actionTaken.delete({ where: { id: testAction.id } });
    });

    it("should enforce Cascade delete: deleting a Ticket cascades to its ActionsTaken", async () => {
      const requester = await prisma.user.findFirstOrThrow({ where: { role: "REQUESTER" } });
      const staff = await prisma.user.findFirstOrThrow({ where: { role: "IT_STAFF" } });
      const cat = await prisma.category.findFirstOrThrow();
      const sys = await prisma.relatedSystem.findFirstOrThrow();

      // Create a dedicated temporary ticket
      const tempTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-TEST-${Date.now()}`,
          summary: "Temporary Cascade Delete Verification Ticket",
          description: "Used solely to verify ActionTaken cascade deletion constraint.",
          requestedPriority: TicketPriority.LOW,
          requesterId: requester.id,
          categoryId: cat.id,
          relatedSystemId: sys.id,
        },
      });

      // Add 2 actions
      const act1 = await prisma.actionTaken.create({
        data: {
          ticketId: tempTicket.id,
          performedById: staff.id,
          description: "Action 1 for cascade verification",
          result: "Done",
        },
      });

      const act2 = await prisma.actionTaken.create({
        data: {
          ticketId: tempTicket.id,
          performedById: staff.id,
          description: "Action 2 for cascade verification",
          result: "Done",
        },
      });

      // Delete the ticket
      await prisma.ticket.delete({ where: { id: tempTicket.id } });

      // Verify actions are removed
      const remainingAct1 = await prisma.actionTaken.findUnique({ where: { id: act1.id } });
      const remainingAct2 = await prisma.actionTaken.findUnique({ where: { id: act2.id } });
      expect(remainingAct1).toBeNull();
      expect(remainingAct2).toBeNull();
    });

    it("should represent all 8 TicketStatus enum values across seeded data", async () => {
      const tickets = await prisma.ticket.findMany({ select: { currentStatus: true } });
      const statuses = new Set(tickets.map((t) => t.currentStatus));

      expect(statuses.has(TicketStatus.New)).toBe(true);
      expect(statuses.has(TicketStatus.Open)).toBe(true);
      expect(statuses.has(TicketStatus.InProgress)).toBe(true);
      expect(statuses.has(TicketStatus.WaitingForRequester)).toBe(true);
      expect(statuses.has(TicketStatus.Resolved)).toBe(true);
      expect(statuses.has(TicketStatus.Closed)).toBe(true);
      expect(statuses.has(TicketStatus.Reopened)).toBe(true);
      expect(statuses.has(TicketStatus.Cancelled)).toBe(true);
    });

    it("should provide at least one Requester with ZERO tickets to test empty dashboard state", async () => {
      const emptyUser = await prisma.user.findUnique({ where: { email: "pueng.su@example.com" } });
      expect(emptyUser).not.toBeNull();
      const count = await prisma.ticket.count({ where: { requesterId: emptyUser!.id } });
      expect(count).toBe(0);
    });
  });

  describe("API-MIG-02: Seed Idempotency & Repeatability (AC-11)", () => {
    it("should maintain strictly identical record counts across repeated seed executions", async () => {
      const preCounts = {
        users: await prisma.user.count(),
        tickets: await prisma.ticket.count(),
        actions: await prisma.actionTaken.count(),
        comments: await prisma.publicComment.count(),
        notes: await prisma.internalNote.count(),
        attachments: await prisma.attachment.count(),
      };

      // Run prisma seed script
      execSync("npx prisma db seed", {
        cwd: process.cwd(),
        env: process.env,
        stdio: "pipe",
      });

      const postCounts = {
        users: await prisma.user.count(),
        tickets: await prisma.ticket.count(),
        actions: await prisma.actionTaken.count(),
        comments: await prisma.publicComment.count(),
        notes: await prisma.internalNote.count(),
        attachments: await prisma.attachment.count(),
      };

      expect(postCounts.users).toBe(preCounts.users);
      expect(postCounts.tickets).toBe(preCounts.tickets);
      expect(postCounts.actions).toBe(preCounts.actions);
      expect(postCounts.comments).toBe(preCounts.comments);
      expect(postCounts.notes).toBe(preCounts.notes);
      expect(postCounts.attachments).toBe(preCounts.attachments);
    });
  });
});
