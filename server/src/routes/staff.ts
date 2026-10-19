import express, { Request, Response } from "express";
import { Prisma, TicketStatus, TicketPriority } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import {
  isValidTransition,
  computeResolutionGate,
  enrichTicketWithWorkflowMetadata,
} from "../utils/workflow.js";

const router = express.Router();
const prisma = getPrisma();

// Helper to validate numeric ID
function parseNumericId(idParam: string): number | null {
  if (!/^\d+$/.test(idParam)) return null;
  const num = parseInt(idParam, 10);
  return num > 0 ? num : null;
}

// Role guard: IT_STAFF and ADMINISTRATOR can access this router (BR-13)
router.use(authenticateToken);
router.use(requireRole(["IT_STAFF", "ADMINISTRATOR"]));

// GET /api/staff/tickets - Operational queue list
router.get("/tickets", async (req: Request, res: Response) => {
  try {
    const { 
      page = "1", 
      limit = "10", 
      search, 
      status, 
      requestedPriority, 
      itPriority,
      categoryId,
      ownerId,
      active,
      appearsResolved,
      updatedSince,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page parameter", code: "INVALID_PAGE" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ error: "Invalid limit parameter (must be between 1 and 50)", code: "INVALID_LIMIT" });
    }

    const allowedSortFields = ["createdAt", "updatedAt", "ticketNumber", "requestedPriority", "itPriority", "status"];
    if (!allowedSortFields.includes(sortBy as string)) {
      return res.status(400).json({ error: "Invalid sortBy parameter", code: "INVALID_SORT_BY" });
    }

    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return res.status(400).json({ error: "Invalid sortOrder parameter (must be 'asc' or 'desc')", code: "INVALID_SORT_ORDER" });
    }

    const validStatuses = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"];
    const where: Prisma.TicketWhereInput = {};
    const statusConditions: Prisma.TicketWhereInput[] = [];

    if (status) {
      const statusList = (status as string).split(",").map(s => s.trim()).filter(Boolean);
      for (const s of statusList) {
        if (!validStatuses.includes(s)) {
          return res.status(400).json({ error: "Invalid status parameter", code: "INVALID_STATUS" });
        }
      }
      if (statusList.length === 1) {
        statusConditions.push({ currentStatus: statusList[0] as TicketStatus });
      } else if (statusList.length > 1) {
        statusConditions.push({ currentStatus: { in: statusList as TicketStatus[] } });
      }
    }

    if (active === "true") {
      statusConditions.push({ currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] } });
    }

    if (statusConditions.length === 1) {
      where.currentStatus = statusConditions[0].currentStatus;
    } else if (statusConditions.length > 1) {
      where.AND = statusConditions;
    }

    const validRequestedPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (requestedPriority && !validRequestedPriorities.includes(requestedPriority as string)) {
      return res.status(400).json({ error: "Invalid requestedPriority parameter", code: "INVALID_PRIORITY" });
    }
    const validItPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (itPriority && !validItPriorities.includes(itPriority as string)) {
      return res.status(400).json({ error: "Invalid itPriority parameter", code: "INVALID_PRIORITY" });
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { ticketNumber: { contains: searchStr, mode: 'insensitive' } },
        { summary: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    if (requestedPriority) where.requestedPriority = requestedPriority as TicketPriority;
    if (itPriority) {
      where.itPriority = itPriority as TicketPriority;
    }
    
    if (categoryId) {
      const catId = parseInt(categoryId as string, 10);
      if (isNaN(catId)) {
        return res.status(400).json({ error: "Invalid categoryId parameter", code: "INVALID_CATEGORY_ID" });
      }
      where.categoryId = catId;
    }
    
    if (ownerId) {
      if (ownerId === "unassigned") {
        where.ownerId = null;
      } else if (ownerId === "me") {
        where.ownerId = res.locals.user?.id;
      } else {
        const ownerIdNum = parseInt(ownerId as string, 10);
        if (!isNaN(ownerIdNum)) {
          where.ownerId = ownerIdNum;
        } else {
          return res.status(400).json({ error: "Invalid ownerId parameter", code: "INVALID_OWNER_ID" });
        }
      }
    }

    if (appearsResolved === "true") {
      where.appearsResolved = true;
    }

    if (updatedSince) {
      const date = new Date(updatedSince as string);
      if (!isNaN(date.getTime())) {
        where.updatedAt = { gte: date };
      }
    }

    const skip = (pageNum - 1) * limitNum;
    const prismaSortField = sortBy === "status" ? "currentStatus" : sortBy;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [{ [prismaSortField as string]: sortOrder }, { id: 'desc' }],
        skip,
        take: limitNum,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true, isActive: true, role: true } }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: tickets.map((t) => enrichTicketWithWorkflowMetadata(t)),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error("Error fetching staff tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/staff/tickets/:id - Detail view with workflow enrichment
router.get("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseNumericId(req.params.id);
    if (!ticketId) {
      return res.status(400).json({ error: "Invalid ticket ID", code: "INVALID_ID_FORMAT" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
        owner: { select: { id: true, name: true, email: true, isActive: true, role: true } },
        attachments: true,
        publicComments: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        internalNotes: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        _count: {
          select: {
            actionsTaken: {
              where: {
                result: { not: "" }
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }

    const gateStatus = computeResolutionGate(ticket);
    res.json(enrichTicketWithWorkflowMetadata(ticket, gateStatus));
  } catch (error) {
    console.error("Error fetching staff ticket detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/staff/tickets/:id - Update status, owner, and priority with OCC and gate
router.patch("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseNumericId(req.params.id);
    if (!ticketId) {
      return res.status(400).json({ error: "Invalid ticket ID", code: "INVALID_ID_FORMAT" });
    }

    const { expectedVersion, ownerId, itPriority, status } = req.body;

    // 1. Mandatory expectedVersion Validation
    if (expectedVersion === undefined) {
      return res.status(400).json({
        error: "expectedVersion is mandatory for ticket updates",
        code: "VERSION_REQUIRED"
      });
    }

    if (typeof expectedVersion !== "number" || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return res.status(400).json({
        error: "expectedVersion must be a non-negative integer",
        code: "INVALID_VERSION_FORMAT"
      });
    }

    // Reject empty update payload where no operational fields are provided
    if (ownerId === undefined && itPriority === undefined && status === undefined) {
      return res.status(400).json({
        error: "At least one operational field (ownerId, itPriority, or status) must be provided to update",
        code: "NO_FIELDS_TO_UPDATE"
      });
    }

    // 2. Validate enum types before touching database
    if (status !== undefined) {
      const validStatuses = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status: ${status}`,
          code: "INVALID_STATUS_VALUE"
        });
      }
    }

    if (itPriority !== undefined) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH"];
      if (!validPriorities.includes(itPriority)) {
        return res.status(400).json({
          error: `Invalid itPriority: ${itPriority}`,
          code: "INVALID_PRIORITY"
        });
      }
    }

    // 3. Fetch current ticket with owner and actionsTaken results
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        owner: { select: { id: true, name: true, email: true, isActive: true, role: true } },
        actionsTaken: { select: { result: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }

    // 4. Stale update check (Optimistic Concurrency Control)
    if (expectedVersion !== ticket.version) {
      return res.status(409).json({
        error: "This ticket has been modified by another user. Please reload the latest changes.",
        code: "STALE_VERSION_CONFLICT",
        currentVersion: ticket.version,
        currentStatus: ticket.currentStatus,
        updatedAt: ticket.updatedAt
      });
    }

    // 5. Terminal / Locked Ticket Guard
    const isLocked = ["Closed", "Cancelled"].includes(ticket.currentStatus);
    if (isLocked) {
      // Only Closed -> Reopened is permitted; all other modifications (priority, owner, other status) are blocked
      if (ticket.currentStatus === "Closed" && status === "Reopened") {
        // Permitted transition, proceed
      } else if (status !== undefined && !isValidTransition(ticket.currentStatus, status)) {
        return res.status(400).json({
          error: `Invalid status transition from ${ticket.currentStatus} to ${status}`,
          code: "INVALID_STATUS_TRANSITION"
        });
      } else {
        return res.status(400).json({
          error: `Cannot modify a locked ticket in status ${ticket.currentStatus}`,
          code: "TERMINAL_TICKET_LOCKED"
        });
      }
    }

    // 6. Assignee / Owner Validation
    let candidateOwner: { id: number; isActive: boolean; role: string } | null = null;
    if (ownerId !== undefined) {
      if (ownerId === null) {
        candidateOwner = null;
      } else {
        const targetUser = await prisma.user.findUnique({
          where: { id: ownerId },
          select: { id: true, name: true, email: true, isActive: true, role: true }
        });

        if (!targetUser) {
          return res.status(400).json({
            error: "Assignee user not found",
            code: "ASSIGNEE_NOT_FOUND"
          });
        }
        if (!targetUser.isActive) {
          return res.status(400).json({
            error: "Must be an active IT Staff member (inactive user rejected)",
            code: "INACTIVE_ASSIGNEE_REJECTED"
          });
        }
        if (targetUser.role !== "IT_STAFF") {
          return res.status(400).json({
            error: "Must be an active IT Staff member (ineligible role)",
            code: "ASSIGNEE_NOT_ELIGIBLE"
          });
        }
        candidateOwner = targetUser;
      }
    }

    // 7. Status Transition & Resolution Gate Check
    let nextStatus = status;
    const isClaiming = ownerId !== undefined && ownerId !== null && ticket.currentStatus === "New" && status === undefined;
    if (isClaiming) {
      nextStatus = "Open";
    }

    if (nextStatus !== undefined && nextStatus !== ticket.currentStatus) {
      if (!isValidTransition(ticket.currentStatus, nextStatus)) {
        return res.status(400).json({
          error: `Invalid status transition from ${ticket.currentStatus} to ${nextStatus}`,
          code: "INVALID_STATUS_TRANSITION"
        });
      }

      if (nextStatus === "Resolved") {
        const gate = computeResolutionGate(ticket, ownerId !== undefined ? candidateOwner : undefined);
        if (!gate.met) {
          return res.status(400).json({
            error: "Resolution gate failed: Ticket must have an active IT Staff owner and at least one Action Taken with a result.",
            code: "RESOLUTION_GATE_FAILED",
            details: gate.missing
          });
        }
      }
    }

    // 8. Prepare update data
    const updatePayload: Prisma.TicketUncheckedUpdateInput = {
      version: { increment: 1 },
      updatedAt: new Date()
    };

    if (ownerId !== undefined) {
      updatePayload.ownerId = ownerId;
    }
    if (itPriority !== undefined) {
      updatePayload.itPriority = itPriority as TicketPriority;
    }
    if (nextStatus !== undefined) {
      updatePayload.currentStatus = nextStatus as TicketStatus;
      updatePayload.appearsResolved = false; // Reset advisory flag on status transition
    }

    // 9. Atomic Conditional Update using updateMany on expectedVersion
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        version: expectedVersion
      },
      data: updatePayload
    });

    if (updateResult.count === 0) {
      const freshTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({
        error: "This ticket has been modified by another user. Please reload the latest changes.",
        code: "STALE_VERSION_CONFLICT",
        currentVersion: freshTicket?.version ?? expectedVersion + 1,
        currentStatus: freshTicket?.currentStatus ?? ticket.currentStatus,
        updatedAt: freshTicket?.updatedAt ?? new Date()
      });
    }

    // 10. Fetch updated ticket and enrich with workflow metadata
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true, isActive: true, role: true } },
        _count: {
          select: {
            actionsTaken: {
              where: {
                result: { not: "" }
              }
            }
          }
        }
      }
    });

    const gateStatus = computeResolutionGate(updatedTicket!);
    res.json(enrichTicketWithWorkflowMetadata(updatedTicket!, gateStatus));

  } catch (error) {
    console.error("Error updating staff ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/staff/tickets/:id/notes
router.post("/tickets/:id/notes", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const ticketId = parseNumericId(req.params.id);
  if (!ticketId) {
    return res.status(400).json({ error: "Invalid ticket ID", code: "INVALID_ID_FORMAT" });
  }

  const { content } = req.body;

  try {
    const trimmedContent = typeof content === 'string' ? content.trim() : "";
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      return res.status(400).json({ error: "Note must be between 1 and 1000 characters", code: "INVALID_NOTE_LENGTH" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }

    const lockedStatuses = ["Closed", "Cancelled"];
    if (lockedStatuses.includes(ticket.currentStatus)) {
      return res.status(400).json({ error: "Cannot add notes to a closed or cancelled ticket", code: "TERMINAL_TICKET_LOCKED" });
    }

    const note = await prisma.internalNote.create({
      data: {
        content: trimmedContent,
        authorId: userId,
        ticketId
      },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Error posting internal note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/staff/tickets/:id/claim
router.post("/tickets/:id/claim", async (req: Request, res: Response) => {
  const user = res.locals.user;
  const userId = user.id;
  const ticketId = parseNumericId(req.params.id);
  if (!ticketId) {
    return res.status(400).json({ error: "Invalid ticket ID", code: "INVALID_ID_FORMAT" });
  }

  // Guard against ineligible owner: only active IT_STAFF can claim (BR-12)
  if (user.role !== "IT_STAFF") {
    return res.status(400).json({
      error: "Must be an active IT Staff member (ineligible role)",
      code: "ASSIGNEE_NOT_ELIGIBLE"
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      error: "Must be an active IT Staff member (inactive user rejected)",
      code: "INACTIVE_ASSIGNEE_REJECTED"
    });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }

    const lockedStatuses = ["Closed", "Cancelled"];
    if (lockedStatuses.includes(ticket.currentStatus)) {
      return res.status(400).json({ error: "Cannot claim a terminal ticket.", code: "TERMINAL_TICKET_LOCKED" });
    }

    const dataToUpdate: Prisma.TicketUncheckedUpdateInput = {
      ownerId: userId,
      version: { increment: 1 },
      updatedAt: new Date()
    };
    if (ticket.currentStatus === "New") {
      dataToUpdate.currentStatus = "Open";
      dataToUpdate.appearsResolved = false;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true, isActive: true, role: true } },
        _count: {
          select: {
            actionsTaken: {
              where: {
                result: { not: "" }
              }
            }
          }
        }
      }
    });

    const gateStatus = computeResolutionGate(updatedTicket);
    res.json(enrichTicketWithWorkflowMetadata(updatedTicket, gateStatus));
  } catch (error) {
    console.error("Error claiming ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
