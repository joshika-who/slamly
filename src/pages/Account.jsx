import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  ACCOUNT_DELETE_CONFIRMATION_WORD,
  deleteAccountAndAllData,
} from '../services/accountService';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * Account Page (/account)
 * Protected page showing the signed-in user's name and email, plus a
 * "Delete my account" section that deletes all owned slam books, public book copies,
 * friend responses, and finally the Firebase Auth user.
 */
function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [failedStep, setFailedStep] = useState('');

  const displayName =
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Slamly Member');
  const email = user?.email || '';

  const isConfirmReady =
    confirmationText === ACCOUNT_DELETE_CONFIRMATION_WORD &&
    password.length > 0 &&
    !isDeleting;

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (isDeleting) return;

    setErrorMessage('');
    setFailedStep('');

    if (confirmationText !== ACCOUNT_DELETE_CONFIRMATION_WORD) {
      setErrorMessage(
        `Please type ${ACCOUNT_DELETE_CONFIRMATION_WORD} in capital letters to confirm.`
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your current password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setProgressMessage('Starting account deletion...');

    try {
      await deleteAccountAndAllData({
        user,
        confirmationText,
        password,
        onProgress: ({ message }) => {
          setProgressMessage(message);
        },
      });

      navigate('/', {
        replace: true,
        state: {
          flashMessage: 'Your account was deleted.',
        },
      });
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Something went wrong while deleting your account. Nothing further was deleted.'
      );
      setFailedStep(error.failedStep || '');
      setIsDeleting(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        {/* Top Bar */}
        <div className="preview-mode-banner" role="region" aria-label="Account navigation">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Account Settings</span>
            <p className="preview-mode-banner__text">
              View your profile details or manage your Slamly account and data.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button
              to="/dashboard"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
            >
              &larr; Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Profile Details Card */}
        <section
          className="paper-card account-profile-card"
          aria-labelledby="account-heading"
        >
          <span className="washi-tape washi-tape--sage" aria-hidden="true" />

          <div className="account-profile-card__header">
            <div className="legal-card__stickers" aria-hidden="true">
              <HeartSticker size={22} />
              <FlowerSticker size={22} />
              <StarSticker size={22} />
            </div>
            <span className="badge badge--sage">Signed-In Profile</span>
            <h1 id="account-heading" className="account-profile-card__title">
              My Account
            </h1>
            <p className="account-profile-card__subtitle">
              Your Slamly account is used to create, share, and manage your digital slam books.
            </p>
          </div>

          <dl className="account-details-list">
            <div className="account-details-item">
              <dt className="account-details-item__label">Name</dt>
              <dd className="account-details-item__value">{displayName}</dd>
            </div>
            <div className="account-details-item">
              <dt className="account-details-item__label">Email Address</dt>
              <dd className="account-details-item__value">{email}</dd>
            </div>
          </dl>

          <div className="account-profile-card__links">
            <Link to="/privacy" className="footer-link">
              Privacy Summary
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link to="/terms" className="footer-link">
              Terms of Use
            </Link>
          </div>
        </section>

        {/* Delete My Account Section */}
        <section
          className="paper-card account-danger-card"
          aria-labelledby="delete-account-heading"
        >
          <span className="washi-tape washi-tape--pink" aria-hidden="true" />

          <div className="account-danger-card__header">
            <span className="badge badge--pink">Permanent Action</span>
            <h2 id="delete-account-heading" className="account-danger-card__title">
              Delete my account
            </h2>
            <p className="account-danger-card__subtitle">
              Deleting your account permanently removes:
            </p>
            <ul className="account-danger-list">
              <li>Every slam book you have created and its public share link.</li>
              <li>Every friend response and attached photo inside your slam books.</li>
              <li>Your Slamly login (name and email in Firebase Authentication).</li>
            </ul>
            <p className="form-hint" style={{ marginTop: '8px' }}>
              <strong>Tip:</strong> If you want to keep a copy of your memories first, visit your{' '}
              <Link to="/dashboard">Dashboard</Link> and download your slam books as a PDF before
              deleting your account.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-alert auth-alert--error" role="alert">
              {failedStep && (
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
                  Failed step: {failedStep}
                </p>
              )}
              <p style={{ margin: 0 }}>{errorMessage}</p>
            </div>
          )}

          {isDeleting && progressMessage && (
            <div
              className="auth-alert alert-preview"
              role="status"
              aria-live="polite"
            >
              <strong>Please wait:</strong> {progressMessage}
            </div>
          )}

          <form
            className="account-delete-form"
            onSubmit={handleDeleteAccount}
            noValidate
          >
            <div className="form-group">
              <label htmlFor="delete-confirm-word" className="form-label">
                Type <code>{ACCOUNT_DELETE_CONFIRMATION_WORD}</code> in capital letters to confirm{' '}
                <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <input
                id="delete-confirm-word"
                type="text"
                className="form-input"
                placeholder={ACCOUNT_DELETE_CONFIRMATION_WORD}
                autoComplete="off"
                value={confirmationText}
                disabled={isDeleting}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  setErrorMessage('');
                }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="delete-confirm-password" className="form-label">
                Re-enter your current password{' '}
                <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="delete-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  disabled={isDeleting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isDeleting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="account-delete-form__actions">
              <Button
                type="submit"
                variant="primary"
                className="btn-danger"
                disabled={!isConfirmReady}
              >
                {isDeleting
                  ? progressMessage || 'Deleting account...'
                  : failedStep
                  ? 'Retry Account Deletion'
                  : 'Permanently Delete My Account'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Account;

