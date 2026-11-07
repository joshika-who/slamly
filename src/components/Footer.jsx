import React from 'react';
import { Link } from 'react-router-dom';
import { SlamlyLogoMark } from '../assets/ScrapbookDoodles';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand-logo" aria-label="Slamly Home">
              <SlamlyLogoMark size={34} />
              <span className="brand-logo-text">Slamly</span>
            </Link>
            <p style={{ marginTop: '10px', maxWidth: '360px' }}>
              Every friend. Every memory. One little book. A personal digital
              scrapbook platform to collect handwritten-style memories from the
              people who matter most.
            </p>
          </div>

          <div>
            <h2 className="handwritten" style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
              Explore
            </h2>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="footer-link">
                  Create a Slam Book
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="footer-link">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="handwritten" style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
              Account &amp; Legal
            </h2>
            <ul className="footer-links">
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard" className="footer-link">
                      Personal Shelf ({user.displayName || user.email})
                    </Link>
                  </li>
                  <li>
                    <Link to="/account" className="footer-link">
                      Account Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="footer-link">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/signup" className="footer-link">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/forgot-password" className="footer-link">
                      Reset Password
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/privacy" className="footer-link">
                  Privacy Summary
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {currentYear} Slamly. Crafted with warm paper textures &amp; nostalgia.
          </span>
          <span>
            Secured with Firebase Auth, Cloud Firestore &amp; App Check
          </span>
        </div>
      </div>
    </footer>
  );
}
