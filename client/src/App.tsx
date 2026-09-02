import { useState, useEffect } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./contexts/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import CreateTicket from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";

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
    <div className="min-vh-100 d-flex flex-column animate-enter">
      <nav className="navbar navbar-expand-lg navbar-dark glass-navbar sticky-top py-3">
        <div className="container">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            TokTickIT
          </a>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse mt-3 mt-lg-0" id="navbarNav">
            <ul className="navbar-nav me-auto gap-1">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none px-3 rounded-pill transition-all ${activeTab === 'create' ? 'bg-white text-zen-primary fw-bold' : 'text-white-50'}`}
                  onClick={() => setActiveTab('create')}
                >
                  Create Ticket
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none px-3 rounded-pill transition-all ${activeTab === 'list' ? 'bg-white text-zen-primary fw-bold' : 'text-white-50'}`}
                  onClick={() => setActiveTab('list')}
                >
                  My Tickets
                </button>
              </li>
            </ul>
            
            <div className="d-flex align-items-center mt-3 mt-lg-0 pt-3 pt-lg-0 border-top border-lg-0 border-light border-opacity-25">
              <div className="d-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded-pill me-3">
                <div className="rounded-circle bg-white text-zen-primary d-flex align-items-center justify-content-center fw-bold me-2" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                  {activeRequester.name.charAt(0)}
                </div>
                <span className="text-white small fw-medium">{activeRequester.name}</span>
              </div>
              <button 
                className="btn btn-sm btn-light rounded-pill px-3 fw-medium"
                onClick={() => setRequester(null)}
              >
                Switch User
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 py-5">
        <div className="container" style={{ maxWidth: '900px' }}>
          {appState === "loading" && (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5 glass-panel">
              <div className="spinner-border text-zen-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted fw-medium">Loading system data...</h5>
            </div>
          )}

          {appState === "error" && (
            <div className="alert alert-danger glass-panel border-danger border-opacity-50 mt-4 p-4 d-flex align-items-start gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger flex-shrink-0 mt-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <h5 className="alert-heading fw-bold mb-1">Connection Error</h5>
                <p className="mb-0">Unable to connect to TokTickIT API. Please ensure the backend is running.</p>
              </div>
            </div>
          )}

          {appState === "success" && (
            <div className="animate-enter mt-4">
              {activeTab === "create" ? (
                <CreateTicket categories={categories} />
              ) : (
                <MyTickets categories={categories} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}
