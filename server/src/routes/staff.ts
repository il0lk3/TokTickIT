import express, { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { authenticateToken, requireRole } from "../middleware/auth";

const prisma = new PrismaClient();
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

    // Build Prisma Where Clause
    const where: Prisma.TicketWhereInput = {};

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { ticketNumber: { contains: searchStr } },
        { summary: { contains: searchStr } }
      ];
    }

    if (status) where.currentStatus = status as string;
    if (requestedPriority) where.requestedPriority = requestedPriority as string;
    if (itPriority) where.itPriority = itPriority as string;
    if (categoryId) {
      const catId = parseInt(categoryId as string, 10);
      if (!isNaN(catId)) where.categoryId = catId;
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
      prisma.ticket.findMany({
        where,
        orderBy: { [prismaSortField as string]: sortOrder },
        skip,
        take: limitNum,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.ticket.count({ where })
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

export default router;
