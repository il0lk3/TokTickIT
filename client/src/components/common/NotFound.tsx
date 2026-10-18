import React from "react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div data-testid="not-found-screen" className="d-flex flex-column align-items-center justify-content-center py-5 my-4 text-center">
      <div className="glass-panel p-5 rounded-4 shadow-sm border border-success border-opacity-25" style={{ maxWidth: "520px" }}>
        <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mb-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="fw-bold text-zen-primary mb-2">404 - Page Not Found</h2>
        <p className="text-muted mb-4">
          The page or ticket you are looking for does not exist or may have been moved.
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

export default NotFound;
