import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/ProtectedRoute';
import {
  BOOK_STATUS_META,
  createQuestionId,
  getBookById,
  getBookShareUrl,
  updateBook,
} from '../services/bookService';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const COVER_THEMES = [
  { id: 'pink', label: 'Pastel Rose' },
  { id: 'lavender', label: 'Soft Lavender' },
  { id: 'peach', label: 'Warm Peach' },
  { id: 'sage', label: 'Sage Leaf' },
];

const QUESTION_TYPES = [
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'paragraph', label: 'Long Story / Paragraph' },
  { id: 'date', label: 'Date / Memory Date' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'polaroid_prompt', label: 'Memory / Vibe Check' },
];

async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * EditBook Page (/books/:bookId/edit)
 * Protected route for editing an existing slam book owned by the signed-in user:
 * - Loads the book from Firestore via `getBookById(user.uid, bookId)`.
 * - Displays a friendly "Book not found" screen if the book does not exist or belongs to another user.
 * - Lets the owner publish a draft, close/reopen a published book, move back to draft,
 *   and copy the public share link (`/s/:bookId`) when published.
 * - Saves changes using `updateBook(user.uid, bookId, changes)` (never creating a duplicate book).
 */
function EditBook() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [notFoundError, setNotFoundError] = useState('');
  const [loadError, setLoadError] = useState('');

  const [bookTitle, setBookTitle] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [coverTheme, setCoverTheme] = useState('pink');
  const [bookStatus, setBookStatus] = useState('draft');
  const [savedStatus, setSavedStatus] = useState('draft');
  const [templateId, setTemplateId] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState('short_answer');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsText, setNewOptionsText] = useState('Option 1, Option 2');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = getBookShareUrl(bookId);

  useEffect(() => {
    let isMounted = true;

    async function fetchBook() {
      if (!user?.uid) return;
      setIsLoadingBook(true);
      setNotFoundError('');
      setLoadError('');

      try {
        const loadedBook = await getBookById(user.uid, bookId);
        if (!isMounted) return;

        setBookTitle(loadedBook.title);
        setBookDescription(loadedBook.description);
        setCoverTheme(loadedBook.coverTheme);
        setBookStatus(loadedBook.status);
        setSavedStatus(loadedBook.status);
        setTemplateId(loadedBook.templateId);
        setQuestions(
          loadedBook.questions.map((q, index) => ({
            ...q,
            text: q.text || q.prompt || '',
            required: Boolean(q.required),
            order: index,
          }))
        );
        setIsDirty(false);
      } catch (error) {
        if (!isMounted) return;
        if (error.code === 'book/not-found') {
          setNotFoundError(
            error.message || 'This slam book does not exist or belongs to another account.'
          );
        } else {
          setLoadError(error.message || 'Failed to load this slam book.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false);
        }
      }
    }

    fetchBook();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, bookId]);

  // Warn user before leaving browser tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty && !isSaving) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving]);

  if (isLoadingBook) {
    return <AuthLoadingScreen message="Opening your slam book for editing..." />;
  }

  if (notFoundError) {
    return (
      <div className="not-found-page">
        <div className="container">
          <div className="paper-card not-found-card">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />
            <div className="not-found-card__illustration">
              <PolaroidIllustration caption="Slam book not found on your shelf" />
            </div>
            <span className="badge badge--lavender">Book Not Found</span>
            <h1 className="not-found-card__title">
              We couldn&rsquo;t find that slam book.
            </h1>
            <p className="not-found-card__description">{notFoundError}</p>
            <div className="not-found-card__actions">
              <Button to="/dashboard" variant="primary" size="lg">
                Back to My Dashboard
              </Button>
              <Button to="/create" variant="secondary" size="lg">
                + Create a New Book
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="builder-page">
        <div className="container">
          <div className="paper-card empty-state">
            <span className="washi-tape" aria-hidden="true" />
            <h1 className="empty-state__title">Could not load slam book</h1>
            <p className="empty-state__description">{loadError}</p>
            <div className="empty-state__actions">
              <Button to="/dashboard" variant="primary">
                &larr; Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyShareLink = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2500);
    } catch {
      // Ignore clipboard failures
    }
  };

  /**
   * Immediately updates ONLY the book's status in Firestore via updateBook()
   * without altering any other saved field.
   */
  const handleQuickStatusChange = async (nextStatus) => {
    if (isSaving) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const updated = await updateBook(user.uid, bookId, { status: nextStatus });
      setBookStatus(updated.status);
      setSavedStatus(updated.status);

      if (nextStatus === 'published') {
        setSuccessMessage('Book published! Your public share link is now live.');
      } else if (nextStatus === 'closed') {
        setSuccessMessage('Book closed! Friends visiting the link will see that responses are closed.');
      } else {
        setSuccessMessage('Book moved back to Draft (private).');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Could not update book status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = newPrompt.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a question prompt before clicking Add Question.');
      return;
    }

    if (questions.length >= 50) {
      setErrorMessage('A slam book can have at most 50 questions.');
      return;
    }

    const nextQuestion = {
      id: createQuestionId(),
      text: trimmed,
      type: newType,
      order: questions.length,
      required: Boolean(newRequired),
    };

    if (newType === 'multiple_choice') {
      const parsedOptions = newOptionsText
        .split(',')
        .map((opt) => opt.trim())
        .filter(Boolean);
      nextQuestion.options = parsedOptions.length >= 2 ? parsedOptions : ['Option 1', 'Option 2'];
    }

    setQuestions((prev) => [...prev, nextQuestion]);
    setNewPrompt('');
    setNewRequired(false);
    setIsDirty(true);
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== questionId)
        .map((q, idx) => ({ ...q, order: idx }))
    );
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setQuestions(copy.map((q, idx) => ({ ...q, order: idx })));
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleQuestionTextChange = (questionId, updatedText) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, text: updatedText } : q))
    );
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleQuestionRequiredChange = (questionId, isRequired) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, required: Boolean(isRequired) } : q))
    );
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleQuestionTypeChange = (questionId, updatedType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const next = { ...q, type: updatedType };
        if (updatedType === 'multiple_choice' && (!Array.isArray(next.options) || next.options.length < 2)) {
          next.options = ['Option 1', 'Option 2'];
        }
        return next;
      })
    );
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleQuestionOptionsChange = (questionId, rawCommaSeparated) => {
    const options = rawCommaSeparated.split(',').map((s) => s.trim());
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options } : q))
    );
    setIsDirty(true);
    setSuccessMessage('');
  };

  const handleBackToDashboard = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Return to Dashboard without saving?')) {
      return;
    }
    navigate('/dashboard');
  };

  const handleUpdateBook = async (statusOverride) => {
    if (isSaving) return;
    setErrorMessage('');
    setSuccessMessage('');

    const finalStatus = statusOverride || bookStatus;
    setIsSaving(true);

    try {
      const updated = await updateBook(user.uid, bookId, {
        title: bookTitle,
        description: bookDescription,
        templateId,
        coverTheme,
        status: finalStatus,
        questions,
      });

      setBookStatus(updated.status);
      setSavedStatus(updated.status);
      setIsDirty(false);
      setSuccessMessage(`Changes saved to "${updated.title}"!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrorMessage(error.message || 'Could not save changes to your slam book.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatusMeta = BOOK_STATUS_META[bookStatus] || BOOK_STATUS_META.draft;
  const savedStatusMeta = BOOK_STATUS_META[savedStatus] || BOOK_STATUS_META.draft;

  return (
    <div className="builder-page">
      <div className="container">
        {/* Top Editor Header Banner */}
        <div className="preview-mode-banner" role="region" aria-label="Edit book header">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Editing Saved Book</span>
            <p className="preview-mode-banner__text">
              <strong>Editing &ldquo;{bookTitle || 'Untitled'}&rdquo;:</strong> Update your title,
              cover theme, status, or questions below and click <strong>Save Changes</strong>.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button variant="secondary" size="sm" onClick={handleBackToDashboard} disabled={isSaving}>
              &larr; Back to Dashboard
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="auth-alert auth-alert--success" role="status" aria-live="polite">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span>{successMessage}</span>
              <Button to="/dashboard" variant="secondary" size="sm">
                Return to Dashboard &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Public Sharing & Status Control Panel */}
        <section
          className="paper-card edit-sharing-panel"
          aria-labelledby="sharing-status-heading"
        >
          <div className="edit-sharing-panel__top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 id="sharing-status-heading" style={{ fontSize: '1.35rem', margin: 0 }}>
                  Sharing &amp; Book Status
                </h2>
                <span className={`status-badge ${savedStatusMeta.badgeClass}`}>
                  {savedStatusMeta.label}
                </span>
              </div>
              <p className="book-status-note" style={{ marginTop: '6px', marginBottom: 0 }}>
                {savedStatusMeta.shortNote}
              </p>
            </div>

            <div className="book-status-actions">
              <Button
                to={`/books/${bookId}/responses`}
                variant="secondary"
                size="sm"
                disabled={isSaving}
              >
                View Responses
              </Button>

              {savedStatus === 'draft' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleQuickStatusChange('published')}
                >
                  {isSaving ? 'Updating...' : 'Publish Book'}
                </Button>
              )}

              {savedStatus === 'published' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleQuickStatusChange('closed')}
                  >
                    {isSaving ? 'Updating...' : 'Close Responses'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleQuickStatusChange('draft')}
                  >
                    Move to Draft
                  </Button>
                </>
              )}

              {savedStatus === 'closed' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleQuickStatusChange('published')}
                  >
                    {isSaving ? 'Updating...' : 'Reopen Book'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleQuickStatusChange('draft')}
                  >
                    Move to Draft
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Share Link — ONLY shown when the book is Published */}
          {savedStatus === 'published' && (
            <div className="book-share-box" style={{ marginTop: '14px' }}>
              <div className="book-share-box__url" title={shareUrl}>
                {shareUrl}
              </div>
              <div className="book-share-box__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyShareLink}
                >
                  {copiedLink ? 'Copied!' : 'Copy Share Link'}
                </button>
                {copiedLink && (
                  <span className="sr-only" role="status" aria-live="polite">
                    Share link copied to clipboard!
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="builder-grid">
          {/* Left Column: Editor */}
          <section className="builder-editor" aria-labelledby="edit-book-heading">
            <div className="paper-card builder-card">
              <span className="washi-tape washi-tape--lavender" aria-hidden="true" />

              <div className="builder-card__header">
                <span className="badge badge--lavender">
                  {templateId ? `Template: ${templateId}` : 'Custom Blank Book'}
                </span>
                <h1 id="edit-book-heading" className="builder-card__title">
                  Edit Slam Book
                </h1>
                <p className="builder-card__subtitle">
                  All changes update this book directly in Cloud Firestore without creating a duplicate.
                </p>
              </div>

              <div className="builder-form-section">
                <div className="form-group">
                  <label htmlFor="edit-book-title" className="form-label">
                    Slam book title <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="edit-book-title"
                    type="text"
                    maxLength={100}
                    className="form-input"
                    value={bookTitle}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookTitle(e.target.value);
                      setIsDirty(true);
                      setSuccessMessage('');
                    }}
                    required
                  />
                  <span className="form-hint">{bookTitle.length}/100 characters</span>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-book-desc" className="form-label">
                    Welcome note / description
                  </label>
                  <textarea
                    id="edit-book-desc"
                    rows={3}
                    maxLength={500}
                    className="form-input form-textarea"
                    value={bookDescription}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookDescription(e.target.value);
                      setIsDirty(true);
                      setSuccessMessage('');
                    }}
                  />
                  <span className="form-hint">{bookDescription.length}/500 characters</span>
                </div>

                {/* Cover Theme Selector */}
                <fieldset className="theme-fieldset" disabled={isSaving}>
                  <legend className="form-label">Scrapbook cover theme</legend>
                  <div className="theme-swatches">
                    {COVER_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        className={`theme-swatch theme-swatch--${theme.id} ${
                          coverTheme === theme.id ? 'theme-swatch--active' : ''
                        }`}
                        onClick={() => {
                          setCoverTheme(theme.id);
                          setIsDirty(true);
                          setSuccessMessage('');
                        }}
                        aria-pressed={coverTheme === theme.id}
                      >
                        <span className="theme-swatch__dot" aria-hidden="true" />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Status Selector */}
                <div className="form-group">
                  <label htmlFor="edit-book-status" className="form-label">
                    Book status
                  </label>
                  <select
                    id="edit-book-status"
                    className="form-input"
                    value={bookStatus}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookStatus(e.target.value);
                      setIsDirty(true);
                      setSuccessMessage('');
                    }}
                  >
                    <option value="published">Published (Public link open for friend responses)</option>
                    <option value="closed">Closed (Public link shows responses are closed)</option>
                    <option value="draft">Draft (Private — only visible to you)</option>
                  </select>
                  <span className="form-hint">{currentStatusMeta.shortNote}</span>
                </div>
              </div>

              {/* Questions Editor */}
              <div className="builder-questions-section">
                <div className="builder-questions-header">
                  <h2 className="builder-section-heading">
                    Questions ({questions.length}/50)
                  </h2>
                  <span className="form-hint">
                    Edit prompts, toggle Required, change question types, or reorder with Up/Down.
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="preview-inline-notice">
                    <p>No questions in this book. Add at least one question below before saving.</p>
                  </div>
                ) : (
                  <ol className="builder-questions-list">
                    {questions.map((question, index) => (
                      <li key={question.id} className="builder-question-item">
                        <div className="builder-question-item__top">
                          <span className="builder-question-number">Q{index + 1}</span>

                          <label
                            htmlFor={`edit-q-type-${question.id}`}
                            className="sr-only"
                          >
                            Question {index + 1} type
                          </label>
                          <select
                            id={`edit-q-type-${question.id}`}
                            className="form-input form-input--compact"
                            value={question.type}
                            disabled={isSaving}
                            onChange={(e) => handleQuestionTypeChange(question.id, e.target.value)}
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>

                          <label className="question-required-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(question.required)}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleQuestionRequiredChange(question.id, e.target.checked)
                              }
                            />
                            <span>Required</span>
                          </label>

                          <div className="builder-question-controls">
                            <button
                              type="button"
                              className="icon-control-btn"
                              onClick={() => handleMoveQuestion(index, -1)}
                              disabled={index === 0 || isSaving}
                              aria-label={`Move question ${index + 1} up`}
                            >
                              &uarr;
                            </button>
                            <button
                              type="button"
                              className="icon-control-btn"
                              onClick={() => handleMoveQuestion(index, 1)}
                              disabled={index === questions.length - 1 || isSaving}
                              aria-label={`Move question ${index + 1} down`}
                            >
                              &darr;
                            </button>
                            <button
                              type="button"
                              className="icon-control-btn icon-control-btn--danger"
                              onClick={() => handleRemoveQuestion(question.id)}
                              disabled={isSaving}
                              aria-label={`Remove question ${index + 1}`}
                            >
                              &times;
                            </button>
                          </div>
                        </div>

                        <label
                          htmlFor={`edit-q-input-${question.id}`}
                          className="sr-only"
                        >
                          Question {index + 1} prompt
                        </label>
                        <input
                          id={`edit-q-input-${question.id}`}
                          type="text"
                          className="form-input"
                          value={question.text}
                          disabled={isSaving}
                          onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                        />

                        {question.type === 'multiple_choice' && (
                          <div style={{ marginTop: '8px' }}>
                            <label
                              htmlFor={`edit-q-options-${question.id}`}
                              className="form-label"
                              style={{ fontSize: '0.82rem' }}
                            >
                              Choices (comma-separated, at least 2):
                            </label>
                            <input
                              id={`edit-q-options-${question.id}`}
                              type="text"
                              className="form-input"
                              value={Array.isArray(question.options) ? question.options.join(', ') : ''}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleQuestionOptionsChange(question.id, e.target.value)
                              }
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Add Question Box */}
                <form className="add-question-box" onSubmit={handleAddQuestion}>
                  <h3 className="add-question-box__title">+ Add another question</h3>
                  <div className="add-question-box__row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="edit-new-prompt" className="form-label">
                        Question prompt
                      </label>
                      <input
                        id="edit-new-prompt"
                        type="text"
                        className="form-input"
                        placeholder="e.g., What is a memory of us you never want to forget?"
                        value={newPrompt}
                        disabled={isSaving}
                        onChange={(e) => setNewPrompt(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="edit-new-type" className="form-label">
                        Answer style
                      </label>
                      <select
                        id="edit-new-type"
                        className="form-input"
                        value={newType}
                        disabled={isSaving}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {newType === 'multiple_choice' && (
                    <div className="form-group">
                      <label htmlFor="edit-new-options" className="form-label">
                        Multiple choice options (comma-separated)
                      </label>
                      <input
                        id="edit-new-options"
                        type="text"
                        className="form-input"
                        placeholder="Option 1, Option 2, Option 3"
                        value={newOptionsText}
                        disabled={isSaving}
                        onChange={(e) => setNewOptionsText(e.target.value)}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <label className="question-required-toggle">
                      <input
                        type="checkbox"
                        checked={newRequired}
                        disabled={isSaving}
                        onChange={(e) => setNewRequired(e.target.checked)}
                      />
                      <span>Make this question required</span>
                    </label>

                    <Button type="submit" variant="secondary" size="sm" disabled={isSaving}>
                      + Add Question
                    </Button>
                  </div>
                </form>
              </div>

              <div className="builder-card__footer">
                <Button variant="ghost" onClick={handleBackToDashboard} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateBook('draft')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleUpdateBook(bookStatus)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </section>

          {/* Right Column: Live Scrapbook Page Preview */}
          <aside className="builder-live-preview" aria-label="Live slam book page preview">
            <div className={`paper-card live-preview-card live-preview-card--${coverTheme}`}>
              <span className="washi-tape tape-sage" aria-hidden="true" />

              <div className="live-preview-card__header">
                <div className="live-preview-card__stickers" aria-hidden="true">
                  <HeartSticker size={20} />
                  <FlowerSticker size={20} />
                  <StarSticker size={20} />
                </div>
                <span className="live-preview-card__eyebrow">
                  Live Preview &bull; {currentStatusMeta.label}
                </span>
                <h2 className="live-preview-card__title">
                  {bookTitle || 'Untitled Slam Book'}
                </h2>
                <p className="live-preview-card__desc">
                  {bookDescription || 'Fill out a page in my personal slam book!'}
                </p>
              </div>

              <div className="live-preview-card__sheet">
                {questions.map((q, idx) => (
                  <div key={q.id} className="live-preview-field">
                    <span className="live-preview-field__label">
                      {idx + 1}. {q.text || 'Untitled question'}
                      {q.required ? ' *' : ''}
                    </span>
                    <div className="live-preview-field__line" aria-hidden="true">
                      {q.type === 'multiple_choice' && Array.isArray(q.options)
                        ? `Choices: ${q.options.filter(Boolean).join(' / ')}`
                        : q.type === 'date'
                        ? 'DD / MM / YYYY'
                        : 'Friend’s handwritten-style answer goes here...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default EditBook;
