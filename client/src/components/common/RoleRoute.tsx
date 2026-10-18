import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Forbidden } from "./Forbidden";

interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // Render in-place Forbidden component without changing URL or redirecting
    return <Forbidden />;
  }

  return <>{children}</>;
}

export default RoleRoute;
