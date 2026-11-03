import { TicketStatus, TicketPriority } from "@prisma/client";

export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  New: [TicketStatus.Open, TicketStatus.Cancelled],
  Open: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
  InProgress: [TicketStatus.WaitingForRequester, TicketStatus.Resolved, TicketStatus.Cancelled],
  WaitingForRequester: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
  Resolved: [TicketStatus.Closed, TicketStatus.Reopened, TicketStatus.Cancelled],
  Closed: [TicketStatus.Reopened],
  Reopened: [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Cancelled],
  Cancelled: [],
};

export function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true; // No-op
  return PERMITTED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: TicketStatus): TicketStatus[] {
  return PERMITTED_STATUS_TRANSITIONS[from] || [];
}

export interface ResolutionGateStatus {
  met: boolean;
  hasActiveOwner: boolean;
  validActionCount: number;
  missing: string[];
}

export function computeResolutionGate(
  ticket: {
    ownerId?: number | null;
    owner?: { id: number; isActive: boolean; role: string } | null;
    actionsTaken?: Array<{ result: string | null }>;
    _count?: { actionsTaken: number };
  },
  candidateOwner?: { id: number; isActive: boolean; role: string } | null
): ResolutionGateStatus {
  const effectiveOwner = candidateOwner !== undefined ? candidateOwner : ticket.owner;
  const hasActiveOwner = Boolean(
    effectiveOwner && effectiveOwner.isActive && effectiveOwner.role === "IT_STAFF"
  );

  let validActionCount = 0;
  if (ticket._count?.actionsTaken !== undefined) {
    validActionCount = ticket._count.actionsTaken;
  } else if (Array.isArray(ticket.actionsTaken)) {
    validActionCount = ticket.actionsTaken.filter(
      (a) => a.result && a.result.trim().length > 0
    ).length;
  }

  const missing: string[] = [];
  if (!hasActiveOwner) {
    missing.push("ACTIVE_STAFF_OWNER_REQUIRED");
  }
  if (validActionCount === 0) {
    missing.push("ACTION_TAKEN_WITH_RESULT_REQUIRED");
  }

  return {
    met: missing.length === 0,
    hasActiveOwner,
    validActionCount,
    missing,
  };
}

export function enrichTicketWithWorkflowMetadata<T extends { currentStatus: TicketStatus }>(
  ticket: T,
  gateStatus?: ResolutionGateStatus
): T & { allowedTransitions: TicketStatus[]; resolutionGate?: ResolutionGateStatus } {
  return {
    ...ticket,
    allowedTransitions: getAllowedTransitions(ticket.currentStatus),
    ...(gateStatus ? { resolutionGate: gateStatus } : {}),
  };
}
