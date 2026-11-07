import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import {
  FlowerSticker,
  StarSticker,
  SlamlyLogoMark,
} from '../assets/ScrapbookDoodles';

/**
 * Login Page (/login)
 * Milestone 1 frontend-only login page with accessible validation.
 * Includes:
 * - Email field
 * - Password field
 * - Visual "Remember me" checkbox
 * - "Forgot password?" interactive preview notice
 * - "Login" button
 * - Link to /signup
 * After valid submit, navigates to /dashboard and shows "Preview mode: no real account created" banner.
 */
function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = formData.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address (for example: you@example.com).';
    }

    if (!formData.password) {
      nextErrors.password = 'Please enter your password.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters long.';
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const emailName = formData.email.trim().split('@')[0];
    const formattedName =
      emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._-]/g, ' ');

    // Milestone 1 requirement: navigate to /dashboard and show preview mode banner
    navigate('/dashboard', {
      state: {
        showPreviewBanner: true,
        previewSource: 'login',
        userName: formattedName || 'Aanya Sharma',
        userEmail: formData.email.trim(),
      },
    });
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'aanya@slamly.example',
      password: 'password123',
      rememberMe: true,
    });
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="container auth-grid">
        {/* Left column: Nostalgic scrapbook illustration & welcome quote */}
        <aside className="auth-showcase" aria-label="Welcome back to Slamly">
          <div className="paper-card paper-card--tinted auth-showcase__card">
            <span className="washi-tape washi-tape--sage" aria-hidden="true" />

            <div className="auth-showcase__badge">
              <FlowerSticker size={18} />
              <span>Welcome Back, Memory Keeper</span>
            </div>

            <h1 className="auth-showcase__title">
              Open your shelf and read what your friends wrote.
            </h1>

            <p className="auth-showcase__subtitle">
              From midnight hostel confessions to last-day-of-school signatures, your personal
              slam books are waiting right where you left them.
            </p>

            <blockquote className="scrapbook-quote-card">
              <p className="scrapbook-quote-card__text">
                &ldquo;Ten years from now, we won&rsquo;t remember every exam score — we&rsquo;ll
                remember the silly nicknames and inside jokes written in our slam books.&rdquo;
              </p>
              <footer className="scrapbook-quote-card__author">
                — Class of &rsquo;26 Memory Book
              </footer>
            </blockquote>

            <div className="auth-milestone-callout">
              <StarSticker size={18} />
              <p>
                <strong>Milestone 1 Frontend Preview:</strong> Firebase Authentication will be
                connected in Milestone 2. Logging in here demonstrates form validation and
                navigates to the preview dashboard.
              </p>
            </div>
          </div>
        </aside>

        {/* Right column: Login Form Card */}
        <section className="auth-card-wrapper" aria-labelledby="login-heading">
          <div className="paper-card auth-card">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />

            <div className="auth-card__header">
              <SlamlyLogoMark size={40} />
              <h2 id="login-heading" className="auth-card__title">
                Log in to Slamly
              </h2>
              <p className="auth-card__subtitle">
                Enter your details to open your personal slam book dashboard.
              </p>
            </div>

            <div className="auth-demo-helper">
              <span>Want to test quickly?</span>
              <button
                type="button"
                className="link-button"
                onClick={fillDemoCredentials}
              >
                Fill demo login
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email address <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  required
                />
                {errors.email && (
                  <p id="login-email-error" className="form-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Password <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  required
                />
                {errors.password && (
                  <p id="login-password-error" className="form-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me + Forgot Password Row */}
              <div className="auth-form__row">
                <label htmlFor="login-remember" className="checkbox-label">
                  <input
                    id="login-remember"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotNotice((prev) => !prev)}
                  aria-expanded={showForgotNotice}
                >
                  Forgot password?
                </button>
              </div>

              {showForgotNotice && (
                <div className="preview-inline-notice" role="status">
                  <p>
                    <strong>Milestone 2 Feature:</strong> Password reset emails powered by Firebase
                    Authentication will be enabled in Milestone 2. For now, enter any valid email
                    and a 6+ character password (or click <em>Fill demo login</em> above) to preview
                    the dashboard!
                  </p>
                </div>
              )}

              <div className="auth-form__actions">
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Login
                </Button>
              </div>
            </form>

            <div className="auth-card__footer">
              <p>
                New to Slamly?{' '}
                <Link to="/signup" className="auth-switch-link">
                  Create a free account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;

