import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { BOOK_TEMPLATES } from '../data/mockBooks';
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
  { id: 'polaroid_prompt', label: 'Memory / Vibe Check' },
];

/**
 * TemplateBuilderPreview Page (/create/template/:id)
 * Milestone 1 interactive preview screen for customising a chosen template.
 * Clearly indicates that cloud saving to Firestore will be connected in Milestone 3.
 */
function TemplateBuilderPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const matchedTemplate = BOOK_TEMPLATES.find((t) => t.id === id);

  const [bookTitle, setBookTitle] = useState(
    matchedTemplate ? `My ${matchedTemplate.title} Slam Book` : 'My Custom Slam Book'
  );
  const [bookDescription, setBookDescription] = useState(
    matchedTemplate ? matchedTemplate.description : ''
  );
  const [coverTheme, setCoverTheme] = useState('pink');
  const [questions, setQuestions] = useState(
    matchedTemplate
      ? matchedTemplate.defaultQuestions.map((q) => ({
          id: q.id,
          prompt: q.text,
          type: q.type,
          required: q.required,
        }))
      : []
  );

  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState('short_answer');
  const [previewSavedBanner, setPreviewSavedBanner] = useState(false);

  // Sync state if URL param changes to a different template ID
  useEffect(() => {
    const found = BOOK_TEMPLATES.find((t) => t.id === id);
    if (found) {
      setBookTitle(`My ${found.title} Slam Book`);
      setBookDescription(found.description);
      setQuestions(
        found.defaultQuestions.map((q) => ({
          id: q.id,
          prompt: q.text,
          type: q.type,
          required: q.required,
        }))
      );
      setPreviewSavedBanner(false);
    }
  }, [id]);

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
    const trimmed = newPrompt.trim();
    if (!trimmed) return;

    const nextQuestion = {
      id: `custom-${Date.now()}`,
      prompt: trimmed,
      type: newType,
      required: false,
    };

    setQuestions((prev) => [...prev, nextQuestion]);
    setNewPrompt('');
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated);
  };

  const handlePromptEdit = (questionId, updatedPrompt) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, prompt: updatedPrompt } : q))
    );
  };

  const handlePreviewSave = () => {
    setPreviewSavedBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="builder-page">
      <div className="container">
        {/* Milestone 1 Preview Mode Notice */}
        <div className="preview-mode-banner" role="status" aria-live="polite">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Milestone 1 Builder Preview</span>
            <p className="preview-mode-banner__text">
              <strong>Interactive Template Customiser ({matchedTemplate.title}):</strong> You can
              edit the book title, switch pastel cover colours, and add, edit, reorder, or delete
              questions below. Saving books to Cloud Firestore will be enabled in Milestone 3.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button to="/create" variant="secondary" size="sm">
              &larr; Switch Template
            </Button>
          </div>
        </div>

        {previewSavedBanner && (
          <div className="builder-saved-toast paper-card" role="alert">
            <div className="builder-saved-toast__content">
              <StarSticker size={22} />
              <div>
                <strong>Preview Saved! (&ldquo;{bookTitle}&rdquo;)</strong>
                <p>
                  In Milestone 1, your customised template with {questions.length} prompts is
                  previewed in browser memory. Ready to return to your dashboard?
                </p>
              </div>
            </div>
            <div className="builder-saved-toast__actions">
              <Button
                onClick={() =>
                  navigate('/dashboard', {
                    state: {
                      showPreviewBanner: true,
                      previewSource: 'builder',
                    },
                  })
                }
                variant="primary"
                size="sm"
              >
                Go to Dashboard &rarr;
              </Button>
            </div>
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
                  Customise &ldquo;{matchedTemplate.title}&rdquo; Template
                </h1>
                <p className="builder-card__subtitle">
                  Make this slam book unmistakably yours before sharing it with your friends.
                </p>
              </div>

              {/* Book Title & Description */}
              <div className="builder-form-section">
                <div className="form-group">
                  <label htmlFor="template-book-title" className="form-label">
                    Slam book title
                  </label>
                  <input
                    id="template-book-title"
                    type="text"
                    className="form-input"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="template-book-desc" className="form-label">
                    Welcome note for friends
                  </label>
                  <textarea
                    id="template-book-desc"
                    rows={3}
                    className="form-input form-textarea"
                    value={bookDescription}
                    onChange={(e) => setBookDescription(e.target.value)}
                  />
                </div>

                {/* Cover Colour Theme Selector */}
                <fieldset className="theme-fieldset">
                  <legend className="form-label">Scrapbook cover theme</legend>
                  <div className="theme-swatches">
                    {COVER_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        className={`theme-swatch theme-swatch--${theme.id} ${
                          coverTheme === theme.id ? 'theme-swatch--active' : ''
                        }`}
                        onClick={() => setCoverTheme(theme.id)}
                        aria-pressed={coverTheme === theme.id}
                      >
                        <span className="theme-swatch__dot" aria-hidden="true" />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Questions List */}
              <div className="builder-questions-section">
                <div className="builder-questions-header">
                  <h2 className="builder-section-heading">
                    Questions ({questions.length})
                  </h2>
                  <span className="form-hint">
                    Edit any prompt directly or use the arrows to reorder.
                  </span>
                </div>

                <ol className="builder-questions-list">
                  {questions.map((question, index) => (
                    <li key={question.id} className="builder-question-item">
                      <div className="builder-question-item__top">
                        <span className="builder-question-number">Q{index + 1}</span>
                        <span className="badge badge--sage">{question.type.replace('_', ' ')}</span>
                        <div className="builder-question-controls">
                          <button
                            type="button"
                            className="icon-control-btn"
                            onClick={() => handleMoveQuestion(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move question ${index + 1} up`}
                          >
                            &uarr;
                          </button>
                          <button
                            type="button"
                            className="icon-control-btn"
                            onClick={() => handleMoveQuestion(index, 1)}
                            disabled={index === questions.length - 1}
                            aria-label={`Move question ${index + 1} down`}
                          >
                            &darr;
                          </button>
                          <button
                            type="button"
                            className="icon-control-btn icon-control-btn--danger"
                            onClick={() => handleRemoveQuestion(question.id)}
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
                        value={question.prompt}
                        onChange={(e) => handlePromptEdit(question.id, e.target.value)}
                      />
                    </li>
                  ))}
                </ol>

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
                  <Button type="submit" variant="secondary" size="sm">
                    + Add Question to Page
                  </Button>
                </form>
              </div>

              <div className="builder-card__footer">
                <Button to="/create" variant="ghost">
                  Cancel
                </Button>
                <Button variant="primary" size="lg" onClick={handlePreviewSave}>
                  Save Slam Book (Preview)
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
                </div>
                <span className="live-preview-card__eyebrow">Live Friend View Preview</span>
                <h2 className="live-preview-card__title">
                  {bookTitle || 'Untitled Slam Book'}
                </h2>
                <p className="live-preview-card__desc">
                  {bookDescription || 'Fill out a page in my personal slam book!'}
                </p>
              </div>

              <div className="live-preview-card__sheet">
                {questions.slice(0, 5).map((q, idx) => (
                  <div key={q.id} className="live-preview-field">
                    <span className="live-preview-field__label">
                      {idx + 1}. {q.prompt}
                    </span>
                    <div className="live-preview-field__line" aria-hidden="true">
                      Friend&rsquo;s handwritten-style answer goes here...
                    </div>
                  </div>
                ))}

                {questions.length > 5 && (
                  <p className="live-preview-more">
                    + {questions.length - 5} more questions in this slam book
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
