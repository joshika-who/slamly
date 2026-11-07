import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getFriendlyAuthErrorMessage } from '../firebase/authErrors';
import {
  FlowerSticker,
  StarSticker,
  SlamlyLogoMark,
} from '../assets/ScrapbookDoodles';

/**
 * Login Page (/login)
 * Connects user sign-in to Firebase Authentication (signInWithEmailAndPassword):
 * - Unifies auth/invalid-credential, auth/wrong-password, and auth/user-not-found
 *   into one generic message ("Incorrect email or password.").
 * - Handles auth/too-many-requests, auth/user-disabled, and network errors.
 * - Redirects the user back to the protected route they originally tried to visit,
 *   defaulting to /dashboard.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Return to the page the user originally requested, or /dashboard by default
  const fromPath = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (serverError) {
      setServerError('');
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
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      navigate(fromPath, { replace: true });
    } catch (error) {
      setServerError(getFriendlyAuthErrorMessage(error, 'login'));
    } finally {
      setIsSubmitting(false);
    }
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

            <h2 className="auth-showcase__title">
              Open your shelf and read what your friends wrote.
            </h2>

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
                <strong>Keep your keepsakes safe:</strong> Sign in with your email and password to
                access your personal slam book dashboard.
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
              <h1 id="login-heading" className="auth-card__title">
                Log in to Slamly
              </h1>
              <p className="auth-card__subtitle">
                Enter your details to open your personal slam book dashboard.
              </p>
            </div>

            {serverError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {serverError}
              </div>
            )}

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

              {/* Remember Me + Forgot Password Link Row */}
              <div className="auth-form__row">
                <label htmlFor="login-remember" className="checkbox-label">
                  <input
                    id="login-remember"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="checkbox-input"
                  />
                  <span>Remember me</span>
                </label>

                <Link to="/forgot-password" className="auth-switch-link">
                  Forgot password?
                </Link>
              </div>

              <div className="auth-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
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
