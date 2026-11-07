import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import BookCard from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import { deleteBook, getUserBooks } from '../services/bookService';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
  PolaroidIllustration,
} from '../assets/ScrapbookDoodles';

/**
 * Dashboard Page (/dashboard)
 * Displays the authenticated user's real slam books from Cloud Firestore (`books/{bookId}`):
 * - Queries only books where `ownerId == user.uid`, ordered newest first.
 * - Shows title, cover theme, status ("published" or "draft"), question count, and creation date.
 * - Provides Edit (`/books/:bookId/edit`) and Delete (with confirmation dialog).
 * - Shows loading state while fetching, handles Firestore errors gracefully, and renders a
 *   scrapbook-themed empty state when the user has no saved books yet.
 */
function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Derive greeting name from Firebase displayName, falling back to email prefix
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const displayUserName =
    user?.displayName && user.displayName.trim()
      ? user.displayName.trim()
      : emailPrefix || 'Memory Keeper';

  const [books, setBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '');
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadBooks = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBooks(true);
    setFetchError('');

    try {
      const userBooks = await getUserBooks(user.uid);
      setBooks(userBooks);
    } catch (error) {
      setFetchError(
        error.message || 'Could not load your slam books from Cloud Firestore.'
      );
    } finally {
      setIsLoadingBooks(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filteredBooks =
    statusFilter === 'All'
      ? books
      : books.filter((book) => book.status.toLowerCase() === statusFilter.toLowerCase());

  const publishedCount = books.filter((book) => book.status === 'published').length;
  const draftCount = books.filter((book) => book.status === 'draft').length;

  const handleRequestDelete = (book) => {
    setDeleteError('');
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteBook(user.uid, bookToDelete.id);
      const deletedTitle = bookToDelete.title;
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
      setFlashMessage(`Deleted "${deletedTitle}" from your shelf.`);
    } catch (error) {
      setDeleteError(error.message || 'Could not delete this slam book.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {flashMessage && (
          <div className="auth-alert auth-alert--success" role="status" aria-live="polite">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
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
                Create, customise, and manage your personal digital slam books. Everything on your
                shelf is private to your account.
              </p>
            </div>

            <div
              className="dashboard-header__cta"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
            >
              <Button to="/create" variant="primary" size="lg">
                + Create new slam book
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </Button>
            </div>
          </div>

          {/* Quick Shelf Statistics */}
          <div className="dashboard-stats" aria-label="Slam book summary statistics">
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{books.length}</span>
              <span className="dashboard-stat-pill__label">Saved Books</span>
            </div>
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{publishedCount}</span>
              <span className="dashboard-stat-pill__label">Published</span>
            </div>
            <div className="dashboard-stat-pill">
              <span className="dashboard-stat-pill__value">{draftCount}</span>
              <span className="dashboard-stat-pill__label">Drafts</span>
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
                Saved privately to your Cloud Firestore shelf.
              </p>
            </div>

            {books.length > 0 && (
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filter slam books by status"
              >
                {['All', 'Published', 'Draft'].map((tab) => (
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

          {/* Loading State */}
          {isLoadingBooks ? (
            <div className="paper-card empty-state" role="status" aria-live="polite">
              <span className="washi-tape tape-lavender" aria-hidden="true" />
              <div className="auth-loading-card__spinner" aria-hidden="true">
                <StarSticker size={28} />
              </div>
              <h3 className="empty-state__title">Loading your slam book shelf...</h3>
              <p className="empty-state__description">
                Fetching your saved books from Cloud Firestore.
              </p>
            </div>
          ) : fetchError ? (
            /* Error State */
            <div className="paper-card empty-state" role="alert">
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />
              <h3 className="empty-state__title">Could not load your slam books</h3>
              <p className="empty-state__description">{fetchError}</p>
              <div className="empty-state__actions">
                <Button variant="primary" onClick={loadBooks}>
                  Try Again
                </Button>
                <Button to="/create" variant="secondary">
                  + Create a Slam Book
                </Button>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            /* Empty State */
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
                  {books.length === 0
                    ? 'Your slam book shelf is waiting for its first story!'
                    : `No "${statusFilter}" slam books found`}
                </h3>
                <p className="empty-state__description">
                  {books.length === 0
                    ? 'Start with a ready-made template like Friendship, College Memories, or School Farewell — or build your own custom slam book from scratch.'
                    : 'Try switching the status filter back to "All" or create a new slam book.'}
                </p>
                <div className="empty-state__actions">
                  <Button to="/create" variant="primary" size="lg">
                    + Create your first slam book
                  </Button>
                  {books.length > 0 && (
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
            /* Books Grid */
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDeleteRequest={handleRequestDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="paper-card modal-card">
            <span className="washi-tape washi-tape--pink" aria-hidden="true" />
            <div className="modal-card__header">
              <div>
                <span className="badge badge--pink">Confirm Deletion</span>
                <h3 id="delete-modal-title" className="modal-card__title">
                  Delete &ldquo;{bookToDelete.title}&rdquo;?
                </h3>
                <p className="modal-card__subtitle">
                  This action permanently removes this slam book and all of its questions from your
                  shelf. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isDeleting && setBookToDelete(null)}
                disabled={isDeleting}
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
                onClick={() => setBookToDelete(null)}
                disabled={isDeleting}
              >
                Keep Book
              </Button>
              <Button
                variant="primary"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Book'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
