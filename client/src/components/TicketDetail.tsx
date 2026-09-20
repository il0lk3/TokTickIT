import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TicketDetailResponse, getTicketDetail, uploadAttachment, removeAttachment, downloadAttachmentBlob, postComment, markAppearsResolved, getItStaff, UserResponse, updateTicket, postNote } from "../api.js";
import { useAuth } from "../contexts/AuthContext";

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
  const [commentError, setCommentError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  const [confirmModal, setConfirmModal] = useState<{ status: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const isStaffUser = user.role === "IT_STAFF" || user.role === "ADMINISTRATOR";
        const detail = await getTicketDetail(ticketId, isStaffUser);
        setTicket(detail);
        if (user.role === "IT_STAFF") {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmModal) {
        setConfirmModal(null);
      }
    };
    if (confirmModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal]);

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

  const handleAppearsResolved = async () => {
    if (!user || !ticket) return;
    setCommenting(true);
    try {
      const result = await markAppearsResolved(ticketId);
      setTicket(prev => prev ? { ...prev, appearsResolved: true, publicComments: [...prev.publicComments, result.comment] } : null);
    } catch (err: any) {
      alert(err.message || "Failed to mark as resolved");
    } finally {
      setCommenting(false);
    }
  };

  const requestUpdate = (updates: { ownerId?: number | null; itPriority?: string; status?: string }) => {
    if (updates.status && ["Resolved", "Closed", "Cancelled"].includes(updates.status)) {
      setConfirmModal({ status: updates.status });
      return;
    }
    performUpdate(updates);
  };

  const performUpdate = async (updates: { ownerId?: number | null; itPriority?: string; status?: string }) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const isStaffUser = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
      await updateTicket(ticketId, updates, isStaffUser);
      const detail = await getTicketDetail(ticketId, isStaffUser);
      setTicket(detail);
    } catch (err: any) {
      alert(err.message || "Failed to update ticket");
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
      case "InProgress": return "badge-zen-warning";
      case "WaitingForRequester": return "badge-zen-warning";
      case "Resolved":
      case "Closed": return "badge-zen-success";
      default: return "badge-zen-secondary";
    }
  };

  const activeAttachments = ticket.attachments.filter(a => !a.isRemoved).length;
  const isTerminal = ["Resolved", "Closed", "Cancelled"].includes(ticket.currentStatus);
  const isStaff = user?.role === "IT_STAFF";

  return (
    <>
      <div className="animate-enter position-relative">
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

      <div className="glass-panel overflow-hidden">
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
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold mb-1">Ticket Owner</label>
              {isStaff ? (
                <div className="d-flex align-items-center gap-2">
                  <select 
                    className="form-select bg-white border"
                    style={{ cursor: 'pointer' }}
                    value={ticket.owner?.id || ticket.ownerId || ""}
                    onChange={(e) => requestUpdate({ ownerId: e.target.value ? parseInt(e.target.value, 10) : null })}
                  >
                    <option value="">-- Unassigned --</option>
                    {itStaffList.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                  {((ticket.owner?.id || ticket.ownerId) !== user.id) && (
                    <button className="btn btn-outline-primary text-nowrap px-2 py-1 small" onClick={() => requestUpdate({ ownerId: user.id })}>
                      Claim
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
            <div className="col-md-4">
              <label className="form-label text-muted small fw-bold mb-1">Current Status</label>
              {isStaff ? (
                <div className="d-flex flex-column gap-1">
                  <select 
                    className="form-select fw-bold bg-white text-dark border"
                    style={{ cursor: 'pointer' }}
                    value={ticket.currentStatus}
                    onChange={(e) => requestUpdate({ status: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="WaitingForRequester">Waiting for Requester</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {ticket.appearsResolved && (
                    <span className="badge badge-zen-success rounded-pill mt-1 d-block text-center py-1">
                      Requester marked resolved
                    </span>
                  )}
                </div>
              ) : (
                <div className="form-control readonly-wrapper d-flex flex-wrap align-items-center gap-2" style={{ minHeight: '38px' }}>
                  <span className={`badge rounded-pill px-3 py-1 ${getStatusBadgeClass(ticket.currentStatus)}`}>
                    {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus}
                  </span>
                  {ticket.appearsResolved && (
                    <span className="badge rounded-pill px-2 py-1 badge-zen-success" style={{fontSize: '0.7rem'}}>
                      Appears Resolved
                    </span>
                  )}
                  {user?.role === 'REQUESTER' && !ticket.appearsResolved && !isTerminal && (
                    <button 
                      className="btn btn-outline-success btn-sm px-2 rounded-pill fw-medium"
                      onClick={handleAppearsResolved}
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
              <label className="form-label text-muted small fw-bold mb-1">IT Priority</label>
              {isStaff ? (
                <select 
                  className="form-select bg-white fw-medium border"
                  style={{ cursor: 'pointer' }}
                  value={ticket.itPriority}
                  onChange={(e) => requestUpdate({ itPriority: e.target.value })}
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

            {/* Tabs Header */}
            <div className="col-12 mt-4 pt-3 border-top">
              <div className="zen-tabs">
                <button 
                  role="tab"
                  className={`zen-tab-btn ${activeTab === 'public' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> 
                  Public Comments <span className="badge bg-secondary rounded-pill">{ticket.publicComments?.length || 0}</span>
                </button>
                {isStaff && (
                  <button 
                    role="tab"
                    className={`zen-tab-btn internal-notes-tab ${activeTab === 'internal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('internal')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> 
                    Internal Notes <span className="badge bg-warning text-dark rounded-pill">{ticket.internalNotes?.length || 0}</span>
                  </button>
                )}
                <button 
                  role="tab"
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

                    {isTerminal ? (
                      <div className="bg-light p-3 rounded border text-center text-muted fst-italic">
                        Ticket is {ticket.currentStatus}. Further comments cannot be added.
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded border shadow-sm">
                        <textarea 
                          className="form-control border-0 bg-light mb-2 small shadow-sm" 
                          rows={3} 
                          placeholder="Type a public comment..." 
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

                    {isTerminal ? (
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
      
      {/* Confirmation Modal */}
      {confirmModal && createPortal(
        <div className="modal d-block glass-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-modal">
              <div className="modal-header bg-warning bg-opacity-10 text-warning-emphasis border-0 glass-modal-header">
                <h5 className="modal-title fw-bold text-dark">Confirm Status Change</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmModal(null)}></button>
              </div>
              <div className="modal-body glass-modal-body">
                <p className="mb-0">Are you sure you want to change the status to <strong>{confirmModal.status}</strong>? This is a terminal or critical status.</p>
              </div>
              <div className="modal-footer border-0 glass-modal-footer">
                <button type="button" className="btn btn-light px-4 fw-medium shadow-sm" autoFocus onClick={() => setConfirmModal(null)}>Cancel</button>
                <button type="button" className="btn btn-warning px-4 fw-bold shadow-sm text-dark" onClick={() => performUpdate({ status: confirmModal.status })}>Confirm</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
