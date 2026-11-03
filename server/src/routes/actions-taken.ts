import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { Role, TicketStatus } from "@prisma/client";

export const actionsTakenRouter = Router({ mergeParams: true });
const prisma = getPrisma();

function parseNumericId(val: string | undefined): number | null {
  if (!val || !/^\d+$/.test(val)) return null;
  const num = Number(val);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/actions-taken
// ---------------------------------------------------------------------------
actionsTakenRouter.get("/", async (req: Request, res: Response) => {
  const user = res.locals.user;
  const ticketId = parseNumericId(req.params.id);

  if (!ticketId) {
    return res.status(400).json({
      error: "Invalid ticket ID format: must be a positive integer",
      code: "INVALID_ID_FORMAT",
    });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Ownership isolation: Requester must own ticket.
    // Return 404 to avoid revealing existence of other tickets to unauthorized requesters.
    if (user.role === Role.REQUESTER && ticket.requesterId !== user.id) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "TICKET_NOT_FOUND",
      });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: [
        { actionAt: "asc" },
        { id: "asc" },
      ],
      include: {
        performedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json(actions);
  } catch (error) {
    console.error("Error fetching actions taken:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/actions-taken
// ---------------------------------------------------------------------------
actionsTakenRouter.post("/", async (req: Request, res: Response) => {
  const user = res.locals.user;

  // 1. Role verification: Only IT_STAFF and ADMINISTRATOR can create actions
  if (user.role !== Role.IT_STAFF && user.role !== Role.ADMINISTRATOR) {
    return res.status(403).json({
      error: "Forbidden: Only IT Staff and Administrators can manage actions taken",
      code: "ROLE_NOT_PERMITTED",
    });
  }

  // 2. Validate ticket ID format
  const ticketId = parseNumericId(req.params.id);
  if (!ticketId) {
    return res.status(400).json({
      error: "Invalid ticket ID format: must be a positive integer",
      code: "INVALID_ID_FORMAT",
    });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "TICKET_NOT_FOUND",
      });
    }

    // 3. Terminal state check
    if (ticket.currentStatus === TicketStatus.Closed || ticket.currentStatus === TicketStatus.Cancelled) {
      return res.status(400).json({
        error: "Cannot record or edit actions on closed or cancelled tickets",
        code: "TERMINAL_TICKET_LOCKED",
      });
    }

    // 4. Validate payload fields
    const { description, result, followUpRequired, followUpNote, attachmentNotes, actionAt } = req.body;

    // Description validation
    if (typeof description !== "string") {
      return res.status(400).json({
        error: "Description is required and must be a string",
        code: "VALIDATION_ERROR",
        fields: { description: "Must be a string between 1 and 1000 characters" },
      });
    }
    const trimmedDesc = description.trim();
    if (trimmedDesc.length === 0 || trimmedDesc.length > 1000) {
      return res.status(400).json({
        error: "Description must be between 1 and 1000 characters",
        code: "VALIDATION_ERROR",
        fields: { description: "Must be between 1 and 1000 characters" },
      });
    }

    // Result validation
    if (typeof result !== "string") {
      return res.status(400).json({
        error: "Result is required and must be a string",
        code: "VALIDATION_ERROR",
        fields: { result: "Must be a string between 1 and 1000 characters" },
      });
    }
    const trimmedResult = result.trim();
    if (trimmedResult.length === 0 || trimmedResult.length > 1000) {
      return res.status(400).json({
        error: "Result must be between 1 and 1000 characters",
        code: "VALIDATION_ERROR",
        fields: { result: "Must be between 1 and 1000 characters" },
      });
    }

    // Follow-up validation
    const isFollowUp = Boolean(followUpRequired);
    let sanitizedFollowUpNote: string | null = null;
    if (isFollowUp) {
      if (typeof followUpNote !== "string" || followUpNote.trim().length === 0) {
        return res.status(400).json({
          error: "Follow-up note is required when follow-up is requested",
          code: "FOLLOWUP_NOTE_REQUIRED",
          fields: { followUpNote: "Follow-up note is required when follow-up is requested" },
        });
      }
      if (followUpNote.trim().length > 1000) {
        return res.status(400).json({
          error: "Follow-up note must not exceed 1000 characters",
          code: "VALIDATION_ERROR",
          fields: { followUpNote: "Must not exceed 1000 characters" },
        });
      }
      sanitizedFollowUpNote = followUpNote.trim();
    }

    // Attachment notes validation
    let sanitizedAttachmentNotes: string | null = null;
    if (attachmentNotes !== undefined && attachmentNotes !== null) {
      if (typeof attachmentNotes !== "string" || attachmentNotes.length > 500) {
        return res.status(400).json({
          error: "Attachment notes must be a string up to 500 characters",
          code: "VALIDATION_ERROR",
          fields: { attachmentNotes: "Must not exceed 500 characters" },
        });
      }
      sanitizedAttachmentNotes = attachmentNotes.trim() || null;
    }

    // actionAt validation
    let parsedActionAt = new Date();
    if (actionAt !== undefined && actionAt !== null) {
      parsedActionAt = new Date(actionAt);
      if (isNaN(parsedActionAt.getTime())) {
        return res.status(400).json({
          error: "Invalid actionAt date format",
          code: "VALIDATION_ERROR",
          fields: { actionAt: "Must be a valid ISO DateTime string" },
        });
      }
      if (parsedActionAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return res.status(400).json({
          error: "Action timestamp cannot be more than 10 minutes in the future",
          code: "FUTURE_ACTION_DATE_REJECTED",
          fields: { actionAt: "Action timestamp cannot be in the future" },
        });
      }
    }

    // 5. Database-backed deduplication (5-second window for same ticket, user, and description)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const duplicate = await prisma.actionTaken.findFirst({
      where: {
        ticketId,
        performedById: user.id,
        description: trimmedDesc,
        createdAt: { gte: fiveSecondsAgo },
      },
      include: {
        performedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (duplicate) {
      return res.status(200).json(duplicate);
    }

    // 6. Create ActionTaken in database
    const newAction = await prisma.actionTaken.create({
      data: {
        ticketId,
        performedById: user.id,
        description: trimmedDesc,
        result: trimmedResult,
        followUpRequired: isFollowUp,
        followUpNote: sanitizedFollowUpNote,
        attachmentNotes: sanitizedAttachmentNotes,
        actionAt: parsedActionAt,
      },
      include: {
        performedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // 7. Touch ticket.updatedAt to trigger "Recently Updated" in operational dashboard queries
    // Note: ticket.version is intentionally NOT modified to prevent false optimistic concurrency conflicts
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json(newAction);
  } catch (error) {
    console.error("Error creating action taken:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/tickets/:id/actions-taken/:actionId
// ---------------------------------------------------------------------------
actionsTakenRouter.patch("/:actionId", async (req: Request, res: Response) => {
  const user = res.locals.user;

  // 1. Role verification
  if (user.role !== Role.IT_STAFF && user.role !== Role.ADMINISTRATOR) {
    return res.status(403).json({
      error: "Forbidden: Only IT Staff and Administrators can manage actions taken",
      code: "ROLE_NOT_PERMITTED",
    });
  }

  // 2. Validate IDs
  const ticketId = parseNumericId(req.params.id);
  const actionId = parseNumericId(req.params.actionId);

  if (!ticketId || !actionId) {
    return res.status(400).json({
      error: "Invalid ID format: ticket and action IDs must be positive integers",
      code: "INVALID_ID_FORMAT",
    });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
        code: "TICKET_NOT_FOUND",
      });
    }

    // 3. Terminal state check
    if (ticket.currentStatus === TicketStatus.Closed || ticket.currentStatus === TicketStatus.Cancelled) {
      return res.status(400).json({
        error: "Cannot record or edit actions on closed or cancelled tickets",
        code: "TERMINAL_TICKET_LOCKED",
      });
    }

    // 4. Lookup existing action
    const existingAction = await prisma.actionTaken.findUnique({
      where: { id: actionId },
    });

    if (!existingAction || existingAction.ticketId !== ticketId) {
      return res.status(404).json({
        error: "Action taken not found under this ticket",
        code: "ACTION_NOT_FOUND",
      });
    }

    // 5. Check if update body has modifiable fields
    const allowedFields = ["description", "result", "actionAt", "followUpRequired", "followUpNote", "attachmentNotes"];
    const providedKeys = Object.keys(req.body).filter((k) => allowedFields.includes(k));
    if (providedKeys.length === 0) {
      return res.status(400).json({
        error: "Empty update payload: at least one modifiable field must be provided",
        code: "EMPTY_UPDATE_PAYLOAD",
      });
    }

    // 6. Optional Optimistic Concurrency check on action
    if (req.body.expectedUpdatedAt !== undefined) {
      if (existingAction.updatedAt.toISOString() !== req.body.expectedUpdatedAt) {
        return res.status(409).json({
          error: "Conflict: This action was modified by another session. Please reload latest data.",
          code: "STALE_ACTION_UPDATE",
        });
      }
    }

    // 7. Merge fields for validation
    const mergedDesc = req.body.description !== undefined ? req.body.description : existingAction.description;
    const mergedResult = req.body.result !== undefined ? req.body.result : existingAction.result;
    const mergedFollowUp = req.body.followUpRequired !== undefined ? Boolean(req.body.followUpRequired) : existingAction.followUpRequired;
    let mergedFollowUpNote = req.body.followUpNote !== undefined ? req.body.followUpNote : existingAction.followUpNote;
    const mergedAttachmentNotes = req.body.attachmentNotes !== undefined ? req.body.attachmentNotes : existingAction.attachmentNotes;
    const mergedActionAt = req.body.actionAt !== undefined ? req.body.actionAt : existingAction.actionAt;

    // Validate merged description
    if (typeof mergedDesc !== "string" || mergedDesc.trim().length === 0 || mergedDesc.trim().length > 1000) {
      return res.status(400).json({
        error: "Description must be a non-empty string between 1 and 1000 characters",
        code: "VALIDATION_ERROR",
        fields: { description: "Must be between 1 and 1000 characters" },
      });
    }

    // Validate merged result
    if (typeof mergedResult !== "string" || mergedResult.trim().length === 0 || mergedResult.trim().length > 1000) {
      return res.status(400).json({
        error: "Result must be a non-empty string between 1 and 1000 characters",
        code: "VALIDATION_ERROR",
        fields: { result: "Must be between 1 and 1000 characters" },
      });
    }

    // Validate merged follow-up
    if (mergedFollowUp) {
      if (!mergedFollowUpNote || typeof mergedFollowUpNote !== "string" || mergedFollowUpNote.trim().length === 0) {
        return res.status(400).json({
          error: "Follow-up note is required when follow-up is requested",
          code: "FOLLOWUP_NOTE_REQUIRED",
          fields: { followUpNote: "Follow-up note is required when follow-up is requested" },
        });
      }
      if (mergedFollowUpNote.trim().length > 1000) {
        return res.status(400).json({
          error: "Follow-up note must not exceed 1000 characters",
          code: "VALIDATION_ERROR",
          fields: { followUpNote: "Must not exceed 1000 characters" },
        });
      }
      mergedFollowUpNote = mergedFollowUpNote.trim();
    } else {
      mergedFollowUpNote = null;
    }

    // Validate merged attachmentNotes
    let sanitizedAttachmentNotes = existingAction.attachmentNotes;
    if (mergedAttachmentNotes !== undefined) {
      if (mergedAttachmentNotes !== null && (typeof mergedAttachmentNotes !== "string" || mergedAttachmentNotes.length > 500)) {
        return res.status(400).json({
          error: "Attachment notes must be a string up to 500 characters",
          code: "VALIDATION_ERROR",
          fields: { attachmentNotes: "Must not exceed 500 characters" },
        });
      }
      sanitizedAttachmentNotes = mergedAttachmentNotes ? mergedAttachmentNotes.trim() : null;
    }

    // Validate merged actionAt
    let parsedActionAt = existingAction.actionAt;
    if (mergedActionAt !== undefined) {
      parsedActionAt = new Date(mergedActionAt);
      if (isNaN(parsedActionAt.getTime())) {
        return res.status(400).json({
          error: "Invalid actionAt date format",
          code: "VALIDATION_ERROR",
          fields: { actionAt: "Must be a valid ISO DateTime string" },
        });
      }
      if (parsedActionAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return res.status(400).json({
          error: "Action timestamp cannot be more than 10 minutes in the future",
          code: "FUTURE_ACTION_DATE_REJECTED",
          fields: { actionAt: "Action timestamp cannot be in the future" },
        });
      }
    }

    // 8. Update Action in database
    // ticketId and performedById remain strictly untouched to preserve binding and author audit
    const updatedAction = await prisma.actionTaken.update({
      where: { id: actionId },
      data: {
        description: mergedDesc.trim(),
        result: mergedResult.trim(),
        followUpRequired: mergedFollowUp,
        followUpNote: mergedFollowUpNote,
        attachmentNotes: sanitizedAttachmentNotes,
        actionAt: parsedActionAt,
      },
      include: {
        performedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(200).json(updatedAction);
  } catch (error) {
    console.error("Error updating action taken:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
