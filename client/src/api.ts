const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// --- AUTHENTICATION API ---
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  requiresPasswordChange: boolean;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Login failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Logout failed");
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch user");
  }
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to change password");
  }
}

// --- CORE SYSTEM API ---
export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) throw new Error("Unable to connect to TokTickIT API");
  
  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) throw new Error("Unable to fetch categories");
  
  const categories = await categoriesRes.json();
  return { online: true, categories };
}

export interface Requester {
  id: number;
  name: string;
  email: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/systems`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch systems");
  return res.json();
}

export async function getItStaff(): Promise<UserResponse[]> {
  const res = await fetch(`${API_URL}/api/it-staff`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch IT staff");
  return res.json();
}

// --- TICKETS API ---
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
  appearsResolved: boolean;
  requestedPriority: string;
  itPriority: string;
  version?: number;
  createdAt: string;
  updatedAt?: string;
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketResponse> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create ticket");
  }
  return res.json();
}

export async function updateTicket(ticketId: number, updates: any, isStaff?: boolean): Promise<TicketDetailResponse> {
  const url = isStaff ? `${API_URL}/api/staff/tickets/${ticketId}` : `${API_URL}/api/tickets/${ticketId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || "Failed to update ticket",
      res.status,
      errorData.code,
      errorData.fields,
      errorData.details,
      errorData.currentStatus,
      errorData.currentVersion,
      errorData.updatedAt
    );
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
  params: {
    search?: string;
    categoryId?: string;
    requestedPriority?: string;
    status?: string;
    active?: boolean | string;
    updatedSince?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.categoryId) query.append("categoryId", params.categoryId);
  if (params.requestedPriority) query.append("requestedPriority", params.requestedPriority);
  if (params.status) query.append("status", params.status);
  if (params.active !== undefined && params.active !== null) query.append("active", String(params.active));
  if (params.updatedSince) query.append("updatedSince", params.updatedSince);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

// Fetch tickets for IT Staff queue
export async function getStaffTickets(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  requestedPriority?: string;
  itPriority?: string;
  categoryId?: number | string;
  ownerId?: string | number;
  active?: boolean | string;
  appearsResolved?: boolean | string;
  updatedSince?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.requestedPriority) query.append("requestedPriority", params.requestedPriority);
  if (params.itPriority) query.append("itPriority", params.itPriority);
  if (params.categoryId) query.append("categoryId", params.categoryId.toString());
  if (params.ownerId) query.append("ownerId", params.ownerId.toString());
  if (params.active !== undefined && params.active !== null) query.append("active", String(params.active));
  if (params.appearsResolved !== undefined && params.appearsResolved !== null) query.append("appearsResolved", String(params.appearsResolved));
  if (params.updatedSince) query.append("updatedSince", params.updatedSince);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  const res = await fetch(`${API_URL}/api/staff/tickets?${query.toString()}`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error(`Failed to fetch staff tickets: ${res.status}`);
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

export interface PublicComment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
}

export interface InternalNote {
  id: number;
  content: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
}

export interface ResolutionGateInfo {
  met: boolean;
  hasActiveOwner: boolean;
  validActionCount: number;
  missing: string[];
}

export interface TicketDetailResponse extends TicketResponse {
  description: string;
  category: Category;
  relatedSystem: RelatedSystem;
  requester: Requester;
  owner?: { id: number, name: string, email: string, isActive?: boolean, role?: string } | null;
  ownerId?: number | null;
  attachments: Attachment[];
  publicComments: PublicComment[];
  internalNotes?: InternalNote[]; // Only if Staff
  ownerName?: string;
  resolutionSummary?: string;
  allowedTransitions?: string[];
  resolutionGate?: ResolutionGateInfo;
}

export async function getTicketDetail(id: number, isStaff?: boolean): Promise<TicketDetailResponse> {
  const url = isStaff ? `${API_URL}/api/staff/tickets/${id}` : `${API_URL}/api/tickets/${id}`;
  const res = await fetch(url, {
    credentials: "include"
  });
  if (!res.ok) {
    let errMsg = "Failed to fetch ticket detail";
    try {
      const errBody = await res.json();
      if (errBody.error) errMsg = errBody.error;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload attachment");
  }
  return res.json();
}

export async function removeAttachment(ticketId: number, attachmentId: number, reason: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to remove attachment");
}

export async function downloadAttachmentBlob(ticketId: number, attachmentId: number): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to download attachment");
  return res.blob();
}

export async function postComment(ticketId: number, content: string): Promise<PublicComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to post comment");
  }
  return res.json();
}

export async function postNote(ticketId: number, content: string): Promise<InternalNote> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to post note");
  }
  return res.json();
}

