import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { RequesterDashboard } from "./RequesterDashboard";
import { StaffDashboard } from "./StaffDashboard";

export function DashboardRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-zen-primary mb-2" role="status"></div>
        <p className="text-muted mb-0 small">Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "REQUESTER") {
    return <RequesterDashboard />;
  }

  if (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") {
    return <StaffDashboard />;
  }

  return <Navigate to="/login" replace />;
}

export default DashboardRoute;
