import React, { useState, useEffect } from "react";
import { checkSystem, Category } from "./api";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import ChangePassword from "./components/auth/ChangePassword";
import CreateTicket from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";

type UiState = "idle" | "loading" | "success" | "error";
type Tab = "create" | "list" | "queue" | "users";

function AppShell() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [appState, setAppState] = useState<UiState>("loading");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      // Reset state on logout
      setActiveTab("list");
      setCategories([]);
      setAppState("loading");
      setSelectedTicketId(null);
      return;
    }

    if (!user.requiresPasswordChange) {
      // Default tabs based on role
      if (user.role === "REQUESTER") setActiveTab("list");
      else if (user.role === "IT_STAFF") setActiveTab("queue");
      else if (user.role === "ADMINISTRATOR") setActiveTab("users");

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
  }, [user]);

  if (!user) return <Login />;
  if (user.requiresPasswordChange) return <ChangePassword />;

  return (
    <div className="min-vh-100 d-flex flex-column animate-enter">
      <nav className="navbar navbar-expand-lg navbar-dark bg-zen-primary sticky-top py-2 shadow-sm">
        <div className="container-xl">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2 text-white me-5" href="#">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ fontSize: '1.25rem', letterSpacing: '-0.03em' }}>TokTickIT</span>
          </a>
          
          <button className="navbar-toggler border-0 text-white" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse mt-3 mt-lg-0" id="navbarNav">
            <ul className="navbar-nav me-auto gap-3">
              {user.role === "REQUESTER" && (
                <>
                  <li className="nav-item">
                    <button 
                      className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 rounded ${activeTab === 'list' ? 'text-white fw-bold bg-white bg-opacity-10' : 'text-white text-opacity-75'}`}
                      onClick={() => { setActiveTab('list'); setSelectedTicketId(null); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      My Tickets
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 rounded ${activeTab === 'create' ? 'text-white fw-bold bg-white bg-opacity-10' : 'text-white text-opacity-75'}`}
                      onClick={() => { setActiveTab('create'); setSelectedTicketId(null); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Create Ticket
                    </button>
                  </li>
                </>
              )}
              {user.role === "IT_STAFF" && (
                <li className="nav-item">
                  <button 
                    className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 rounded ${activeTab === 'queue' ? 'text-white fw-bold bg-white bg-opacity-10' : 'text-white text-opacity-75'}`}
                    onClick={() => { setActiveTab('queue'); setSelectedTicketId(null); }}
                  >
                    Ticket Queue
                  </button>
                </li>
              )}
              {user.role === "ADMINISTRATOR" && (
                <li className="nav-item">
                  <button 
                    className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 rounded ${activeTab === 'users' ? 'text-white fw-bold bg-white bg-opacity-10' : 'text-white text-opacity-75'}`}
                    onClick={() => { setActiveTab('users'); setSelectedTicketId(null); }}
                  >
                    User Management
                  </button>
                </li>
              )}
            </ul>
            
            <hr className="d-lg-none text-white opacity-25 my-3" />
            
            <div className="d-flex align-items-center mt-2 mt-lg-0 gap-3">
              <div className="d-flex align-items-center text-white px-3 py-1 rounded bg-white bg-opacity-10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="small fw-medium">{user.name} ({user.role})</span>
              </div>
              <button 
                className="btn btn-sm btn-outline-light rounded px-3 fw-medium d-flex align-items-center gap-2"
                onClick={logout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 py-5">
        <div className="container-xl">
          {appState === "loading" ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5 glass-panel">
              <div className="spinner-border text-zen-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted fw-medium">Loading system data...</h5>
            </div>
          ) : appState === "error" ? (
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
          ) : (
            <div className="animate-enter mt-4">
              {user.role === "REQUESTER" && (
                selectedTicketId ? (
                  <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
                ) : activeTab === "create" ? (
                  <CreateTicket categories={categories} />
                ) : (
                  <MyTickets categories={categories} onSelectTicket={setSelectedTicketId} />
                )
              )}
              {user.role === "IT_STAFF" && (
                <div className="text-center py-5 mt-5">
                  <h4 className="text-muted">Ticket Queue (Coming soon)</h4>
                </div>
              )}
              {user.role === "ADMINISTRATOR" && (
                <div className="text-center py-5 mt-5">
                  <h4 className="text-muted">User Management (Coming soon)</h4>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MainApp() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light">
        <div className="spinner-border text-zen-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
