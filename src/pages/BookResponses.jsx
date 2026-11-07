import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/ProtectedRoute';
import {
  BOOK_STATUS_META,
  getBookById,
  getBookShareUrl,
} from '../services/bookService';
import {
  DEFAULT_RESPONSE_PAGE_SIZE,
  MAX_ANSWER_LENGTH,
  MAX_RESPONDENT_NAME_LENGTH,
  deleteResponse,
  getBookResponses,
  getResponseCount,
  updateResponse,
} from '../services/responseService';
import {
  MAX_EXPORT_RESPONSES,
  exportBookToPdf,
  fetchAllResponses,
  scanUnsupportedPdfCharacters,
} from '../services/pdfExportService';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

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
 * BookResponses Page (/books/:bookId/responses)
 * Protected owner-only page for viewing, searching, editing, deleting, and exporting friend responses:
 * - Verifies ownership by loading the book via `getBookById(user.uid, bookId)`.
 * - Shows "Book not found" if the book is missing or owned by another user.
 * - Loads responses newest first (25 per page) via `getBookResponses` and total count via `getResponseCount`.
 * - Lets the owner export responses as a scrapbook A4 PDF via `fetchAllResponses` + `exportBookToPdf`,
 *   with pre-export character scanning for non-Latin scripts/emoji.
 * - Supports client-side search, inline editing (`updateResponse`), and deletion (`deleteResponse`).
 */
