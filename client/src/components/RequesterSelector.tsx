import { useState, useEffect } from "react";
import { getRequesters, Requester } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";

type FetchState = "idle" | "loading" | "success" | "error";

export function RequesterSelector() {
  const { setRequester } = useRequester();
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [state, setState] = useState<FetchState>("idle");
  const [selectedId, setSelectedId] = useState<string>("");

  const fetchRequesters = async () => {
    setState("loading");
    try {
      const data = await getRequesters();
      setRequesters(data);
      if (data.length > 0) setSelectedId(String(data[0].id));
      setState("success");
    } catch (err) {
      setState("error");
    }
  };

  useEffect(() => {
    fetchRequesters();
  }, []);

  const handleContinue = () => {
    const selected = requesters.find(r => String(r.id) === selectedId);
    if (selected) {
      setRequester(selected);
    }
  };

  return (
    <div className="animate-enter">
      {/* Breadcrumb matching the image */}
      <div className="mb-4 d-flex align-items-center text-zen-primary fw-medium" style={{ fontSize: '0.9rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span className="text-muted mx-2">›</span>
        <span>Development Requester Selection</span>
      </div>

      <div className="d-flex justify-content-center">
        <div className="glass-panel w-100" style={{ maxWidth: '600px' }}>
          <div className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-zen-pale rounded-circle" style={{ width: '64px', height: '64px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--zen-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <h2 className="h4 mb-2 fw-bold text-dark">Select Development Requester</h2>
              <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
                Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen.
              </p>
            </div>

            {state === "loading" && (
              <div className="text-center my-4">
                <div className="spinner-border text-zen-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="alert alert-danger mb-4">
                <p className="mb-2">Failed to load requesters. Is the API running?</p>
                <button className="btn btn-sm btn-outline-danger" onClick={fetchRequesters}>Retry</button>
              </div>
            )}

            {state === "success" && (
              <div className="mb-4">
                <label htmlFor="requesterSelect" className="form-label fw-bold">Development Requester <span className="text-danger">*</span></label>
                <select 
                  id="requesterSelect"
                  className="form-select mb-3"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {requesters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div className="alert bg-zen-pale text-zen-secondary d-flex align-items-center p-3 mb-3 border-0 rounded" style={{ fontSize: '0.9rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-3 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <div>Only active development requesters are shown.</div>
                </div>

                <div className="alert bg-light text-secondary d-flex align-items-start p-3 mb-0 border rounded" style={{ fontSize: '0.9rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-3 flex-shrink-0 mt-1">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <div>
                    <div className="fw-bold text-dark mb-1">Authentication coming in Lab 3</div>
                    <div className="small">In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.</div>
                  </div>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-4">
              <button className="btn btn-outline-secondary px-4 fw-medium">Cancel</button>
              <button 
                className="btn btn-primary px-4 fw-medium d-flex align-items-center gap-2" 
                onClick={handleContinue}
                disabled={state !== "success" || !selectedId}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
