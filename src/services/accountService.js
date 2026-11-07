import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase';
import { deleteBook, getUserBooks } from './bookService';

export const ACCOUNT_DELETE_CONFIRMATION_WORD = 'DELETE';

/**
 * Maps Firebase Auth reauthentication / account deletion errors to clear, friendly messages.
 */
export function getFriendlyAccountDeletionError(
  error,
  fallbackMessage = 'Could not complete account deletion. Please try again.'
) {
  if (!error) return fallbackMessage;

  if (error.isValidationError) {
    return error.message;
  }

  const code = error.code || '';

  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password. Please re-enter your current account password and try again.';
    case 'auth/requires-recent-login':
      return 'For security, please log out, log back in, and try deleting your account again.';
    case 'auth/too-many-requests':
      return 'Too many failed password attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/user-mismatch':
    case 'auth/user-not-found':
      return 'Your login session could not be verified. Please log in again and retry.';
    default:
      return error.message || fallbackMessage;
  }
}

/**
 * Deletes all data owned by the signed-in user and then deletes their Firebase Auth user.
 *
 * Steps performed in strict order using existing owner permissions (no Cloud Functions needed):
 * 1. Validates that the user typed `DELETE` and entered their password, then reauthenticates
 *    via `reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))`.
 * 2. Fetches all books owned by `user.uid` (`getUserBooks(user.uid)`). For each book:
 *    - Deletes all responses in `books/{bookId}/responses` in batches of up to 400.
 *    - Deletes `publicBooks/{bookId}` and `books/{bookId}` in a single `writeBatch` (`deleteBook`).
 *    - Reports live progress (`"Deleting your books... 2 of 5"`).
 * 3. Only after every book and response has been deleted, deletes the Firebase Auth user
 *    (`deleteUser(user)`) and ensures the client is signed out.
 *
 * If any step fails midway, throws an error containing `failedStep` and a clear message
 * explaining which step failed, confirming that nothing further was deleted, and letting
 * the user retry safely (re-running is idempotent).
 */
export async function deleteAccountAndAllData({
  user,
  confirmationText,
  password,
  onProgress,
} = {}) {
  const reportProgress = (message, meta = {}) => {
    if (typeof onProgress === 'function') {
      onProgress({ message, ...meta });
    }
  };

  if (!isFirebaseConfigured || !auth) {
    const err = new Error('Firebase Authentication is not configured.');
    err.isValidationError = true;
    throw err;
  }

  if (!user || !user.uid || !user.email) {
    const err = new Error('You must be logged in to delete your account.');
    err.isValidationError = true;
    throw err;
  }

  if (confirmationText !== ACCOUNT_DELETE_CONFIRMATION_WORD) {
    const err = new Error(
      `Please type ${ACCOUNT_DELETE_CONFIRMATION_WORD} in all capital letters to confirm.`
    );
    err.isValidationError = true;
    throw err;
  }

  if (!password || typeof password !== 'string') {
    const err = new Error('Please enter your current password to confirm account deletion.');
    err.isValidationError = true;
    throw err;
  }

  // Step 1: Reauthenticate the user with their email and password
  reportProgress('Verifying your password...', { step: 'reauth' });
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    const friendly = getFriendlyAccountDeletionError(
      error,
      'Could not verify your password. Nothing was deleted.'
    );
    const wrapped = new Error(`${friendly} Nothing was deleted.`);
    wrapped.failedStep = 'Password verification';
    wrapped.code = error.code;
    throw wrapped;
  }

  // Step 2: Load all books owned by this user
  reportProgress('Finding your slam books...', { step: 'fetch-books' });
  let books = [];
  try {
    books = await getUserBooks(user.uid);
  } catch (error) {
    const wrapped = new Error(
      `Step failed (Loading your slam books): ${
        error.message || 'Could not load your books.'
      } Nothing further was deleted. You can safely click retry.`
    );
    wrapped.failedStep = 'Loading your slam books';
    throw wrapped;
  }

  // Step 3: Delete each book (all responses in batches of up to 400, then publicBooks/{id} + books/{id})
  const totalBooks = books.length;
  for (let index = 0; index < totalBooks; index += 1) {
    const book = books[index];
    const currentNumber = index + 1;
    reportProgress(`Deleting your books... ${currentNumber} of ${totalBooks}`, {
      step: 'delete-books',
      current: currentNumber,
      total: totalBooks,
    });

    try {
      await deleteBook(user.uid, book.id);
    } catch (error) {
      const wrapped = new Error(
        `Step failed while deleting book ${currentNumber} of ${totalBooks} ("${
          book.title || 'Untitled'
        }"): ${
          error.message || 'Database error.'
        } Process stopped — nothing further was deleted, and your account is still active. You can safely retry to finish deleting the remaining data.`
      );
      wrapped.failedStep = `Deleting book ${currentNumber} of ${totalBooks}`;
      throw wrapped;
    }
  }

  // Step 4: Only after all Firestore data is deleted, delete the Firebase Auth user
  reportProgress('Deleting your account...', { step: 'delete-auth' });
  try {
    await deleteUser(user);
  } catch (error) {
    const friendly = getFriendlyAccountDeletionError(
      error,
      'Could not delete your login account.'
    );
    const wrapped = new Error(
      `Step failed (Deleting your login account): ${friendly} Your slam books and responses have already been removed, and nothing further was changed. Please retry to finish removing your login.`
    );
    wrapped.failedStep = 'Deleting your login account';
    wrapped.code = error.code;
    throw wrapped;
  }

  // Ensure local auth session is cleared if still present
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // deleteUser already signs out the current user in Firebase Auth
  }

  return {
    deletedBooksCount: totalBooks,
  };
}

