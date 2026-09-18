import express, { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Role guard: Only IT_STAFF can access this router
router.use(authenticateToken);
router.use(requireRole(["IT_STAFF"]));

// GET /api/staff/tickets
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
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Parsing and validation
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ error: "Invalid limit parameter (must be between 1 and 50)" });
    }

    const allowedSortFields = ["createdAt", "updatedAt", "ticketNumber", "requestedPriority", "itPriority", "status"];
    if (!allowedSortFields.includes(sortBy as string)) {
      return res.status(400).json({ error: "Invalid sortBy parameter" });
    }

    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return res.status(400).json({ error: "Invalid sortOrder parameter (must be 'asc' or 'desc')" });
    }

    // Validate enum filters
    const validStatuses = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"];
    if (status && !validStatuses.includes(status as string)) {
      return res.status(400).json({ error: "Invalid status parameter" });
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (requestedPriority && !validPriorities.includes(requestedPriority as string)) {
      return res.status(400).json({ error: "Invalid requestedPriority parameter" });
    }
    if (itPriority && !validPriorities.includes(itPriority as string)) {
      return res.status(400).json({ error: "Invalid itPriority parameter" });
    }

    // Build Prisma Where Clause
    const where: Prisma.TicketWhereInput = {};

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { ticketNumber: { contains: searchStr, mode: 'insensitive' } },
        { summary: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    if (status) where.currentStatus = status as string;
    if (requestedPriority) where.requestedPriority = requestedPriority as string;
    if (itPriority) where.itPriority = itPriority as string;
    
    if (categoryId) {
      const catId = parseInt(categoryId as string, 10);
      if (isNaN(catId)) {
        return res.status(400).json({ error: "Invalid categoryId parameter" });
      }
      where.categoryId = catId;
    }
    
    if (ownerId) {
      if (ownerId === "unassigned") {
        where.ownerId = null;
      } else {
        const ownerIdNum = parseInt(ownerId as string, 10);
        if (!isNaN(ownerIdNum)) {
          where.ownerId = ownerIdNum;
        } else {
          return res.status(400).json({ error: "Invalid ownerId parameter" });
        }
      }
    }

    // Pagination computation
    const skip = (pageNum - 1) * limitNum;

    // Prisma sort field mapping
    const prismaSortField = sortBy === "status" ? "currentStatus" : sortBy;

    // Fetch data and count
    const [tickets, total] = await Promise.all([
      getPrisma().ticket.findMany({
        where,
        orderBy: { [prismaSortField as string]: sortOrder },
        skip,
        take: limitNum,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } }
        }
      }),
      getPrisma().ticket.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: tickets,
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

// PATCH /api/staff/tickets/:id
router.patch("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const { ownerId, itPriority, status } = req.body;
    
    // Fetch current ticket
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const terminalStatuses = ["Resolved", "Closed", "Cancelled"];
    const dataToUpdate: Prisma.TicketUncheckedUpdateInput = {};
    let isClaiming = false;

    // 1. Validate and set ownerId
    if (ownerId !== undefined) {
      if (ownerId === null) {
        dataToUpdate.ownerId = null;
      } else {
        const targetOwner = await getPrisma().user.findUnique({
          where: { id: ownerId }
        });
        if (!targetOwner || !targetOwner.isActive || targetOwner.role !== "IT_STAFF") {
          return res.status(400).json({ error: "Invalid ownerId. Must be an active IT Staff." });
        }
        
        if (terminalStatuses.includes(ticket.currentStatus)) {
          return res.status(400).json({ error: "Cannot assign/claim a terminal ticket." });
        }

        dataToUpdate.ownerId = ownerId;
        isClaiming = true;
      }
    }

    // 2. Validate and set itPriority
    if (itPriority !== undefined) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH"];
      if (!validPriorities.includes(itPriority)) {
        return res.status(400).json({ error: "Invalid itPriority" });
      }
      dataToUpdate.itPriority = itPriority as "LOW" | "MEDIUM" | "HIGH";
    }

    // 3. Validate and set status (enforce transition matrix)
    let nextStatus = status;
    if (isClaiming && ticket.currentStatus === "New" && status === undefined) {
      nextStatus = "Open";
    }

    if (nextStatus !== undefined && nextStatus !== ticket.currentStatus) {
      const current = ticket.currentStatus;
      
      const validTransitions: Record<string, string[]> = {
        "New": ["Open", "Cancelled"],
        "Open": ["InProgress", "Resolved", "Cancelled"],
        "InProgress": ["WaitingForRequester", "Resolved", "Cancelled"],
        "WaitingForRequester": ["InProgress", "Cancelled"],
        "Resolved": ["Closed", "Reopened", "Cancelled"],
        "Closed": ["Cancelled"],
        "Reopened": ["InProgress", "Resolved", "Cancelled"],
        "Cancelled": []
      };

      // BR-09: Any -> Cancelled is allowed
      const allowedNext = validTransitions[current] || [];
      if (!allowedNext.includes(nextStatus) && nextStatus !== "Cancelled") {
        return res.status(400).json({ error: `Invalid status transition from ${current} to ${nextStatus}` });
      }

      dataToUpdate.currentStatus = nextStatus;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedTicket = await getPrisma().ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/staff/tickets/:id
router.get("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
        owner: { select: { id: true, name: true, email: true } },
        attachments: true,
        publicComments: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        internalNotes: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error fetching staff ticket detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/staff/tickets/:id/notes
router.post("/tickets/:id/notes", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const ticketId = parseInt(req.params.id, 10);
  const { content } = req.body;

  try {
    const trimmedContent = typeof content === 'string' ? content.trim() : "";
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      return res.status(400).json({ error: "Note must be between 1 and 1000 characters" });
    }

    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const terminalStatuses = ["Resolved", "Closed", "Cancelled"];
    if (terminalStatuses.includes(ticket.currentStatus)) {
      return res.status(400).json({ error: "Cannot add notes to a closed or resolved ticket" });
    }

    const note = await getPrisma().internalNote.create({
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
  const userId = res.locals.user.id;
  const ticketId = parseInt(req.params.id, 10);

  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const terminalStatuses = ["Resolved", "Closed", "Cancelled"];
    if (terminalStatuses.includes(ticket.currentStatus)) {
      return res.status(400).json({ error: "Cannot claim a terminal ticket." });
    }

    const dataToUpdate: Prisma.TicketUncheckedUpdateInput = { ownerId: userId };
    if (ticket.currentStatus === "New") {
      dataToUpdate.currentStatus = "Open";
    }

    const updatedTicket = await getPrisma().ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error claiming ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
