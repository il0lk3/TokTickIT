import { Router, Request, Response, NextFunction } from "express";
import { getPrisma } from "../prisma.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = Router();
const prisma = getPrisma();
import { authenticateToken } from "../middleware/auth.js";

// Setup Multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// Middleware: Authenticate via JWT
router.use(authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  // Map user id to requesterId for Lab 2 routes backward compatibility
  // Note: IT Staff also uses this router for some endpoints in Lab 3 (e.g. GET /api/tickets/:id).
  res.locals.requesterId = res.locals.user.id;
  next();
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
      const sequentialNumber = String(count + attempts).padStart(6, '0');
      const ticketNumber = `TKT-${year}-${sequentialNumber}`;

      try {
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            summary: trimmedSummary,
            description: trimmedDesc,
            requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
            itPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
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

// GET /api/tickets/:id - Get ticket details
router.get("/:id", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const userRole = res.locals.user.role;
  const ticketId = parseInt(req.params.id, 10);

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
        attachments: true,
        publicComments: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        internalNotes: userRole === "IT_STAFF" ? { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } } : false
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Authorization: Requester must own ticket. IT Staff can view any.
    if (userRole === "REQUESTER" && ticket.requesterId !== userId) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    if (userRole === "ADMINISTRATOR") {
      return res.status(403).json({ error: "Administrators cannot view tickets" });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

// POST /api/tickets/:id/attachments - Upload attachment
router.post("/:id/attachments", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const requesterId = res.locals.requesterId as number;
  const ticketId = parseInt(req.params.id, 10);
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: { where: { isRemoved: false } } }
    });

    if (!ticket || ticket.requesterId !== requesterId) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.attachments.length >= 5) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Maximum 5 attachments allowed" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    fs.unlinkSync(file.path);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// GET /api/tickets/:id/attachments/:attachmentId/download
router.get("/:id/attachments/:attachmentId/download", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const userRole = res.locals.user.role;
  const ticketId = parseInt(req.params.id, 10);
  const attachmentId = parseInt(req.params.attachmentId, 10);

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Authorization
    if (userRole === "REQUESTER" && ticket.requesterId !== userId) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    if (userRole === "ADMINISTRATOR") {
      return res.status(403).json({ error: "Administrators cannot view tickets" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId, ticketId } });
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    if (attachment.isRemoved) {
      return res.status(410).json({ error: "Attachment has been removed" });
    }

    const filePath = path.join(uploadDir, attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// DELETE /api/tickets/:id/attachments/:attachmentId
router.delete("/:id/attachments/:attachmentId", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const userRole = res.locals.user.role;
  const ticketId = parseInt(req.params.id, 10);
  const attachmentId = parseInt(req.params.attachmentId, 10);
  const { reason } = req.body;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Only Requester who owns the ticket can delete attachments in this implementation
    if (userRole !== "REQUESTER" || ticket.requesterId !== userId) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId, ticketId } });
    if (!attachment || attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { isRemoved: true, removedReason: reason || "User requested removal" }
    });

    res.json({ message: "Attachment removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove attachment" });
  }
});

// GET /api/tickets - List tickets with search, filter, pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const requesterId = res.locals.requesterId as number;
    const { 
      search, 
      categoryId, 
      requestedPriority, 
      status, 
      page = "1", 
      limit = "10", 
      sortBy = "createdAt", 
      sortOrder = "desc" 
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build the where clause
    const where: any = { requesterId };

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = parseInt(String(categoryId), 10);
    }
    
    if (requestedPriority) {
      where.requestedPriority = String(requestedPriority);
    }
    
    if (status) {
      where.currentStatus = String(status);
    }

    // Ensure valid sort fields
    const validSortFields = ['createdAt', 'updatedAt', 'ticketNumber', 'currentStatus', 'requestedPriority'];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortDir = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const prisma = getPrisma();
    
    // Execute count and query in parallel
    const [total, data] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir },
        include: {
          category: true,
          relatedSystem: true
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tickets/:id/comments - Add a public comment
router.post("/:id/comments", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const userRole = res.locals.user.role;
  const ticketId = parseInt(req.params.id, 10);
  const { content } = req.body;

  try {
    const trimmedContent = typeof content === 'string' ? content.trim() : "";
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      return res.status(400).json({ error: "Comment must be between 1 and 1000 characters" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (userRole === "ADMINISTRATOR") {
      return res.status(403).json({ error: "Administrators cannot post comments" });
    }
    if (userRole === "REQUESTER" && ticket.requesterId !== userId) {
      return res.status(404).json({ error: "Ticket not found" }); 
    }

    const comment = await prisma.publicComment.create({
      data: {
        content: trimmedContent,
        authorId: userId,
        ticketId
      },
      include: { author: { select: { name: true, role: true } } }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// POST /api/tickets/:id/notes - Add an internal note
router.post("/:id/notes", async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const userRole = res.locals.user.role;
  const ticketId = parseInt(req.params.id, 10);
  const { content } = req.body;

  try {
    if (userRole !== "IT_STAFF") {
      return res.status(403).json({ error: "Only IT Staff can post internal notes" });
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : "";
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      return res.status(400).json({ error: "Note must be between 1 and 1000 characters" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
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
    console.error(error);
    res.status(500).json({ error: "Failed to post note" });
  }
});

export default router;
