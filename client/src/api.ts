const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }
  
  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) {
    throw new Error("Unable to fetch categories");
  }
  const categories = await categoriesRes.json();
  
  return { online: true, categories };
}

// Issue 3: Requesters API
export interface Requester {
  id: number;
  name: string;
  email: string;
}

export async function getRequesters(): Promise<Requester[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error("Failed to fetch requesters");
  }
  return res.json();
}

// Issue 5: Systems and Create Ticket API
export interface RelatedSystem {
  id: number;
  name: string;
}

export async function getSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/systems`);
  if (!res.ok) {
    throw new Error("Failed to fetch systems");
  }
  return res.json();
}

export interface CreateTicketPayload {
  categoryId: number;
  relatedSystemId: number;
  requestedPriority: string;
  summary: string;
  description: string;
}

export interface TicketResponse {
  id: number;
  ticketNumber: string;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  currentStatus: string;
  createdAt: string;
}

export async function createTicket(payload: CreateTicketPayload, requesterId: number): Promise<TicketResponse> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requester-Id": requesterId.toString()
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create ticket");
  }
  
  return res.json();
}

export interface TicketListResponse {
  data: TicketResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export async function getTickets(
  params: { search?: string, categoryId?: string, requestedPriority?: string, status?: string, page?: number, limit?: number },
  requesterId: number
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.categoryId) query.append("categoryId", params.categoryId);
  if (params.requestedPriority) query.append("requestedPriority", params.requestedPriority);
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    headers: {
      "X-Requester-Id": requesterId.toString()
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return res.json();
}

export interface Attachment {
  id: number;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  isRemoved: boolean;
  removedReason: string | null;
  createdAt: string;
}

export interface TicketDetailResponse extends TicketResponse {
  description: string;
  category: Category;
  relatedSystem: RelatedSystem;
  requester: Requester;
  attachments: Attachment[];
}

export async function getTicketDetail(id: number, requesterId: number): Promise<TicketDetailResponse> {
  const res = await fetch(`${API_URL}/api/tickets/${id}`, {
    headers: {
      "X-Requester-Id": requesterId.toString()
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch ticket detail");
  }

  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File, requesterId: number): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "X-Requester-Id": requesterId.toString()
    },
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload attachment");
  }

  return res.json();
}

export async function removeAttachment(ticketId: number, attachmentId: number, reason: string, requesterId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Requester-Id": requesterId.toString()
    },
    body: JSON.stringify({ reason })
  });

  if (!res.ok) {
    throw new Error("Failed to remove attachment");
  }
}

export async function downloadAttachmentBlob(ticketId: number, attachmentId: number, requesterId: number): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
    headers: {
      "X-Requester-Id": requesterId.toString()
    }
  });

  if (!res.ok) {
    throw new Error("Failed to download attachment");
  }

  return res.blob();
}
