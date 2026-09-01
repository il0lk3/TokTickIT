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
      <div className="card shadow-sm" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="card-body p-4 text-center">
          <h2 className="h4 mb-2">Welcome to TokTickIT</h2>
          <p className="text-muted small mb-4">Please select a Development Requester to continue testing the application.</p>
          
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
            <div className="mb-4 text-start">
              <label htmlFor="requesterSelect" className="form-label fw-semibold">Requester</label>
              <select 
                id="requesterSelect"
                className="form-select form-select-lg"
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
            className="btn btn-success btn-lg w-100 fw-bold" 
            onClick={handleContinue}
            disabled={state !== "success" || !selectedId}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
