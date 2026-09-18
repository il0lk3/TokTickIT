import { useState, useEffect, useRef } from "react";
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
  const [uploading, setUploading] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [updating, setUpdating] = useState(false);
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
    if (!user || !ticket || !commentText.trim()) return;
    setCommenting(true);
    try {
      const newComment = await postComment(ticketId, commentText.trim());
      setTicket(prev => prev ? { ...prev, publicComments: [...prev.publicComments, newComment] } : null);
      setCommentText("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setCommenting(false);
    }
  };

  const handlePostNote = async () => {
    if (!user || !ticket || !noteText.trim()) return;
    setCommenting(true);
    try {
      const newNote = await postNote(ticketId, noteText.trim());
      setTicket(prev => prev ? { ...prev, internalNotes: [...(prev.internalNotes || []), newNote] } : null);
      setNoteText("");
    } catch (err: any) {
      alert(err.message || "Failed to post internal note");
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
      await updateTicket(ticketId, updates);
      const isStaffUser = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
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

  const activeAttachments = ticket.attachments.filter(a => !a.isRemoved).length;
  const isTerminal = ["Resolved", "Closed", "Cancelled"].includes(ticket.currentStatus);
  const isStaff = user?.role === "IT_STAFF";

  return (
    <div className="animate-enter position-relative">
      {/* Loading Overlay for updates */}
      {updating && (
        <div className="position-absolute w-100 h-100 bg-white bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 10, backdropFilter: 'blur(1px)' }}>
          <div className="spinner-border text-zen-primary" role="status"></div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-warning bg-opacity-10 text-warning-emphasis border-0">
                <h5 className="modal-title fw-bold">Confirm Status Change</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmModal(null)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-0">Are you sure you want to change the status to <strong>{confirmModal.status}</strong>? This is a terminal or critical status.</p>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button type="button" className="btn btn-light px-4 fw-medium" onClick={() => setConfirmModal(null)}>Cancel</button>
                <button type="button" className="btn btn-warning px-4 fw-bold" onClick={() => performUpdate({ status: confirmModal.status })}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
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

      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <div className="row g-4">
            {/* Row 1 */}
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Ticket No.</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.ticketNumber} />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Ticket Date</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={new Date(ticket.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Category</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.category.name} />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Related System</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.relatedSystem.name} />
            </div>

            {/* Row 2 */}
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Requester</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.requester?.name || '-'} />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Requested Priority</label>
              <div className="form-control bg-light d-flex align-items-center">
                <span className={`badge rounded-pill px-3 py-1 ${ticket.requestedPriority === 'HIGH' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : ticket.requestedPriority === 'MEDIUM' ? 'bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'}`}>
                  {ticket.requestedPriority.charAt(0) + ticket.requestedPriority.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">IT Priority</label>
              {isStaff ? (
                <select 
                  className="form-select bg-white fw-medium"
                  value={ticket.itPriority}
                  onChange={(e) => requestUpdate({ itPriority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              ) : (
                <div className="form-control bg-light d-flex align-items-center">
                  <span className={`badge rounded-pill px-3 py-1 ${ticket.itPriority === 'HIGH' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : ticket.itPriority === 'MEDIUM' ? 'bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'}`}>
                    {ticket.itPriority.charAt(0) + ticket.itPriority.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Current Status</label>
              {isStaff ? (
                <div className="d-flex flex-column gap-1">
                  <select 
                    className="form-select fw-bold bg-white text-dark"
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
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 mt-1 d-block text-center py-1">
                      Requester marked resolved
                    </span>
                  )}
                </div>
              ) : (
                <div className="form-control bg-light d-flex flex-column align-items-start gap-1 h-auto py-2">
                  <span className={`badge rounded-pill px-3 py-1 ${ticket.currentStatus === 'Resolved' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-50' : ticket.currentStatus === 'InProgress' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-50' : 'bg-info bg-opacity-10 text-dark border border-info border-opacity-50'}`}>
                    {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus}
                  </span>
                  {ticket.appearsResolved && (
                    <span className="badge rounded-pill px-2 py-1 bg-success bg-opacity-10 text-success border border-success border-opacity-50" style={{fontSize: '0.7rem'}}>
                      Appears Resolved
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Row 3 */}
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Ticket Owner</label>
              {isStaff ? (
                <div className="d-flex flex-column gap-2">
                  <select 
                    className="form-select bg-white"
                    value={ticket.ownerName ? itStaffList.find(s => s.name === ticket.ownerName)?.id || "" : ""}
                    onChange={(e) => requestUpdate({ ownerId: e.target.value ? parseInt(e.target.value, 10) : null })}
                  >
                    <option value="">-- Unassigned --</option>
                    {itStaffList.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                  {(!ticket.ownerName || ticket.ownerName !== user.name) && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => requestUpdate({ ownerId: user.id })}>
                      Claim Ticket
                    </button>
                  )}
                </div>
              ) : (
                <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.ownerName || '-'} />
              )}
            </div>
            <div className="col-md-9">
              <label className="form-label text-muted small fw-bold mb-1">Summary</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.summary} />
            </div>

            {/* Row 4 */}
            <div className="col-12">
              <label className="form-label text-muted small fw-bold mb-1">Description</label>
              <textarea className="form-control bg-light text-muted" readOnly rows={3} style={{ resize: 'none' }} value={ticket.description} />
            </div>

            {/* Row 5 */}
            <div className="col-12">
              <label className="form-label text-muted small fw-bold mb-1">Resolution Summary</label>
              <textarea className="form-control bg-light text-muted fst-italic" readOnly rows={2} style={{ resize: 'none' }} value={ticket.resolutionSummary || 'No resolution summary available yet.'} />
            </div>

            {/* Row 6: Attachments */}
            <div className="col-12 mt-4 pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label text-muted small fw-bold mb-0">Attachments</label>
                <span className="badge bg-secondary rounded-pill">{activeAttachments}/5</span>
              </div>
              
              {ticket.attachments.length === 0 ? (
                <div className="text-center py-3 bg-light rounded border">
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
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {activeAttachments < 5 && (!isStaff || user.role === 'REQUESTER') && (
                <div className="mt-2">
                  <input 
                    type="file" 
                    className="d-none" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                  <button 
                    className="btn btn-sm btn-outline-secondary px-3 py-1 fw-medium rounded d-flex align-items-center gap-2 bg-white"
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
            
            {/* Row 7: Comments & Notes */}
            <div className="col-12 mt-4 pt-3 border-top">
              
              {isStaff ? (
                <ul className="nav nav-pills mb-3 border-bottom pb-2">
                  <li className="nav-item">
                    <button 
                      className={`nav-link rounded-pill px-4 fw-medium ${activeTab === 'comments' ? 'active bg-zen-primary' : 'text-muted'}`}
                      onClick={() => setActiveTab('comments')}
                    >
                      Public Comments
                    </button>
                  </li>
                  <li className="nav-item ms-2">
                    <button 
                      className={`nav-link rounded-pill px-4 fw-medium ${activeTab === 'notes' ? 'active bg-warning text-dark' : 'text-muted'}`}
                      onClick={() => setActiveTab('notes')}
                    >
                      Internal Notes
                    </button>
                  </li>
                </ul>
              ) : (
                <label className="form-label text-muted small fw-bold mb-3">Comments</label>
              )}
              
              <div className="mb-4">
                {activeTab === 'comments' && (
                  (!ticket.publicComments || ticket.publicComments.length === 0) ? (
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
                  )
                )}

                {activeTab === 'notes' && isStaff && (
                  (!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
                    <p className="text-muted small fst-italic">No internal notes yet.</p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {ticket.internalNotes.map(n => (
                        <div key={n.id} className="p-3 rounded border border-warning shadow-sm" style={{ backgroundColor: '#fffdf5' }}>
                          <div className="d-flex justify-content-between mb-2">
                            <strong className="small text-dark">{n.author.name} <span className="text-muted fw-normal">({n.author.role})</span></strong>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(n.createdAt).toLocaleString()}</small>
                          </div>
                          <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-wrap' }}>{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Input Forms */}
              {!isTerminal && (
                <div className={`p-3 rounded border shadow-sm ${activeTab === 'notes' ? 'bg-warning bg-opacity-10 border-warning border-opacity-50' : 'bg-white'}`}>
                  <textarea 
                    className="form-control border-0 bg-white mb-2 small shadow-sm" 
                    rows={3} 
                    placeholder={activeTab === 'notes' ? "Type a private internal note..." : "Type a public comment..."} 
                    style={{ resize: 'none' }}
                    value={activeTab === 'notes' ? noteText : commentText}
                    onChange={e => activeTab === 'notes' ? setNoteText(e.target.value) : setCommentText(e.target.value)}
                    disabled={commenting}
                  />
                  <div className="d-flex justify-content-between align-items-center">
                    {user?.role === 'REQUESTER' && !ticket.appearsResolved && activeTab === 'comments' && (
                      <button 
                        className="btn btn-outline-success btn-sm px-3 rounded-pill fw-medium"
                        onClick={handleAppearsResolved}
                        disabled={commenting}
                      >
                        Problem Appears Resolved
                      </button>
                    )}
                    <button 
                      className={`btn btn-sm px-4 rounded-pill fw-medium ms-auto ${activeTab === 'notes' ? 'btn-warning' : 'btn-primary'}`}
                      onClick={activeTab === 'notes' ? handlePostNote : handlePostComment}
                      disabled={commenting || (activeTab === 'notes' ? !noteText.trim() : !commentText.trim())}
                    >
                      {commenting ? "Posting..." : (activeTab === 'notes' ? "Post Note" : "Post Comment")}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
