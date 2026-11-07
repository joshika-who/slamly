import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getFriendlyAuthErrorMessage } from '../firebase/authErrors';
import {
  FlowerSticker,
  StarSticker,
  SlamlyLogoMark,
} from '../assets/ScrapbookDoodles';

/**
 * ForgotPassword Page (/forgot-password)
 * Sends a Firebase password reset email while protecting user privacy:
 * - Never reveals whether an email address is registered or not.
 * - Handles invalid email format, rate limits, and network errors cleanly.
 */
function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (fieldError) setFieldError('');
    if (serverError) setServerError('');
  };

  const validateEmail = () => {
    const trimmed = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed) {
      return 'Please enter the email address linked to your account.';
    }
    if (!emailPattern.test(trimmed)) {
      return 'Please enter a valid email address (for example: you@example.com).';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setConfirmationMessage('');

    const validationError = validateEmail();
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setConfirmationMessage(
        'If an account exists for this email, a reset link has been sent. Please check your inbox and spam folder.'
      );
    } catch (error) {
      // Security requirement: never reveal whether an email is registered
      if (error && error.code === 'auth/user-not-found') {
        setConfirmationMessage(
          'If an account exists for this email, a reset link has been sent. Please check your inbox and spam folder.'
        );
      } else {
        setServerError(getFriendlyAuthErrorMessage(error, 'reset'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-grid">
        {/* Left column: Helpful scrapbook guidance */}
        <aside className="auth-showcase" aria-label="Password reset help">
          <div className="paper-card paper-card--tinted auth-showcase__card">
            <span className="washi-tape washi-tape--peach" aria-hidden="true" />

            <div className="auth-showcase__badge">
              <FlowerSticker size={18} />
              <span>Account Recovery</span>
            </div>

            <h2 className="auth-showcase__title">
              Lost the key to your slam book shelf?
            </h2>

            <p className="auth-showcase__subtitle">
              No worries at all. Enter your email address and we&rsquo;ll send you a secure link to
              choose a fresh password so you can get right back to your memories.
            </p>

            <blockquote className="scrapbook-quote-card">
              <p className="scrapbook-quote-card__text">
                &ldquo;Good friends never let you stay locked out of your own diary.&rdquo;
              </p>
              <footer className="scrapbook-quote-card__author">
                — Slamly Memory Keeper Note
              </footer>
            </blockquote>

            <div className="auth-milestone-callout">
              <StarSticker size={18} />
              <p>
                <strong>Tip:</strong> If the email doesn&rsquo;t arrive within a minute, check your
                Spam or Promotions folder for a message from Firebase Authentication.
              </p>
            </div>
          </div>
        </aside>

        {/* Right column: Password Reset Form Card */}
        <section className="auth-card-wrapper" aria-labelledby="forgot-password-heading">
          <div className="paper-card auth-card">
            <span className="washi-tape washi-tape--lavender" aria-hidden="true" />

            <div className="auth-card__header">
              <SlamlyLogoMark size={40} />
              <h1 id="forgot-password-heading" className="auth-card__title">
                Reset your password
              </h1>
              <p className="auth-card__subtitle">
                Enter your email address to receive a password reset link.
              </p>
            </div>

            {serverError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {serverError}
              </div>
            )}

            {confirmationMessage && (
              <div className="auth-alert auth-alert--success" role="status" aria-live="polite">
                {confirmationMessage}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="reset-email" className="form-label">
                  Email address <span className="required-indicator" aria-hidden="true">*</span>
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isSubmitting}
                  className={`form-input ${fieldError ? 'form-input--error' : ''}`}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'reset-email-error' : undefined}
                  required
                />
                {fieldError && (
                  <p id="reset-email-error" className="form-error" role="alert">
                    {fieldError}
                  </p>
                )}
              </div>

              <div className="auth-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </div>
            </form>

            <div className="auth-card__footer">
              <p>
                Remembered your password?{' '}
                <Link to="/login" className="auth-switch-link">
                  Back to Log in
                </Link>
              </p>
              <p style={{ marginTop: '8px' }}>
                Need a new account?{' '}
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

export default ForgotPassword;

