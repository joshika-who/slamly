import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { isFirebaseConfigured } from '../firebase/firebase';

const BOOKS_COLLECTION = 'books';
const RESPONSES_SUBCOLLECTION = 'responses';
const DELETE_BATCH_SIZE = 400;

export const ALLOWED_QUESTION_TYPES = [
  'short_answer',
  'paragraph',
  'date',
  'multiple_choice',
  'polaroid_prompt',
];

export const ALLOWED_COVER_THEMES = ['pink', 'lavender', 'peach', 'sage'];

export const ALLOWED_BOOK_STATUSES = ['draft', 'published', 'closed'];

export const BOOK_STATUS_META = {
  draft: {
    label: 'Draft',
    badgeClass: 'status-draft',
    shortNote: 'Private — only you can see this book. The public link is turned off.',
  },
  published: {
    label: 'Published',
    badgeClass: 'status-active',
    shortNote: 'Open — anyone with your share link can fill out and submit a page.',
  },
  closed: {
    label: 'Closed',
    badgeClass: 'status-closed',
    shortNote: 'Closed — your share link shows that this slam book is no longer accepting responses.',
  },
};

export const QUESTION_TYPE_LABELS = {
  short_answer: 'Short Answer',
  paragraph: 'Long Story / Paragraph',
  date: 'Date / Memory Date',
  multiple_choice: 'Multiple Choice',
  polaroid_prompt: 'Polaroid / Vibe Check',
};

/**
 * Builds the public share URL for a slam book using its Firestore document ID.
 */
export function getBookShareUrl(bookId) {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
  return `${origin}/s/${bookId}`;
}

/**
 * Generates a unique question ID when a question is created or copied from a template.
 */
export function createQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Deep-copies template questions into a brand-new array with fresh IDs and normalized order.
 * Ensures future changes to static templates never mutate saved user books.
 */
export function cloneTemplateQuestions(templateQuestions = []) {
  return templateQuestions.map((q, index) => {
    const type = ALLOWED_QUESTION_TYPES.includes(q.type) ? q.type : 'short_answer';
    const text = (q.text || q.prompt || '').trim();
    const cloned = {
      id: createQuestionId(),
      type,
      text,
      order: index,
      required: Boolean(q.required),
    };
    if (type === 'multiple_choice') {
      cloned.options = Array.isArray(q.options) && q.options.length > 0
        ? [...q.options]
        : ['Option 1', 'Option 2'];
    }
    return cloned;
  });
}

/**
 * Converts Firestore errors into clear, beginner-friendly messages.
 */
export function getFriendlyFirestoreError(error, fallbackMessage = 'Something went wrong while talking to the database.') {
  if (!error) return fallbackMessage;

  if (error.isValidationError || error.code === 'book/not-found' || error.code === 'book/unauthorized') {
    return error.message;
  }

  const code = error.code || '';

  switch (code) {
    case 'permission-denied':
      return 'Permission denied by Cloud Firestore. Make sure you are signed in as the book owner and that the latest firestore.rules have been published in the Firebase Console.';
    case 'not-found':
      return 'The requested slam book could not be found.';
    case 'unavailable':
      return 'Network error: Cloud Firestore is temporarily unreachable. Please check your internet connection and try again.';
    case 'failed-precondition':
      return 'Firestore requires an index or precondition for this query. Check the browser console for the index creation link.';
    case 'unauthenticated':
      return 'Your session has expired. Please log in again to continue.';
    default:
      return error.message || fallbackMessage;
  }
}

/**
 * Ensures Firestore is initialized.
 */
function assertFirestoreInitialized() {
  if (!isFirebaseConfigured || !db) {
    const err = new Error('Cloud Firestore is not configured. Please check your .env.local file.');
    err.isValidationError = true;
    throw err;
  }
}

/**
 * Ensures Firestore is initialized and an authenticated userId is provided.
 */
function assertFirestoreAndUser(userId) {
  assertFirestoreInitialized();
  if (!userId || typeof userId !== 'string') {
    const err = new Error('You must be logged in to manage slam books.');
    err.code = 'unauthenticated';
    err.isValidationError = true;
    throw err;
  }
}

/**
 * Validates and normalizes a questions array before saving to Firestore.
 */
