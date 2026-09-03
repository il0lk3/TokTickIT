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
      <div className="d-flex align-items-center mb-4 gap-3">
        <button onClick={onBack} className="btn btn-light rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            Ticket Details
            <span className="badge bg-secondary bg-opacity-10 text-secondary fs-6" style={{ fontFamily: 'monospace' }}>{ticket.ticketNumber}</span>
          </h2>
          <p className="text-muted mb-0 small">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="glass-panel p-4 h-100">
            <h5 className="fw-bold mb-4 border-bottom pb-2">Information</h5>
            
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase mb-1">Summary</label>
              <div className="fs-5 fw-medium">{ticket.summary}</div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase mb-1">Description</label>
              <div className="p-3 bg-light rounded bg-opacity-50" style={{ whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1">Category</label>
                <div className="fw-medium">{ticket.category.name}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1">Related System</label>
                <div className="fw-medium">{ticket.relatedSystem.name}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-panel p-4 mb-4">
            <h5 className="fw-bold mb-4 border-bottom pb-2">Status</h5>
            
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-muted small fw-bold text-uppercase mb-1">Current Status</label>
                <div>
                  <span className={`badge rounded-pill px-3 py-2 ${ticket.currentStatus === 'Resolved' ? 'bg-success bg-opacity-10 text-success' : ticket.currentStatus === 'InProgress' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'}`}>
                    {ticket.currentStatus === 'InProgress' ? 'In Progress' : ticket.currentStatus}
                  </span>
                </div>
              </div>
              <div>
                <label className="form-label text-muted small fw-bold text-uppercase mb-1">Priority</label>
                <div>
                  <span className={`fw-bold ${ticket.requestedPriority === 'HIGH' ? 'text-danger' : ticket.requestedPriority === 'MEDIUM' ? 'text-warning' : 'text-success'}`}>
                    {ticket.requestedPriority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
              Attachments
              <span className="badge bg-secondary">{activeAttachments}/5</span>
            </h5>
            
            {ticket.attachments.length === 0 ? (
              <p className="text-muted small text-center my-4">No attachments uploaded yet.</p>
            ) : (
              <ul className="list-group list-group-flush mb-3">
                {ticket.attachments.map(a => (
                  <li key={a.id} className="list-group-item px-0 bg-transparent">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2 text-truncate">
                        {a.isRemoved ? (
                          <div className="text-decoration-line-through text-muted small text-truncate" title={a.originalName}>{a.originalName}</div>
                        ) : (
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handleDownload(a.id, a.originalName); }}
                            className="text-decoration-none fw-medium text-zen-primary small text-truncate d-block"
                            title={a.originalName}
                          >
                            {a.originalName}
                          </a>
                        )}
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {(a.size / 1024).toFixed(1)} KB
                          {a.isRemoved && a.removedReason && ` • Removed: ${a.removedReason}`}
                        </div>
                      </div>
                      {!a.isRemoved && (
                        <button 
                          className="btn btn-sm btn-link text-danger p-0" 
                          onClick={() => handleRemove(a.id)}
                          title="Remove attachment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {activeAttachments < 5 && (
              <div className="mt-3">
                <input 
                  type="file" 
                  className="d-none" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                />
                <button 
                  className="btn btn-outline-primary w-100 btn-sm rounded-pill d-flex align-items-center justify-content-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  )}
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
                <div className="text-center mt-2 text-muted" style={{ fontSize: '0.65rem' }}>JPG, PNG, WEBP, PDF up to 5MB</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
