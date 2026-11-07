import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { BOOK_TEMPLATES } from '../data/mockBooks';
import {
  BOOK_STATUS_META,
  cloneTemplateQuestions,
  createBook,
  createQuestionId,
} from '../services/bookService';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const COVER_THEMES = [
  { id: 'pink', label: 'Pastel Rose', hex: '#FAD2DD' },
  { id: 'lavender', label: 'Soft Lavender', hex: '#E4DAF6' },
  { id: 'peach', label: 'Warm Peach', hex: '#FDE0C6' },
  { id: 'sage', label: 'Sage Leaf', hex: '#D5E8DA' },
];

const QUESTION_TYPES = [
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'paragraph', label: 'Long Story / Paragraph' },
  { id: 'date', label: 'Date / Memory Date' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'polaroid_prompt', label: 'Memory / Vibe Check' },
];

/**
 * TemplateBuilderPreview Page (/create/template/:id)
 * Connects template-based slam book creation to Cloud Firestore in Milestone 3:
 * - Deep-copies the chosen template's questions into local state (never storing a reference).
 * - Supports editing title, description, cover theme, status, and adding/editing/reordering/deleting questions.
 * - Saves the new book to `books/{bookId}` via `createBook()` and redirects to `/dashboard`.
 */
function TemplateBuilderPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const matchedTemplate = BOOK_TEMPLATES.find((t) => t.id === id);

  const [bookTitle, setBookTitle] = useState(
    matchedTemplate ? `My ${matchedTemplate.title} Slam Book` : ''
  );
  const [bookDescription, setBookDescription] = useState(
    matchedTemplate ? matchedTemplate.description : ''
  );
  const [coverTheme, setCoverTheme] = useState(
    matchedTemplate?.coverTheme || 'pink'
  );
  const [bookStatus, setBookStatus] = useState('published');
  const [questions, setQuestions] = useState(() =>
    matchedTemplate ? cloneTemplateQuestions(matchedTemplate.defaultQuestions) : []
  );

  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState('short_answer');
  const [newOptionsText, setNewOptionsText] = useState('Chai, Coffee, Hot Chocolate');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset builder state if route parameter :id changes to another template
  useEffect(() => {
    const found = BOOK_TEMPLATES.find((t) => t.id === id);
    if (found) {
      setBookTitle(`My ${found.title} Slam Book`);
      setBookDescription(found.description);
      setCoverTheme(found.coverTheme || 'pink');
      setBookStatus('published');
      setQuestions(cloneTemplateQuestions(found.defaultQuestions));
      setIsDirty(false);
      setErrorMessage('');
    }
  }, [id]);

  // Warn user before closing or refreshing browser tab with unsaved edits
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

  if (!matchedTemplate) {
    return (
      <div className="builder-page">
        <div className="container">
          <div className="paper-card empty-state">
            <span className="washi-tape" aria-hidden="true" />
            <h1 className="empty-state__title">Template not found</h1>
            <p className="empty-state__description">
              We couldn&rsquo;t find a slam book template matching <code>{id}</code>. Choose one of
              our five keepsake templates or start from scratch.
            </p>
            <div className="empty-state__actions">
              <Button to="/create" variant="primary">
                &larr; Browse Templates
              </Button>
              <Button to="/create/blank" variant="secondary">
                Start From Scratch
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddQuestion = (event) => {
    event.preventDefault();
    setErrorMessage('');
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
      required: false,
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
    setIsDirty(true);
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== questionId)
        .map((q, idx) => ({ ...q, order: idx }))
    );
    setIsDirty(true);
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated.map((q, idx) => ({ ...q, order: idx })));
    setIsDirty(true);
  };

  const handleQuestionTextChange = (questionId, updatedText) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, text: updatedText } : q))
    );
    setIsDirty(true);
  };

  const handleQuestionRequiredChange = (questionId, isRequired) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, required: Boolean(isRequired) } : q))
    );
    setIsDirty(true);
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
  };

  const handleQuestionOptionsChange = (questionId, rawCommaSeparated) => {
    const options = rawCommaSeparated.split(',').map((s) => s.trim());
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options } : q))
    );
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave this slam book without saving?')) {
      return;
    }
    navigate('/create');
  };

  const handleSaveBook = async (statusOverride) => {
    if (isSaving) return;
    setErrorMessage('');

    const finalStatus = statusOverride || bookStatus;
    setIsSaving(true);

    try {
      const created = await createBook(user?.uid, {
        title: bookTitle,
        description: bookDescription,
        templateId: matchedTemplate.id,
        coverTheme,
        status: finalStatus,
        questions,
      });

      setIsDirty(false);
      navigate('/dashboard', {
        state: {
          flashMessage: `Saved "${created.title}" to your slam book shelf!`,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || 'Could not save your slam book. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="builder-page">
      <div className="container">
        {/* Top Builder Banner */}
        <div className="preview-mode-banner" role="region" aria-label="Template builder header">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Template Studio</span>
            <p className="preview-mode-banner__text">
              <strong>Starting from &ldquo;{matchedTemplate.title}&rdquo;:</strong> These questions
              have been copied into your new book. Edit anything you like, then save directly to
              your private shelf.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button variant="secondary" size="sm" onClick={handleCancel} disabled={isSaving}>
              &larr; Switch Template
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="builder-grid">
          {/* Left Column: Book Settings & Question Editor */}
          <section className="builder-editor" aria-labelledby="builder-editor-heading">
            <div className="paper-card builder-card">
              <span className="washi-tape" aria-hidden="true" />

              <div className="builder-card__header">
                <span className="badge badge--pink">{matchedTemplate.badge}</span>
                <h1 id="builder-editor-heading" className="builder-card__title">
                  Customise &ldquo;{matchedTemplate.title}&rdquo; Slam Book
                </h1>
                <p className="builder-card__subtitle">
                  Make this slam book unmistakably yours before saving it to your shelf.
                </p>
              </div>

              {/* Book Title, Description, Cover Theme & Status */}
              <div className="builder-form-section">
                <div className="form-group">
                  <label htmlFor="template-book-title" className="form-label">
                    Slam book title <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="template-book-title"
                    type="text"
                    maxLength={100}
                    className="form-input"
                    value={bookTitle}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    required
                  />
                  <span className="form-hint">{bookTitle.length}/100 characters</span>
                </div>

                <div className="form-group">
                  <label htmlFor="template-book-desc" className="form-label">
                    Welcome note / description
                  </label>
                  <textarea
                    id="template-book-desc"
                    rows={3}
                    maxLength={500}
                    className="form-input form-textarea"
                    value={bookDescription}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookDescription(e.target.value);
                      setIsDirty(true);
                    }}
                  />
                  <span className="form-hint">{bookDescription.length}/500 characters</span>
                </div>

                {/* Cover Colour Theme Selector */}
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
                        }}
                        aria-pressed={coverTheme === theme.id}
                      >
                        <span className="theme-swatch__dot" aria-hidden="true" />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Book Status Selector */}
                <div className="form-group">
                  <label htmlFor="template-book-status" className="form-label">
                    Book status
                  </label>
                  <select
                    id="template-book-status"
                    className="form-input"
                    value={bookStatus}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookStatus(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="published">Published (Public link open for friend responses)</option>
                    <option value="draft">Draft (Private — only visible to you)</option>
                    <option value="closed">Closed (Public link shows responses are closed)</option>
                  </select>
                  <span className="form-hint">
                    {(BOOK_STATUS_META[bookStatus] || BOOK_STATUS_META.draft).shortNote}
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div className="builder-questions-section">
                <div className="builder-questions-header">
                  <h2 className="builder-section-heading">
                    Questions ({questions.length}/50)
                  </h2>
                  <span className="form-hint">
                    Edit any prompt directly or use the Up/Down buttons to reorder.
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="preview-inline-notice">
                    <p>No questions in this book yet. Add at least one question below before saving.</p>
                  </div>
                ) : (
                  <ol className="builder-questions-list">
                    {questions.map((question, index) => (
                      <li key={question.id} className="builder-question-item">
                        <div className="builder-question-item__top">
                          <span className="builder-question-number">Q{index + 1}</span>

                          <label
                            htmlFor={`q-type-${question.id}`}
                            className="sr-only"
                          >
                            Question {index + 1} type
                          </label>
                          <select
                            id={`q-type-${question.id}`}
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
                          htmlFor={`q-input-${question.id}`}
                          className="sr-only"
                        >
                          Question {index + 1} prompt
                        </label>
                        <input
                          id={`q-input-${question.id}`}
                          type="text"
                          className="form-input"
                          value={question.text}
                          disabled={isSaving}
                          onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                        />

                        {question.type === 'multiple_choice' && (
                          <div style={{ marginTop: '8px' }}>
                            <label
                              htmlFor={`q-options-${question.id}`}
                              className="form-label"
                              style={{ fontSize: '0.82rem' }}
                            >
                              Choices (comma-separated, at least 2):
                            </label>
                            <input
                              id={`q-options-${question.id}`}
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

                {/* Add a New Custom Question */}
                <form className="add-question-box" onSubmit={handleAddQuestion}>
                  <h3 className="add-question-box__title">+ Add another question</h3>
                  <div className="add-question-box__row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="new-question-prompt" className="form-label">
                        Question prompt
                      </label>
                      <input
                        id="new-question-prompt"
                        type="text"
                        className="form-input"
                        placeholder="e.g., What song reminds you of our group?"
                        value={newPrompt}
                        disabled={isSaving}
                        onChange={(e) => setNewPrompt(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="new-question-type" className="form-label">
                        Answer style
                      </label>
                      <select
                        id="new-question-type"
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
                      <label htmlFor="new-question-options" className="form-label">
                        Multiple choice options (comma-separated)
                      </label>
                      <input
                        id="new-question-options"
                        type="text"
                        className="form-input"
                        placeholder="Option 1, Option 2, Option 3"
                        value={newOptionsText}
                        disabled={isSaving}
                        onChange={(e) => setNewOptionsText(e.target.value)}
                      />
                    </div>
                  )}

                  <Button type="submit" variant="secondary" size="sm" disabled={isSaving}>
                    + Add Question to Page
                  </Button>
                </form>
              </div>

              <div className="builder-card__footer">
                <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleSaveBook('draft')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleSaveBook(bookStatus)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving to Shelf...' : 'Save Slam Book'}
                </Button>
              </div>
            </div>
          </section>

          {/* Right Column: Live Scrapbook Page Preview */}
          <aside className="builder-live-preview" aria-label="Live slam book page preview">
            <div className={`paper-card live-preview-card live-preview-card--${coverTheme}`}>
              <span className="washi-tape tape-lavender" aria-hidden="true" />

              <div className="live-preview-card__header">
                <div className="live-preview-card__stickers" aria-hidden="true">
                  <HeartSticker size={20} />
                  <FlowerSticker size={20} />
                  <StarSticker size={20} />
                </div>
                <span className="live-preview-card__eyebrow">
                  Live Preview &bull; {bookStatus === 'published' ? 'Published' : 'Draft'}
                </span>
                <h2 className="live-preview-card__title">
                  {bookTitle || 'Untitled Slam Book'}
                </h2>
                <p className="live-preview-card__desc">
                  {bookDescription || 'Fill out a page in my personal slam book!'}
                </p>
              </div>

              <div className="live-preview-card__sheet">
                {questions.slice(0, 6).map((q, idx) => (
                  <div key={q.id} className="live-preview-field">
                    <span className="live-preview-field__label">
                      {idx + 1}. {q.text || 'Untitled question'}
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

                {questions.length > 6 && (
                  <p className="live-preview-more">
                    + {questions.length - 6} more questions in this slam book
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TemplateBuilderPreview;
