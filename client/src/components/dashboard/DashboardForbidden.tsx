import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardForbiddenProps {
  message?: string;
}

export function DashboardForbidden({
  message = "You do not have permission to access this dashboard view.",
}: DashboardForbiddenProps) {
  const { user } = useAuth();
  const returnPath = user?.role === "REQUESTER" ? "/tickets" : "/queue";
  const returnLabel = user?.role === "REQUESTER" ? "Go to My Tickets" : "Go to Ticket Queue";

  return (
    <div className="container-xl py-5 animate-enter">
      <div className="glass-panel p-5 text-center mx-auto rounded-4 shadow-sm" style={{ maxWidth: "560px" }}>
        <div className="mb-4 text-warning" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h1 className="h4 fw-bold mb-2 text-dark">403 - Access Forbidden</h1>
        <p className="text-muted mb-4">{message}</p>

        <div className="d-flex justify-content-center gap-3">
          <Link to={returnPath} className="btn btn-zen-primary px-4 py-2 rounded-pill fw-medium">
            {returnLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
