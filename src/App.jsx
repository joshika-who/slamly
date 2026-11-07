import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import CreateBook from './pages/CreateBook';
import TemplateBuilderPreview from './pages/TemplateBuilderPreview';
import BlankBuilderPreview from './pages/BlankBuilderPreview';
import EditBook from './pages/EditBook';
import BookResponses from './pages/BookResponses';
import PrintBook from './pages/PrintBook';
import PublicBook from './pages/PublicBook';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

const ROUTE_TITLES = [
  { pattern: /^\/$/, title: 'Slamly — Digital Scrapbook & Slam Book for Friends' },
  { pattern: /^\/privacy$/, title: 'Privacy Summary — Slamly' },
  { pattern: /^\/terms$/, title: 'Terms of Use — Slamly' },
  { pattern: /^\/login$/, title: 'Log In — Slamly' },
  { pattern: /^\/signup$/, title: 'Create Account — Slamly' },
  { pattern: /^\/forgot-password$/, title: 'Reset Password — Slamly' },
  { pattern: /^\/dashboard$/, title: 'My Slam Books Dashboard — Slamly' },
  { pattern: /^\/account$/, title: 'Account Settings — Slamly' },
  { pattern: /^\/create$/, title: 'Create a Slam Book — Slamly' },
  { pattern: /^\/create\/template\/[^/]+$/, title: 'Customize Template Book — Slamly' },
  { pattern: /^\/create\/blank$/, title: 'Build a Blank Slam Book — Slamly' },
  { pattern: /^\/books\/[^/]+\/edit$/, title: 'Edit Slam Book — Slamly' },
  { pattern: /^\/books\/[^/]+\/responses$/, title: 'Friend Responses — Slamly' },
  { pattern: /^\/books\/[^/]+\/print$/, title: 'Print Memory Book — Slamly' },
  { pattern: /^\/s\/[^/]+$/, title: 'Sign My Slam Book — Slamly' },
];

export function getDocumentTitleForPath(pathname) {
  const match = ROUTE_TITLES.find((item) => item.pattern.test(pathname));
  return match ? match.title : 'Page Not Found — Slamly';
}

/**
 * Updates `document.title` on every route, scrolls to the top when navigating
 * between routes (unless a hash anchor like #how-it-works is present), and moves
 * keyboard focus to the page's main landmark (`#main-content`) or `<h1>` after route changes.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    document.title = getDocumentTitleForPath(pathname);

    if (!hash) {
      window.scrollTo(0, 0);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!hash) {
      const mainEl = document.getElementById('main-content');
      if (mainEl && typeof mainEl.focus === 'function') {
        mainEl.focus({ preventScroll: true });
      }
    }
  }, [pathname, hash]);

  return null;
}

/**
 * Development-only helper to verify the top-level ErrorBoundary when `?testErrorBoundary=1`
 * is present in the URL query string. Strictly disabled in production builds.
 */
function ErrorBoundaryTestTrigger() {
  const { search } = useLocation();
  if (!import.meta.env.DEV) {
    return null;
  }
  const params = new URLSearchParams(search);
  if (params.get('testErrorBoundary') === '1') {
    throw new Error('Intentional ErrorBoundary verification test.');
  }
  return null;
}

/**
 * Root Application Component
 * Wraps the app in AuthProvider and ErrorBoundary, and defines:
 * - Minimal public share route (/s/:bookId) with no login required and no dashboard navigation.
 * - MainLayout routes: public landing, privacy & terms, public-only auth routes, and protected owner routes.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <ErrorBoundaryTestTrigger />
          <Routes>
            {/* Public share link route: minimal layout (logo + form only, no login required) */}
            <Route path="/s/:bookId" element={<PublicBook />} />

            {/* Protected Print-Ready Memory Book route: rendered outside MainLayout (no navbar or footer) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/books/:bookId/print" element={<PrintBook />} />
            </Route>

            <Route element={<MainLayout />}>
              {/* Public pages */}
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Public-only auth routes (redirect logged-in users to /dashboard) */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* Protected routes (require login; redirect logged-out users to /login) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/account" element={<Account />} />
                <Route path="/create" element={<CreateBook />} />
                <Route path="/create/template/:id" element={<TemplateBuilderPreview />} />
                <Route path="/create/blank" element={<BlankBuilderPreview />} />
                <Route path="/books/:bookId/edit" element={<EditBook />} />
                <Route path="/books/:bookId/responses" element={<BookResponses />} />
              </Route>

              {/* Public 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
