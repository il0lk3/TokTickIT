import { useState, useEffect } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./contexts/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import CreateTicket from "./components/CreateTicket";

type UiState = "idle" | "loading" | "success" | "error";
type Tab = "create" | "list";

function AppContent() {
  const { activeRequester, setRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [categories, setCategories] = useState<Category[]>([]);
  const [appState, setAppState] = useState<UiState>("loading");

  useEffect(() => {
    if (activeRequester) {
      checkSystem()
        .then(result => {
          if (result.online) {
            setCategories(result.categories);
            setAppState("success");
          } else {
            setAppState("error");
          }
        })
        .catch(() => setAppState("error"));
    }
  }, [activeRequester]);

  if (!activeRequester) {
    return <RequesterSelector />;
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-zen-primary shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">TokTickIT</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'create' ? 'active fw-bold' : ''}`} 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('create'); }}
                >
                  Create Ticket
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'list' ? 'active fw-bold' : ''}`} 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab('list'); }}
                >
                  My Tickets
                </a>
              </li>
            </ul>
            
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
        </div>
      </nav>

      <div className="container py-4" style={{ maxWidth: 900 }}>
        {appState === "loading" && (
          <div className="text-center py-5">
            <div className="spinner-border text-zen-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {appState === "error" && (
          <div className="alert alert-danger mt-4">
            <strong>Offline:</strong> Unable to connect to TokTickIT API. Please ensure the backend is running.
          </div>
        )}

        {appState === "success" && activeTab === "create" && (
          <CreateTicket categories={categories} />
        )}

        {appState === "success" && activeTab === "list" && (
          <div className="card shadow-sm mt-4 border-0">
            <div className="card-body p-5 text-center text-muted">
              <h3 className="h5 mb-3">My Tickets</h3>
              <p>The ticket list will be implemented in Issue 6.</p>
            </div>
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
