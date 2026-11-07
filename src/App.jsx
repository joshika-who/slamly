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
 * Wraps the app in AuthProvider and defines public, public-only (auth),
 * and protected routes inside the shared MainLayout.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
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
