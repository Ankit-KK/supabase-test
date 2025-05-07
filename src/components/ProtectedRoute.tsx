
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  requireAdminType?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdminType }) => {
  const { user, adminType, isLoading } = useAuth();

  if (isLoading) {
    // Show loading while checking authentication
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If admin type requirement specified, check it
  if (requireAdminType && adminType !== requireAdminType) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
