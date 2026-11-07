import React from 'react';
import Button from './Button';
import { HeartSticker, StarSticker } from '../assets/ScrapbookDoodles';

/**
 * Reusable BookCard component displaying a user's slam book on the Dashboard.
 */
export default function BookCard({ book, onSelectBook, onCopySharePreview }) {
  const statusClass =
    book.statusCode === 'active'
      ? 'status-active'
      : book.statusCode === 'draft'
      ? 'status-draft'
      : 'status-closed';

  return (
    <article className="book-card" aria-label={book.title}>
      <div className={`washi-tape ${book.tapeClass || ''}`} aria-hidden="true" />

      <div
        className="book-cover-banner"
        style={{ backgroundColor: book.coverColor || '#FAD2DD' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
          }}
          aria-hidden="true"
        >
          {book.statusCode === 'active' ? (
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
            {book.themeName}
          </span>
          <h3 style={{ fontSize: '1.45rem', color: '#261F1C' }}>{book.title}</h3>
        </div>
      </div>

      <div className="book-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span className={`status-badge ${statusClass}`}>{book.status}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
            Updated {book.lastUpdated}
          </span>
        </div>

        <p style={{ fontSize: '0.92rem', marginTop: '4px' }}>{book.subtitle}</p>

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
          <span>{book.responseCount} Friend Entries</span>
          <span>&bull;</span>
          <span>{book.questionCount} Questions</span>
        </div>
      </div>

      <div className="book-card-footer">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSelectBook(book)}
        >
          View Memories ({book.responseCount})
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopySharePreview(book)}
          aria-label={`Preview share link for ${book.title}`}
        >
          Share Link
        </Button>
      </div>
    </article>
  );
}

