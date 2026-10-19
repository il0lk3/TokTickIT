import express, { Request, Response } from "express";
import { Prisma, TicketStatus, Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = getPrisma();

// Helper to compute admin user counts
async function computeAdminUserCounts() {
  const [total, active, roleGroups] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
  ]);

  const counts = {
    total,
    active,
    requesters: 0,
    staff: 0,
    admins: 0,
  };

  for (const rg of roleGroups) {
    if (rg.role === Role.REQUESTER) counts.requesters = rg._count.id;
    if (rg.role === Role.IT_STAFF) counts.staff = rg._count.id;
    if (rg.role === Role.ADMINISTRATOR) counts.admins = rg._count.id;
  }

  return counts;
}

// ===========================================================================
// GET /api/dashboard/requester - Requester personal metrics and recent tickets
// ===========================================================================
router.get(
  "/requester",
  authenticateToken,
  requireRole(["REQUESTER"]),
  async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

      const requesterId = res.locals.user.id;
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      // Parallel aggregations for Requester
      const [
        openRequestsCount,
        inProgressCount,
        waitingCount,
        recentlyResolvedCount,
        closedCount,
        recentTickets,
        attentionTickets,
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            requesterId,
            currentStatus: { in: [TicketStatus.New, TicketStatus.Open, TicketStatus.Reopened] },
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId,
            currentStatus: TicketStatus.InProgress,
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId,
            currentStatus: TicketStatus.WaitingForRequester,
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId,
            currentStatus: TicketStatus.Resolved,
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.ticket.count({
          where: {
            requesterId,
            currentStatus: TicketStatus.Closed,
          },
        }),
        prisma.ticket.findMany({
          where: { requesterId },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            appearsResolved: true,
            updatedAt: true,
            category: { select: { id: true, name: true } },
          },
        }),
        prisma.ticket.findMany({
          where: {
            requesterId,
            currentStatus: TicketStatus.WaitingForRequester,
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            appearsResolved: true,
            updatedAt: true,
            category: { select: { id: true, name: true } },
          },
        }),
      ]);

      res.status(200).json({
        metrics: {
          openRequests: {
            count: openRequestsCount,
            drillDown: {
              path: "/tickets",
              query: { status: "New,Open,Reopened" },
            },
          },
          inProgress: {
            count: inProgressCount,
            drillDown: {
              path: "/tickets",
              query: { status: "InProgress" },
            },
          },
          waitingForRequester: {
            count: waitingCount,
            drillDown: {
              path: "/tickets",
              query: { status: "WaitingForRequester" },
            },
          },
          recentlyResolved: {
            count: recentlyResolvedCount,
            drillDown: {
              path: "/tickets",
              query: { status: "Resolved", updatedSince: sevenDaysAgoIso },
            },
          },
          closed: {
            count: closedCount,
            drillDown: {
              path: "/tickets",
              query: { status: "Closed" },
            },
          },
        },
        recentTickets,
        attentionTickets,
        generatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch requester dashboard:", error);
      res.status(500).json({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  }
);

// ===========================================================================
// GET /api/dashboard/staff - IT Staff & Administrator operational dashboard
// ===========================================================================
router.get(
  "/staff",
  authenticateToken,
  requireRole(["IT_STAFF", "ADMINISTRATOR"]),
  async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

      const user = (req as any).user || res.locals.user;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twentyFourHoursAgoIso = twentyFourHoursAgo.toISOString();

      const activeWhere: Prisma.TicketWhereInput = {
        currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] },
      };

      const [
        statusGroups,
        priorityGroups,
        unassignedCount,
        ownedByMeCount,
        appearsResolvedCount,
        recentlyUpdatedCount,
        myRecentTickets,
        urgentTickets,
        adminUserCounts,
      ] = await Promise.all([
        // 1. Single-pass groupBy on currentStatus across all tickets
        prisma.ticket.groupBy({
          by: ["currentStatus"],
          _count: { id: true },
        }),
        // 2. Single-pass groupBy on itPriority for active tickets
        prisma.ticket.groupBy({
          by: ["itPriority"],
          where: activeWhere,
          _count: { id: true },
        }),
        // 3. Unassigned active tickets
        prisma.ticket.count({
          where: { ...activeWhere, ownerId: null },
        }),
        // 4. Owned by me active tickets
        prisma.ticket.count({
          where: { ...activeWhere, ownerId: user.id },
        }),
        // 5. Appears resolved active tickets
        prisma.ticket.count({
          where: { ...activeWhere, appearsResolved: true },
        }),
        // 6. Recently updated active tickets (last 24 hours)
        prisma.ticket.count({
          where: { ...activeWhere, updatedAt: { gte: twentyFourHoursAgo } },
        }),
        // 7. My Recent Tickets (active, owned by logged in staff)
        prisma.ticket.findMany({
          where: { ...activeWhere, ownerId: user.id },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            itPriority: true,
            appearsResolved: true,
            category: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
            updatedAt: true,
          },
        }),
        // 8. Urgent Tickets (active, HIGH priority, recency ordered)
        prisma.ticket.findMany({
          where: { ...activeWhere, itPriority: "HIGH" },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            itPriority: true,
            appearsResolved: true,
            category: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
            updatedAt: true,
          },
        }),
        // 9. Admin user counts (only if ADMINISTRATOR)
        user.role === Role.ADMINISTRATOR ? computeAdminUserCounts() : Promise.resolve(null),
      ]);

      // Normalize byStatus map (all 8 statuses guaranteed with numbers >= 0)
      const byStatus: Record<string, number> = {
        New: 0,
        Open: 0,
        InProgress: 0,
        WaitingForRequester: 0,
        Resolved: 0,
        Reopened: 0,
        Closed: 0,
        Cancelled: 0,
      };
      for (const sg of statusGroups) {
        if (byStatus[sg.currentStatus] !== undefined) {
          byStatus[sg.currentStatus] = sg._count.id;
        }
      }

      // Normalize byPriority map (LOW, MEDIUM, HIGH, UNSET guaranteed with numbers >= 0)
      const byPriority: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        UNSET: 0,
      };
      for (const pg of priorityGroups) {
        if (pg.itPriority && byPriority[pg.itPriority] !== undefined) {
          byPriority[pg.itPriority] = pg._count.id;
        } else {
          byPriority.UNSET += pg._count.id;
        }
      }

      res.status(200).json({
        metrics: {
          unassigned: {
            count: unassignedCount,
            drillDown: {
              path: "/queue",
              query: { ownerId: "unassigned", active: "true" },
            },
          },
          ownedByMe: {
            count: ownedByMeCount,
            drillDown: {
              path: "/queue",
              query: { ownerId: "me", active: "true" },
            },
          },
          appearsResolved: {
            count: appearsResolvedCount,
            drillDown: {
              path: "/queue",
              query: { appearsResolved: "true", active: "true" },
            },
          },
          recentlyUpdated: {
            count: recentlyUpdatedCount,
            drillDown: {
              path: "/queue",
              query: { active: "true", updatedSince: twentyFourHoursAgoIso },
            },
          },
          byStatus,
          byPriority,
          adminUserCounts,
        },
        myRecentTickets,
        urgentTickets,
        generatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch staff dashboard:", error);
      res.status(500).json({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  }
);

export default router;
