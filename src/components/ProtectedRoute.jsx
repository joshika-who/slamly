import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SlamlyLogoMark, StarSticker } from '../assets/ScrapbookDoodles';

/**
 * Scrapbook-styled loading screen displayed while Firebase checks the active session.
 * Prevents protected pages from flashing or redirecting prematurely on page refresh.
 */
export function AuthLoadingScreen({ message = 'Checking your slam book key...' }) {
  return (
    <div className="auth-loading-page" role="status" aria-live="polite">
      <div className="container">
        <div className="paper-card auth-loading-card">
          <span className="washi-tape washi-tape--lavender" aria-hidden="true" />
          <div className="auth-loading-card__icon">
            <SlamlyLogoMark size={44} />
          </div>
          <div className="auth-loading-card__spinner" aria-hidden="true">
            <StarSticker size={24} />
          </div>
          <h2 className="auth-loading-card__title">{message}</h2>
          <p className="auth-loading-card__subtitle">
            Hold on a moment while we open your personal memory shelf.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute wraps routes that require an authenticated user (/dashboard, /create, etc.).
 * - Shows a scrapbook loading card while Firebase initializes the session.
 * - Redirects logged-out users to /login and saves the attempted location in router state.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

