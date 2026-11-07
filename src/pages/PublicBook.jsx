import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { getPublicBookById } from '../services/bookService';
import {
  createResponse,
  MAX_ANSWER_LENGTH,
  MAX_RESPONDENT_NAME_LENGTH,
} from '../services/responseService';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const THEME_LABELS = {
  pink: 'Pastel Rose',
  lavender: 'Soft Lavender',
  peach: 'Warm Peach',
  sage: 'Sage Leaf',
};

const SUBMITTED_STORAGE_PREFIX = 'slamly_submitted_';

function getSubmittedStorageKey(bookId) {
  return `${SUBMITTED_STORAGE_PREFIX}${bookId}`;
}

function readAlreadySubmittedNote(bookId) {
  if (typeof window === 'undefined' || !bookId) return false;
  try {
    return window.localStorage.getItem(getSubmittedStorageKey(bookId)) === '1';
  } catch {
    return false;
  }
}

function saveAlreadySubmittedNote(bookId) {
  if (typeof window === 'undefined' || !bookId) return;
  try {
    window.localStorage.setItem(getSubmittedStorageKey(bookId), '1');
  } catch {
    // Ignore storage quota or private-browsing restrictions
  }
}

/**
 * PublicBook Page (/s/:bookId)
 * Minimal, public-facing slam book page where friends can fill out and submit a response
 * without needing an account:
 * - Injects `<meta name="robots" content="noindex">` so search engines do not index share links.
 * - Loads the book with a single `getDoc()` call via `getPublicBookById(bookId)`.
 * - Never displays or accesses `ownerId`.
 * - Handles 4 states: Loading, "Book not found" (missing or draft),
 *   "No longer accepting responses" (closed), and the Response Form (published) + Thank-You screen.
 */
