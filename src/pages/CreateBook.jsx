import React from 'react';
import Button from '../components/Button';
import { BOOK_TEMPLATES } from '../data/mockBooks';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * Create Slam Book Page (/create)
 * Lets the user choose how to start their new personal slam book:
 * - Option 1: Choose a ready-made template (Friendship, College memories,
 *             School farewell, Birthday, Get to know me) -> /create/template/:id
 * - Option 2: Start from scratch -> /create/blank
 */
function CreateBook() {
  return (
    <div className="create-page">
      <div className="container">
        {/* Page Header */}
        <header className="create-header">
          <div className="create-header__top">
            <Button to="/dashboard" variant="ghost" size="sm">
              &larr; Back to Dashboard
            </Button>
            <span className="badge badge--pink">Step 1 of 2 &bull; Choose Your Starting Point</span>
          </div>

          <h1 className="create-header__title">
            Create a new personal slam book
          </h1>
          <p className="create-header__subtitle">
            Pick one of our nostalgic ready-made templates and tweak the questions, or start with a
            fresh blank page and write your own prompts from scratch.
          </p>
        </header>

        {/* Option 1: Choose a template */}
        <section
          className="create-option-section"
          aria-labelledby="templates-option-heading"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-eyebrow">
                <StarSticker size={16} /> Option 1: Ready-Made Keepsake Templates
              </span>
              <h2 id="templates-option-heading" className="section-title">
                Choose a template
              </h2>
              <p className="section-description">
                Every template comes pre-filled with thoughtful questions you can reorder, edit, or
                add to on the next screen.
              </p>
            </div>
          </div>

          <div className="templates-grid">
            {BOOK_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="paper-card template-card"
                style={{ borderTop: `8px solid ${template.coverColor}` }}
              >
                <span
                  className={`washi-tape ${template.tapeClass || ''}`}
                  aria-hidden="true"
                />

                <div className="template-card__top">
                  <span className="template-card__badge">{template.badge}</span>
                  <span className="template-card__count">
                    {template.defaultQuestions.length} prompts
                  </span>
                </div>

                <h3 className="template-card__title">{template.title}</h3>
                <p className="template-card__tagline">{template.tagline}</p>
                <p className="template-card__description">{template.description}</p>

                <div className="template-card__sample-box">
                  <p className="template-card__sample-label">Sample questions inside:</p>
                  <ul className="template-card__sample-list">
                    {template.defaultQuestions.slice(0, 3).map((q) => (
                      <li key={q.id}>&ldquo;{q.text}&rdquo;</li>
                    ))}
                  </ul>
                </div>

                <div className="template-card__footer">
                  <Button
                    to={`/create/template/${template.id}`}
                    variant="primary"
                    className="btn-full"
                  >
                    Use &ldquo;{template.title}&rdquo; Template &rarr;
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Option 2: Start from scratch */}
        <section
          className="create-scratch-section"
          aria-labelledby="scratch-option-heading"
        >
          <div className="paper-card scratch-banner">
            <span className="washi-tape tape-sage" aria-hidden="true" />

            <div className="scratch-banner-card__content">
              <div className="scratch-banner-card__eyebrow">
                <HeartSticker size={18} />
                <FlowerSticker size={18} />
                <span>Option 2: Complete Creative Freedom</span>
              </div>

              <h2 id="scratch-option-heading" className="scratch-banner-card__title">
                Prefer to start from scratch?
              </h2>

              <p className="scratch-banner-card__description">
                Begin with a blank scrapbook canvas. Name your slam book, choose your favourite
                pastel cover theme, and craft every single question in your own voice.
              </p>

              <ul className="scratch-feature-pills" aria-label="Blank builder capabilities">
                <li>Custom Cover Colours</li>
                <li>Unlimited Questions</li>
                <li>Multiple Question Types</li>
                <li>Reorder &amp; Preview Live</li>
              </ul>
            </div>

            <div className="scratch-banner-card__action">
              <Button to="/create/blank" variant="primary" size="lg">
                Start from scratch &rarr;
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CreateBook;
