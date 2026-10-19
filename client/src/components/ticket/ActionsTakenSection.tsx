import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  ActionTaken,
  getActionsTaken,
  createActionTaken,
  updateActionTaken,
  ApiError,
} from "../../api";
import { useAuth } from "../../contexts/AuthContext";

export interface ActionsTakenSectionHandle {
  openCreateForm: () => void;
  focusSection: () => void;
}

export interface ActionsTakenSectionProps {
  ticketId: number;
  ticketStatus: string;
  onActionChanged: () => void;
}

function toLocalDatetimeString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function sortActions(list: any): ActionTaken[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = new Date(a.actionAt).getTime();
    const timeB = new Date(b.actionAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id - b.id;
  });
}

export const ActionsTakenSection = forwardRef<ActionsTakenSectionHandle, ActionsTakenSectionProps>(
  function ActionsTakenSection({
    ticketId,
    ticketStatus,
    onActionChanged,
  }, ref) {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeMode, setActiveMode] = useState<
    "none" | "create" | { type: "edit"; actionId: number }
  >("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Create Form State
  const [createActionAt, setCreateActionAt] = useState(() => toLocalDatetimeString());
  const [createDescription, setCreateDescription] = useState("");
  const [createResult, setCreateResult] = useState("");
  const [createFollowUpRequired, setCreateFollowUpRequired] = useState(false);
  const [createFollowUpNote, setCreateFollowUpNote] = useState("");
  const [createAttachmentNotes, setCreateAttachmentNotes] = useState("");

  // Edit Form State
  const [editDescription, setEditDescription] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editFollowUpRequired, setEditFollowUpRequired] = useState(false);
  const [editFollowUpNote, setEditFollowUpNote] = useState("");
  const [editAttachmentNotes, setEditAttachmentNotes] = useState("");
  const [editActionAt, setEditActionAt] = useState("");

  // Focus Return Refs
  const logButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const pendingFocusRef = useRef<"log" | { edit: number } | null>(null);

  // Input Field Refs for Focus on Validation Error
  const createDescRef = useRef<HTMLTextAreaElement>(null);
  const createResultRef = useRef<HTMLTextAreaElement>(null);
  const createNoteRef = useRef<HTMLTextAreaElement>(null);
  const createAttachmentRef = useRef<HTMLTextAreaElement>(null);
  const editDescRef = useRef<HTMLTextAreaElement>(null);
  const editResultRef = useRef<HTMLTextAreaElement>(null);
  const editNoteRef = useRef<HTMLTextAreaElement>(null);

  const isStaffOrAdmin = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
  const isTerminal = ticketStatus === "Closed" || ticketStatus === "Cancelled";

  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    openCreateForm: () => {
      if (containerRef.current) {
        if (typeof containerRef.current.scrollIntoView === 'function') {
          containerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        containerRef.current.focus();
      }
      if (!isTerminal) {
        handleOpenCreate();
      }
    },
    focusSection: () => {
      if (containerRef.current) {
        if (typeof containerRef.current.scrollIntoView === 'function') {
          containerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        containerRef.current.focus();
      }
    },
  }));

  useEffect(() => {
    if (activeMode === "none" && pendingFocusRef.current) {
      if (pendingFocusRef.current === "log") {
        logButtonRef.current?.focus();
      } else if (typeof pendingFocusRef.current === "object") {
        editButtonRefs.current.get(pendingFocusRef.current.edit)?.focus();
      }
      pendingFocusRef.current = null;
    }
  }, [activeMode]);

  const loadActions = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getActionsTaken(ticketId);
      setActions(sortActions(data));
    } catch (err: any) {
      setFetchError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [ticketId]);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormError("");
    setFormFieldErrors({});
    setCreateActionAt(toLocalDatetimeString());
    setCreateDescription("");
    setCreateResult("");
    setCreateFollowUpRequired(false);
    setCreateFollowUpNote("");
    setCreateAttachmentNotes("");
    setActiveMode("create");
  };

  // Cancel Create Form
  const handleCancelCreate = () => {
    pendingFocusRef.current = "log";
    setActiveMode("none");
    setFormError("");
    setFormFieldErrors({});
  };

  // Open Edit Mode
  const handleOpenEdit = (action: ActionTaken) => {
    setFormError("");
    setFormFieldErrors({});
    setEditDescription(action.description);
    setEditResult(action.result);
    setEditFollowUpRequired(action.followUpRequired);
    setEditFollowUpNote(action.followUpNote || "");
    setEditAttachmentNotes(action.attachmentNotes || "");
    setEditActionAt(action.actionAt);
    setActiveMode({ type: "edit", actionId: action.id });
  };

  // Cancel Edit Mode
  const handleCancelEdit = (actionId: number) => {
    pendingFocusRef.current = { edit: actionId };
    setActiveMode("none");
    setFormError("");
    setFormFieldErrors({});
  };

  // Submit Create Action
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!createDescription.trim()) {
      errors.description = "Description must not be empty";
    } else if (createDescription.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }

    if (!createResult.trim()) {
      errors.result = "Result must not be empty";
    } else if (createResult.length > 1000) {
      errors.result = "Result must not exceed 1000 characters";
    }

    if (createFollowUpRequired) {
      if (!createFollowUpNote.trim()) {
        errors.followUpNote = "Follow-up note is required when follow-up is requested";
      } else if (createFollowUpNote.length > 1000) {
        errors.followUpNote = "Follow-up note must not exceed 1000 characters";
      }
    }

    if (createAttachmentNotes.length > 500) {
      errors.attachmentNotes = "Attachment notes must not exceed 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormFieldErrors(errors);
      // Shift focus to first invalid input
      if (errors.description) createDescRef.current?.focus();
      else if (errors.result) createResultRef.current?.focus();
      else if (errors.followUpNote) createNoteRef.current?.focus();
      else if (errors.attachmentNotes) createAttachmentRef.current?.focus();
      return;
    }

    setFormFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      const isoActionAt = createActionAt ? new Date(createActionAt).toISOString() : undefined;
      await createActionTaken(ticketId, {
        actionAt: isoActionAt,
        description: createDescription.trim(),
        result: createResult.trim(),
        followUpRequired: createFollowUpRequired,
        followUpNote: createFollowUpRequired ? createFollowUpNote.trim() : null,
        attachmentNotes: createAttachmentNotes.trim() || null,
      });

      // Refetch list to ensure stable chronological order matching database
      const refreshed = await getActionsTaken(ticketId);
      setActions(sortActions(refreshed));
      setActiveMode("none");
      setSuccessMessage("Action saved successfully");
      setTimeout(() => setSuccessMessage(""), 4000);
      onActionChanged();
      setTimeout(() => {
        logButtonRef.current?.focus();
      }, 0);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "TERMINAL_TICKET_LOCKED") {
        setFormError(err.message || "Cannot record or edit actions on closed or cancelled tickets");
        setActiveMode("none");
        onActionChanged();
      } else if (err instanceof ApiError && err.fields) {
        setFormFieldErrors(err.fields);
        setFormError(err.message || "Validation error");
        if (err.fields.description) createDescRef.current?.focus();
        else if (err.fields.result) createResultRef.current?.focus();
        else if (err.fields.followUpNote) createNoteRef.current?.focus();
      } else {
        setFormError(err.message || "Failed to log action taken");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Action
  const handleSubmitEdit = async (actionId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!editDescription.trim()) {
      errors.description = "Description must not be empty";
    } else if (editDescription.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }

    if (!editResult.trim()) {
      errors.result = "Result must not be empty";
    } else if (editResult.length > 1000) {
      errors.result = "Result must not exceed 1000 characters";
    }

    if (editFollowUpRequired) {
      if (!editFollowUpNote.trim()) {
        errors.followUpNote = "Follow-up note is required when follow-up is requested";
      } else if (editFollowUpNote.length > 1000) {
        errors.followUpNote = "Follow-up note must not exceed 1000 characters";
      }
    }

    if (editAttachmentNotes.length > 500) {
      errors.attachmentNotes = "Attachment notes must not exceed 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormFieldErrors(errors);
      if (errors.description) editDescRef.current?.focus();
      else if (errors.result) editResultRef.current?.focus();
      else if (errors.followUpNote) editNoteRef.current?.focus();
      return;
    }

    setFormFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await updateActionTaken(ticketId, actionId, {
        description: editDescription.trim(),
        result: editResult.trim(),
        followUpRequired: editFollowUpRequired,
        followUpNote: editFollowUpRequired ? editFollowUpNote.trim() : null,
        attachmentNotes: editAttachmentNotes.trim() || null,
      });

      const refreshed = await getActionsTaken(ticketId);
      setActions(sortActions(refreshed));
      setActiveMode("none");
      setSuccessMessage("Action saved successfully");
      setTimeout(() => setSuccessMessage(""), 4000);
      onActionChanged();
      setTimeout(() => {
        editButtonRefs.current.get(actionId)?.focus();
      }, 0);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "TERMINAL_TICKET_LOCKED") {
        setFormError(err.message || "Cannot record or edit actions on closed or cancelled tickets");
        setActiveMode("none");
        onActionChanged();
      } else if (err instanceof ApiError && err.fields) {
        setFormFieldErrors(err.fields);
        setFormError(err.message || "Validation error");
        if (err.fields.description) editDescRef.current?.focus();
        else if (err.fields.result) editResultRef.current?.focus();
        else if (err.fields.followUpNote) editNoteRef.current?.focus();
      } else {
        setFormError(err.message || "Failed to update action taken");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="actions-taken-section"
      tabIndex={-1}
      className="glass-panel overflow-hidden mb-4 p-4 p-md-5 animate-enter"
      data-testid="actions-taken-section"
      style={{ outline: 'none' }}
    >
      {/* Header with Title, Count Badge, and Trigger Button */}
      <div className="d-flex flex-wrap justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom border-light-subtle">
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2 rounded-3 bg-success bg-opacity-10 text-zen-primary border border-success border-opacity-20 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 44, height: 44 }}
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="h4 fw-bold text-zen-primary mb-0">Actions Taken</h2>
              <span
                className="badge rounded-pill bg-success bg-opacity-15 text-zen-primary border border-success border-opacity-25 px-2 py-1 small fw-semibold"
                data-testid="actions-count-badge"
              >
                {actions.length}
              </span>
            </div>
            <p className="text-muted small mb-0">
              Technical diagnostics, hardware checks, and resolution actions performed.
            </p>
          </div>
        </div>

        {/* Action Controls for Staff/Admin */}
        {isStaffOrAdmin && (
          <div>
            {isTerminal ? (
              <span className="badge badge-zen-secondary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Ticket is {ticketStatus} (Actions locked)
              </span>
            ) : (
              activeMode === "none" && (
                <button
                  ref={logButtonRef}
                  id="log-action-btn"
                  data-testid="log-action-btn"
                  aria-label="+ Log Action Taken"
                  type="button"
                  onClick={handleOpenCreate}
                  className="btn btn-outline-success btn-sm fw-bold d-inline-flex align-items-center gap-1 shadow-sm bg-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Log Action Taken
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Accessible Success Message Announcement */}
      {successMessage && (
        <div role="status" aria-live="polite" className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Global Form/Lock Error Banner */}
      {formError && (
        <div role="alert" className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      {/* Create Action Form Mode */}
      {activeMode === "create" && (
        <div className="card p-4 rounded-4 mb-4 border border-success border-opacity-25 bg-white shadow-sm" data-testid="create-action-form">
          <h3 className="h6 fw-bold text-zen-primary mb-3">Record New Action Taken</h3>
          <form onSubmit={handleSubmitCreate} noValidate>
            <div className="row g-3">
              {/* Row 1: Action Date/Time & Performed By */}
              <div className="col-12 col-md-6">
                <label htmlFor="create-action-at" className="form-label small fw-bold text-muted mb-1">
                  Action Date / Time
                </label>
                <input
                  type="datetime-local"
                  id="create-action-at"
                  className={`form-control ${formFieldErrors.actionAt ? "is-invalid" : ""}`}
                  value={createActionAt}
                  onChange={(e) => setCreateActionAt(e.target.value)}
                  max={toLocalDatetimeString(new Date(Date.now() + 10 * 60 * 1000))}
                  aria-describedby={formFieldErrors.actionAt ? "create-action-at-err" : undefined}
                  aria-invalid={Boolean(formFieldErrors.actionAt)}
                />
                {formFieldErrors.actionAt && (
                  <div id="create-action-at-err" className="invalid-feedback">
                    {formFieldErrors.actionAt}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="create-performed-by" className="form-label small fw-bold text-muted mb-1">
                  Performed By
                </label>
                <input
                  type="text"
                  id="create-performed-by"
                  className="form-control bg-light text-muted border-light"
                  value={user?.name ? `${user.name} (${user.role})` : "Authenticated Performer"}
                  readOnly
                  aria-readonly="true"
                />
                <div className="form-text small text-muted">Bound automatically from your current session</div>
              </div>

              {/* Row 2: Description */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="create-description" className="form-label small fw-bold text-muted mb-0">
                    Description <span className="text-danger">*</span>
                  </label>
                  <span className="small text-muted" data-testid="desc-counter">
                    {createDescription.length} / 1000
                  </span>
                </div>
                <textarea
                  ref={createDescRef}
                  id="create-description"
                  rows={3}
                  maxLength={1000}
                  className={`form-control ${formFieldErrors.description ? "is-invalid" : ""}`}
                  placeholder="Detail the technical actions, diagnostics, hardware checks, or configurations performed..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  aria-describedby={formFieldErrors.description ? "create-desc-err" : undefined}
                  aria-invalid={Boolean(formFieldErrors.description)}
                  required
                />
                {formFieldErrors.description && (
                  <div id="create-desc-err" className="invalid-feedback">
                    {formFieldErrors.description}
                  </div>
                )}
              </div>

              {/* Row 3: Result */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="create-result" className="form-label small fw-bold text-muted mb-0">
                    Result <span className="text-danger">*</span>
                  </label>
                  <span className="small text-muted">
                    {createResult.length} / 1000
                  </span>
                </div>
                <textarea
                  ref={createResultRef}
                  id="create-result"
                  rows={2}
                  maxLength={1000}
                  className={`form-control ${formFieldErrors.result ? "is-invalid" : ""}`}
                  placeholder="Observed outcome, diagnostic findings, verified temperatures, or resolution state..."
                  value={createResult}
                  onChange={(e) => setCreateResult(e.target.value)}
                  aria-describedby={formFieldErrors.result ? "create-result-err" : undefined}
                  aria-invalid={Boolean(formFieldErrors.result)}
                  required
                />
                {formFieldErrors.result && (
                  <div id="create-result-err" className="invalid-feedback">
                    {formFieldErrors.result}
                  </div>
                )}
              </div>

              {/* Row 4: Follow-up Checkbox */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="create-follow-up-check"
                    className="form-check-input"
                    checked={createFollowUpRequired}
                    onChange={(e) => {
                      setCreateFollowUpRequired(e.target.checked);
                      if (!e.target.checked) setCreateFollowUpNote("");
                    }}
                    aria-expanded={createFollowUpRequired}
                    aria-controls="create-follow-up-note-container"
                  />
                  <label htmlFor="create-follow-up-check" className="form-check-label fw-medium text-dark">
                    Follow-Up Required
                  </label>
                </div>
              </div>

              {/* Conditionally Revealed: Follow-up Note */}
              {createFollowUpRequired && (
                <div className="col-12" id="create-follow-up-note-container">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="create-follow-up-note" className="form-label small fw-bold text-muted mb-0">
                      Follow-up Note <span className="text-danger">*</span>
                    </label>
                    <span className="small text-muted">
                      {createFollowUpNote.length} / 1000
                    </span>
                  </div>
                  <textarea
                    ref={createNoteRef}
                    id="create-follow-up-note"
                    rows={2}
                    maxLength={1000}
                    className={`form-control ${formFieldErrors.followUpNote ? "is-invalid" : ""}`}
                    placeholder="Describe pending diagnostic steps, part arrivals, or scheduled checkups..."
                    value={createFollowUpNote}
                    onChange={(e) => setCreateFollowUpNote(e.target.value)}
                    aria-describedby={formFieldErrors.followUpNote ? "create-note-err" : undefined}
                    aria-invalid={Boolean(formFieldErrors.followUpNote)}
                    required={createFollowUpRequired}
                  />
                  {formFieldErrors.followUpNote && (
                    <div id="create-note-err" className="invalid-feedback">
                      {formFieldErrors.followUpNote}
                    </div>
                  )}
                </div>
              )}

              {/* Row 5: Attachment Notes */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="create-attachment-notes" className="form-label small fw-bold text-muted mb-0">
                    Attachment Notes
                  </label>
                  <span className="small text-muted">
                    {createAttachmentNotes.length} / 500
                  </span>
                </div>
                <textarea
                  ref={createAttachmentRef}
                  id="create-attachment-notes"
                  rows={2}
                  maxLength={500}
                  className={`form-control ${formFieldErrors.attachmentNotes ? "is-invalid" : ""}`}
                  placeholder="e.g., Look for diagnostic-log.png in attachments"
                  value={createAttachmentNotes}
                  onChange={(e) => setCreateAttachmentNotes(e.target.value)}
                  aria-describedby={formFieldErrors.attachmentNotes ? "create-attachment-err" : undefined}
                  aria-invalid={Boolean(formFieldErrors.attachmentNotes)}
                />
                {formFieldErrors.attachmentNotes && (
                  <div id="create-attachment-err" className="invalid-feedback">
                    {formFieldErrors.attachmentNotes}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  disabled={isSubmitting}
                  className="btn btn-outline-secondary btn-sm px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-success btn-sm px-4 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                >
                  {isSubmitting && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />}
                  {isSubmitting ? "Saving..." : "Log Action"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5" role="status" aria-label="Loading actions taken">
          <div className="spinner-border text-zen-primary mb-2" />
          <p className="text-muted small mb-0">Loading actions taken history...</p>
        </div>
      ) : fetchError ? (
        <div className="alert alert-warning text-center p-4 rounded-4" role="alert">
          <h4 className="h6 text-danger fw-bold mb-2">Error Loading Actions</h4>
          <p className="small text-muted mb-3">{fetchError}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={loadActions}
          >
            Retry Loading Actions
          </button>
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-5 px-3 border rounded-3 bg-light bg-opacity-40">
          <div className="p-3 rounded-circle bg-success bg-opacity-10 text-zen-primary d-inline-flex mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="h6 fw-bold text-dark mb-1">No Actions Recorded Yet</h3>
          <p className="text-muted mb-0 small" style={{ maxWidth: 440, margin: "0 auto" }}>
            {isStaffOrAdmin
              ? "No actions have been recorded yet. Log the first technical action using the button above."
              : "No actions have been recorded yet."}
          </p>
        </div>
      ) : (
        /* Single-DOM Responsive Table / Cards Container */
        <div className="card border rounded-3 overflow-hidden shadow-sm bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 actions-table-responsive">
              <caption className="visually-hidden">Actions taken history for this ticket</caption>
              <thead className="table-light">
                <tr className="border-bottom text-secondary small fw-bold">
                  <th scope="col" className="py-3 px-3 text-nowrap border-end border-light-subtle" style={{ width: "16%" }}>
                    Date / Time
                  </th>
                  <th scope="col" className="py-3 px-3 border-end border-light-subtle" style={{ width: "24%" }}>
                    Description
                  </th>
                  <th scope="col" className="py-3 px-3 border-end border-light-subtle" style={{ width: "24%" }}>
                    Result / Outcome
                  </th>
                  <th scope="col" className="py-3 px-3 text-nowrap border-end border-light-subtle" style={{ width: "13%" }}>
                    Performed By
                  </th>
                  <th scope="col" className="py-3 px-3 text-nowrap border-end border-light-subtle" style={{ width: "9%" }}>
                    Follow-Up
                  </th>
                  <th scope="col" className="py-3 px-3 border-end border-light-subtle" style={{ width: "14%" }}>
                    Notes & Files
                  </th>
                  {isStaffOrAdmin && !isTerminal && (
                    <th scope="col" className="py-3 px-3 text-end text-nowrap" style={{ width: "8%" }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => {
                  const isEditingThis = typeof activeMode === "object" && activeMode.type === "edit" && activeMode.actionId === act.id;

                  if (isEditingThis) {
                    return (
                      <tr key={`edit-${act.id}`} className="action-edit-row border-top border-bottom bg-light bg-opacity-75" data-testid="inline-edit-form">
                        <td colSpan={isStaffOrAdmin && !isTerminal ? 7 : 6} className="p-4">
                          <h4 className="h6 fw-bold text-zen-primary mb-3">
                            Edit Action Taken #{act.id}
                          </h4>
                          <form onSubmit={(e) => handleSubmitEdit(act.id, e)} noValidate>
                            <div className="row g-3">
                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-muted mb-1">
                                  Action Date / Time
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-light text-muted border-light"
                                  value={formatDisplayDateTime(editActionAt)}
                                  readOnly
                                  aria-readonly="true"
                                />
                                <div className="form-text small text-muted">Action timestamp is immutable after logging</div>
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-muted mb-1">
                                  Recorded By
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-light text-muted border-light"
                                  value={`${act.performedBy?.name || "Staff"} (${act.performedBy?.role || "IT_STAFF"})`}
                                  readOnly
                                  aria-readonly="true"
                                />
                              </div>

                              <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <label htmlFor={`edit-desc-${act.id}`} className="form-label small fw-bold text-muted mb-0">
                                    Description <span className="text-danger">*</span>
                                  </label>
                                  <span className="small text-muted">
                                    {editDescription.length} / 1000
                                  </span>
                                </div>
                                <textarea
                                  ref={editDescRef}
                                  id={`edit-desc-${act.id}`}
                                  rows={3}
                                  maxLength={1000}
                                  className={`form-control ${formFieldErrors.description ? "is-invalid" : ""}`}
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  aria-describedby={formFieldErrors.description ? `edit-desc-err-${act.id}` : undefined}
                                  aria-invalid={Boolean(formFieldErrors.description)}
                                  required
                                />
                                {formFieldErrors.description && (
                                  <div id={`edit-desc-err-${act.id}`} className="invalid-feedback">
                                    {formFieldErrors.description}
                                  </div>
                                )}
                              </div>

                              <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <label htmlFor={`edit-result-${act.id}`} className="form-label small fw-bold text-muted mb-0">
                                    Result <span className="text-danger">*</span>
                                  </label>
                                  <span className="small text-muted">
                                    {editResult.length} / 1000
                                  </span>
                                </div>
                                <textarea
                                  ref={editResultRef}
                                  id={`edit-result-${act.id}`}
                                  rows={2}
                                  maxLength={1000}
                                  className={`form-control ${formFieldErrors.result ? "is-invalid" : ""}`}
                                  value={editResult}
                                  onChange={(e) => setEditResult(e.target.value)}
                                  aria-describedby={formFieldErrors.result ? `edit-result-err-${act.id}` : undefined}
                                  aria-invalid={Boolean(formFieldErrors.result)}
                                  required
                                />
                                {formFieldErrors.result && (
                                  <div id={`edit-result-err-${act.id}`} className="invalid-feedback">
                                    {formFieldErrors.result}
                                  </div>
                                )}
                              </div>

                              <div className="col-12">
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    id={`edit-follow-up-check-${act.id}`}
                                    className="form-check-input"
                                    checked={editFollowUpRequired}
                                    onChange={(e) => {
                                      setEditFollowUpRequired(e.target.checked);
                                      if (!e.target.checked) setEditFollowUpNote("");
                                    }}
                                    aria-expanded={editFollowUpRequired}
                                  />
                                  <label htmlFor={`edit-follow-up-check-${act.id}`} className="form-check-label fw-medium text-dark">
                                    Follow-Up Required
                                  </label>
                                </div>
                              </div>

                              {editFollowUpRequired && (
                                <div className="col-12">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label htmlFor={`edit-follow-up-note-${act.id}`} className="form-label small fw-bold text-muted mb-0">
                                      Follow-up Note <span className="text-danger">*</span>
                                    </label>
                                    <span className="small text-muted">
                                      {editFollowUpNote.length} / 1000
                                    </span>
                                  </div>
                                  <textarea
                                    ref={editNoteRef}
                                    id={`edit-follow-up-note-${act.id}`}
                                    rows={2}
                                    maxLength={1000}
                                    className={`form-control ${formFieldErrors.followUpNote ? "is-invalid" : ""}`}
                                    value={editFollowUpNote}
                                    onChange={(e) => setEditFollowUpNote(e.target.value)}
                                    aria-describedby={formFieldErrors.followUpNote ? `edit-note-err-${act.id}` : undefined}
                                    aria-invalid={Boolean(formFieldErrors.followUpNote)}
                                    required={editFollowUpRequired}
                                  />
                                  {formFieldErrors.followUpNote && (
                                    <div id={`edit-note-err-${act.id}`} className="invalid-feedback">
                                      {formFieldErrors.followUpNote}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <label htmlFor={`edit-attachment-notes-${act.id}`} className="form-label small fw-bold text-muted mb-0">
                                    Attachment Notes
                                  </label>
                                  <span className="small text-muted">
                                    {editAttachmentNotes.length} / 500
                                  </span>
                                </div>
                                <textarea
                                  id={`edit-attachment-notes-${act.id}`}
                                  rows={2}
                                  maxLength={500}
                                  className={`form-control ${formFieldErrors.attachmentNotes ? "is-invalid" : ""}`}
                                  value={editAttachmentNotes}
                                  onChange={(e) => setEditAttachmentNotes(e.target.value)}
                                />
                              </div>

                              <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleCancelEdit(act.id)}
                                  disabled={isSubmitting}
                                  className="btn btn-outline-secondary btn-sm px-3"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="btn btn-success btn-sm px-4 fw-bold shadow-sm"
                                >
                                  {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          </form>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={act.id} className="action-row border-bottom border-light-subtle" data-testid={`action-row-${act.id}`}>
                      <td data-label="Date / Time" className="py-3 px-3 text-nowrap small text-muted border-end border-light-subtle">
                        <div className="d-inline-flex align-items-center gap-2">
                          <span className="p-1 rounded bg-light text-muted d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </span>
                          <span className="fw-medium text-dark">{formatDisplayDateTime(act.actionAt)}</span>
                        </div>
                      </td>
                      <td data-label="Description" className="py-3 px-3 text-dark text-break border-end border-light-subtle">
                        <span className="fw-semibold text-dark">{act.description}</span>
                      </td>
                      <td data-label="Result" className="py-3 px-3 text-break border-end border-light-subtle">
                        <div className="p-2 rounded-2 bg-light border border-light-subtle small text-dark">
                          <div className="d-flex align-items-center gap-1 text-success fw-bold mb-1" style={{ fontSize: "0.72rem" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Outcome</span>
                          </div>
                          <span className="text-secondary">{act.result}</span>
                        </div>
                      </td>
                      <td data-label="Performed By" className="py-3 px-3 text-nowrap border-end border-light-subtle">
                        <div className="d-inline-flex align-items-center gap-2 px-2 py-1 rounded-pill bg-light border border-light-subtle">
                          <div className="rounded-circle bg-success bg-opacity-15 text-zen-primary d-flex align-items-center justify-content-center" style={{ width: 22, height: 22 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <span className="small fw-medium text-dark">{act.performedBy?.name || "Staff"}</span>
                        </div>
                      </td>
                      <td data-label="Follow-Up" className="py-3 px-3 text-nowrap border-end border-light-subtle">
                        {act.followUpRequired ? (
                          <span className="badge rounded-pill bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-30 px-2 py-1 d-inline-flex align-items-center gap-1 small fw-semibold">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20 px-2 py-1 d-inline-flex align-items-center gap-1 small">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>No</span>
                          </span>
                        )}
                      </td>
                      <td data-label="Notes" className="py-3 px-3 small text-break border-end border-light-subtle">
                        {act.followUpNote && (
                          <div className="p-2 mb-1 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25 small text-dark">
                            <div className="fw-semibold text-warning-emphasis d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.72rem" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                              </svg>
                              <span>Follow-Up Note:</span>
                            </div>
                            <span>{act.followUpNote}</span>
                          </div>
                        )}
                        {act.attachmentNotes && (
                          <div className="p-1 px-2 rounded bg-light border border-light-subtle small text-muted d-flex align-items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-secondary">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                            <span className="fst-italic text-truncate" title={act.attachmentNotes}>{act.attachmentNotes}</span>
                          </div>
                        )}
                        {!act.followUpNote && !act.attachmentNotes && <span className="text-muted small">-</span>}
                      </td>
                      {isStaffOrAdmin && !isTerminal && (
                        <td data-label="Actions" className="py-3 px-3 text-end text-nowrap">
                          <button
                            ref={(el) => {
                              if (el) editButtonRefs.current.set(act.id, el);
                              else editButtonRefs.current.delete(act.id);
                            }}
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            className="btn btn-outline-secondary btn-sm px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-sm bg-white"
                            aria-label={`Edit action logged at ${formatDisplayDateTime(act.actionAt)}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

export default ActionsTakenSection;
