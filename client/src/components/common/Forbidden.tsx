import React from "react";
import { Link } from "react-router-dom";

export function Forbidden() {
  return (
    <div data-testid="forbidden-screen" className="d-flex flex-column align-items-center justify-content-center py-5 my-4 text-center">
      <div className="glass-panel p-5 rounded-4 shadow-sm border border-danger border-opacity-25" style={{ maxWidth: "520px" }}>
        <div className="d-inline-flex p-3 rounded-circle bg-danger bg-opacity-10 text-danger mb-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 className="fw-bold text-danger mb-2">403 - Access Forbidden</h2>
        <p className="text-muted mb-4">
          You do not have the required permissions to view this screen. If you believe this is an error, please contact your system administrator.
        </p>
        <Link to="/dashboard" className="btn btn-zen-primary px-4 py-2 rounded-pill fw-medium d-inline-flex align-items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Forbidden;
