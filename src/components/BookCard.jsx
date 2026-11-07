import React from 'react';
import Button from './Button';
import { HeartSticker, StarSticker } from '../assets/ScrapbookDoodles';

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
 * Reusable BookCard component displaying a user's saved slam book from Cloud Firestore.
 * Shows title, cover theme, status ("published" or "draft"), creation date, question count,
 * and provides Edit and Delete actions.
 */
export default function BookCard({ book, onDeleteRequest }) {
  const theme = THEME_CONFIG[book.coverTheme] || THEME_CONFIG.pink;
  const isPublished = book.status === 'published';
  const statusClass = isPublished ? 'status-active' : 'status-draft';
  const statusLabel = isPublished ? 'Published' : 'Draft';
  const questionCount = Array.isArray(book.questions) ? book.questions.length : 0;

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
          <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
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

        <p style={{ fontSize: '0.92rem', marginTop: '4px' }}>
          {book.description || 'No description added yet.'}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: 'auto',
            paddingTop: '10px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}
        >
          <span>
            {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
          </span>
          <span>&bull;</span>
          <span>{book.templateId ? `Template: ${book.templateId}` : 'Blank Custom'}</span>
        </div>
      </div>

      <div className="book-card-footer">
        <Button
          to={`/books/${book.id}/edit`}
          variant="secondary"
          size="sm"
        >
          Edit Book
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="btn-danger-ghost"
          onClick={() => onDeleteRequest(book)}
          aria-label={`Delete ${book.title}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
