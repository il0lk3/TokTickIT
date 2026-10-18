import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useLocation } from "react-router-dom";
import { checkSystem, Category } from "./api";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import ChangePassword from "./components/auth/ChangePassword";
import { UserManagement } from "./components/UserManagement";
import { NotFound } from "./components/common/NotFound";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleRoute } from "./components/common/RoleRoute";
import { DashboardShell } from "./components/dashboard/DashboardShell";
import { MyTicketsRoute } from "./routes/MyTicketsRoute";
import { CreateTicketRoute } from "./routes/CreateTicketRoute";
import { TicketQueueRoute } from "./routes/TicketQueueRoute";
import { TicketDetailRoute } from "./routes/TicketDetailRoute";

type UiState = "idle" | "loading" | "success" | "error";

interface NavItemLinkProps {
  to: string;
  end?: boolean;
  isContextuallyActive?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavItemLink({
  to,
  end = false,
  isContextuallyActive = false,
  children,
  onClick
}: NavItemLinkProps) {
  const location = useLocation();
  const isMatch = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + "/");
  const isActive = isMatch || isContextuallyActive;

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`nav-link d-flex align-items-center gap-2 px-3 rounded ${
        isActive ? "text-white fw-bold bg-white bg-opacity-10 active" : "text-white text-opacity-75"
      }`}
    >
      {children}
    </Link>
  );
}

function DocumentTitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "TokTickIT";

    if (path === "/login") {
      title = "Login | TokTickIT";
    } else if (path === "/change-password") {
      title = "Change Password | TokTickIT";
    } else if (path === "/dashboard" || path === "/") {
      title = "Dashboard | TokTickIT";
    } else if (path === "/tickets") {
      title = "My Tickets | TokTickIT";
    } else if (path === "/tickets/new") {
      title = "Create Ticket | TokTickIT";
    } else if (path.startsWith("/tickets/")) {
      title = "Ticket Detail | TokTickIT";
    } else if (path === "/queue") {
      title = "Ticket Queue | TokTickIT";
    } else if (path === "/admin/users") {
      title = "User Management | TokTickIT";
    } else {
      title = "Page Not Found | TokTickIT";
    }

    document.title = title;
  }, [location.pathname]);

  return null;
}

interface AppShellProps {
  categories: Category[];
  appState: UiState;
}

export function AppShell({ categories: _categories, appState }: AppShellProps) {
  const { user, logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const isTicketDetail =
    /^\/tickets\/\d+$/.test(location.pathname) ||
    (location.pathname.startsWith("/tickets/") && location.pathname !== "/tickets/new");

  return (
    <div className="min-vh-100 d-flex flex-column animate-enter">
      <a
        href="#main-content"
        className="visually-hidden-focusable btn btn-zen-primary position-absolute top-0 start-0 m-2 z-3"
      >
        Skip to main content
      </a>

      <nav className="navbar navbar-expand-lg navbar-dark bg-zen-primary sticky-top py-2 shadow-sm">
        <div className="container-xl">
          <Link
            className="navbar-brand fw-bold d-flex align-items-center gap-2 text-white me-5"
            to="/dashboard"
            onClick={() => setIsNavOpen(false)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ fontSize: '1.25rem', letterSpacing: '-0.03em' }}>TokTickIT</span>
          </Link>

          <button
            className="navbar-toggler border-0 text-white"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen ? "true" : "false"}
            aria-controls="navbarNav"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''} mt-3 mt-lg-0`} id="navbarNav">
            <ul className="navbar-nav me-auto gap-3">
              <li className="nav-item">
                <NavItemLink to="/dashboard" end onClick={() => setIsNavOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Dashboard
                </NavItemLink>
              </li>

              {user.role === "REQUESTER" && (
                <>
                  <li className="nav-item">
                    <NavItemLink
                      to="/tickets"
                      end
                      isContextuallyActive={isTicketDetail && user.role === "REQUESTER"}
                      onClick={() => setIsNavOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      My Tickets
                    </NavItemLink>
                  </li>
                  <li className="nav-item">
                    <NavItemLink to="/tickets/new" end onClick={() => setIsNavOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Create Ticket
                    </NavItemLink>
                  </li>
                </>
              )}

              {(user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
                <li className="nav-item">
                  <NavItemLink
                    to="/queue"
                    end
                    isContextuallyActive={isTicketDetail && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR")}
                    onClick={() => setIsNavOpen(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    Ticket Queue
                  </NavItemLink>
                </li>
              )}

              {user.role === "ADMINISTRATOR" && (
                <li className="nav-item">
                  <NavItemLink to="/admin/users" end onClick={() => setIsNavOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    User Management
                  </NavItemLink>
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

      <main id="main-content" tabIndex={-1} className="flex-grow-1 py-5">
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
            <div className="animate-enter">
              <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginRouteWrapper() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light">
        <div className="spinner-border text-zen-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.requiresPasswordChange) {
      return <Navigate to="/change-password" replace />;
    }
    const fromPath = (location.state as any)?.from?.pathname || "/dashboard";
    const fromSearch = (location.state as any)?.from?.search || "";
    return <Navigate to={`${fromPath}${fromSearch}`} replace />;
  }

  return <Login />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [appState, setAppState] = useState<UiState>("loading");

  useEffect(() => {
    if (!user || user.requiresPasswordChange) {
      setCategories([]);
      setAppState("loading");
      return;
    }

    let isMounted = true;
    checkSystem()
      .then(result => {
        if (!isMounted) return;
        if (result.online) {
          setCategories(result.categories);
          setAppState("success");
        } else {
          setAppState("error");
        }
      })
      .catch(() => {
        if (isMounted) setAppState("error");
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <>
      <DocumentTitleUpdater />
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginRouteWrapper />} />

        {/* Temporary Password Quarantine Route */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Protected Application Layout and Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell categories={categories} appState={appState} />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={["REQUESTER", "IT_STAFF", "ADMINISTRATOR"]}>
                <DashboardShell />
              </RoleRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <RoleRoute allowedRoles={["REQUESTER"]}>
                <MyTicketsRoute categories={categories} />
              </RoleRoute>
            }
          />

          <Route
            path="/tickets/new"
            element={
              <RoleRoute allowedRoles={["REQUESTER"]}>
                <CreateTicketRoute categories={categories} />
              </RoleRoute>
            }
          />

          <Route
            path="/tickets/:ticketId"
            element={
              <RoleRoute allowedRoles={["REQUESTER", "IT_STAFF", "ADMINISTRATOR"]}>
                <TicketDetailRoute />
              </RoleRoute>
            }
          />

          <Route
            path="/queue"
            element={
              <RoleRoute allowedRoles={["IT_STAFF", "ADMINISTRATOR"]}>
                <TicketQueueRoute categories={categories} />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={["ADMINISTRATOR"]}>
                <UserManagement />
              </RoleRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