export async function markAppearsResolved(ticketId: number): Promise<{ ticket: TicketDetailResponse, comment: PublicComment }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/appears-resolved`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || "Failed to mark as resolved",
      res.status,
      errorData.code,
      errorData.fields,
      errorData.details
    );
  }
  return res.json();
}

// --- ADMIN USER MANAGEMENT API ---

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  requiresPasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminUsers(search?: string, role?: string): Promise<{ items: AdminUser[], filtersApplied?: Record<string, string> }> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role) params.append("role", role);
  
  const res = await fetch(`${API_URL}/api/admin/users?${params.toString()}`, {
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch users");
  }
  return res.json();
}

export async function createAdminUser(data: Omit<AdminUser, "id" | "createdAt" | "updatedAt" | "requiresPasswordChange"> & { initialPassword?: string }): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create user");
  }
  return res.json();
}

export async function updateAdminUser(id: number, data: Partial<Omit<AdminUser, "id" | "createdAt" | "updatedAt" | "requiresPasswordChange">>): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update user");
  }
  return res.json();
}

export async function setInitialPassword(id: number, newInitialPassword: string): Promise<{ user: Partial<AdminUser> }> {
  const res = await fetch(`${API_URL}/api/admin/users/${id}/initial-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newInitialPassword }),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to set initial password");
  }
  return res.json();
}

// --- LAB 4: ACTIONS TAKEN API ---
export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface ActionTakenPerformer {
  id: number;
  name: string;
  role: UserRole;
}

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionAt: string;
  description: string;
  result: string;
  performedById: number;
  performedBy: ActionTakenPerformer;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionTakenPayload {
  actionAt?: string;
  description: string;
  result: string;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
}

export interface UpdateActionTakenPayload {
  description?: string;
  result?: string;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;
  details?: string[];
  currentStatus?: string;
  currentVersion?: number;
  updatedAt?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    fields?: Record<string, string>,
    details?: string[],
    currentStatus?: string,
    currentVersion?: number,
    updatedAt?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.details = details;
    this.currentStatus = currentStatus;
    this.currentVersion = currentVersion;
    this.updatedAt = updatedAt;
  }
}

export async function getActionsTaken(ticketId: number): Promise<ActionTaken[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/actions-taken`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || "Failed to fetch actions taken", res.status, errorData.code, errorData.fields);
  }
  return res.json();
}

export async function createActionTaken(ticketId: number, payload: CreateActionTakenPayload): Promise<ActionTaken> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/actions-taken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || "Failed to create action taken", res.status, errorData.code, errorData.fields);
  }
  return res.json();
}

export async function updateActionTaken(ticketId: number, actionId: number, payload: UpdateActionTakenPayload): Promise<ActionTaken> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/actions-taken/${actionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || "Failed to update action taken", res.status, errorData.code, errorData.fields);
  }
  return res.json();
}

// --- DASHBOARD API ---
export interface MetricDrillDown {
  path: string;
  query: Record<string, string>;
}

export interface DashboardMetric {
  count: number;
  drillDown: MetricDrillDown;
}

export interface DashboardRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  appearsResolved?: boolean;
  itPriority?: string;
  updatedAt: string;
  category: { id: number; name: string };
  owner?: { id: number; name: string } | null;
  requester?: { id: number; name: string } | null;
}

export interface RequesterDashboardResponse {
  metrics: {
    openRequests: DashboardMetric;
    inProgress: DashboardMetric;
    waitingForRequester: DashboardMetric;
    recentlyResolved: DashboardMetric;
    closed: DashboardMetric;
  };
  attentionTickets: DashboardRecentTicket[];
  recentTickets: DashboardRecentTicket[];
  generatedAt: string;
}

export interface AdminUserCounts {
  total: number;
  active?: number;
  requesters: number;
  staff: number;
  admins: number;
  unassignedStaff?: number;
}

export interface StaffDashboardResponse {
  metrics: {
    unassigned: DashboardMetric;
    ownedByMe: DashboardMetric;
    appearsResolved: DashboardMetric;
    recentlyUpdated: DashboardMetric;
    byStatus: Record<string, number>;
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
    };
    adminUserCounts?: AdminUserCounts | null;
  };
  myRecentTickets: DashboardRecentTicket[];
  urgentTickets: DashboardRecentTicket[];
  generatedAt: string;
}

export async function getRequesterDashboard(signal?: AbortSignal): Promise<RequesterDashboardResponse> {
  const res = await fetch(`${API_URL}/api/dashboard/requester`, {
    method: "GET",
    credentials: "include",
    signal
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || "Failed to fetch requester dashboard", res.status, errorData.code);
  }
  return res.json();
}

export async function getStaffDashboard(signal?: AbortSignal): Promise<StaffDashboardResponse> {
  const res = await fetch(`${API_URL}/api/dashboard/staff`, {
    method: "GET",
    credentials: "include",
    signal
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || "Failed to fetch staff dashboard", res.status, errorData.code);
  }
  return res.json();
}


