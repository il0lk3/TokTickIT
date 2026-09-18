import express, { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
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

    const dataToUpdate: Prisma.TicketUpdateInput = {};

    // 1. Validate and set ownerId
    if (ownerId !== undefined) {
      if (ownerId === null) {
        dataToUpdate.owner = { disconnect: true };
      } else {
        const targetOwner = await getPrisma().user.findUnique({
          where: { id: ownerId }
        });
        if (!targetOwner || !targetOwner.isActive || (targetOwner.role !== "IT_STAFF" && targetOwner.role !== "ADMINISTRATOR")) {
          return res.status(400).json({ error: "Invalid ownerId. Must be an active IT Staff or Administrator." });
        }
        dataToUpdate.ownerId = ownerId;
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
    if (status !== undefined && status !== ticket.currentStatus) {
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
      if (!allowedNext.includes(status) && status !== "Cancelled") {
        return res.status(400).json({ error: `Invalid status transition from ${current} to ${status}` });
      }

      dataToUpdate.currentStatus = status;
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

export default router;
