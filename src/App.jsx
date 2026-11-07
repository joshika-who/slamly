import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CreateBook from './pages/CreateBook';
import TemplateBuilderPreview from './pages/TemplateBuilderPreview';
import BlankBuilderPreview from './pages/BlankBuilderPreview';
import EditBook from './pages/EditBook';
import BookResponses from './pages/BookResponses';
import PrintBook from './pages/PrintBook';
import PublicBook from './pages/PublicBook';
import NotFound from './pages/NotFound';

/**
 * Scrolls to the top of the page when navigating between routes
 * (unless a hash anchor like #how-it-works is present).
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

/**
 * Root Application Component
 * Wraps the app in AuthProvider and defines:
 * - Minimal public share route (/s/:bookId) with no login required and no dashboard navigation.
 * - MainLayout routes: public landing page, public-only auth routes, and protected owner routes.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public share link route: minimal layout (logo + form only, no login required) */}
          <Route path="/s/:bookId" element={<PublicBook />} />

          {/* Protected Print-Ready Memory Book route: rendered outside MainLayout (no navbar or footer) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/books/:bookId/print" element={<PrintBook />} />
          </Route>

          <Route element={<MainLayout />}>
            {/* Public landing page */}
            <Route path="/" element={<Home />} />

            {/* Public-only auth routes (redirect logged-in users to /dashboard) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected routes (require login; redirect logged-out users to /login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
