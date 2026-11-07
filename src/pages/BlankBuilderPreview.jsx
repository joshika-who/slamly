import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
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
  { id: 'polaroid_prompt', label: 'Memory / Vibe Check' },
];

/**
 * BlankBuilderPreview Page (/create/blank)
 * Milestone 1 interactive preview screen for building a slam book from scratch.
 * Allows naming the book, choosing a cover colour, and adding custom questions.
 */
function BlankBuilderPreview() {
  const navigate = useNavigate();

  const [bookTitle, setBookTitle] = useState('My Custom Friendship Book');
  const [bookDescription, setBookDescription] = useState(
    'Leave a page of memories, inside jokes, and honest confessions for me to keep!'
  );
  const [coverTheme, setCoverTheme] = useState('peach');
  const [questions, setQuestions] = useState([
    {
      id: 'blank-q-1',
      prompt: 'What is your name and how did we first meet?',
      type: 'short_answer',
    },
    {
      id: 'blank-q-2',
      prompt: 'What is a memory of us that always makes you laugh?',
      type: 'paragraph',
    },
    {
      id: 'blank-q-3',
      prompt: 'Write a message for me to open five years from today:',
      type: 'paragraph',
    },
  ]);

  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState('short_answer');
  const [previewSavedBanner, setPreviewSavedBanner] = useState(false);

  const handleAddQuestion = (event) => {
    event.preventDefault();
    const trimmed = newPrompt.trim();
    if (!trimmed) return;

    setQuestions((prev) => [
      ...prev,
      {
        id: `blank-q-${Date.now()}`,
        prompt: trimmed,
        type: newType,
      },
    ]);
    setNewPrompt('');
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setQuestions(copy);
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
        {/* Milestone 1 Preview Mode Banner */}
        <div className="preview-mode-banner" role="status" aria-live="polite">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Milestone 1 Blank Builder Preview</span>
            <p className="preview-mode-banner__text">
              <strong>Start From Scratch Studio:</strong> Design your own custom slam book layout
              and prompts. Full Cloud Firestore persistence and share link generation will be
              connected in Milestone 3.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button to="/create" variant="secondary" size="sm">
              &larr; Back to Templates
            </Button>
          </div>
        </div>

        {previewSavedBanner && (
          <div className="builder-saved-toast paper-card" role="alert">
            <div className="builder-saved-toast__content">
              <StarSticker size={22} />
              <div>
                <strong>Custom Slam Book Preview Ready! (&ldquo;{bookTitle}&rdquo;)</strong>
                <p>
                  You designed a custom slam book with {questions.length} questions. In Milestone 3,
                  this button will save your book directly to Cloud Firestore.
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
                Return to Dashboard &rarr;
              </Button>
            </div>
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
                    Slam book title
                  </label>
                  <input
                    id="blank-book-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Hostel Wing B Memories"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="blank-book-desc" className="form-label">
                    Welcome note for friends
                  </label>
                  <textarea
                    id="blank-book-desc"
                    rows={3}
                    className="form-input form-textarea"
                    placeholder="Write a warm note explaining what this slam book is for..."
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

              {/* Custom Questions Builder */}
              <div className="builder-questions-section">
                <div className="builder-questions-header">
                  <h2 className="builder-section-heading">
                    Your Custom Prompts ({questions.length})
                  </h2>
                  <span className="form-hint">
                    Add as many prompts as you like or reorder them below.
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
                          <span className="badge badge--lavender">
                            {question.type.replace('_', ' ')}
                          </span>
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
                          htmlFor={`blank-q-input-${question.id}`}
                          className="sr-only"
                        >
                          Question {index + 1} prompt
                        </label>
                        <input
                          id={`blank-q-input-${question.id}`}
                          type="text"
                          className="form-input"
                          value={question.prompt}
                          onChange={(e) => handlePromptEdit(question.id, e.target.value)}
                        />
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
                    + Add Question
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
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />

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
                {questions.map((q, idx) => (
                  <div key={q.id} className="live-preview-field">
                    <span className="live-preview-field__label">
                      {idx + 1}. {q.prompt}
                    </span>
                    <div className="live-preview-field__line" aria-hidden="true">
                      Friend&rsquo;s handwritten-style answer goes here...
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

