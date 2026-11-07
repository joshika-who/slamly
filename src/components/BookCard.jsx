import React, { useState } from 'react';
import Button from './Button';
import { BOOK_STATUS_META, getBookShareUrl } from '../services/bookService';
import { HeartSticker, StarSticker, FlowerSticker } from '../assets/ScrapbookDoodles';

const THEME_CONFIG = {
  pink: {
    color: '#FAD2DD',
    label: 'Pastel Rose',
    tapeClass: '',
  },
  lavender: {
    color: '#E4DAF6',
    label: 'Soft Lavender',
    tapeClass: 'tape-lavender',
  },
  peach: {
    color: '#FDE0C6',
    label: 'Warm Peach',
    tapeClass: 'tape-peach',
  },
  sage: {
    color: '#D5E8DA',
    label: 'Sage Leaf',
    tapeClass: 'tape-sage',
  },
};

/**
 * Copies text to the clipboard with a safe fallback for older browsers.
 */
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
 * Reusable BookCard component displaying a user's saved slam book from Cloud Firestore.
 * Supports:
 * - Status display ("draft", "published", "closed") with plain-language explanation.
 * - Lazy-loaded response count with loading placeholder and graceful fallback.
 * - Quick status transitions via `onStatusChange(book, nextStatus)` (which calls `updateBook`).
 * - Copyable public share link (`${window.location.origin}/s/${book.id}`) shown only when published.
 * - View Responses (`/books/:bookId/responses`), Edit Book (`/books/:bookId/edit`), and Delete actions.
 */
export default function BookCard({
  book,
  onDeleteRequest,
  onStatusChange,
  isUpdatingStatus = false,
  responseCount,
  isLoadingResponseCount = false,
}) {
  const [copied, setCopied] = useState(false);

  const theme = THEME_CONFIG[book.coverTheme] || THEME_CONFIG.pink;
  const statusKey = BOOK_STATUS_META[book.status] ? book.status : 'draft';
  const statusMeta = BOOK_STATUS_META[statusKey];
  const isPublished = statusKey === 'published';
  const isClosed = statusKey === 'closed';
  const isDraft = statusKey === 'draft';

  const questionCount = Array.isArray(book.questions) ? book.questions.length : 0;
  const shareUrl = getBookShareUrl(book.id);

  const handleCopyShareLink = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      // Fallback: ignore if clipboard access is denied
    }
  };

  let responseCountText = 'Responses —';
  if (isLoadingResponseCount) {
    responseCountText = 'Loading responses...';
  } else if (typeof responseCount === 'number') {
    responseCountText = `${responseCount} ${responseCount === 1 ? 'Response' : 'Responses'}`;
  }

  return (
    <article className="book-card" aria-label={book.title}>
      <div className={`washi-tape ${theme.tapeClass}`} aria-hidden="true" />

      <div
        className="book-cover-banner"
        style={{ backgroundColor: theme.color }}
      >
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
          }}
          aria-hidden="true"
        >
          {isPublished ? (
            <HeartSticker size={26} fill="#FFFDF9" />
          ) : isClosed ? (
            <FlowerSticker size={26} fill="#FFFDF9" />
          ) : (
            <StarSticker size={26} fill="#FFFDF9" />
          )}
        </div>

        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(255, 253, 249, 0.88)',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1.5px solid #261F1C',
              marginBottom: '6px',
            }}
          >
            {theme.label} Theme
          </span>
          <h3 style={{ fontSize: '1.45rem', color: '#261F1C' }}>{book.title}</h3>
        </div>
      </div>

      <div className="book-card-body">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className={`status-badge ${statusMeta.badgeClass}`}>
            {statusMeta.label}
          </span>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--color-ink-soft)',
              fontWeight: 600,
            }}
          >
            Created {book.formattedDate || 'Just now'}
          </span>
        </div>

        {/* Plain-language status explanation */}
        <p className="book-status-note">{statusMeta.shortNote}</p>

        <p style={{ fontSize: '0.92rem', marginTop: '2px' }}>
          {book.description || 'No description added yet.'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '8px',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}
        >
          <span>
            {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
          </span>
          <span>&bull;</span>
          <span className="book-card-response-pill" aria-live="polite">
            {responseCountText}
          </span>
          <span>&bull;</span>
          <span>{book.templateId ? `Template: ${book.templateId}` : 'Blank Custom'}</span>
        </div>

        {/* Share Link Box — ONLY shown for published books */}
        {isPublished && (
          <div className="book-share-box" aria-label="Public share link">
            <div className="book-share-box__url" title={shareUrl}>
              {shareUrl}
            </div>
            <div className="book-share-box__actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyShareLink}
              >
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
              {copied && (
                <span className="sr-only" role="status" aria-live="polite">
                  Share link copied to clipboard!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Status Controls */}
        {onStatusChange && (
          <div className="book-status-actions" aria-label={`Change status for ${book.title}`}>
            {isDraft && (
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => onStatusChange(book, 'published')}
              >
                {isUpdatingStatus ? 'Updating...' : 'Publish Book'}
              </Button>
            )}

            {isPublished && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(book, 'closed')}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Close Responses'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(book, 'draft')}
                >
                  Move to Draft
                </Button>
              </>
            )}

            {isClosed && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(book, 'published')}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Reopen Book'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(book, 'draft')}
                >
                  Move to Draft
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="book-card-footer">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Button
            to={`/books/${book.id}/responses`}
            variant="primary"
            size="sm"
            disabled={isUpdatingStatus}
          >
            View Responses
          </Button>
          <Button
            to={`/books/${book.id}/edit`}
            variant="secondary"
            size="sm"
            disabled={isUpdatingStatus}
          >
            Edit Book
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="btn-danger-ghost"
          onClick={() => onDeleteRequest(book)}
          disabled={isUpdatingStatus}
          aria-label={`Delete ${book.title}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