function PublicBook() {
  const { bookId } = useParams();

  const [pageState, setPageState] = useState('loading'); // 'loading' | 'not-found' | 'error' | 'closed' | 'published' | 'submitted'
  const [book, setBook] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  // Form state
  const [respondentName, setRespondentName] = useState('');
  const [answersById, setAnswersById] = useState({});
  const [honeypot, setHoneypot] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [alreadySubmittedNote, setAlreadySubmittedNote] = useState(false);

  // Add <meta name="robots" content="noindex"> while viewing the public share page
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const createdMeta = !robotsMeta;
    const previousContent = robotsMeta ? robotsMeta.getAttribute('content') : null;

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex');

    return () => {
      if (createdMeta && robotsMeta.parentNode) {
        robotsMeta.parentNode.removeChild(robotsMeta);
      } else if (robotsMeta && previousContent !== null) {
        robotsMeta.setAttribute('content', previousContent);
      }
    };
  }, []);

  // Load the slam book with a single document read
  useEffect(() => {
    let isMounted = true;

    async function fetchPublicBook() {
      setPageState('loading');
      setLoadErrorMessage('');
      setFieldErrors({});
      setSubmitError('');

      try {
        const publicBook = await getPublicBookById(bookId);
        if (!isMounted) return;

        setBook(publicBook);
        setAlreadySubmittedNote(readAlreadySubmittedNote(bookId));

        // Initialize empty answer strings for each question
        const initialAnswers = {};
        publicBook.questions.forEach((q, idx) => {
          const qId = q.id || `q_${idx}`;
          initialAnswers[qId] = '';
        });
        setAnswersById(initialAnswers);

        if (publicBook.status === 'closed') {
          setPageState('closed');
        } else {
          setPageState('published');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.code === 'book/not-found') {
          setPageState('not-found');
        } else {
          setLoadErrorMessage(
            error.message || 'Could not load this slam book right now. Please check your connection.'
          );
          setPageState('error');
        }
      }
    }

    fetchPublicBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const handleAnswerChange = (questionId, value) => {
    const cappedValue = value.slice(0, MAX_ANSWER_LENGTH);
    setAnswersById((prev) => ({
      ...prev,
      [questionId]: cappedValue,
    }));
    if (fieldErrors[questionId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
    setSubmitError('');
  };

  const validateClientForm = () => {
    const errors = {};
    const trimmedName = respondentName.trim();

    if (!trimmedName) {
      errors.respondentName = 'Please enter your name or nickname.';
    } else if (trimmedName.length > MAX_RESPONDENT_NAME_LENGTH) {
      errors.respondentName = `Your name must be ${MAX_RESPONDENT_NAME_LENGTH} characters or fewer.`;
    }

    if (book && Array.isArray(book.questions)) {
      book.questions.forEach((q, index) => {
        const qId = q.id || `q_${index}`;
        const rawAnswer = answersById[qId] || '';
        const trimmedAnswer = rawAnswer.trim();

        if (q.required && !trimmedAnswer) {
          errors[qId] = 'This question is required.';
        } else if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
          errors[qId] = `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`;
        }
      });
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !book || book.status !== 'published') return;

    setSubmitError('');
    const validationErrors = validateClientForm();
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError('Please fill in all required fields marked below before sending your page.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createResponse(book.id, {
        respondentName,
        questions: book.questions,
        rawAnswersById: answersById,
        honeypot,
      });

      const cleanName = respondentName.trim();
      setSubmittedName(cleanName);
      saveAlreadySubmittedNote(book.id);
      setAlreadySubmittedNote(true);
      setPageState('submitted');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setSubmitError(
        error.message || 'Could not submit your response right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnotherResponse = () => {
    if (!book) return;
    const resetAnswers = {};
    book.questions.forEach((q, idx) => {
      resetAnswers[q.id || `q_${idx}`] = '';
    });
    setRespondentName('');
    setAnswersById(resetAnswers);
    setFieldErrors({});
    setSubmitError('');
    setPageState('published');
  };

  const coverTheme = book?.coverTheme || 'pink';
  const themeLabel = THEME_LABELS[coverTheme] || THEME_LABELS.pink;

  return (
    <div className="public-book-shell">
      <a href="#main-content" className="skip-link">
        Skip to slam book form
      </a>

      {/* Minimal Header: Only the Slamly Logo (No Dashboard Navigation) */}
      <header className="public-book-topbar" role="banner">
        <div className="container public-book-topbar__inner">
          <Link to="/" className="brand-logo" aria-label="Slamly Home">
            <HeartSticker size={26} />
            <span className="brand-logo-text">Slamly</span>
            <span className="brand-badge">Keepsake Page</span>
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="public-book-main">
        <div className="container public-book-container">
          {/* 1. LOADING STATE */}
          {pageState === 'loading' && (
            <div
              className="paper-card auth-loading-card"
              role="status"
              aria-live="polite"
            >
              <span className="washi-tape tape-lavender" aria-hidden="true" />
              <div className="auth-loading-card__spinner" aria-hidden="true">
                <StarSticker size={32} />
              </div>
              <h1 className="auth-loading-card__title">
                Opening this slam book...
              </h1>
              <p className="auth-loading-card__subtitle">
                Preparing a fresh keepsake page for you to sign.
              </p>
            </div>
          )}

          {/* 2. BOOK NOT FOUND STATE (Missing or Draft) */}
          {pageState === 'not-found' && (
            <div className="paper-card not-found-card" role="region" aria-labelledby="public-not-found-heading">
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />
              <div className="not-found-card__illustration">
                <PolaroidIllustration caption="Slam book not found" />
              </div>
              <span className="badge badge--pink">Book Not Found</span>
              <h1 id="public-not-found-heading" className="not-found-card__title">
                Book not found
              </h1>
              <p className="not-found-card__description">
                We couldn&rsquo;t find this slam book. The link might have a typo, the book may still
                be a private draft, or it may have been removed by its owner.
              </p>
              <div className="not-found-card__actions">
                <Button to="/" variant="secondary" size="lg">
                  Visit Slamly Home
                </Button>
              </div>
            </div>
          )}

          {/* 2b. NETWORK / UNEXPECTED ERROR STATE */}
          {pageState === 'error' && (
            <div className="paper-card not-found-card" role="alert">
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />
              <span className="badge badge--pink">Connection Issue</span>
              <h1 className="not-found-card__title">Could not load this slam book</h1>
              <p className="not-found-card__description">{loadErrorMessage}</p>
              <div className="not-found-card__actions">
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* 3. CLOSED BOOK STATE */}
          {pageState === 'closed' && book && (
            <div
              className={`paper-card public-book-card live-preview-card--${coverTheme}`}
              role="region"
              aria-labelledby="closed-book-heading"
            >
              <span className="washi-tape tape-lavender" aria-hidden="true" />
              <div className="public-book-card__header">
                <div className="live-preview-card__stickers" aria-hidden="true">
                  <HeartSticker size={22} />
                  <FlowerSticker size={22} />
                  <StarSticker size={22} />
                </div>
                <span className="badge badge--lavender">{themeLabel} Keepsake</span>
                <h1 id="closed-book-heading" className="public-book-card__title">
                  {book.title}
                </h1>
                {book.description && (
                  <p className="public-book-card__description">{book.description}</p>
                )}
              </div>

              <div className="public-book-closed-banner" role="status" aria-live="polite">
                <h2 className="public-book-closed-banner__title">
                  This slam book is no longer accepting responses
                </h2>
                <p className="public-book-closed-banner__text">
                  The owner has closed this slam book for new entries. Thank you for stopping by!
                </p>
              </div>
            </div>
          )}

          {/* 4. THANK YOU STATE (After Successful Submission) */}
          {pageState === 'submitted' && book && (
            <div
              className={`paper-card public-book-card live-preview-card--${coverTheme}`}
              role="status"
              aria-live="polite"
            >
              <span className="washi-tape tape-sage" aria-hidden="true" />
              <div className="not-found-card__stickers" aria-hidden="true">
                <HeartSticker size={28} />
                <FlowerSticker size={28} />
                <StarSticker size={28} />
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <span className="badge badge--sage">Page Saved to Slam Book</span>
                <h1 className="not-found-card__title">
                  Thank you, {submittedName || 'friend'}!
                </h1>
                <p className="not-found-card__description" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
                  Your answers have been tucked safely inside <strong>&ldquo;{book.title}&rdquo;</strong>.
                  Only the book&rsquo;s owner can read your keepsake page.
                </p>
                <div className="not-found-card__actions">
                  <Button
                    variant="secondary"
                    onClick={handleSendAnotherResponse}
                  >
                    Fill out another page
                  </Button>
                  <Button to="/" variant="ghost">
                    Create your own Slamly book &rarr;
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 5. PUBLISHED FORM STATE */}
          {pageState === 'published' && book && (
            <article
              className={`paper-card public-book-card live-preview-card--${coverTheme}`}
              aria-labelledby="public-book-title"
            >
              <span className="washi-tape" aria-hidden="true" />

              {/* Book Cover Header */}
              <header className="public-book-card__header">
                <div className="live-preview-card__stickers" aria-hidden="true">
                  <HeartSticker size={22} />
                  <FlowerSticker size={22} />
                  <StarSticker size={22} />
                </div>
                <span className="badge badge--pink">
                  {themeLabel} Edition &bull; {book.questions.length}{' '}
                  {book.questions.length === 1 ? 'Question' : 'Questions'}
                </span>
                <h1 id="public-book-title" className="public-book-card__title">
                  {book.title}
                </h1>
                {book.description && (
                  <p className="public-book-card__description">{book.description}</p>
                )}
              </header>

              {/* Non-blocking convenience notice if localStorage shows a previous submission */}
              {alreadySubmittedNote && (
                <div
                  className="public-already-submitted-note"
                  role="note"
                  aria-label="Previous submission notice"
                >
                  <strong>Friendly note:</strong> It looks like you already submitted a page for this
                  slam book on this device. You are still welcome to submit another response below!
                </div>
              )}

              {/* Form-level error alert */}
              {submitError && (
                <div className="auth-alert auth-alert--error" role="alert" aria-live="assertive">
                  {submitError}
                </div>
              )}

              <form
                className="public-response-form"
                onSubmit={handleSubmit}
                noValidate
              >
                {/* Hidden Honeypot Field for Bot Protection */}
                <div className="honeypot-field" aria-hidden="true">
                  <label htmlFor="slamly-website-field">
                    Leave this field blank
                  </label>
                  <input
                    id="slamly-website-field"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Friend's Name / Nickname Field */}
                <div className="public-question-card public-question-card--identity">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="respondent-name" className="form-label public-question-label">
                      Your name or nickname{' '}
                      <span className="required-indicator" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      id="respondent-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Rohan ('Ro')"
                      maxLength={MAX_RESPONDENT_NAME_LENGTH}
                      value={respondentName}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.respondentName)}
                      aria-describedby={
                        fieldErrors.respondentName
                          ? 'respondent-name-error respondent-name-hint'
                          : 'respondent-name-hint'
                      }
                      onChange={(e) => {
                        setRespondentName(e.target.value);
                        if (fieldErrors.respondentName) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.respondentName;
                            return next;
                          });
                        }
                        setSubmitError('');
                      }}
                    />
                    <div className="public-field-meta">
                      <span id="respondent-name-hint" className="form-hint">
                        So your friend knows whose page this is (1–{MAX_RESPONDENT_NAME_LENGTH} characters)
                      </span>
                      <span className="form-hint">
                        {respondentName.length}/{MAX_RESPONDENT_NAME_LENGTH}
                      </span>
                    </div>
                    {fieldErrors.respondentName && (
                      <p
                        id="respondent-name-error"
                        className="field-error-text"
                        role="alert"
                      >
                        {fieldErrors.respondentName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Questions List */}
                <ol className="public-questions-list">
                  {book.questions.map((question, index) => {
                    const qId = question.id || `q_${index}`;
                    const inputId = `question-input-${qId}`;
                    const errorId = `question-error-${qId}`;
                    const hintId = `question-hint-${qId}`;
                    const currentAnswer = answersById[qId] || '';
                    const hasError = Boolean(fieldErrors[qId]);

                    return (
                      <li key={qId} className="public-question-card">
                        <div className="public-question-card__header">
                          <span className="builder-question-number">Q{index + 1}</span>
                          <span className="public-question-badge">
                            {question.required ? 'Required' : 'Optional'}
                          </span>
                        </div>

                        {/* Multiple Choice Question */}
                        {question.type === 'multiple_choice' ? (
                          <fieldset
                            className="public-mc-fieldset"
                            disabled={isSubmitting}
                            aria-required={question.required}
                            aria-invalid={hasError}
                            aria-describedby={hasError ? errorId : undefined}
                          >
                            <legend className="form-label public-question-label">
                              {question.text}
                              {question.required && (
                                <span className="required-indicator" aria-hidden="true">
                                  {' '}*
                                </span>
                              )}
                            </legend>

                            <div className="public-mc-options">
                              {(Array.isArray(question.options) && question.options.length > 0
                                ? question.options
                                : ['Option 1', 'Option 2']
                              ).map((optionText, optIdx) => {
                                const optionId = `${inputId}-opt-${optIdx}`;
                                const isChecked = currentAnswer === optionText;
                                return (
                                  <label
                                    key={optionId}
                                    htmlFor={optionId}
                                    className={`public-mc-option ${
                                      isChecked ? 'public-mc-option--selected' : ''
                                    }`}
                                  >
                                    <input
                                      id={optionId}
                                      type="radio"
                                      name={inputId}
                                      value={optionText}
                                      checked={isChecked}
                                      onChange={() => handleAnswerChange(qId, optionText)}
                                    />
                                    <span>{optionText}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {!question.required && currentAnswer && (
                              <button
                                type="button"
                                className="link-button"
                                style={{ marginTop: '8px', fontSize: '0.82rem' }}
                                onClick={() => handleAnswerChange(qId, '')}
                              >
                                Clear selection
                              </button>
                            )}
                          </fieldset>
                        ) : (
                          /* Text, Paragraph, Date, or Polaroid Prompt Question */
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label htmlFor={inputId} className="form-label public-question-label">
                              {question.text}
                              {question.required && (
                                <span className="required-indicator" aria-hidden="true">
                                  {' '}*
                                </span>
                              )}
                            </label>

                            {question.type === 'paragraph' && (
                              <textarea
                                id={inputId}
                                rows={4}
                                maxLength={MAX_ANSWER_LENGTH}
                                className="form-input form-textarea"
                                placeholder="Write your story, memory, or message here..."
                                value={currentAnswer}
                                disabled={isSubmitting}
                                required={question.required}
                                aria-required={question.required}
                                aria-invalid={hasError}
                                aria-describedby={hasError ? `${errorId} ${hintId}` : hintId}
                                onChange={(e) => handleAnswerChange(qId, e.target.value)}
                              />
                            )}

                            {question.type === 'polaroid_prompt' && (
                              <div className="public-polaroid-prompt-box">
                                <span className="public-polaroid-prompt-box__caption">
                                  Polaroid Memory / Vibe Check (Text Note)
                                </span>
                                <textarea
                                  id={inputId}
                                  rows={3}
                                  maxLength={MAX_ANSWER_LENGTH}
                                  className="form-input form-textarea"
                                  placeholder="Describe the moment, snapshot, or vibe you would pin here..."
                                  value={currentAnswer}
                                  disabled={isSubmitting}
                                  required={question.required}
                                  aria-required={question.required}
                                  aria-invalid={hasError}
                                  aria-describedby={hasError ? `${errorId} ${hintId}` : hintId}
                                  onChange={(e) => handleAnswerChange(qId, e.target.value)}
                                />
                              </div>
                            )}

                            {question.type === 'date' && (
                              <input
                                id={inputId}
                                type="date"
                                className="form-input"
                                value={currentAnswer}
                                disabled={isSubmitting}
                                required={question.required}
                                aria-required={question.required}
                                aria-invalid={hasError}
                                aria-describedby={hasError ? errorId : undefined}
                                onChange={(e) => handleAnswerChange(qId, e.target.value)}
                              />
                            )}

                            {(question.type === 'short_answer' ||
                              (!['paragraph', 'polaroid_prompt', 'date', 'multiple_choice'].includes(
                                question.type
                              ))) && (
                              <input
                                id={inputId}
                                type="text"
                                maxLength={MAX_ANSWER_LENGTH}
                                className="form-input"
                                placeholder="Write your answer..."
                                value={currentAnswer}
                                disabled={isSubmitting}
                                required={question.required}
                                aria-required={question.required}
                                aria-invalid={hasError}
                                aria-describedby={hasError ? `${errorId} ${hintId}` : hintId}
                                onChange={(e) => handleAnswerChange(qId, e.target.value)}
                              />
                            )}

                            {question.type !== 'date' && (
                              <div className="public-field-meta">
                                <span id={hintId} className="form-hint">
                                  {question.required ? 'Required question' : 'Optional question'}
                                </span>
                                <span className="form-hint">
                                  {currentAnswer.length}/{MAX_ANSWER_LENGTH}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {hasError && (
                          <p id={errorId} className="field-error-text" role="alert">
                            {fieldErrors[qId]}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>

                {/* Submit Bar */}
                <div className="public-submit-bar">
                  <p className="form-hint" style={{ margin: 0 }}>
                    Once submitted, your page is saved privately for the slam book owner.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending your page...' : 'Sign & Send My Page'}
                  </Button>
                </div>
              </form>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

export default PublicBook;

