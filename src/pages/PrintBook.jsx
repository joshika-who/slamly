import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/ProtectedRoute';
import { getBookById } from '../services/bookService';
import {
  MAX_PRINT_RESPONSES,
  fetchAllResponses,
} from '../services/pdfExportService';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const THEME_LABELS = {
  pink: 'Pastel Rose',
  lavender: 'Soft Lavender',
  peach: 'Warm Peach',
  sage: 'Sage Leaf',
};

/**
 * Multi-script font stack with explicit system fallbacks for Latin, Tamil, Devanagari (Hindi),
 * and full-color Emoji so native browser print/Save-as-PDF renders every script accurately.
 */
export const MULTILINGUAL_PRINT_FONT_STACK =
  "'DM Sans', 'Nirmala UI', 'Latha', 'InaiMathi', 'Tamil Sangam MN', 'Kohinoor Devanagari', 'Mangal', 'Devanagari Sangam MN', 'Noto Sans Tamil', 'Noto Sans Devanagari', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

/**
 * PrintBook Page (/books/:bookId/print)
 * Protected owner-only Print-Ready Memory Book view rendered outside MainLayout (no navbar or footer).
 * Uses the browser's native print engine (`window.print()` -> "Save as PDF") so emoji, Tamil,
 * Hindi (Devanagari), and attached polaroid photos all render and export with full fidelity.
 */
