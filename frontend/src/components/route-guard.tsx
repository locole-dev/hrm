import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";

type RouteGuardProps = {
  permissions?: string[];
  roles?: string[];
};

export function RouteGuard({ permissions, roles }: RouteGuardProps) {
  const location = useLocation();
  const { hasPermission, hasRole, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const permissionOk = permissions ? permissions.every((item) => hasPermission(item)) : true;
  const roleOk = roles ? roles.some((item) => hasRole(item)) : true;

  if (!permissionOk || !roleOk) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
