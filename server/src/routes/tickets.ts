import { Router, Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// Middleware: Authenticate via X-Requester-Id header
router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.header("X-Requester-Id");
    if (!requesterId) {
      res.status(401).json({ error: "Requester not found or missing X-Requester-Id header" });
      return;
    }

    const id = parseInt(requesterId, 10);
    if (isNaN(id)) {
      res.status(401).json({ error: "Requester not found or missing X-Requester-Id header" });
      return;
    }

    const requester = await getPrisma().requesterUser.findUnique({
      where: { id, isActive: true }
    });

    if (!requester) {
      res.status(401).json({ error: "Requester not found or missing X-Requester-Id header" });
      return;
    }

    // Attach requesterId to locals for use in route handlers
    res.locals.requesterId = id;
    next();
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets - Create a new ticket
router.post("/", async (req: Request, res: Response) => {
  try {
    const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;
    const requesterId = res.locals.requesterId as number;

    // Basic Validation
    if (!categoryId || !relatedSystemId || !requestedPriority || summary === undefined || description === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const catId = parseInt(categoryId, 10);
    const sysId = parseInt(relatedSystemId, 10);
    if (isNaN(catId) || isNaN(sysId)) {
      res.status(400).json({ error: "Invalid categoryId or relatedSystemId" });
      return;
    }

    const trimmedSummary = String(summary).trim();
    const trimmedDesc = String(description).trim();
    if (trimmedSummary.length === 0 || trimmedSummary.length > 150) {
      res.status(400).json({ error: "Summary must be between 1 and 150 characters" });
      return;
    }
    if (trimmedDesc.length === 0 || trimmedDesc.length > 1000) {
      res.status(400).json({ error: "Description must be between 1 and 1000 characters" });
      return;
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!validPriorities.includes(requestedPriority)) {
      res.status(400).json({ error: "Invalid requestedPriority" });
      return;
    }

    const prisma = getPrisma();

    // Verify Foreign Keys
    const category = await prisma.category.findUnique({ where: { id: catId } });
    const system = await prisma.relatedSystem.findUnique({ where: { id: sysId } });
    if (!category || !system) {
      res.status(400).json({ error: "Category or Related System does not exist" });
      return;
    }

    // Prevent duplicate submission (same summary within 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const duplicate = await prisma.ticket.findFirst({
      where: {
        requesterId,
        summary: trimmedSummary,
        createdAt: { gte: tenSecondsAgo }
      }
    });
    if (duplicate) {
      res.status(400).json({ error: "Duplicate submission detected" });
      return;
    }

    // Generate Ticket Number with retry
    let ticket: any = null;
    let attempts = 0;
    while (!ticket && attempts < 3) {
      attempts++;
      const year = new Date().getFullYear();
      const count = await prisma.ticket.count({
        where: { ticketNumber: { startsWith: `TKT-${year}-` } }
      });
      const sequentialNumber = String(count + 1).padStart(6, '0');
      const ticketNumber = `TKT-${year}-${sequentialNumber}`;

      try {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            summary: trimmedSummary,
            description: trimmedDesc,
            requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
            currentStatus: "New",
            requesterId,
            categoryId: catId,
            relatedSystemId: sysId
          }
        });
      } catch (e: any) {
        if (e.code === 'P2002') { // Unique constraint violation
          continue; // retry
        }
        throw e;
      }
    }

    if (!ticket) {
      res.status(500).json({ error: "Failed to generate unique ticket number after 3 attempts" });
      return;
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