function PrintBook() {
  const { bookId } = useParams();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [responses, setResponses] = useState([]);
  const [wasCapped, setWasCapped] = useState(false);
  const [notFoundError, setNotFoundError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Readiness state: waits for both `document.fonts?.ready` AND all `<img>` tags to finish loading
  const [isPrintReady, setIsPrintReady] = useState(false);
  const printBookRootRef = useRef(null);

  const loadMemoryBook = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setIsPrintReady(false);
    setNotFoundError('');
    setLoadError('');

    try {
      // 1. Verify ownership and fetch book details
      const loadedBook = await getBookById(user.uid, bookId);
      setBook(loadedBook);

      // 2. Fetch responses in pages of 25 up to the 300-response print cap
      const loadedResponses = await fetchAllResponses(user.uid, bookId, {
        maxResponses: MAX_PRINT_RESPONSES,
      });

      setResponses(loadedResponses);
      setWasCapped(Boolean(loadedResponses.capped));
    } catch (error) {
      if (error.code === 'book/not-found') {
        setNotFoundError(
          error.message || 'This slam book does not exist or belongs to another account.'
        );
      } else {
        setLoadError(
          error.message || 'Could not load this slam book for printing. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, bookId]);

  useEffect(() => {
    loadMemoryBook();
  }, [loadMemoryBook]);

  // Wait for document.fonts?.ready AND all <img> elements inside the memory book to finish loading
  useEffect(() => {
    if (isLoading || !book || notFoundError || loadError) {
      setIsPrintReady(false);
      return undefined;
    }

    let isCancelled = false;

    async function waitForFontsAndImages() {
      try {
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Ignore font readiness errors and continue
      }

      if (isCancelled) return;

      const rootEl = printBookRootRef.current;
      const imgElements = rootEl
        ? Array.from(rootEl.querySelectorAll('img'))
        : [];

      const pendingPromises = imgElements
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              const onDone = () => {
                img.removeEventListener('load', onDone);
                img.removeEventListener('error', onDone);
                resolve();
              };
              img.addEventListener('load', onDone);
              img.addEventListener('error', onDone);
            })
        );

      if (pendingPromises.length > 0) {
        await Promise.all(pendingPromises);
      }

      if (!isCancelled) {
        setIsPrintReady(true);
      }
    }

    waitForFontsAndImages();

    return () => {
      isCancelled = true;
    };
  }, [isLoading, book, responses, notFoundError, loadError]);

  const handlePrint = () => {
    if (!isPrintReady || typeof window === 'undefined') return;
    window.print();
  };

  if (isLoading) {
    return <AuthLoadingScreen message="Preparing your memory book..." />;
  }

  // Friendly "Book not found" screen if missing or owned by another user
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

  if (loadError || !book) {
    return (
      <div className="builder-page">
        <div className="container">
          <div className="paper-card empty-state" role="alert">
            <span className="washi-tape" aria-hidden="true" />
            <h1 className="empty-state__title">Could not prepare memory book</h1>
            <p className="empty-state__description">
              {loadError || 'Something went wrong while loading your slam book responses.'}
            </p>
            <div className="empty-state__actions">
              <Button variant="primary" onClick={loadMemoryBook}>
                Try Again
              </Button>
              <Button to={`/books/${bookId}/responses`} variant="secondary">
                &larr; Back to Responses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coverTheme = THEME_LABELS[book.coverTheme] ? book.coverTheme : 'pink';
  const themeLabel = THEME_LABELS[coverTheme];
  const formattedExportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      ref={printBookRootRef}
      className="print-memory-book-shell"
      style={{ fontFamily: MULTILINGUAL_PRINT_FONT_STACK }}
    >
      {/* On-Screen Toolbar (Hidden when printing via .no-print) */}
      <header className="print-toolbar no-print" role="region" aria-label="Print memory book controls">
        <div className="container print-toolbar__inner">
          <div className="print-toolbar__left">
            <Link
              to={`/books/${book.id}/responses`}
              className="btn btn-secondary btn-sm"
            >
              &larr; Back to Responses
            </Link>
            <div className="print-toolbar__tips">
              <strong>Print tip:</strong> In the print dialog choose{' '}
              <strong>Save as PDF</strong>, and turn on{' '}
              <strong>Background graphics</strong>.
            </div>
          </div>

          <div className="print-toolbar__right">
            {!isPrintReady && (
              <span className="print-toolbar__status" role="status" aria-live="polite">
                Preparing your memory book...
              </span>
            )}
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePrint}
              disabled={!isPrintReady || responses.length === 0}
            >
              {isPrintReady ? 'Print / Save as PDF' : 'Preparing your memory book...'}
            </Button>
          </div>
        </div>

        {wasCapped && (
          <div className="container" style={{ marginTop: '10px' }}>
            <div className="preview-inline-notice" role="status" aria-live="polite">
              <strong>Note:</strong> Showing the first{' '}
              <strong>{MAX_PRINT_RESPONSES} responses</strong> (the print-ready memory book cap of{' '}
              {MAX_PRINT_RESPONSES} responses was reached).
            </div>
          </div>
        )}
      </header>

      <main className="print-memory-book-main">
        <div className="print-memory-book-container">
          {/* 1. COVER PAGE */}
          <section
            className={`print-cover-page print-theme--${coverTheme}`}
            aria-label="Slam Book Cover Page"
          >
            <span className="washi-tape no-print" aria-hidden="true" />

            <div className="print-cover-page__inner">
              <div className="print-cover-page__stickers" aria-hidden="true">
                <HeartSticker size={26} />
                <FlowerSticker size={26} />
                <StarSticker size={26} />
              </div>

              <span className="badge badge--pink print-cover-page__badge">
                Slamly Keepsake Edition
              </span>

              <p className="print-cover-page__tagline">
                Every friend. Every memory. One little book.
              </p>

              <hr className="print-cover-page__divider" />

              <h1 className="print-cover-page__title">{book.title}</h1>

              {book.description && (
                <p className="print-cover-page__description">{book.description}</p>
              )}

              <div className="print-cover-page__meta">
                <div className="print-cover-page__meta-item">
                  <span className="print-cover-page__meta-label">Responses Preserved</span>
                  <strong className="print-cover-page__meta-value">
                    {responses.length}{' '}
                    {responses.length === 1 ? 'Friend Page' : 'Friend Pages'}
                  </strong>
                </div>
                <div className="print-cover-page__meta-item">
                  <span className="print-cover-page__meta-label">Cover Theme</span>
                  <strong className="print-cover-page__meta-value">{themeLabel}</strong>
                </div>
                <div className="print-cover-page__meta-item">
                  <span className="print-cover-page__meta-label">Exported On</span>
                  <strong className="print-cover-page__meta-value">
                    {formattedExportDate}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* 2. FRIEND RESPONSE KEEPSAKE CARDS */}
          {responses.length === 0 ? (
            <div className="paper-card empty-state no-print" style={{ marginTop: '24px' }}>
              <h2 className="empty-state__title">No responses to print yet</h2>
              <p className="empty-state__description">
                Once friends sign your slam book, their pages and photos will appear here ready to
                print or save as a PDF.
              </p>
              <div className="empty-state__actions">
                <Button to={`/books/${book.id}/responses`} variant="primary">
                  &larr; Return to Responses
                </Button>
              </div>
            </div>
          ) : (
            <section className="print-responses-section" aria-label="Friend keepsake pages">
              {responses.map((response, index) => (
                <article
                  key={response.id}
                  className={`print-response-card print-theme-accent--${coverTheme}`}
                  aria-label={`Keepsake page from ${response.respondentName}`}
                >
                  <header className={`print-response-card__header print-theme--${coverTheme}`}>
                    <div className="print-response-card__title-group">
                      <span className="print-response-card__index">#{index + 1}</span>
                      <h2 className="print-response-card__name">
                        {response.respondentName}
                      </h2>
                    </div>
                    <p className="print-response-card__date">
                      Signed on {response.formattedDate}
                    </p>
                  </header>

                  <div className="print-response-card__body">
                    {response.photo && (
                      <div className="print-response-card__photo-wrap">
                        <figure className="response-polaroid-frame print-polaroid-frame">
                          <div className="response-polaroid-frame__image-box">
                            <img
                              src={response.photo}
                              alt={`Polaroid keepsake photo from ${response.respondentName}`}
                              className="response-polaroid-frame__img"
                            />
                          </div>
                          <figcaption className="response-polaroid-frame__caption">
                            {response.respondentName}
                          </figcaption>
                        </figure>
                      </div>
                    )}

                    <dl className="print-response-card__answers">
                      {response.answers.length === 0 ? (
                        <p className="form-hint" style={{ margin: 0 }}>
                          (No question answers recorded on this page)
                        </p>
                      ) : (
                        response.answers.map((ansItem, qIdx) => (
                          <div
                            key={ansItem.questionId || qIdx}
                            className="print-qa-item"
                          >
                            <dt className="print-qa-item__question">
                              Q{qIdx + 1}. {ansItem.question || `Question #${qIdx + 1}`}
                            </dt>
                            <dd className="print-qa-item__answer">
                              {ansItem.answer && ansItem.answer.trim() ? (
                                ansItem.answer
                              ) : (
                                <span className="response-answer-block__empty">
                                  (No answer provided)
                                </span>
                              )}
                            </dd>
                          </div>
                        ))
                      )}
                    </dl>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default PrintBook;

