import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getFriendlyAuthErrorMessage } from '../firebase/authErrors';
import {
  HeartSticker,
  StarSticker,
  SlamlyLogoMark,
} from '../assets/ScrapbookDoodles';

/**
 * Signup Page (/signup)
 * Connects user registration to Firebase Authentication:
 * - Validates full name, email format, 6+ character password, and matching confirmation.
 * - Creates the account with createUserWithEmailAndPassword.
 * - Saves the full name to the Firebase user's displayName via updateProfile.
 * - Redirects to /dashboard upon success.
 */
function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      nextErrors.name = 'Please enter your full name so friends know whose book it is.';
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters long.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address (for example: you@example.com).';
    }

    if (!formData.password) {
      nextErrors.password = 'Please create a password.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters long.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match. Please check and try again.';
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
      await signup(formData.name, formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(getFriendlyAuthErrorMessage(error, 'signup'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-grid">
        {/* Left column: Friendly scrapbook welcome card */}
        <aside className="auth-showcase" aria-label="About creating a Slamly account">
          <div className="paper-card paper-card--tinted auth-showcase__card">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />

            <div className="auth-showcase__badge">
              <StarSticker size={18} />
              <span>Start Your Memory Shelf</span>
            </div>

            <h2 className="auth-showcase__title">
              Your personal corner for every friendship memory.
            </h2>

            <p className="auth-showcase__subtitle">
              Create themed digital slam books for school farewells, college hostels,
              birthdays, and best friends — all organised on your private shelf.
            </p>

            <ul className="auth-perks-list">
              <li>
                <span className="auth-perks-list__icon" aria-hidden="true">01</span>
                <div>
                  <strong>Pick a template or start blank</strong>
                  <p>Start in seconds with nostalgic slam book prompts or write your own.</p>
                </div>
              </li>
              <li>
                <span className="auth-perks-list__icon" aria-hidden="true">02</span>
                <div>
                  <strong>Friends reply without signing up</strong>
                  <p>Share one link on WhatsApp or Instagram — no app download required.</p>
                </div>
              </li>
              <li>
                <span className="auth-perks-list__icon" aria-hidden="true">03</span>
                <div>
                  <strong>Keep forever or export to PDF</strong>
                  <p>Read memories anytime or save a printable keepsake book.</p>
                </div>
              </li>
            </ul>

            <div className="auth-milestone-callout">
              <HeartSticker size={18} />
              <p>
                <strong>Private by design:</strong> Your personal slam book shelf is protected by
                your account login so only you can manage your books and curate friend entries.
              </p>
            </div>
          </div>
        </aside>

        {/* Right column: Signup Form Card */}
        <section className="auth-card-wrapper" aria-labelledby="signup-heading">
          <div className="paper-card auth-card">
            <span className="washi-tape washi-tape--lavender" aria-hidden="true" />

            <div className="auth-card__header">
              <SlamlyLogoMark size={40} />
              <h1 id="signup-heading" className="auth-card__title">
                Create your Slamly account
              </h1>
              <p className="auth-card__subtitle">
                Every friend. Every memory. One little book.
              </p>
            </div>

            {serverError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {serverError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Full Name Field */}
              <div className="form-group">
                <label htmlFor="signup-name" className="form-label">
                  Full name <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g., Aanya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'signup-name-error' : undefined}
                  required
                />
                {errors.name && (
                  <p id="signup-name-error" className="form-error" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="signup-email" className="form-label">
                  Email address <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'signup-email-error' : undefined}
                  required
                />
                {errors.email && (
                  <p id="signup-email-error" className="form-error" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="signup-password" className="form-label">
                  Password <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'signup-password-error' : 'signup-password-hint'
                  }
                  required
                />
                <p id="signup-password-hint" className="form-hint">
                  Must be at least 6 characters long.
                </p>
                {errors.password && (
                  <p id="signup-password-error" className="form-error" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="signup-confirm-password" className="form-label">
                  Confirm password <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? 'signup-confirm-password-error' : undefined
                  }
                  required
                />
                {errors.confirmPassword && (
                  <p id="signup-confirm-password-error" className="form-error" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="auth-form__actions">
                <p className="form-legal-note">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="auth-switch-link">
                    Terms of Use
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="auth-switch-link">
                    Privacy Summary
                  </Link>
                  .
                </p>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>

            <div className="auth-card__footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-switch-link">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Signup;
