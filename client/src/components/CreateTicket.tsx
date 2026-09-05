import { useState, useEffect } from "react";
import { getSystems, createTicket, uploadAttachment, Category, RelatedSystem } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";

type FormState = "idle" | "submitting" | "success" | "error";

interface CreateTicketProps {
  categories: Category[];
}

export default function CreateTicket({ categories }: CreateTicketProps) {
  const { activeRequester } = useRequester();
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [systemsError, setSystemsError] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  // Form Fields
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("MEDIUM");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const fetchSystems = async () => {
    setSystemsError(false);
    try {
      const data = await getSystems();
      setSystems(data);
    } catch (err) {
      console.error("Failed to fetch systems", err);
      setSystemsError(true);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!categoryId) errors.categoryId = "Category is required.";
    if (!relatedSystemId) errors.relatedSystemId = "Related System is required.";
    if (!summary.trim()) {
      errors.summary = "Summary is required.";
    } else if (summary.trim().length > 150) {
      errors.summary = "Summary cannot exceed 150 characters.";
    }
    if (!description.trim()) {
      errors.description = "Description is required.";
    } else if (description.trim().length > 1000) {
      errors.description = "Description cannot exceed 1000 characters.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequester) return;

    if (!validate()) return;

    setFormState("submitting");
    setErrorMessage("");
    setValidationErrors({});

    try {
      const response = await createTicket({
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        requestedPriority,
        summary,
        description
      }, activeRequester.id);

      // Upload attachments if any
      if (attachments.length > 0) {
        setFormState("submitting");
        let failedUploads = 0;
        for (const file of attachments) {
          try {
            await uploadAttachment(response.id, file, activeRequester.id);
          } catch (uploadErr) {
            console.error("Failed to upload:", file.name);
            failedUploads++;
          }
        }
        if (failedUploads > 0) {
          setUploadError(`Ticket created, but ${failedUploads} attachment(s) failed to upload.`);
        }
      }

      setTicketNumber(response.ticketNumber);
      setFormState("success");
    } catch (err: any) {
      setFormState("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const validFiles: File[] = [];
    let errorMsg = "";

    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        errorMsg = "Only JPG, PNG, WEBP, and PDF files are allowed.";
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        errorMsg = "Each file must be under 5MB.";
        break;
      }
      validFiles.push(file);
    }

    if (errorMsg) {
      alert(errorMsg);
      // We still process valid files below if we want, but breaking means we just stop or take valid ones.
      // Let's just use the valid ones.
    }

    setAttachments(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > 5) {
        alert("Maximum of 5 attachments allowed.");
        return combined.slice(0, 5);
      }
      return combined;
    });

    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("MEDIUM");
    setSummary("");
    setDescription("");
    setFormState("idle");
    setTicketNumber("");
    setValidationErrors({});
    setErrorMessage("");
    setAttachments([]);
    setUploadError("");
  };

  if (formState === "success") {
    return (
      <div className="card shadow-sm mt-4 border-0">
        <div className="card-body p-5 text-center">
          <div className="mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--zen-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="h4 text-success mb-3">Ticket Created Successfully!</h2>
          <p className="lead mb-4">
            Your ticket number is: <br/>
            <strong className="fs-3 text-dark">{ticketNumber}</strong>
          </p>
          {uploadError && (
            <div className="alert alert-warning py-2 small mb-4">{uploadError}</div>
          )}
          <button className="btn btn-outline-secondary px-4" onClick={resetForm}>
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <div className="glass-panel p-4 p-md-5 mb-4">
        <div className="mb-4 pb-3 border-bottom border-light border-opacity-50">
          <h2 className="h3 mb-2 text-zen-primary fw-bold d-flex align-items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            Submit a New Request
          </h2>
          <p className="text-muted mb-0">Please fill out the form below to report an IT issue or request a service.</p>
        </div>

        {formState === "error" && (
          <div className="alert alert-danger glass-panel border-danger border-opacity-50 mb-4 p-4 d-flex align-items-start gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger flex-shrink-0 mt-1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <h5 className="alert-heading fw-bold mb-1">Submission Failed</h5>
              <p className="mb-0">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-4">
            <div className="col-md-6">
              <label htmlFor="categoryId" className="form-label fw-medium">Category <span className="text-danger">*</span></label>
              <select 
                id="categoryId" 
                className={`form-select ${validationErrors.categoryId ? 'is-invalid' : ''}`}
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select a category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {validationErrors.categoryId && <div className="invalid-feedback">{validationErrors.categoryId}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="relatedSystemId" className="form-label fw-medium">Related System <span className="text-danger">*</span></label>
              {systemsError ? (
                <div className="d-flex align-items-center mt-1">
                  <span className="text-danger small me-2">Failed to load systems.</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={fetchSystems}>Retry</button>
                </div>
              ) : (
                <>
                  <select 
                    id="relatedSystemId" 
                    className={`form-select ${validationErrors.relatedSystemId ? 'is-invalid' : ''}`}
                    value={relatedSystemId} 
                    onChange={(e) => setRelatedSystemId(e.target.value)}
                  >
                    <option value="">Select a system...</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {validationErrors.relatedSystemId && <div className="invalid-feedback">{validationErrors.relatedSystemId}</div>}
                </>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="requestedPriority" className="form-label fw-medium">Priority <span className="text-danger">*</span></label>
              <select 
                id="requestedPriority" 
                className="form-select"
                value={requestedPriority} 
                onChange={(e) => setRequestedPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="col-12">
              <label htmlFor="summary" className="form-label fw-medium">Summary <span className="text-danger">*</span></label>
              <input 
                type="text" 
                id="summary" 
                className={`form-control ${validationErrors.summary ? 'is-invalid' : ''}`}
                placeholder="Brief summary of the issue (max 150 chars)"
                maxLength={150}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              {validationErrors.summary && <div className="invalid-feedback">{validationErrors.summary}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="description" className="form-label fw-medium">Description <span className="text-danger">*</span></label>
              <textarea 
                id="description" 
                className={`form-control ${validationErrors.description ? 'is-invalid' : ''}`}
                placeholder="Detailed description of the issue... (max 1000 chars)"
                style={{ height: "120px", resize: "vertical" }}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              {validationErrors.description && <div className="invalid-feedback">{validationErrors.description}</div>}
            </div>
            
            <div className="col-12 mt-4">
              <label className="form-label fw-medium d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zen-secondary">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                Attachments (Optional)
              </label>
              <div className={`border border-2 border-dashed rounded-3 p-4 bg-white bg-opacity-50 transition-all ${attachments.length > 0 ? 'text-start' : 'text-center hover-shadow'}`} style={{ borderColor: '#DFE6E1' }}>
                <input 
                  type="file" 
                  className="d-none" 
                  id="attachmentInput" 
                  multiple 
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  disabled={attachments.length >= 5}
                />
                
                {attachments.length === 0 ? (
                  <div className="py-3">
                    <label htmlFor="attachmentInput" className="btn btn-outline-secondary px-4 py-2 mb-3 rounded-pill fw-medium" style={{ cursor: 'pointer' }}>
                      Browse Files
                    </label>
                    <p className="small text-muted mb-0">Drag and drop files here or click to browse.</p>
                    <p className="small text-muted mb-0 mt-1" style={{ fontSize: '0.75rem' }}>Max 5 files. JPG, PNG, WEBP, PDF up to 5MB each.</p>
                  </div>
                ) : (
                  <div>
                    <ul className="list-group list-group-flush mb-3">
                      {attachments.map((file, index) => (
                        <li key={index} className="list-group-item bg-transparent px-2 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center text-truncate me-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted me-2 flex-shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <span className="small text-dark fw-medium text-truncate">{file.name}</span>
                            <span className="small text-muted ms-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-link text-danger p-0 m-0 border-0" 
                            onClick={() => removeAttachment(index)}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">{attachments.length}/5 files attached</span>
                      {attachments.length < 5 && (
                        <label htmlFor="attachmentInput" className="btn btn-sm btn-outline-secondary rounded-pill px-3 m-0" style={{ cursor: 'pointer' }}>
                          + Add More
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 mt-5 pt-4 border-top border-light border-opacity-50 d-flex justify-content-end">
              <button 
                type="submit" 
                className="btn btn-primary px-5 py-2 fs-6 rounded-pill d-flex align-items-center gap-2" 
                disabled={formState === "submitting"}
              >
                {formState === "submitting" ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                ) : (
                  <>
                    Submit Request
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