export function validateAndNormalizeQuestions(questions) {
  if (!Array.isArray(questions)) {
    const err = new Error('Questions must be a valid list.');
    err.isValidationError = true;
    throw err;
  }

  if (questions.length === 0) {
    const err = new Error('Please include at least 1 question in your slam book.');
    err.isValidationError = true;
    throw err;
  }

  if (questions.length > 50) {
    const err = new Error('A slam book can have at most 50 questions.');
    err.isValidationError = true;
    throw err;
  }

  return questions.map((q, index) => {
    const text = typeof q.text === 'string' ? q.text.trim() : typeof q.prompt === 'string' ? q.prompt.trim() : '';
    if (!text) {
      const err = new Error(`Question #${index + 1} cannot be empty. Please enter a question prompt or remove it.`);
      err.isValidationError = true;
      throw err;
    }
    if (text.length > 300) {
      const err = new Error(`Question #${index + 1} is too long (maximum 300 characters).`);
      err.isValidationError = true;
      throw err;
    }

    const type = ALLOWED_QUESTION_TYPES.includes(q.type) ? q.type : 'short_answer';
    const normalizedQuestion = {
      id: q.id && typeof q.id === 'string' ? q.id : createQuestionId(),
      type,
      text,
      order: index,
      required: Boolean(q.required),
    };

    if (type === 'multiple_choice') {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const cleanedOptions = rawOptions
        .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
        .filter(Boolean);

      if (cleanedOptions.length < 2) {
        const err = new Error(`Question #${index + 1} (Multiple Choice) needs at least 2 options.`);
        err.isValidationError = true;
        throw err;
      }
      normalizedQuestion.options = cleanedOptions;
    }

    return normalizedQuestion;
  });
}

/**
 * Validates and normalizes book fields before creating or updating a document.
 */
export function validateBookFields(bookData, { partial = false } = {}) {
  const normalized = {};

  if (!partial || 'title' in bookData) {
    const title = typeof bookData.title === 'string' ? bookData.title.trim() : '';
    if (!title) {
      const err = new Error('Please enter a title for your slam book.');
      err.isValidationError = true;
      throw err;
    }
    if (title.length > 100) {
      const err = new Error('Slam book title must be 100 characters or fewer.');
      err.isValidationError = true;
      throw err;
    }
    normalized.title = title;
  }

  if (!partial || 'description' in bookData) {
    const description = typeof bookData.description === 'string' ? bookData.description.trim() : '';
    if (description.length > 500) {
      const err = new Error('Description / welcome note must be 500 characters or fewer.');
      err.isValidationError = true;
      throw err;
    }
    normalized.description = description;
  }

  if (!partial || 'coverTheme' in bookData) {
    const coverTheme = ALLOWED_COVER_THEMES.includes(bookData.coverTheme)
      ? bookData.coverTheme
      : 'pink';
    normalized.coverTheme = coverTheme;
  }

  if (!partial || 'status' in bookData) {
    const status = ALLOWED_BOOK_STATUSES.includes(bookData.status)
      ? bookData.status
      : 'draft';
    normalized.status = status;
  }

  if (!partial || 'templateId' in bookData) {
    normalized.templateId =
      typeof bookData.templateId === 'string' && bookData.templateId.trim()
        ? bookData.templateId.trim()
        : null;
  }

  if (!partial || 'questions' in bookData) {
    normalized.questions = validateAndNormalizeQuestions(bookData.questions);
  }

  return normalized;
}

/**
 * Normalizes a Firestore DocumentSnapshot into a clean JS object for owner UI components.
 */
