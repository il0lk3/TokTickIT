import { useState } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./contexts/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

function AppContent() {
  const { activeRequester, setRequester } = useRequester();
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  if (!activeRequester) {
    return <RequesterSelector />;
  }

  async function handleCheck() {
    setState("loading");
    try {
      const result = await checkSystem();
      if (result.online) {
        setCategories(result.categories);
        setState("success");
      } else {
        setState("error");
      }
    } catch (err) {
      setState("error");
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-zen-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">TokTickIT</a>
          <div className="d-flex align-items-center">
            <span className="text-white me-3 small">
              Logged in as: <strong>{activeRequester.name}</strong>
            </span>
            <button 
              className="btn btn-sm btn-outline-light" 
              onClick={() => setRequester(null)}
            >
              Switch User
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5" style={{ maxWidth: 640 }}>
        <h1 className="h3 mb-4">
          TokTickIT <span className="text-zen-primary">IT Service Desk</span>
        </h1>

        <button className="btn btn-success mb-3" onClick={handleCheck} disabled={state === "loading"}>
          {state === "loading" ? "Loading…" : "Check System"}
        </button>

        {state === "success" && (
          <div className="border p-3 rounded">
            <p className="mb-0">System Status: <span className="text-success fw-bold">Online</span></p>
            {categories.length > 0 && (
              <div className="mt-3">
                <p className="mb-1">Supported Request Categories:</p>
                <ul className="mb-0">
                  {categories.map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="border border-danger p-3 rounded text-danger">
            <p className="mb-0">System Status: <span className="fw-bold">Offline</span></p>
            <p className="mb-0">Unable to connect to TokTickIT API</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}
