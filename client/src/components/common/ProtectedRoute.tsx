import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light">
        <div className="spinner-border text-zen-primary" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.requiresPasswordChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!user.requiresPasswordChange && location.pathname === "/change-password") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