function formatBookDoc(docSnap) {
  const data = docSnap.data();
  const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  const updatedAtDate = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;

  const sortedQuestions = Array.isArray(data.questions)
    ? [...data.questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return {
    id: docSnap.id,
    ownerId: data.ownerId,
    title: data.title || 'Untitled Slam Book',
    description: data.description || '',
    templateId: data.templateId ?? null,
    coverTheme: ALLOWED_COVER_THEMES.includes(data.coverTheme) ? data.coverTheme : 'pink',
    status: ALLOWED_BOOK_STATUSES.includes(data.status) ? data.status : 'draft',
    questions: sortedQuestions,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    createdAtMillis: createdAtDate ? createdAtDate.getTime() : 0,
    updatedAtMillis: updatedAtDate ? updatedAtDate.getTime() : 0,
    formattedDate: createdAtDate
      ? createdAtDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Just now',
  };
}

/**
 * Normalizes a Firestore DocumentSnapshot for the PUBLIC share page (/s/:bookId).
 * Strictly omits `ownerId` and internal metadata so only public fields are returned.
 */
function formatPublicBookDoc(docSnap) {
  const data = docSnap.data();
  const sortedQuestions = Array.isArray(data.questions)
    ? [...data.questions]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((q, index) => ({
          id: q.id || `q_${index}`,
          type: ALLOWED_QUESTION_TYPES.includes(q.type) ? q.type : 'short_answer',
          text: (q.text || q.prompt || '').trim(),
          required: Boolean(q.required),
          options: Array.isArray(q.options) ? q.options : [],
        }))
    : [];

  return {
    id: docSnap.id,
    title: data.title || 'Untitled Slam Book',
    description: data.description || '',
    coverTheme: ALLOWED_COVER_THEMES.includes(data.coverTheme) ? data.coverTheme : 'pink',
    status: ALLOWED_BOOK_STATUSES.includes(data.status) ? data.status : 'draft',
    questions: sortedQuestions,
  };
}

/**
 * 1. createBook(userId, bookData)
 * Creates a new slam book document in `books/{bookId}` owned by `userId`.
 * Uses `addDoc()` so Firestore always generates a non-guessable, non-sequential random ID.
 */
export async function createBook(userId, bookData) {
  assertFirestoreAndUser(userId);

  try {
    const validated = validateBookFields(bookData, { partial: false });

    const payload = {
      ownerId: userId,
      title: validated.title,
      description: validated.description,
      templateId: validated.templateId,
      coverTheme: validated.coverTheme,
      questions: validated.questions,
      status: validated.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, BOOKS_COLLECTION), payload);
    return {
      id: docRef.id,
      ...payload,
    };
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error, 'Could not create your slam book.'));
  }
}

/**
 * 2. getUserBooks(userId)
 * Queries `books` where `ownerId == userId` and returns them sorted newest first.
 */
export async function getUserBooks(userId) {
  assertFirestoreAndUser(userId);

  try {
    const booksQuery = query(
      collection(db, BOOKS_COLLECTION),
      where('ownerId', '==', userId)
    );

    const snapshot = await getDocs(booksQuery);
    const books = snapshot.docs.map(formatBookDoc);

    // Sort newest first by createdAt timestamp
    books.sort((a, b) => b.createdAtMillis - a.createdAtMillis);
    return books;
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error, 'Could not load your slam books.'));
  }
}

/**
 * 3. getBookById(userId, bookId)
 * Fetches a single slam book and verifies that it belongs to `userId`.
 */
export async function getBookById(userId, bookId) {
  assertFirestoreAndUser(userId);

  if (!bookId || typeof bookId !== 'string') {
    const notFoundErr = new Error('Book not found.');
    notFoundErr.code = 'book/not-found';
    throw notFoundErr;
  }

  try {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    const docSnap = await getDoc(bookRef);

    if (!docSnap.exists()) {
      const notFoundErr = new Error('This slam book does not exist or may have been deleted.');
      notFoundErr.code = 'book/not-found';
      throw notFoundErr;
    }

    const data = docSnap.data();
    if (data.ownerId !== userId) {
      const unauthorizedErr = new Error('Book not found or you do not have permission to view it.');
      unauthorizedErr.code = 'book/not-found';
      throw unauthorizedErr;
    }

    return formatBookDoc(docSnap);
  } catch (error) {
    if (error.code === 'book/not-found' || error.code === 'permission-denied') {
      const friendlyNotFound = new Error(
        'We could not find this slam book on your shelf, or it belongs to another account.'
      );
      friendlyNotFound.code = 'book/not-found';
      throw friendlyNotFound;
    }
    throw new Error(getFriendlyFirestoreError(error, 'Could not load this slam book.'));
  }
}

/**
 * 4. getPublicBookById(bookId)
 * Loads a single slam book for the public share page (/s/:bookId) using a single `getDoc()` call.
 * - Never performs a list query.
 * - Requires no authentication.
 * - Treats missing books, draft books, and permission-denied responses identically as "Book not found".
 * - Never returns `ownerId`.
 */
