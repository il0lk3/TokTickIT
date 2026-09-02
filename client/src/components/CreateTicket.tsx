import { useState, useEffect } from "react";
import { getSystems, createTicket, Category, RelatedSystem } from "../api.js";
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

      setTicketNumber(response.ticketNumber);
      setFormState("success");
    } catch (err: any) {
      setFormState("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
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
          <button className="btn btn-outline-success px-4" onClick={resetForm}>
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mt-4 border-0">
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
        <h2 className="h4 mb-0 text-zen-primary">Submit a New Request</h2>
      </div>
      <div className="card-body p-4">
        {formState === "error" && (
          <div className="alert alert-danger mb-4">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
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
              <label className="form-label fw-medium">Attachments (Optional)</label>
              <div className="border border-2 border-dashed rounded p-4 text-center bg-light text-muted">
                <input type="file" className="d-none" id="attachmentInput" multiple />
                <label htmlFor="attachmentInput" className="btn btn-outline-secondary btn-sm mb-2" style={{ cursor: 'pointer' }}>
                  Choose Files
                </label>
                <p className="small mb-0">Drag and drop files here. (Upload functionality arriving in Issue 7)</p>
              </div>
            </div>

            <div className="col-12 mt-4 pt-3 border-top d-flex justify-content-end">
              <button 
                type="submit" 
                className="btn btn-success px-5" 
                disabled={formState === "submitting"}
              >
                {formState === "submitting" ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting...</>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
