import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateBook from './pages/CreateBook';
import TemplateBuilderPreview from './pages/TemplateBuilderPreview';
import BlankBuilderPreview from './pages/BlankBuilderPreview';
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
 * Defines all Milestone 1 routes inside the shared MainLayout.
 */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateBook />} />
          <Route path="/create/template/:id" element={<TemplateBuilderPreview />} />
          <Route path="/create/blank" element={<BlankBuilderPreview />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

