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
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="glass-panel animate-enter" style={{ width: "100%", maxWidth: "480px" }}>
        <div className="p-4 p-md-5 text-center">
          <div className="mb-4 d-inline-flex align-items-center justify-content-center bg-zen-pale rounded-circle" style={{ width: '64px', height: '64px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--zen-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2 className="h3 mb-2 fw-bold text-zen-primary">Welcome to TokTickIT</h2>
          <p className="text-muted mb-4">Please select a Development Requester to continue testing the application.</p>
          {state === "loading" && (
            <div className="spinner-border text-zen-primary my-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}

          {state === "error" && (
            <div className="alert alert-danger mb-4">
              <p className="mb-2">Failed to load requesters. Is the API running?</p>
              <button className="btn btn-sm btn-outline-danger" onClick={fetchRequesters}>Retry</button>
            </div>
          )}

          {state === "success" && (
            <div className="mb-5 text-start">
              <label htmlFor="requesterSelect" className="form-label">Requester Account</label>
              <select 
                id="requesterSelect"
                className="form-select form-select-lg shadow-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {requesters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            className="btn btn-primary btn-lg w-100 rounded-pill d-flex justify-content-center align-items-center gap-2" 
            onClick={handleContinue}
            disabled={state !== "success" || !selectedId}
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
