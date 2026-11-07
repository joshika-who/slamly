import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/Button';
import BookCard from '../components/BookCard';
import { MOCK_SLAM_BOOKS, MOCK_USER_PROFILE } from '../data/mockBooks';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
  PolaroidIllustration,
} from '../assets/ScrapbookDoodles';

/**
 * Dashboard Page (/dashboard)
 * Displays the user's personal slam book shelf using mock data in Milestone 1.
 * Includes:
 * - "Preview mode: no real account created" banner
 * - Welcome message
 * - "Create new slam book" button
 * - "My slam books" grid with BookCard components
 * - Toggleable Empty State for new users
 * - Interactive modal to preview sample responses or share links for any book
 */
function Dashboard() {
  const location = useLocation();
  const routeState = location.state || {};

  const displayUserName = routeState.userName || MOCK_USER_PROFILE.displayName;
  const previewSource = routeState.previewSource || null;

  const [statusFilter, setStatusFilter] = useState('All');
  const [simulateEmptyState, setSimulateEmptyState] = useState(false);
  const [selectedBookForMemories, setSelectedBookForMemories] = useState(null);
  const [selectedBookForShare, setSelectedBookForShare] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const books = simulateEmptyState ? [] : MOCK_SLAM_BOOKS;

  const filteredBooks =
    statusFilter === 'All'
      ? books
      : books.filter((book) => book.status.toLowerCase() === statusFilter.toLowerCase());

  const totalResponses = books.reduce((sum, book) => sum + book.responseCount, 0);
  const activeBooksCount = books.filter((book) => book.status === 'Open').length;

  const handleOpenMemories = (book) => {
    setSelectedBookForMemories(book);
  };

  const handleOpenShare = (book) => {
    setSelectedBookForShare(book);
    setCopiedLink(false);
  };

  const handleCopyShareLink = (slug) => {
    const shareUrl = `https://${slug}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedLink(true);
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Required Milestone 1 Preview Mode Banner */}
        <div
          className="preview-mode-banner"
          role="status"
          aria-live="polite"
        >
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Milestone 1</span>
            <p className="preview-mode-banner__text">
              <strong>Preview mode: no real account created.</strong>{' '}
              {previewSource === 'signup' &&
                `Welcome, ${displayUserName}! Your signup form passed frontend validation. `}
              {previewSource === 'login' &&
                `Welcome back, ${displayUserName}! Your login form passed frontend validation. `}
              You are viewing Slamly with sample slam books. Real Firebase Authentication and Cloud
              Firestore persistence will be connected in Milestone 2.
            </p>
          </div>
          <div className="preview-mode-banner__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSimulateEmptyState((prev) => !prev)}
              aria-pressed={simulateEmptyState}
            >
              {simulateEmptyState ? 'Show Sample Books (4)' : 'Preview New User Empty State'}
            </Button>
          </div>
        </div>

        {/* Welcome Header Banner */}
        <header className="dashboard-welcome-card paper-card">
          <span className="washi-tape" aria-hidden="true" />
          <div className="dashboard-header__main">
            <div className="dashboard-header__greeting">
              <div className="dashboard-header__eyebrow">
                <StarSticker size={18} />
                <span>Personal Memory Shelf</span>
              </div>
              <h1 className="dashboard-header__title">
                Welcome back, {displayUserName}!
              </h1>
              <p className="dashboard-header__subtitle">
                Manage your personal slam books, read what friends have written, or start a brand
                new keepsake book for your next chapter.
              </p>
            </div>

            <div className="dashboard-header__cta">
              <Button to="/create" variant="primary" size="lg">
                + Create new slam book
              </Button>
            </div>
          </div>

          {/* Quick Shelf Statistics */}
          <div className="dashboard-stats" aria-label="Slam book summary statistics">
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{books.length}</span>
              <span className="dashboard-stat-pill__label">Slam Books</span>
            </div>
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{totalResponses}</span>
              <span className="dashboard-stat-pill__label">Friend Responses</span>
            </div>
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{activeBooksCount}</span>
              <span className="dashboard-stat-pill__label">Open for Replies</span>
            </div>
          </div>
        </header>

        {/* My Slam Books Section */}
        <section className="dashboard-books-section" aria-labelledby="my-books-heading">
          <div className="dashboard-toolbar">
            <div>
              <h2 id="my-books-heading" className="dashboard-section-title">
                My slam books
              </h2>
              <p className="dashboard-section-subtitle">
                Each slam book has its own custom questions, theme colour, and share link.
              </p>
            </div>

            {!simulateEmptyState && (
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filter slam books by status"
              >
                {['All', 'Open', 'Draft', 'Closed'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab)}
                    aria-pressed={statusFilter === tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Empty State for New Users */}
          {filteredBooks.length === 0 ? (
            <div className="empty-state paper-card" role="region" aria-label="No slam books found">
              <span className="washi-tape tape-lavender" aria-hidden="true" />
              <div className="empty-state__illustration">
                <PolaroidIllustration caption="Your first memory book awaits!" />
              </div>
              <div className="empty-state__content">
                <div className="empty-state__stickers" aria-hidden="true">
                  <HeartSticker size={22} />
                  <FlowerSticker size={22} />
                  <StarSticker size={22} />
                </div>
                <h3 className="empty-state__title">
                  {simulateEmptyState
                    ? 'Your slam book shelf is waiting for its first story!'
                    : `No "${statusFilter}" slam books found`}
                </h3>
                <p className="empty-state__description">
                  {simulateEmptyState
                    ? 'Start with a ready-made template like Friendship, College Memories, or School Farewell — or build your own custom slam book from scratch.'
                    : 'Try switching the status filter back to "All" or create a new slam book.'}
                </p>
                <div className="empty-state__actions">
                  <Button to="/create" variant="primary" size="lg">
                    + Create your first slam book
                  </Button>
                  {simulateEmptyState ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setSimulateEmptyState(false)}
                    >
                      Restore sample books
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setStatusFilter('All')}
                    >
                      Show all books
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelectBook={handleOpenMemories}
                  onCopySharePreview={handleOpenShare}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal 1: Sample Memories / Responses Viewer */}
      {selectedBookForMemories && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memories-modal-title"
        >
          <div className="paper-card modal-card">
            <span className="washi-tape" aria-hidden="true" />
            <div className="modal-card__header">
              <div>
                <span className="badge badge--sage">{selectedBookForMemories.themeName}</span>
                <h3 id="memories-modal-title" className="modal-card__title">
                  {selectedBookForMemories.title}
                </h3>
                <p className="modal-card__subtitle">
                  {selectedBookForMemories.responseCount} responses collected &bull; Previewing
                  sample friend entries
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBookForMemories(null)}
                aria-label="Close memories preview"
              >
                &times;
              </button>
            </div>

            <div className="modal-card__body">
              {selectedBookForMemories.sampleResponses &&
              selectedBookForMemories.sampleResponses.length > 0 ? (
                <div className="sample-responses-list">
                  {selectedBookForMemories.sampleResponses.map((entry, idx) => (
                    <article key={idx} className="sample-response-card">
                      <div className="sample-response-card__header">
                        <strong>{entry.friendName}</strong>
                        <span className="sample-response-card__nickname">
                          One word for you: &ldquo;{entry.oneWordForMe}&rdquo;
                        </span>
                      </div>
                      <p className="sample-response-card__quote">
                        &ldquo;{entry.favoriteMemory}&rdquo;
                      </p>
                      <span className="sample-response-card__song">
                        Dedication song: {entry.songDedication}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="preview-inline-notice">
                  <p>
                    This book is currently a <strong>Draft</strong> and hasn&rsquo;t been shared
                    with friends yet. Once you publish and share the link in Milestone 4, friend
                    responses will appear right here!
                  </p>
                </div>
              )}
            </div>

            <div className="modal-card__footer">
              <Button
                to="/create/template/friendship"
                variant="secondary"
              >
                Customise Questions
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedBookForMemories(null)}
              >
                Done Reading
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Share Link Preview Modal */}
      {selectedBookForShare && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <div className="paper-card modal-card">
            <span className="washi-tape tape-sage" aria-hidden="true" />
            <div className="modal-card__header">
              <div>
                <span className="badge badge--lavender">Shareable Link Preview</span>
                <h3 id="share-modal-title" className="modal-card__title">
                  Invite friends to sign &ldquo;{selectedBookForShare.title}&rdquo;
                </h3>
                <p className="modal-card__subtitle">
                  Friends can answer your slam book directly from their browser without creating an
                  account.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBookForShare(null)}
                aria-label="Close share modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-card__body">
              <label htmlFor="share-url-input" className="form-label">
                Unique slam book link (Milestone 4 preview)
              </label>
              <div className="share-link-box">
                <input
                  id="share-url-input"
                  type="text"
                  readOnly
                  className="form-input"
                  value={`https://${selectedBookForShare.shareSlug}`}
                />
                <Button
                  variant="primary"
                  onClick={() => handleCopyShareLink(selectedBookForShare.shareSlug)}
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              <div className="preview-inline-notice" style={{ marginTop: '1rem' }}>
                <p>
                  <strong>Roadmap Note:</strong> Public friend response links and real-time response
                  collection will be enabled in Milestone 4 once Firestore is connected.
                </p>
              </div>
            </div>

            <div className="modal-card__footer">
              <Button
                variant="secondary"
                onClick={() => setSelectedBookForShare(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