export async function getPublicBookById(bookId) {
  assertFirestoreInitialized();

  const cleanBookId = typeof bookId === 'string' ? bookId.trim() : '';
  if (!cleanBookId) {
    const notFoundErr = new Error('This slam book link is invalid or the book is not published.');
    notFoundErr.code = 'book/not-found';
    throw notFoundErr;
  }

  try {
    const bookRef = doc(db, BOOKS_COLLECTION, cleanBookId);
    const docSnap = await getDoc(bookRef);

    if (!docSnap.exists()) {
      const notFoundErr = new Error('This slam book could not be found or is still a private draft.');
      notFoundErr.code = 'book/not-found';
      throw notFoundErr;
    }

    const publicBook = formatPublicBookDoc(docSnap);

    // Even if the owner views /s/:bookId while signed in, a draft book has no public access
    if (publicBook.status === 'draft') {
      const draftErr = new Error('This slam book could not be found or is still a private draft.');
      draftErr.code = 'book/not-found';
      throw draftErr;
    }

    return publicBook;
  } catch (error) {
    // Firestore denies `get` for logged-out visitors when a book does not exist or is a draft
    if (error.code === 'book/not-found' || error.code === 'permission-denied') {
      const notFoundErr = new Error(
        'This slam book could not be found. It may still be a private draft or the link may be incorrect.'
      );
      notFoundErr.code = 'book/not-found';
      throw notFoundErr;
    }
    throw new Error(getFriendlyFirestoreError(error, 'Could not load this slam book right now.'));
  }
}

/**
 * 5. updateBook(userId, bookId, changes)
 * Updates an existing book owned by `userId`.
 * Explicitly prevents modifying `ownerId` or `createdAt`, and sets `updatedAt`.
 * When called with `{ status }` only (e.g. publishing, closing, or moving to draft),
 * preserves all other existing book fields unchanged.
 */
export async function updateBook(userId, bookId, changes = {}) {
  assertFirestoreAndUser(userId);

  // First verify the book exists and belongs to this user
  const existingBook = await getBookById(userId, bookId);

  try {
    // Strip immutable fields so ownerId and createdAt can never be changed
    const safeChanges = { ...changes };
    delete safeChanges.ownerId;
    delete safeChanges.createdAt;
    delete safeChanges.id;

    // Merge with existing book fields if partial changes were passed so unrelated fields are preserved
    const mergedForValidation = {
      title: 'title' in safeChanges ? safeChanges.title : existingBook.title,
      description: 'description' in safeChanges ? safeChanges.description : existingBook.description,
      coverTheme: 'coverTheme' in safeChanges ? safeChanges.coverTheme : existingBook.coverTheme,
      status: 'status' in safeChanges ? safeChanges.status : existingBook.status,
      templateId: 'templateId' in safeChanges ? safeChanges.templateId : existingBook.templateId,
      questions: 'questions' in safeChanges ? safeChanges.questions : existingBook.questions,
    };

    const validated = validateBookFields(mergedForValidation, { partial: false });

    const updatePayload = {
      title: validated.title,
      description: validated.description,
      coverTheme: validated.coverTheme,
      status: validated.status,
      templateId: validated.templateId,
      questions: validated.questions,
      updatedAt: serverTimestamp(),
    };

    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await updateDoc(bookRef, updatePayload);

    return {
      ...existingBook,
      ...updatePayload,
    };
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error, 'Could not save changes to your slam book.'));
  }
}

/**
 * 6. deleteBook(userId, bookId)
 * Verifies ownership, deletes all documents in `books/{bookId}/responses` in batches of up to 400,
 * and then permanently deletes the slam book document itself.
 */
export async function deleteBook(userId, bookId) {
  assertFirestoreAndUser(userId);

  // Verify the book exists and belongs to this user before deleting
  await getBookById(userId, bookId);

  try {
    // Step 1: Delete all friend responses in `books/{bookId}/responses` in batches of up to 400
    // (Must happen BEFORE deleting the parent book so Firestore rules can verify parent ownership)
    const responsesRef = collection(db, BOOKS_COLLECTION, bookId, RESPONSES_SUBCOLLECTION);
    const responsesSnapshot = await getDocs(responsesRef);

    if (!responsesSnapshot.empty) {
      const responseDocs = responsesSnapshot.docs;
      for (let i = 0; i < responseDocs.length; i += DELETE_BATCH_SIZE) {
        const chunk = responseDocs.slice(i, i + DELETE_BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((responseDoc) => {
          batch.delete(responseDoc.ref);
        });
        await batch.commit();
      }
    }

    // Step 2: Delete the parent book document
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await deleteDoc(bookRef);
    return true;
  } catch (error) {
    throw new Error(getFriendlyFirestoreError(error, 'Could not delete this slam book and its responses.'));
  }
}
