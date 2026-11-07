import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SlamlyLogoMark } from '../assets/ScrapbookDoodles';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Allow closing mobile menu with Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  function handleSectionJump(e, sectionId) {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus({ preventScroll: true });
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/');
    } catch {
      // Keep UI responsive even if network hiccups during signOut
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="navbar-wrapper">
      <div className="container navbar">
        <Link to="/" className="brand-logo" aria-label="Slamly Home">
          <SlamlyLogoMark size={38} />
          <span className="brand-logo-text">Slamly</span>
          <span className="brand-badge">Scrapbook</span>
        </Link>

        <nav aria-label="Primary navigation">
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="/#how-it-works"
                onClick={(e) => handleSectionJump(e, 'how-it-works')}
                className="nav-link"
              >
                How it works
              </a>
            </li>
            <li>
              <a
                href="/#features"
                onClick={(e) => handleSectionJump(e, 'features')}
                className="nav-link"
              >
                Features
              </a>
            </li>
            {user && (
              <li>
                <Link
                  to="/create"
                  className={`nav-link ${location.pathname.startsWith('/create') ? 'active' : ''}`}
                >
                  Create book
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Button to="/dashboard" variant="secondary">
                Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Log in
              </Button>
              <Button to="/create" variant="primary">
                Create your book
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-btn"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="#261F1C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="#261F1C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="mobile-drawer"
        >
          <Link to="/" className="nav-link">
            Home
          </Link>
          <a
            href="/#how-it-works"
            onClick={(e) => handleSectionJump(e, 'how-it-works')}
            className="nav-link"
          >
            How it works
          </a>
          <a
            href="/#features"
            onClick={(e) => handleSectionJump(e, 'features')}
            className="nav-link"
          >
            Features
          </a>
          {user && (
            <Link to="/create" className="nav-link">
              Create book
            </Link>
          )}

          <div className="mobile-drawer-actions">
            {user ? (
              <>
                <Button to="/dashboard" variant="secondary">
                  Dashboard
                </Button>
                <Button
                  variant="primary"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="secondary">
                  Log in
                </Button>
                <Button to="/create" variant="primary">
                  Create your book
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
