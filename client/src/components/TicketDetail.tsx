import { useState, useEffect, useRef } from "react";
import { TicketDetailResponse, getTicketDetail, uploadAttachment, removeAttachment, downloadAttachmentBlob } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { activeRequester } = useRequester();
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!activeRequester) return;
      try {
        const data = await getTicketDetail(ticketId, activeRequester.id);
        setTicket(data);
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId, activeRequester]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeRequester || !ticket || !e.target.files?.length) return;
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
      const newAttachment = await uploadAttachment(ticket.id, file, activeRequester.id);
      setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null);
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (attachmentId: number) => {
    if (!activeRequester || !ticket) return;
    const reason = prompt("Please provide a reason for removing this attachment:");
    if (reason === null) return; // User cancelled

    try {
      await removeAttachment(ticket.id, attachmentId, reason, activeRequester.id);
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
    if (!activeRequester || !ticket) return;
    try {
      const blob = await downloadAttachmentBlob(ticket.id, attachmentId, activeRequester.id);
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

  return (
    <div className="animate-enter">
      {/* Breadcrumb and Back Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-success fw-medium">
          <span className="text-success" style={{cursor: 'pointer'}} onClick={onBack}>My Tickets</span> &gt; <span className="text-secondary">Ticket Details</span>
        </div>
        <button onClick={onBack} className="btn btn-outline-success btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 bg-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to My Tickets
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
              <div className="form-control bg-light d-flex align-items-center">
                <span className={`badge rounded-pill px-3 py-1 ${ticket.requestedPriority === 'HIGH' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : ticket.requestedPriority === 'MEDIUM' ? 'bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'}`}>
                  {ticket.requestedPriority.charAt(0) + ticket.requestedPriority.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Current Status</label>
              <div className="form-control bg-light d-flex align-items-center">
                <span className={`badge rounded-pill px-3 py-1 ${ticket.currentStatus === 'Resolved' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-50' : ticket.currentStatus === 'InProgress' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-50' : 'bg-info bg-opacity-10 text-dark border border-info border-opacity-50'}`}>
                  {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus}
                </span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold mb-1">Ticket Owner</label>
              <input type="text" className="form-control bg-light text-muted" readOnly value={ticket.ownerName || '-'} />
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
                      {!a.isRemoved && (
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

              {activeAttachments < 5 && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