function BookResponses() {
  const { bookId } = useParams();
  const { user } = useAuth();

  // Book loading state
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [book, setBook] = useState(null);
  const [notFoundError, setNotFoundError] = useState('');
  const [bookLoadError, setBookLoadError] = useState('');

  // Responses & pagination state
  const [responses, setResponses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [responsesError, setResponsesError] = useState('');

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Share link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // Notification banners
  const [flashMessage, setFlashMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // PDF Export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportError, setPdfExportError] = useState('');
  const [pendingPdfWarning, setPendingPdfWarning] = useState(null); // { allResponses, capped, scanResult }

  // Inline Edit state
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAnswers, setEditAnswers] = useState([]);
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation modal state
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [isDeletingResponse, setIsDeletingResponse] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const shareUrl = getBookShareUrl(bookId);

  const loadBookAndInitialResponses = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBook(true);
    setNotFoundError('');
    setBookLoadError('');
    setResponsesError('');

    try {
      // Step 1: Load the book and verify ownership
      const loadedBook = await getBookById(user.uid, bookId);
      setBook(loadedBook);
      setIsLoadingBook(false);

      // Step 2: Load first page of responses (25) and total response count
      setIsLoadingResponses(true);
      const [pageResult, countResult] = await Promise.all([
        getBookResponses(user.uid, bookId, { pageSize: DEFAULT_RESPONSE_PAGE_SIZE }),
        getResponseCount(user.uid, bookId),
      ]);

      setResponses(pageResult.responses);
      setNextCursor(pageResult.nextCursor);
      setHasMore(pageResult.hasMore);
      setTotalCount(countResult);
    } catch (error) {
      if (error.code === 'book/not-found') {
        setNotFoundError(
          error.message || 'This slam book does not exist or belongs to another account.'
        );
      } else if (!book) {
        setBookLoadError(error.message || 'Could not load this slam book.');
      } else {
        setResponsesError(error.message || 'Could not load responses for this slam book.');
      }
    } finally {
      setIsLoadingBook(false);
      setIsLoadingResponses(false);
    }
  }, [user?.uid, bookId]);

  useEffect(() => {
    loadBookAndInitialResponses();
  }, [loadBookAndInitialResponses]);

  const handleRetryResponses = async () => {
    if (!user?.uid || !book) {
      loadBookAndInitialResponses();
      return;
    }

    setIsLoadingResponses(true);
    setResponsesError('');

    try {
      const [pageResult, countResult] = await Promise.all([
        getBookResponses(user.uid, bookId, { pageSize: DEFAULT_RESPONSE_PAGE_SIZE }),
        getResponseCount(user.uid, bookId),
      ]);

      setResponses(pageResult.responses);
      setNextCursor(pageResult.nextCursor);
      setHasMore(pageResult.hasMore);
      setTotalCount(countResult);
    } catch (error) {
      setResponsesError(error.message || 'Could not load responses for this slam book.');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleLoadMore = async () => {
    if (!user?.uid || !hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setActionError('');

    try {
      const nextPage = await getBookResponses(user.uid, bookId, {
        pageSize: DEFAULT_RESPONSE_PAGE_SIZE,
        cursor: nextCursor,
      });

      setResponses((prev) => [...prev, ...nextPage.responses]);
      setNextCursor(nextPage.nextCursor);
      setHasMore(nextPage.hasMore);
    } catch (error) {
      setActionError(error.message || 'Could not load more responses. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  /**
   * Finalizes PDF creation & download after character check passes or owner confirms.
   */
  const runPdfGeneration = async (allResponses, wasCapped) => {
    if (!book) return;
    setIsExportingPdf(true);
    setPdfExportError('');
    setFlashMessage('');

    try {
      const result = await exportBookToPdf(book, allResponses);
      if (wasCapped) {
        setFlashMessage(
          `Downloaded "${result.fileName}"! Note: Only the first ${MAX_EXPORT_RESPONSES} responses were exported (safety cap reached).`
        );
      } else {
        setFlashMessage(
          `Downloaded "${result.fileName}" (${result.exportedCount} ${
            result.exportedCount === 1 ? 'response' : 'responses'
          }, ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'})!`
        );
      }
    } catch (error) {
      setPdfExportError(
        error.message || 'Could not generate your PDF memory book. Please try again.'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Triggered when the owner clicks "Download PDF":
   * 1. Fetches all responses up to the 500-response safety cap via `fetchAllResponses`.
   * 2. Scans for characters unsupported by built-in PDF fonts (emoji, Tamil, Hindi, etc.).
   * 3. Either shows the warning dialog or generates and downloads the PDF immediately.
   */
  const handleStartPdfExport = async () => {
    if (!user?.uid || !book || totalCount === 0 || isExportingPdf) return;

    setIsExportingPdf(true);
    setPdfExportError('');
    setActionError('');
    setFlashMessage('');

    try {
      const allResponses = await fetchAllResponses(user.uid, bookId);
      const wasCapped = Boolean(allResponses.capped);

      if (allResponses.length === 0) {
        setPdfExportError('There are no responses available to export yet.');
        setIsExportingPdf(false);
        return;
      }

      const scanResult = scanUnsupportedPdfCharacters(book, allResponses);

      if (scanResult.hasUnsupported) {
        // Pause and ask the owner whether to download anyway (replacing unsupported chars with ?) or cancel
        setPendingPdfWarning({
          allResponses,
          capped: wasCapped,
          scanResult,
        });
        setIsExportingPdf(false);
        return;
      }

      await runPdfGeneration(allResponses, wasCapped);
    } catch (error) {
      setPdfExportError(
        error.message || 'Could not fetch responses for PDF export. Please try again.'
      );
      setIsExportingPdf(false);
    }
  };

  const handleConfirmPdfDownloadAnyway = async () => {
    if (!pendingPdfWarning) return;
    const { allResponses, capped } = pendingPdfWarning;
    setPendingPdfWarning(null);
    await runPdfGeneration(allResponses, capped);
  };

  const handleCancelPdfWarning = () => {
    setPendingPdfWarning(null);
  };

  // Start editing a response card
  const handleStartEdit = (response) => {
    setEditingResponseId(response.id);
    setEditName(response.respondentName);
    setEditAnswers(
      response.answers.map((item) => ({
        questionId: item.questionId,
        question: item.question,
        answer: item.answer,
      }))
    );
    setEditError('');
    setFlashMessage('');
    setActionError('');
  };

  const handleCancelEdit = () => {
    if (isSavingEdit) return;
    setEditingResponseId(null);
    setEditName('');
    setEditAnswers([]);
    setEditError('');
  };

  const handleEditAnswerChange = (index, value) => {
    const capped = value.slice(0, MAX_ANSWER_LENGTH);
    setEditAnswers((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, answer: capped } : item))
    );
    setEditError('');
  };

  const handleSaveEdit = async (event, responseId) => {
    event.preventDefault();
    if (isSavingEdit) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Please enter a respondent name or nickname (1 to 50 characters).');
      return;
    }
    if (trimmedName.length > MAX_RESPONDENT_NAME_LENGTH) {
      setEditError(`Respondent name must be ${MAX_RESPONDENT_NAME_LENGTH} characters or fewer.`);
      return;
    }

    setIsSavingEdit(true);
    setEditError('');
    setFlashMessage('');

    try {
      const updated = await updateResponse(user.uid, bookId, responseId, {
        respondentName: trimmedName,
        answers: editAnswers,
      });

      setResponses((prev) =>
        prev.map((item) =>
          item.id === responseId
            ? {
                ...item,
                respondentName: updated.respondentName,
                answers: updated.answers,
              }
            : item
        )
      );

      setEditingResponseId(null);
      setFlashMessage(`Saved changes to ${updated.respondentName}’s keepsake page.`);
    } catch (error) {
      setEditError(error.message || 'Could not save changes to this response.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete response confirmation & execution
  const handleRequestDelete = (response) => {
    setDeleteError('');
    setResponseToDelete(response);
  };

  const handleConfirmDelete = async () => {
    if (!responseToDelete || isDeletingResponse) return;
    setIsDeletingResponse(true);
    setDeleteError('');

    try {
      await deleteResponse(user.uid, bookId, responseToDelete.id);
      const deletedName = responseToDelete.respondentName;

      setResponses((prev) => prev.filter((item) => item.id !== responseToDelete.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      if (editingResponseId === responseToDelete.id) {
        setEditingResponseId(null);
      }
      setResponseToDelete(null);
      setFlashMessage(`Deleted ${deletedName}’s response from this slam book.`);
    } catch (error) {
      setDeleteError(error.message || 'Could not delete this response.');
    } finally {
      setIsDeletingResponse(false);
    }
  };

  // Client-side search across loaded responses (respondentName + answers)
  const filteredResponses = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    if (!queryText) return responses;

    return responses.filter((resp) => {
      if (resp.respondentName.toLowerCase().includes(queryText)) {
        return true;
      }
      return resp.answers.some(
        (ans) =>
          (ans.answer && ans.answer.toLowerCase().includes(queryText)) ||
          (ans.question && ans.question.toLowerCase().includes(queryText))
      );
    });
  }, [responses, searchQuery]);

  if (isLoadingBook) {
    return <AuthLoadingScreen message="Opening your slam book responses..." />;
  }

  // Friendly "Book not found" screen (if book does not exist or belongs to another account)
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

  if (bookLoadError || !book) {
    return (
      <div className="builder-page">
        <div className="container">
          <div className="paper-card empty-state" role="alert">
            <span className="washi-tape" aria-hidden="true" />
            <h1 className="empty-state__title">Could not load slam book</h1>
            <p className="empty-state__description">
              {bookLoadError || 'Something went wrong while loading this slam book.'}
            </p>
            <div className="empty-state__actions">
              <Button variant="primary" onClick={loadBookAndInitialResponses}>
                Try Again
              </Button>
              <Button to="/dashboard" variant="secondary">
                &larr; Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusKey = BOOK_STATUS_META[book.status] ? book.status : 'draft';
  const statusMeta = BOOK_STATUS_META[statusKey];
  const isPublished = statusKey === 'published';
  const isExportDisabled = isLoadingResponses || totalCount === 0 || isExportingPdf;

  return (
    <div className="responses-page">
      <div className="container">
        {/* Top Navigation Bar */}
        <div className="preview-mode-banner" role="region" aria-label="Responses navigation bar">
          <div className="preview-mode-banner__content">
            <span className="preview-mode-banner__badge">Keepsake Responses</span>
            <p className="preview-mode-banner__text">
              Viewing friend pages signed for <strong>&ldquo;{book.title}&rdquo;</strong>.
            </p>
          </div>
          <div className="preview-mode-banner__actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button to="/dashboard" variant="secondary" size="sm">
              &larr; Back to Dashboard
            </Button>
            <Button to={`/books/${book.id}/edit`} variant="primary" size="sm">
              Edit Book
            </Button>
          </div>
        </div>

        {flashMessage && (
          <div className="auth-alert auth-alert--success" role="status" aria-live="polite">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span>{flashMessage}</span>
              <button
                type="button"
                className="link-button"
                onClick={() => setFlashMessage('')}
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <div className="auth-alert auth-alert--error" role="alert">
            {actionError}
          </div>
        )}

        {pdfExportError && (
          <div className="auth-alert auth-alert--error" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span>{pdfExportError}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartPdfExport}
                disabled={isExportingPdf || totalCount === 0}
              >
                Retry PDF Export
              </Button>
            </div>
          </div>
        )}

        {/* Book Summary, Total Response Count & Download PDF Header */}
        <header className={`paper-card responses-header-card live-preview-card--${book.coverTheme}`}>
          <span className="washi-tape" aria-hidden="true" />

          <div className="responses-header-card__top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span className={`status-badge ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
                <span className="badge badge--lavender">
                  {totalCount} {totalCount === 1 ? 'Response' : 'Responses'}
                </span>
              </div>

              <h1 className="responses-header-card__title">{book.title}</h1>
              {book.description && (
                <p className="responses-header-card__subtitle">{book.description}</p>
              )}
              <p className="book-status-note" style={{ marginTop: '10px', display: 'inline-block' }}>
                {statusMeta.shortNote}
              </p>
            </div>

            <div className="responses-header-card__aside">
              <div className="responses-count-box" aria-label="Total responses collected">
                <span className="responses-count-box__number">{totalCount}</span>
                <span className="responses-count-box__label">
                  {totalCount === 1 ? 'Friend Page' : 'Friend Pages'}
                </span>
              </div>

              <div className="responses-pdf-action">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartPdfExport}
                  disabled={isExportDisabled}
                  aria-describedby={!isLoadingResponses && totalCount === 0 ? 'pdf-disabled-note' : undefined}
                >
                  {isExportingPdf ? 'Preparing your memory book...' : 'Download PDF'}
                </Button>

                {isExportingPdf && (
                  <span className="form-hint" role="status" aria-live="polite">
                    Preparing your memory book...
                  </span>
                )}

                {!isLoadingResponses && totalCount === 0 && (
                  <span id="pdf-disabled-note" className="form-hint">
                    Collect at least 1 response to download a PDF keepsake.
                  </span>
                )}
              </div>
            </div>
          </div>

          {isPublished && (
            <div className="book-share-box" style={{ marginTop: '16px' }}>
              <div className="book-share-box__url" title={shareUrl}>
                {shareUrl}
              </div>
              <div className="book-share-box__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyShareLink}
                >
                  {copiedLink ? 'Copied!' : 'Copy Share Link'}
                </button>
                {copiedLink && (
                  <span className="sr-only" role="status" aria-live="polite">
                    Share link copied to clipboard!
                  </span>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Search Toolbar (shown when at least 1 response is loaded) */}
        {!isLoadingResponses && !responsesError && responses.length > 0 && (
          <div className="paper-card responses-search-bar" role="search">
            <div className="responses-search-bar__input-wrap">
              <label htmlFor="responses-search-input" className="form-label" style={{ marginBottom: '4px' }}>
                Search responses by friend&rsquo;s name or answer text
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  id="responses-search-input"
                  type="search"
                  className="form-input"
                  style={{ flex: 1, minWidth: '220px' }}
                  placeholder="Type a friend's name, memory, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
            <div className="responses-search-bar__meta" aria-live="polite">
              Showing <strong>{filteredResponses.length}</strong> of{' '}
              <strong>{responses.length}</strong> loaded{' '}
              {responses.length === 1 ? 'response' : 'responses'}
              {totalCount > responses.length ? ` (${totalCount} total)` : ''}
            </div>
          </div>
        )}

        {/* Responses Content Area */}
        {isLoadingResponses ? (
          /* Loading State */
          <div className="paper-card empty-state" role="status" aria-live="polite">
            <span className="washi-tape tape-lavender" aria-hidden="true" />
            <div className="auth-loading-card__spinner" aria-hidden="true">
              <StarSticker size={28} />
            </div>
            <h2 className="empty-state__title">Loading friend responses...</h2>
            <p className="empty-state__description">
              Fetching keepsake pages from Cloud Firestore.
            </p>
          </div>
        ) : responsesError ? (
          /* Error & Retry State */
          <div className="paper-card empty-state" role="alert">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />
            <h2 className="empty-state__title">Could not load responses</h2>
            <p className="empty-state__description">{responsesError}</p>
            <div className="empty-state__actions">
              <Button variant="primary" onClick={handleRetryResponses}>
                Try Again
              </Button>
              <Button to="/dashboard" variant="secondary">
                &larr; Return to Dashboard
              </Button>
            </div>
          </div>
        ) : responses.length === 0 ? (
          /* Empty State (No Responses Yet) */
          <div className="paper-card empty-state" role="region" aria-label="No responses yet">
            <span className="washi-tape tape-sage" aria-hidden="true" />
            <div className="empty-state__illustration">
              <PolaroidIllustration caption="Waiting for your first friend's page!" />
            </div>
            <div className="empty-state__content">
              <div className="empty-state__stickers" aria-hidden="true">
                <HeartSticker size={22} />
                <FlowerSticker size={22} />
                <StarSticker size={22} />
              </div>
              <h2 className="empty-state__title">No responses yet!</h2>
              <p className="empty-state__description">
                {isPublished
                  ? 'Tip: Copy your public share link below and send it to your friends on WhatsApp, Instagram, or group chats so they can sign a page!'
                  : 'Tip: This slam book is currently not accepting responses. Publish or reopen it on the Edit Book page so friends can sign a page!'}
              </p>

              <div className="empty-state__actions">
                {isPublished ? (
                  <Button variant="primary" size="lg" onClick={handleCopyShareLink}>
                    {copiedLink ? 'Copied!' : 'Copy Share Link'}
                  </Button>
                ) : (
                  <Button to={`/books/${book.id}/edit`} variant="primary" size="lg">
                    Open Edit Book to Publish
                  </Button>
                )}
                <Button to="/dashboard" variant="secondary" size="lg">
                  &larr; Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : filteredResponses.length === 0 ? (
          /* Search No Matches State */
          <div className="paper-card empty-state" role="status" aria-live="polite">
            <span className="washi-tape tape-lavender" aria-hidden="true" />
            <h2 className="empty-state__title">No matching responses</h2>
            <p className="empty-state__description">
              No loaded responses matched <strong>&ldquo;{searchQuery}&rdquo;</strong> by friend name
              or answer text.
            </p>
            <div className="empty-state__actions">
              <Button variant="primary" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          /* Scrapbook Response Cards List */
          <>
            <div className="responses-list">
              {filteredResponses.map((response, cardIdx) => {
                const isEditing = editingResponseId === response.id;

                return (
                  <article
                    key={response.id}
                    className="paper-card response-keepsake-card"
                    aria-label={`Response from ${response.respondentName}`}
                  >
                    <span
                      className={`washi-tape ${
                        cardIdx % 3 === 1
                          ? 'tape-lavender'
                          : cardIdx % 3 === 2
                          ? 'tape-sage'
                          : ''
                      }`}
                      aria-hidden="true"
                    />

                    {isEditing ? (
                      /* INLINE EDIT FORM */
                      <form
                        className="response-edit-form"
                        onSubmit={(e) => handleSaveEdit(e, response.id)}
                        noValidate
                      >
                        <div className="response-keepsake-card__header">
                          <div>
                            <span className="badge badge--lavender">Editing Keepsake Page</span>
                            <p className="response-keepsake-card__date" style={{ marginTop: '6px' }}>
                              Originally submitted {response.formattedDate} (submission date cannot be changed)
                            </p>
                          </div>
                        </div>

                        {editError && (
                          <div className="auth-alert auth-alert--error" role="alert">
                            {editError}
                          </div>
                        )}

                        <div className="form-group">
                          <label
                            htmlFor={`edit-resp-name-${response.id}`}
                            className="form-label"
                          >
                            Respondent name or nickname{' '}
                            <span className="required-indicator" aria-hidden="true">*</span>
                          </label>
                          <input
                            id={`edit-resp-name-${response.id}`}
                            type="text"
                            className="form-input"
                            maxLength={MAX_RESPONDENT_NAME_LENGTH}
                            value={editName}
                            disabled={isSavingEdit}
                            required
                            onChange={(e) => {
                              setEditName(e.target.value);
                              setEditError('');
                            }}
                          />
                          <span className="form-hint">
                            {editName.length}/{MAX_RESPONDENT_NAME_LENGTH} characters
                          </span>
                        </div>

                        <div className="response-answers-grid">
                          {editAnswers.map((ansItem, ansIdx) => {
                            const fieldId = `edit-resp-${response.id}-ans-${ansIdx}`;
                            return (
                              <div key={ansItem.questionId || ansIdx} className="response-edit-answer-item">
                                <label htmlFor={fieldId} className="form-label">
                                  Q{ansIdx + 1}. {ansItem.question || `Question #${ansIdx + 1}`}
                                </label>
                                <textarea
                                  id={fieldId}
                                  rows={3}
                                  maxLength={MAX_ANSWER_LENGTH}
                                  className="form-input form-textarea"
                                  value={ansItem.answer}
                                  disabled={isSavingEdit}
                                  onChange={(e) => handleEditAnswerChange(ansIdx, e.target.value)}
                                />
                                <span className="form-hint">
                                  {(ansItem.answer || '').length}/{MAX_ANSWER_LENGTH} characters
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="response-keepsake-card__footer">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSavingEdit}
                          >
                            {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      /* READ VIEW */
                      <>
                        <div className="response-keepsake-card__header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <HeartSticker size={20} />
                              <h2 className="response-keepsake-card__name">
                                {response.respondentName}
                              </h2>
                            </div>
                            <p className="response-keepsake-card__date">
                              Signed on {response.formattedDate}
                            </p>
                          </div>

                          <div className="response-keepsake-card__actions">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartEdit(response)}
                              aria-label={`Edit response from ${response.respondentName}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="btn-danger-ghost"
                              onClick={() => handleRequestDelete(response)}
                              aria-label={`Delete response from ${response.respondentName}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <dl className="response-answers-sheet">
                          {response.answers.length === 0 ? (
                            <p className="form-hint" style={{ margin: 0 }}>
                              No question answers recorded on this page.
                            </p>
                          ) : (
                            response.answers.map((ansItem, ansIdx) => (
                              <div
                                key={ansItem.questionId || ansIdx}
                                className="response-answer-block"
                              >
                                <dt className="response-answer-block__question">
                                  Q{ansIdx + 1}. {ansItem.question || `Question #${ansIdx + 1}`}
                                </dt>
                                <dd className="response-answer-block__answer">
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
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Pagination: Load More (25 per page) */}
            {hasMore && (
              <div className="responses-load-more">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore
                    ? 'Loading more responses...'
                    : `Load more responses (${responses.length} of ${totalCount} loaded)`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Unsupported PDF Characters Warning Modal */}
      {pendingPdfWarning && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-char-warning-title"
        >
          <div className="paper-card modal-card">
            <span className="washi-tape tape-lavender" aria-hidden="true" />
            <div className="modal-card__header">
              <div>
                <span className="badge badge--peach">Character Support Notice</span>
                <h3 id="pdf-char-warning-title" className="modal-card__title">
                  Some characters cannot be rendered in standard PDF fonts
                </h3>
                <p className="modal-card__subtitle">
                  The built-in PDF fonts support standard Latin letters (including accented characters
                  like &eacute; and &ntilde;), numbers, and punctuation, but cannot render emoji or
                  non-Latin scripts (such as Tamil, Hindi, Arabic, or Chinese).
                </p>
                <div className="preview-inline-notice" style={{ marginTop: '12px' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    Affected items found in this slam book:
                  </p>
                  <ul style={{ margin: '6px 0 0 18px', fontSize: '0.9rem' }}>
                    {pendingPdfWarning.scanResult.affectedNamesCount > 0 && (
                      <li>
                        <strong>{pendingPdfWarning.scanResult.affectedNamesCount}</strong>{' '}
                        {pendingPdfWarning.scanResult.affectedNamesCount === 1
                          ? 'respondent name'
                          : 'respondent names'}
                      </li>
                    )}
                    {pendingPdfWarning.scanResult.affectedAnswersCount > 0 && (
                      <li>
                        <strong>{pendingPdfWarning.scanResult.affectedAnswersCount}</strong>{' '}
                        {pendingPdfWarning.scanResult.affectedAnswersCount === 1
                          ? 'question/answer field'
                          : 'question/answer fields'}
                      </li>
                    )}
                    {pendingPdfWarning.scanResult.affectedBookFieldsCount > 0 && (
                      <li>
                        <strong>{pendingPdfWarning.scanResult.affectedBookFieldsCount}</strong>{' '}
                        {pendingPdfWarning.scanResult.affectedBookFieldsCount === 1
                          ? 'book title/description field'
                          : 'book title/description fields'}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCancelPdfWarning}
                aria-label="Cancel PDF export"
              >
                &times;
              </button>
            </div>

            <div className="modal-card__footer" style={{ flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={handleCancelPdfWarning}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmPdfDownloadAnyway}>
                Download anyway (unsupported characters will be replaced with ?)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Response Confirmation Modal */}
      {responseToDelete && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-response-modal-title"
        >
          <div className="paper-card modal-card">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />
            <div className="modal-card__header">
              <div>
                <span className="badge badge--pink">Confirm Response Deletion</span>
                <h3 id="delete-response-modal-title" className="modal-card__title">
                  Delete {responseToDelete.respondentName}&rsquo;s response?
                </h3>
                <p className="modal-card__subtitle">
                  This permanently removes <strong>{responseToDelete.respondentName}</strong>&rsquo;s
                  keepsake page from <strong>&ldquo;{book.title}&rdquo;</strong>. This action cannot
                  be undone.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isDeletingResponse && setResponseToDelete(null)}
                disabled={isDeletingResponse}
                aria-label="Close delete confirmation"
              >
                &times;
              </button>
            </div>

            {deleteError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="modal-card__footer">
              <Button
                variant="secondary"
                onClick={() => setResponseToDelete(null)}
                disabled={isDeletingResponse}
              >
                Keep Response
              </Button>
              <Button
                variant="primary"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeletingResponse}
              >
                {isDeletingResponse ? 'Deleting...' : 'Yes, Delete Response'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookResponses;
