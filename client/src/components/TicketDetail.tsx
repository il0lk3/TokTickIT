import React, { useState, useEffect, useRef } from "react";
import {
  TicketDetailResponse,
  getTicketDetail,
  uploadAttachment,
  removeAttachment,
  downloadAttachmentBlob,
  postComment,
  markAppearsResolved,
  getItStaff,
  UserResponse,
  updateTicket,
  postNote,
  ApiError
} from "../api.js";
import { useAuth } from "../contexts/AuthContext";
import { ActionsTakenSection, ActionsTakenSectionHandle } from "./ticket/ActionsTakenSection";
import { TicketWorkflowActions } from "./ticket/TicketWorkflowActions";
import { AccessibleDialog } from "./common/AccessibleDialog";

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [itStaffList, setItStaffList] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [commentError, setCommentError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("public");

  // Modals state
  const [confirmModal, setConfirmModal] = useState<{ status: string } | null>(null);
  const [conflictModal, setConflictModal] = useState<{ currentStatus?: string; currentVersion?: number } | null>(null);
  const [advisoryModal, setAdvisoryModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ownerSelectRef = useRef<HTMLSelectElement>(null);
  const actionsTakenRef = useRef<ActionsTakenSectionHandle>(null);

  const isStaff = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const isStaffUser = user.role === "IT_STAFF" || user.role === "ADMINISTRATOR";
        const detail = await getTicketDetail(ticketId, isStaffUser);
        setTicket(detail);
        if (isStaffUser) {
          const staff = await getItStaff();
          setItStaffList(staff);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId, user]);

  const reloadTicket = async () => {
    if (!user) return;
    try {
      const isStaffUser = user.role === "IT_STAFF" || user.role === "ADMINISTRATOR";
      const detail = await getTicketDetail(ticketId, isStaffUser);
      setTicket(detail);
    } catch (err: any) {
      console.error("Failed to reload ticket:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !ticket || !e.target.files?.length) return;
    const file = e.target.files[0];

    const activeCount = ticket.attachments.filter(a => !a.isRemoved).length;
    if (activeCount >= 5) {
      alert("Maximum of 5 active attachments allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must not exceed 5MB.");
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.");
      return;
    }

    setUploading(true);
    try {
      const newAttachment = await uploadAttachment(ticketId, file);
      setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null);
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (attachmentId: number) => {
    if (!user || !ticket) return;
    const reason = prompt("Please provide a reason for removing this attachment:");
    if (reason === null) return;
    if (reason.trim() === "") {
      alert("A reason is required.");
      return;
    }

    try {
      await removeAttachment(ticketId, attachmentId, reason);
      setTicket(prev => {
        if (!prev) return null;
        return {
          ...prev,
          attachments: prev.attachments.map(a => a.id === attachmentId ? { ...a, isRemoved: true, removedReason: reason } : a)
        };
      });
    } catch (err: any) {
      alert(err.message || "Failed to remove attachment");
    }
  };

  const handleDownload = async (attachmentId: number, originalName: string) => {
    if (!user || !ticket) return;
    try {
      const blob = await downloadAttachmentBlob(ticketId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to download file. It may have been removed.");
    }
  };

  const handlePostComment = async () => {
    if (!user || !ticket || !commentText.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }
    setCommenting(true);
    setCommentError("");
    try {
      const newComment = await postComment(ticketId, commentText.trim());
      setTicket(prev => prev ? { ...prev, publicComments: [...prev.publicComments, newComment] } : null);
      setCommentText("");
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment");
    } finally {
      setCommenting(false);
    }
  };

  const handlePostNote = async () => {
    if (!user || !ticket || !noteText.trim()) {
      setNoteError("Note cannot be empty");
      return;
    }
    setCommenting(true);
    setNoteError("");
    try {
      const newNote = await postNote(ticketId, noteText.trim());
      setTicket(prev => prev ? { ...prev, internalNotes: [...(prev.internalNotes || []), newNote] } : null);
      setNoteText("");
    } catch (err: any) {
      setNoteError(err.message || "Failed to post internal note");
    } finally {
      setCommenting(false);
    }
  };

  const handleExecuteAppearsResolved = async () => {
    if (!user || !ticket) return;
    setUpdating(true);
    setWorkflowError("");
    try {
      const result = await markAppearsResolved(ticketId);
      setTicket(prev => prev ? {
        ...prev,
        appearsResolved: true,
        version: result.ticket.version ?? (prev.version ?? 1) + 1,
        publicComments: [...prev.publicComments, result.comment],
      } : null);
    } catch (err: any) {
      setWorkflowError(err.message || "Failed to mark as resolved");
    } finally {
      setUpdating(false);
    }
  };

  const requestUpdate = (updates: { ownerId?: number | null; itPriority?: string; status?: string }) => {
    if (updates.status && ["Resolved", "Closed", "Cancelled"].includes(updates.status)) {
      setConfirmModal({ status: updates.status });
      return;
    }
    performTicketUpdate(updates);
  };

  const performTicketUpdate = async (updates: { ownerId?: number | null; itPriority?: string; status?: string }) => {
    if (!ticket) return;
    setUpdating(true);
    setWorkflowError("");
    try {
      const isStaffUser = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
      const updated = await updateTicket(ticketId, {
        ...updates,
        expectedVersion: ticket.version ?? 1,
      }, isStaffUser);

      setTicket(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updated,
          version: updated.version,
          updatedAt: updated.updatedAt,
          currentStatus: updated.currentStatus || prev.currentStatus,
          allowedTransitions: updated.allowedTransitions || prev.allowedTransitions,
          resolutionGate: updated.resolutionGate || prev.resolutionGate,
          appearsResolved: updated.appearsResolved !== undefined ? updated.appearsResolved : prev.appearsResolved,
        };
      });

      if (updates.status) {
        setStatusAnnouncement(`Status changed to ${updates.status}`);
        setTimeout(() => {
          const summaryEl = document.getElementById("ticket-summary-status");
          if (summaryEl) {
            summaryEl.focus();
          }
        }, 50);
      }
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 409 || err.code === 'STALE_VERSION_CONFLICT')) {
        setConflictModal({
          currentStatus: err.currentStatus,
          currentVersion: err.currentVersion,
        });
      } else if (err instanceof ApiError && err.code === 'RESOLUTION_GATE_FAILED') {
        setWorkflowError("Resolution gate failed: Ticket must have an active IT Staff owner and at least one Action Taken with a result.");
      } else if (err instanceof ApiError && err.code === 'INVALID_STATUS_TRANSITION') {
        setWorkflowError(err.message || "Invalid status transition.");
      } else if (err instanceof ApiError && err.code === 'TERMINAL_TICKET_LOCKED') {
        setWorkflowError(err.message || "Cannot modify a locked ticket.");
      } else if (err instanceof ApiError && err.code === 'INACTIVE_ASSIGNEE_REJECTED') {
        setWorkflowError("Must be an active IT Staff member (inactive user rejected).");
      } else {
        setWorkflowError(err.message || "Network or unexpected error occurred. Please try again.");
      }
    } finally {
      setUpdating(false);
      setConfirmModal(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 glass-panel">
        <div className="spinner-border text-zen-primary mb-2" role="status"></div>
        <p className="text-muted mb-0">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="glass-panel p-5 text-center">
        <h5 className="text-danger mb-3">Error Loading Ticket</h5>
        <p className="text-muted">{error || "Ticket not found"}</p>
        <button className="btn btn-outline-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "HIGH": return "badge-zen-danger";
      case "MEDIUM": return "badge-zen-warning";
      case "LOW": return "badge-zen-success";
      default: return "badge-zen-secondary";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "New": return "badge-zen-info";
      case "Open": return "badge-zen-primary";
      case "InProgress": return "badge-zen-warning";
      case "WaitingForRequester": return "badge-zen-warning";
      case "Resolved": return "badge-zen-success";
      case "Closed": return "badge-zen-secondary";
      case "Cancelled": return "badge-zen-danger";
      case "Reopened": return "badge-zen-warning";
      default: return "badge-zen-secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "New":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
      case "Open":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
      case "InProgress":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      case "WaitingForRequester":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
      case "Resolved":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
      case "Closed":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
      case "Cancelled":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
      case "Reopened":
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>;
      default:
        return null;
    }
  };

  const activeAttachments = ticket.attachments.filter(a => !a.isRemoved).length;
  const isWorkflowLocked = ["Closed", "Cancelled"].includes(ticket.currentStatus);
  const isCommentLocked = ["Resolved", "Closed", "Cancelled"].includes(ticket.currentStatus);

  // Status transitions available
  const fallbackTransitions = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"].filter(s => s !== ticket.currentStatus);
  const allowedTransitions = ticket.allowedTransitions !== undefined ? ticket.allowedTransitions : fallbackTransitions;

  return (
    <>
      <div className="animate-enter position-relative">
        {/* Announcer region for a11y */}
        <div role="status" aria-live="polite" className="visually-hidden">
          {statusAnnouncement}
        </div>

        {/* Loading Overlay for updates */}
        {updating && (
          <div className="position-absolute w-100 h-100 bg-white bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 10, backdropFilter: 'blur(1px)' }}>
            <div className="spinner-border text-zen-primary" role="status"></div>
          </div>
        )}

        {/* Breadcrumb and Back Button */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="text-success fw-medium">
            <span className="text-success" style={{cursor: 'pointer'}} onClick={onBack}>{isStaff ? "Ticket Queue" : "My Tickets"}</span> &gt; <span className="text-secondary">Ticket Details</span>
          </div>
          <button onClick={onBack} className="btn btn-outline-success btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 bg-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to {isStaff ? "Queue" : "Tickets"}
          </button>
        </div>

        {/* Staff Advisory Notice Banner */}
        {ticket.appearsResolved && isStaff && (
          <div
            id="requester-advisory-banner"
            data-testid="requester-advisory-banner"
            className="alert alert-success d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border-0 bg-success bg-opacity-10 shadow-sm"
            role="region"
            aria-label="Requester Advisory Notice"
          >
            <div className="d-flex align-items-center gap-2 text-success-emphasis fw-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>Requester marked issue as resolved — please verify actions taken and resolve ticket.</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-success px-3 py-1 rounded-pill fw-bold text-nowrap"
              onClick={() => {
                if (actionsTakenRef.current) {
                  actionsTakenRef.current.focusSection();
                } else {
                  const el = document.getElementById("actions-taken-section");
                  if (el) {
                    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth' });
                    el.focus();
                  }
                }
              }}
            >
              Review Actions Taken
            </button>
          </div>
        )}

        {/* Workflow / Concurrency Error Alert */}
        {workflowError && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm border-0" role="alert">
            <div className="d-flex align-items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <span>{workflowError}</span>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setWorkflowError("")} />
          </div>
        )}

        {/* Ticket Details Panel */}
        <div className="glass-panel overflow-hidden mb-4">
          <div className="p-4 p-md-5">
            <div className="row g-4">
              {/* Row 1 */}
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Ticket No.</label>
                <input type="text" className="form-control bg-light text-muted border-light" readOnly value={ticket.ticketNumber} style={{ cursor: 'default' }} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Category</label>
                <input type="text" className="form-control bg-light text-muted border-light" readOnly value={ticket.category.name} style={{ cursor: 'default' }} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Related System</label>
                <input type="text" className="form-control bg-light text-muted border-light" readOnly value={ticket.relatedSystem.name} style={{ cursor: 'default' }} />
              </div>

              {/* Row 2 */}
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Requester</label>
                <input type="text" className="form-control bg-light text-muted border-light" readOnly value={ticket.requester?.name || '-'} style={{ cursor: 'default' }} />
              </div>

              {/* Ticket Owner */}
              <div className="col-md-4">
                <label htmlFor="ownerSelect" className="form-label text-muted small fw-bold mb-1">Ticket Owner</label>
                {isStaff ? (
                  <div className="d-flex align-items-center gap-2">
                    <select 
                      id="ownerSelect"
                      ref={ownerSelectRef}
                      aria-label="Ticket Owner"
                      className="form-select bg-white border"
                      style={{ cursor: isWorkflowLocked ? 'not-allowed' : 'pointer' }}
                      value={ticket.owner?.id || ticket.ownerId || ""}
                      disabled={isWorkflowLocked || updating}
                      onChange={(e) => performTicketUpdate({ ownerId: e.target.value ? parseInt(e.target.value, 10) : null })}
                    >
                      <option value="">-- Unassigned --</option>
                      {itStaffList.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                    {!isWorkflowLocked && ((ticket.owner?.id || ticket.ownerId) !== user.id) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary text-nowrap px-2 py-1 small"
                        disabled={updating}
                        onClick={() => performTicketUpdate({ ownerId: user.id })}
                      >
                        Claim Ticket
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="form-control readonly-wrapper d-flex align-items-center" style={{ minHeight: '38px' }}>
                    <span className="badge rounded-pill px-3 py-1 bg-secondary text-white">
                      {ticket.owner?.name || ticket.ownerName || '-'}
                    </span>
                  </div>
                )}
              </div>

              {/* Current Status */}
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Current Status</label>
                {isStaff ? (
                  <div className="d-flex flex-column gap-2">
                    <div id="ticket-summary-status" data-testid="ticket-summary-status" tabIndex={-1} style={{ outline: 'none' }} className="d-flex align-items-center gap-2">
                      <span data-testid="status-badge" className={`badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 ${getStatusBadgeClass(ticket.currentStatus)}`}>
                        {getStatusIcon(ticket.currentStatus)}
                        {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus === 'WaitingForRequester' ? 'Waiting for Requester' : ticket.currentStatus}
                      </span>
                    </div>

                    {/* Role-aware dropdown for backwards compatibility & quick selection */}
                    <select
                      aria-label="Current Status"
                      className="form-select fw-bold bg-white text-dark border small"
                      style={{ cursor: isWorkflowLocked ? 'not-allowed' : 'pointer' }}
                      value={ticket.currentStatus}
                      disabled={isWorkflowLocked || updating}
                      onChange={(e) => requestUpdate({ status: e.target.value })}
                    >
                      <option value={ticket.currentStatus}>{ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus}</option>
                      {allowedTransitions.map(target => (
                        <option key={target} value={target}>
                          {target === 'InProgress' ? 'In Progress' : target === 'WaitingForRequester' ? 'Waiting for Requester' : target}
                        </option>
                      ))}
                    </select>

                    {/* Dedicated Workflow Transition Action Buttons */}
                    <TicketWorkflowActions
                      currentStatus={ticket.currentStatus}
                      allowedTransitions={allowedTransitions}
                      resolutionGate={ticket.resolutionGate}
                      isUpdating={updating}
                      onTransition={(targetStatus) => performTicketUpdate({ status: targetStatus })}
                      onAssignOwnerShortcut={() => {
                        if (ownerSelectRef.current) {
                          if (typeof ownerSelectRef.current.scrollIntoView === 'function') {
                            ownerSelectRef.current.scrollIntoView({ behavior: 'smooth' });
                          }
                          ownerSelectRef.current.focus();
                        }
                      }}
                      onLogActionShortcut={() => {
                        if (actionsTakenRef.current) {
                          actionsTakenRef.current.openCreateForm();
                        } else {
                          const el = document.getElementById("actions-taken-section");
                          if (el) {
                            if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth' });
                            el.focus();
                          }
                          const logBtn = document.querySelector<HTMLButtonElement>('[data-testid="log-action-btn"]');
                          logBtn?.click();
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div id="ticket-summary-status" data-testid="ticket-summary-status" tabIndex={-1} className="form-control readonly-wrapper d-flex flex-wrap align-items-center gap-2" style={{ minHeight: '38px', outline: 'none' }}>
                    <span data-testid="status-badge" className={`badge rounded-pill px-3 py-1 ${getStatusBadgeClass(ticket.currentStatus)}`}>
                      {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus === 'WaitingForRequester' ? 'Waiting for Requester' : ticket.currentStatus}
                    </span>
                    {ticket.appearsResolved && (
                      <span className="badge rounded-pill px-2 py-1 badge-zen-success" style={{fontSize: '0.7rem'}}>
                        You reported this problem appears resolved
                      </span>
                    )}
                    {user?.role === 'REQUESTER' && !ticket.appearsResolved && ['Open', 'InProgress', 'WaitingForRequester'].includes(ticket.currentStatus) && (
                      <button 
                        type="button"
                        className="btn btn-outline-success btn-sm px-2 rounded-pill fw-medium"
                        onClick={() => setAdvisoryModal(true)}
                        disabled={updating}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        Problem Appears Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Row 3 */}
              <div className="col-md-4">
                <label className="form-label text-muted small fw-bold mb-1">Requested Priority</label>
                <div className="form-control readonly-wrapper d-flex align-items-center" style={{ minHeight: '38px' }}>
                  <span className={`badge rounded-pill px-3 py-1 ${getPriorityBadgeClass(ticket.requestedPriority)}`}>
                    {ticket.requestedPriority.charAt(0) + ticket.requestedPriority.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="col-md-4">
                <label htmlFor="itPrioritySelect" className="form-label text-muted small fw-bold mb-1">IT Priority</label>
                {isStaff ? (
                  <select 
                    id="itPrioritySelect"
                    aria-label="IT Priority"
                    className="form-select bg-white fw-medium border"
                    style={{ cursor: isWorkflowLocked ? 'not-allowed' : 'pointer' }}
                    value={ticket.itPriority}
                    disabled={isWorkflowLocked || updating}
                    onChange={(e) => performTicketUpdate({ itPriority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                ) : (
                  <div className="form-control readonly-wrapper d-flex align-items-center" style={{ minHeight: '38px' }}>
                    <span className={`badge rounded-pill px-3 py-1 ${getPriorityBadgeClass(ticket.itPriority)}`}>
                      {ticket.itPriority.charAt(0) + ticket.itPriority.slice(1).toLowerCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 4 */}
              <div className="col-12">
                <label className="form-label text-muted small fw-bold mb-1">Summary</label>
                <input type="text" className="form-control bg-light text-muted border-light" readOnly value={ticket.summary} style={{ cursor: 'default' }} />
              </div>

              {/* Row 5 */}
              <div className="col-12">
                <label className="form-label text-muted small fw-bold mb-1">Description</label>
                <textarea className="form-control bg-light text-muted border-light" readOnly rows={3} style={{ resize: 'none', cursor: 'default' }} value={ticket.description} />
              </div>

              {/* Row 6 */}
              <div className="col-12">
                <label className="form-label text-muted small fw-bold mb-1">Resolution Summary</label>
                <textarea className="form-control bg-light text-muted fst-italic border-light" readOnly rows={2} style={{ resize: 'none', cursor: 'default' }} value={ticket.resolutionSummary || 'No resolution summary available yet.'} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Taken Section */}
        <ActionsTakenSection
          ref={actionsTakenRef}
          ticketId={ticketId}
          ticketStatus={ticket.currentStatus}
          onActionChanged={reloadTicket}
        />

        {/* Communication Tabs Container */}
        <div className="glass-panel overflow-hidden mb-4">
          <div className="p-4 p-md-5">
            <div className="row g-4">
              {/* Tabs Header */}
              <div className="col-12">
                <div className="zen-tabs">
                  <button 
                    className={`zen-tab-btn ${activeTab === 'public' ? 'active' : ''}`}
                    onClick={() => setActiveTab('public')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> 
                    Public Comments <span className="badge bg-secondary rounded-pill">{ticket.publicComments?.length || 0}</span>
                  </button>
                  {isStaff && (
                    <button 
                      className={`zen-tab-btn internal-notes-tab ${activeTab === 'internal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('internal')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> 
                      Internal Notes <span className="badge bg-warning text-dark rounded-pill">{ticket.internalNotes?.length || 0}</span>
                    </button>
                  )}
                  <button 
                    className={`zen-tab-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attachments')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> 
                    Attachments <span className="badge bg-secondary rounded-pill">{activeAttachments}</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="tab-content">
                  
                  {/* PUBLIC COMMENTS TAB */}
                  {activeTab === 'public' && (
                    <div className="animate-enter">
                      <div className="mb-4">
                        {(!ticket.publicComments || ticket.publicComments.length === 0) ? (
                          <p className="text-muted small fst-italic">No comments yet.</p>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {ticket.publicComments.map(c => (
                              <div key={c.id} className="bg-light p-3 rounded border border-light shadow-sm">
                                <div className="d-flex justify-content-between mb-2">
                                  <strong className="small text-dark">{c.author.name} <span className="text-muted fw-normal">({c.author.role})</span></strong>
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleString()}</small>
                                </div>
                                <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isCommentLocked ? (
                        <div className="bg-light p-3 rounded border text-center text-muted fst-italic">
                          Ticket is {ticket.currentStatus}. Further comments cannot be added.
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded border shadow-sm">
                          <textarea 
                            className="form-control border-0 bg-light mb-2 small shadow-sm" 
                            rows={3} 
                            placeholder="Type a comment..." 
                            style={{ resize: 'none' }}
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            disabled={commenting}
                          />
                          <div className="d-flex justify-content-end align-items-center">
                            <button 
                              className="btn btn-primary btn-sm px-4 rounded-pill fw-medium"
                              onClick={handlePostComment}
                              disabled={commenting || !commentText.trim()}
                            >
                              {commenting ? "Posting..." : "Post Comment"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERNAL NOTES TAB */}
                  {isStaff && activeTab === 'internal' && (
                    <div className="animate-enter internal-notes-content">
                      <div className="mb-4">
                        {(!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
                          <p className="text-muted small fst-italic">No internal notes yet.</p>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {ticket.internalNotes.map(n => (
                              <div key={n.id} className="p-3 rounded bg-white shadow-sm">
                                <div className="d-flex justify-content-between mb-2">
                                  <strong className="small text-dark">{n.author.name} <span className="text-muted fw-normal">({n.author.role})</span></strong>
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(n.createdAt).toLocaleString()}</small>
                                </div>
                                <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-wrap' }}>{n.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isCommentLocked ? (
                        <div className="bg-light p-3 rounded border text-center text-muted fst-italic">
                          Ticket is {ticket.currentStatus}. Further notes cannot be added.
                        </div>
                      ) : (
                        <div className="p-3 rounded border shadow-sm bg-white">
                          <textarea 
                            className="form-control border-0 bg-light mb-2 small shadow-sm" 
                            rows={3} 
                            placeholder="Type a private internal note..." 
                            style={{ resize: 'none' }}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            disabled={commenting}
                          />
                          <div className="d-flex justify-content-end">
                            <button 
                              className="btn btn-warning btn-sm px-4 rounded-pill fw-medium text-dark"
                              onClick={handlePostNote}
                              disabled={commenting || !noteText.trim()}
                            >
                              {commenting ? "Posting..." : "Post Note"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ATTACHMENTS TAB */}
                  {activeTab === 'attachments' && (
                    <div className="animate-enter">
                      {ticket.attachments.length === 0 ? (
                        <div className="text-center py-4 bg-light rounded border">
                          <p className="text-muted small mb-0">No attachments uploaded yet.</p>
                        </div>
                      ) : (
                        <ul className="list-group mb-3 shadow-sm border-0">
                          {ticket.attachments.map(a => (
                            <li key={a.id} className="list-group-item bg-white border-light px-3 py-2 d-flex justify-content-between align-items-center">
                              <div className="me-2 text-truncate">
                                {a.isRemoved ? (
                                  <div className="text-decoration-line-through text-muted small text-truncate fw-medium" title={a.originalName}>{a.originalName}</div>
                                ) : (
                                  <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); handleDownload(a.id, a.originalName); }}
                                    className="text-decoration-none fw-bold text-zen-primary small text-truncate d-block"
                                    title={a.originalName}
                                  >
                                    {a.originalName}
                                  </a>
                                )}
                              </div>
                              {!a.isRemoved && (!isStaff || user.role === 'REQUESTER') && (
                                <button 
                                  className="btn btn-sm btn-link text-danger p-1" 
                                  onClick={() => handleRemove(a.id)}
                                  title="Remove attachment"
                                  aria-label={`Remove attachment ${a.originalName}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeAttachments < 5 && (!isStaff || user.role === 'REQUESTER') && (
                        <div className="mt-2 text-end">
                          <input 
                            type="file" 
                            className="d-none" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload}
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                          />
                          <button 
                            className="btn btn-sm btn-outline-secondary px-3 py-1 fw-medium rounded d-inline-flex align-items-center gap-2 bg-white"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            )}
                            {uploading ? "Uploading..." : "Upload File"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Status Change Confirmation Modal */}
      {confirmModal && (
        <AccessibleDialog
          isOpen={true}
          role="alertdialog"
          title="Confirm Status Change"
          description={`Are you sure you want to change the status to ${confirmModal.status}? This is a terminal or critical status.`}
          confirmText={`Confirm ${confirmModal.status === 'Cancelled' ? 'Cancel' : confirmModal.status}`}
          cancelText="Cancel"
          confirmVariant={confirmModal.status === 'Cancelled' ? 'danger' : 'warning'}
          isSubmitting={updating}
          initialFocusSafe={true}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => performTicketUpdate({ status: confirmModal.status })}
        />
      )}

      {/* Optimistic Concurrency 409 Conflict Dialog */}
      {conflictModal && (
        <AccessibleDialog
          isOpen={true}
          role="alertdialog"
          title="Conflict Detected"
          description={`This ticket has been modified by another user. Current status is ${conflictModal.currentStatus || 'updated'} (v${conflictModal.currentVersion || ''}). Please reload latest changes to prevent accidental overwrites.`}
          confirmText="Reload Ticket"
          cancelText="Close"
          confirmVariant="primary"
          initialFocusSafe={false}
          onClose={async () => {
            setConflictModal(null);
            await reloadTicket();
          }}
          onConfirm={async () => {
            setConflictModal(null);
            await reloadTicket();
          }}
        />
      )}

      {/* Requester Advisory Signal Confirmation Modal */}
      {advisoryModal && (
        <AccessibleDialog
          isOpen={true}
          role="dialog"
          title="Confirm Resolution Signal"
          description="This will notify IT Staff that your issue appears resolved and post an advisory audit comment. IT Staff will verify and complete the resolution."
          confirmText="Confirm"
          cancelText="Cancel"
          confirmVariant="success"
          isSubmitting={updating}
          initialFocusSafe={true}
          onClose={() => setAdvisoryModal(false)}
          onConfirm={async () => {
            setAdvisoryModal(false);
            await handleExecuteAppearsResolved();
          }}
        />
      )}
    </>
  );
}
