import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import {
  createBook,
  createQuestionId,
} from '../services/bookService';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const COVER_THEMES = [
  { id: 'peach', label: 'Warm Peach' },
  { id: 'pink', label: 'Pastel Rose' },
  { id: 'lavender', label: 'Soft Lavender' },
  { id: 'sage', label: 'Sage Leaf' },
];

const QUESTION_TYPES = [
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'paragraph', label: 'Long Story / Paragraph' },
  { id: 'date', label: 'Date / Memory Date' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'polaroid_prompt', label: 'Memory / Vibe Check' },
];

/**
 * BlankBuilderPreview Page (/create/blank)
 * Connects blank slam book creation to Cloud Firestore in Milestone 3:
 * - Validates title, description, coverTheme, status, and questions.
 * - Saves the new book to `books/{bookId}` with `templateId: null` via `createBook()`.
 * - Redirects to `/dashboard` after saving.
 */
function BlankBuilderPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookTitle, setBookTitle] = useState('My Custom Friendship Book');
  const [bookDescription, setBookDescription] = useState(
    'Leave a page of memories, inside jokes, and honest confessions for me to keep!'
  );
  const [coverTheme, setCoverTheme] = useState('peach');
  const [bookStatus, setBookStatus] = useState('published');
  const [questions, setQuestions] = useState(() => [
    {
      id: createQuestionId(),
      text: 'What is your name and how did we first meet?',
      type: 'short_answer',
      order: 0,
      required: true,
    },
    {
      id: createQuestionId(),
      text: 'What is a memory of us that always makes you laugh?',
      type: 'paragraph',
      order: 1,
      required: true,
    },
    {
      id: createQuestionId(),
      text: 'Write a message for me to open five years from today:',
      type: 'paragraph',
      order: 2,
      required: false,
    },
  ]);

  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState('short_answer');
  const [newOptionsText, setNewOptionsText] = useState('Option 1, Option 2');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Warn before closing or refreshing the browser tab when unsaved changes exist
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

    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setQuestions(copy.map((q, idx) => ({ ...q, order: idx })));
    setIsDirty(true);
  };

  const handleQuestionTextChange = (questionId, updatedText) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, text: updatedText } : q))
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

    if (!bookTitle.trim()) {
      setErrorMessage('Please enter a title for your slam book before saving.');
      return;
    }

    const finalStatus = statusOverride || bookStatus;
    setIsSaving(true);

    try {
      const created = await createBook(user?.uid, {
        title: bookTitle,
        description: bookDescription,
        templateId: null,
        coverTheme,
        status: finalStatus,
        questions,
      });

      setIsDirty(false);
      navigate('/dashboard', {
        state: {
          flashMessage: `Created "${created.title}" on your slam book shelf!`,
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
        {/* Top Studio Banner */}
        <div className="preview-mode-banner" role="region" aria-label="Blank studio header">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Blank Canvas Studio</span>
            <p className="preview-mode-banner__text">
              <strong>Start From Scratch:</strong> Design your own custom slam book layout, cover
              theme, and questions, then save directly to your private shelf.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button variant="secondary" size="sm" onClick={handleCancel} disabled={isSaving}>
              &larr; Back to Templates
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="builder-grid">
          {/* Left Column: Blank Builder Editor */}
          <section className="builder-editor" aria-labelledby="blank-builder-heading">
            <div className="paper-card builder-card">
              <span className="washi-tape washi-tape--sage" aria-hidden="true" />

              <div className="builder-card__header">
                <span className="badge badge--peach">Blank Canvas Studio</span>
                <h1 id="blank-builder-heading" className="builder-card__title">
                  Build your slam book from scratch
                </h1>
                <p className="builder-card__subtitle">
                  Give your book a title, pick a pastel cover, and write custom prompts for your
                  circle of friends.
                </p>
              </div>

              <div className="builder-form-section">
                <div className="form-group">
                  <label htmlFor="blank-book-title" className="form-label">
                    Slam book title <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="blank-book-title"
                    type="text"
                    maxLength={100}
                    className="form-input"
                    placeholder="e.g., Hostel Wing B Memories"
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
                  <label htmlFor="blank-book-desc" className="form-label">
                    Welcome note / description
                  </label>
                  <textarea
                    id="blank-book-desc"
                    rows={3}
                    maxLength={500}
                    className="form-input form-textarea"
                    placeholder="Write a warm note explaining what this slam book is for..."
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
                  <label htmlFor="blank-book-status" className="form-label">
                    Book status
                  </label>
                  <select
                    id="blank-book-status"
                    className="form-input"
                    value={bookStatus}
                    disabled={isSaving}
                    onChange={(e) => {
                      setBookStatus(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="published">Published (Ready on my shelf)</option>
                    <option value="draft">Draft (Still working on questions)</option>
                  </select>
                </div>
              </div>

              {/* Custom Questions Builder */}
              <div className="builder-questions-section">
                <div className="builder-questions-header">
                  <h2 className="builder-section-heading">
                    Your Custom Prompts ({questions.length}/50)
                  </h2>
                  <span className="form-hint">
                    Add up to 50 prompts or reorder them with the Up/Down buttons.
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="preview-inline-notice">
                    <p>No questions yet! Use the form below to add your first slam book prompt.</p>
                  </div>
                ) : (
                  <ol className="builder-questions-list">
                    {questions.map((question, index) => (
                      <li key={question.id} className="builder-question-item">
                        <div className="builder-question-item__top">
                          <span className="builder-question-number">Q{index + 1}</span>

                          <label
                            htmlFor={`blank-q-type-${question.id}`}
                            className="sr-only"
                          >
                            Question {index + 1} type
                          </label>
                          <select
                            id={`blank-q-type-${question.id}`}
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
                          htmlFor={`blank-q-input-${question.id}`}
                          className="sr-only"
                        >
                          Question {index + 1} prompt
                        </label>
                        <input
                          id={`blank-q-input-${question.id}`}
                          type="text"
                          className="form-input"
                          value={question.text}
                          disabled={isSaving}
                          onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                        />

                        {question.type === 'multiple_choice' && (
                          <div style={{ marginTop: '8px' }}>
                            <label
                              htmlFor={`blank-q-options-${question.id}`}
                              className="form-label"
                              style={{ fontSize: '0.82rem' }}
                            >
                              Choices (comma-separated, at least 2):
                            </label>
                            <input
                              id={`blank-q-options-${question.id}`}
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

                {/* Add Question Form */}
                <form className="add-question-box" onSubmit={handleAddQuestion}>
                  <h3 className="add-question-box__title">+ Add a custom question</h3>
                  <div className="add-question-box__row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="blank-new-prompt" className="form-label">
                        Question prompt
                      </label>
                      <input
                        id="blank-new-prompt"
                        type="text"
                        className="form-input"
                        placeholder="e.g., What is your secret nickname for me?"
                        value={newPrompt}
                        disabled={isSaving}
                        onChange={(e) => setNewPrompt(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="blank-new-type" className="form-label">
                        Answer style
                      </label>
                      <select
                        id="blank-new-type"
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
                      <label htmlFor="blank-new-options" className="form-label">
                        Multiple choice options (comma-separated)
                      </label>
                      <input
                        id="blank-new-options"
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
                    + Add Question
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
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />

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
                {questions.map((q, idx) => (
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
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BlankBuilderPreview;
