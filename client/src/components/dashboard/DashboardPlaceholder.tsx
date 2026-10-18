import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// TODO(issue-9): Implement full backend-driven dashboard metrics fetching from /api/dashboard/requester and /api/dashboard/staff
// This placeholder serves as the initial role-aware workspace landing frame until Issue 8 & Issue 9 deliver live metric cards.
export function DashboardPlaceholder() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div data-testid="dashboard-shell-screen" className="animate-enter">
      {/* Header Banner */}
      <div className="glass-panel p-4 p-md-5 rounded-4 mb-4 border border-success border-opacity-25 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success bg-opacity-10 text-zen-primary small fw-semibold mb-2">
              <span className="p-1 rounded-circle bg-success"></span>
              {user.role === "REQUESTER" ? "Requester Workspace" : user.role === "IT_STAFF" ? "IT Staff Workspace" : "System Administration"}
            </div>
            <h1 className="h2 fw-bold text-zen-primary mb-1">
              Welcome back, {user.name}!
            </h1>
            <p className="text-muted mb-0">
              {user.role === "REQUESTER"
                ? "Manage your active service requests and check issue progress."
                : user.role === "IT_STAFF"
                ? "Review and resolve technical tickets assigned across support queues."
                : "Manage system configurations, user accounts, and support operations."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="row g-3 mb-4">
        {user.role === "REQUESTER" && (
          <>
            <div className="col-12 col-sm-6">
              <Link to="/tickets" className="card h-100 p-4 rounded-4 text-decoration-none glass-panel border border-success border-opacity-25 shadow-sm hover-elevate">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-3 bg-success bg-opacity-10 text-zen-primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <h5 className="fw-bold text-zen-primary mb-1">View My Tickets</h5>
                    <p className="text-muted small mb-0">Search, filter, and track status updates</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6">
              <Link to="/tickets/new" className="card h-100 p-4 rounded-4 text-decoration-none glass-panel border border-success border-opacity-25 shadow-sm hover-elevate">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-3 bg-success bg-opacity-10 text-zen-primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </div>
                  <div>
                    <h5 className="fw-bold text-zen-primary mb-1">Create New Ticket</h5>
                    <p className="text-muted small mb-0">Submit a new incident or support inquiry</p>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {(user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
          <div className="col-12 col-sm-6">
            <Link to="/queue" className="card h-100 p-4 rounded-4 text-decoration-none glass-panel border border-success border-opacity-25 shadow-sm hover-elevate">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-success bg-opacity-10 text-zen-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold text-zen-primary mb-1">Ticket Queue</h5>
                  <p className="text-muted small mb-0">Browse unassigned and active support tickets</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {user.role === "ADMINISTRATOR" && (
          <div className="col-12 col-sm-6">
            <Link to="/admin/users" className="card h-100 p-4 rounded-4 text-decoration-none glass-panel border border-success border-opacity-25 shadow-sm hover-elevate">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-3 bg-success bg-opacity-10 text-zen-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold text-zen-primary mb-1">User Management</h5>
                  <p className="text-muted small mb-0">Manage staff and requester accounts</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export { DashboardPlaceholder as DashboardShell };
export default DashboardPlaceholder;
