import { Router, Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// Middleware: Authenticate via X-Requester-Id header
router.use(async (req: Request, res: Response, next: NextFunction) => {
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
});

// POST /api/tickets - Create a new ticket
router.post("/", async (req: Request, res: Response) => {
  const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;
  const requesterId = res.locals.requesterId as number;

  // Basic Validation
  if (!categoryId || !relatedSystemId || !requestedPriority || !summary || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (typeof summary !== "string" || summary.trim().length === 0) {
    res.status(400).json({ error: "Summary is required" });
    return;
  }

  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (!validPriorities.includes(requestedPriority)) {
    res.status(400).json({ error: "Invalid requestedPriority" });
    return;
  }

  try {
    const prisma = getPrisma();
    
    // Generate Ticket Number
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count({
      where: {
        ticketNumber: {
          startsWith: `TKT-${year}-`
        }
      }
    });
    const sequentialNumber = String(count + 1).padStart(6, '0');
    const ticketNumber = `TKT-${year}-${sequentialNumber}`;

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
        currentStatus: "New",
        requesterId,
        categoryId: parseInt(categoryId, 10),
        relatedSystemId: parseInt(relatedSystemId, 10)
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
