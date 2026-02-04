
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { User } from '../../types';

interface ProtectedRouteProps {
  user: User | null;
  allowedRoles?: string[];
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  allowedRoles,
  redirectPath = '/login',
  children,
}) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Jika user login tapi role tidak sesuai (misal guru coba akses /admin), lempar ke dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
