import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from './ProtectedRoute';

/**
 * PublicOnlyRoute wraps authentication screens (/login, /signup, /forgot-password).
 * - Shows a scrapbook loading card while Firebase checks the session.
 * - Redirects already logged-in users directly to /dashboard.
 */
export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

