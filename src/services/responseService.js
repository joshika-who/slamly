import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { auth, isFirebaseConfigured } from '../firebase/firebase';

const BOOKS_COLLECTION = 'books';
const RESPONSES_SUBCOLLECTION = 'responses';

export const MAX_RESPONDENT_NAME_LENGTH = 50;
export const MAX_ANSWER_LENGTH = 1000;
export const MAX_ANSWERS_COUNT = 50;
export const DEFAULT_RESPONSE_PAGE_SIZE = 25;

/**
 * Converts Firestore errors into friendly messages for friends and book owners.
 */
export function getFriendlyResponseError(
  error,
  fallbackMessage = 'Something went wrong while communicating with Cloud Firestore.'
) {
  if (!error) return fallbackMessage;

  if (error.isValidationError) {
    return error.message;
  }

  const code = error.code || '';

  switch (code) {
    case 'permission-denied':
      return 'Permission denied by Cloud Firestore. Make sure you are signed in as the book owner (or that the book is published) and that the latest firestore.rules are published.';
    case 'not-found':
      return 'The requested response could not be found.';
    case 'unavailable':
      return 'Network error: Cloud Firestore is temporarily unreachable. Please check your internet connection and try again.';
    case 'failed-precondition':
      return 'Firestore requires an index for this query. Open the browser developer console (F12) and click the Firebase index creation link.';
    case 'unauthenticated':
      return 'You must be logged in to manage slam book responses.';
    default:
      return error.message || fallbackMessage;
  }
}

/**
 * Ensures Firestore is configured and an authenticated owner UID is available.
 */
function assertOwnerAndBook(userId, bookId) {
  if (!isFirebaseConfigured || !db) {
    const err = new Error('Cloud Firestore is not configured. Please check your .env.local file.');
    err.isValidationError = true;
    throw err;
  }

  const resolvedUserId =
    typeof userId === 'string' && userId.trim()
      ? userId.trim()
      : auth?.currentUser?.uid || '';

  if (!resolvedUserId) {
    const err = new Error('You must be logged in to view or manage slam book responses.');
    err.code = 'unauthenticated';
    err.isValidationError = true;
    throw err;
  }

  const cleanBookId = typeof bookId === 'string' ? bookId.trim() : '';
  if (!cleanBookId) {
    const err = new Error('A valid slam book ID is required.');
    err.isValidationError = true;
    throw err;
  }

  return { userId: resolvedUserId, bookId: cleanBookId };
}

/**
 * Normalizes a Firestore response DocumentSnapshot into a clean JS object for owner UI cards.
 */
function formatResponseDoc(docSnap) {
  const data = docSnap.data();
  const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null;

  const normalizedAnswers = Array.isArray(data.answers)
    ? data.answers.map((item, idx) => ({
        questionId: item?.questionId ? String(item.questionId) : `q_${idx}`,
        question: typeof item?.question === 'string' ? item.question : `Question #${idx + 1}`,
        answer: typeof item?.answer === 'string' ? item.answer : '',
      }))
    : [];

  return {
    id: docSnap.id,
    respondentName:
      typeof data.respondentName === 'string' && data.respondentName.trim()
        ? data.respondentName.trim()
        : 'Anonymous Friend',
    answers: normalizedAnswers,
    createdAt: data.createdAt || null,
    createdAtMillis: createdAtDate ? createdAtDate.getTime() : 0,
    formattedDate: createdAtDate
      ? createdAtDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Just now',
  };
}

/**
 * Validates and normalizes a friend's response before writing to or updating in Firestore.
 * Can be called with either:
 *   - `questions` (the book's questions array) + `rawAnswersById` (map of questionId -> string)
 *   - OR a pre-built `answers` array `[{ questionId, question, answer }]`
 */
export function validateResponsePayload({
  respondentName,
  questions = [],
  rawAnswersById = null,
  answers = null,
}) {
  const cleanedName = typeof respondentName === 'string' ? respondentName.trim() : '';

  if (!cleanedName) {
    const err = new Error('Please enter a name or nickname (1 to 50 characters).');
    err.isValidationError = true;
    err.field = 'respondentName';
    throw err;
  }

  if (cleanedName.length > MAX_RESPONDENT_NAME_LENGTH) {
    const err = new Error(
      `Name or nickname must be ${MAX_RESPONDENT_NAME_LENGTH} characters or fewer.`
    );
    err.isValidationError = true;
    err.field = 'respondentName';
    throw err;
  }

  let normalizedAnswers = [];

  if (Array.isArray(questions) && questions.length > 0 && rawAnswersById && typeof rawAnswersById === 'object') {
    if (questions.length > MAX_ANSWERS_COUNT) {
      const err = new Error(`A response can include at most ${MAX_ANSWERS_COUNT} answers.`);
      err.isValidationError = true;
      throw err;
    }

    normalizedAnswers = questions.map((q, index) => {
      const questionId = q.id || `q_${index}`;
      const questionText = (q.text || q.prompt || '').trim();
      const rawValue = rawAnswersById[questionId];
      const answerText = typeof rawValue === 'string' ? rawValue.trim() : '';

      if (q.required && !answerText) {
        const err = new Error(
          `Please answer Question #${index + 1}: "${questionText}"`
        );
        err.isValidationError = true;
        err.field = questionId;
        throw err;
      }

      if (answerText.length > MAX_ANSWER_LENGTH) {
        const err = new Error(
          `Your answer for Question #${index + 1} is too long (maximum ${MAX_ANSWER_LENGTH} characters).`
        );
        err.isValidationError = true;
        err.field = questionId;
        throw err;
      }

      return {
        questionId: String(questionId),
        question: questionText,
        answer: answerText,
      };
    });
  } else if (Array.isArray(answers)) {
    if (answers.length > MAX_ANSWERS_COUNT) {
      const err = new Error(`A response can include at most ${MAX_ANSWERS_COUNT} answers.`);
      err.isValidationError = true;
      throw err;
    }

    // Build a lookup map if questions were also provided to check required flags
    const questionsById = new Map(
      Array.isArray(questions) ? questions.map((q, idx) => [q.id || `q_${idx}`, q]) : []
    );

    normalizedAnswers = answers.map((item, index) => {
      const questionId = item?.questionId ? String(item.questionId) : `q_${index}`;
      const matchedQuestion = questionsById.get(questionId);
      const questionText =
        typeof item?.question === 'string' && item.question.trim()
          ? item.question.trim()
          : (matchedQuestion?.text || matchedQuestion?.prompt || `Question #${index + 1}`).trim();
      const answerText = typeof item?.answer === 'string' ? item.answer.trim() : '';

      if (matchedQuestion?.required && !answerText) {
        const err = new Error(
          `Please answer the required question: "${questionText || `#${index + 1}`}"`
        );
        err.isValidationError = true;
        err.field = questionId;
        throw err;
      }

      if (answerText.length > MAX_ANSWER_LENGTH) {
        const err = new Error(
          `Answer #${index + 1} is too long (maximum ${MAX_ANSWER_LENGTH} characters).`
        );
        err.isValidationError = true;
        err.field = questionId;
        throw err;
      }

      return {
        questionId,
        question: questionText,
        answer: answerText,
      };
    });
  } else {
    const err = new Error('Please provide answers for the slam book questions.');
    err.isValidationError = true;
    throw err;
  }

  return {
    respondentName: cleanedName,
    answers: normalizedAnswers,
  };
}

/**
 * 1. createResponse(bookId, data)
 * Public submission function: stores a friend's response in `books/{bookId}/responses/{responseId}`
 * using an auto-generated ID.
 * - Requires no authentication (friends can respond without an account).
 * - Silently ignores submissions where the hidden honeypot field is filled.
 * - Saves `respondentName`, `answers` ([{ questionId, question, answer }]), and `createdAt` (serverTimestamp).
 */
export async function createResponse(bookId, data = {}) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Cloud Firestore is not configured. Please check the application setup.');
  }

  const cleanBookId = typeof bookId === 'string' ? bookId.trim() : '';
  if (!cleanBookId) {
    throw new Error('Invalid slam book link.');
  }

  // Honeypot check: if a bot fills the hidden field, silently ignore without writing to Firestore
  if (typeof data.honeypot === 'string' && data.honeypot.trim().length > 0) {
    return {
      id: 'honeypot_ignored',
      skippedHoneypot: true,
    };
  }

  try {
    const validated = validateResponsePayload(data);

    const payload = {
      respondentName: validated.respondentName,
      answers: validated.answers,
      createdAt: serverTimestamp(),
    };

    const responsesColRef = collection(
      db,
      BOOKS_COLLECTION,
      cleanBookId,
      RESPONSES_SUBCOLLECTION
    );
    const docRef = await addDoc(responsesColRef, payload);

    return {
      id: docRef.id,
      respondentName: validated.respondentName,
      answers: validated.answers,
    };
  } catch (error) {
    if (error?.code === 'permission-denied') {
      throw new Error('This slam book is no longer accepting responses, or the link is no longer active.');
    }
    throw new Error(
      getFriendlyResponseError(error, 'Could not send your response right now. Please try again.')
    );
  }
}

/**
 * 2. getBookResponses(userId, bookId, { pageSize = 25, cursor = null })
 *    (Also supports calling as `getBookResponses(bookId, { pageSize, cursor })`)
 * Owner-only function: fetches a paginated page of responses from `books/{bookId}/responses`,
 * ordered newest first (`createdAt desc`), 25 per page by default.
 * Returns `{ responses, cursor, nextCursor, hasMore }`.
 */
export async function getBookResponses(arg1, arg2, arg3) {
  let rawUserId;
  let rawBookId;
  let options;

  if (typeof arg2 === 'string') {
    rawUserId = arg1;
    rawBookId = arg2;
    options = arg3 || {};
  } else {
    rawUserId = auth?.currentUser?.uid;
    rawBookId = arg1;
    options = arg2 || {};
  }

  const { bookId } = assertOwnerAndBook(rawUserId, rawBookId);
  const pageSize =
    typeof options.pageSize === 'number' && options.pageSize > 0
      ? Math.min(options.pageSize, 100)
      : DEFAULT_RESPONSE_PAGE_SIZE;
  const cursor = options.cursor || null;

  try {
    const responsesRef = collection(db, BOOKS_COLLECTION, bookId, RESPONSES_SUBCOLLECTION);

    // Fetch pageSize + 1 documents so we know whether another page exists after this one
    const constraints = [orderBy('createdAt', 'desc')];
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(pageSize + 1));

    const responsesQuery = query(responsesRef, ...constraints);
    const snapshot = await getDocs(responsesQuery);

    const hasMore = snapshot.docs.length > pageSize;
    const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

    return {
      responses: pageDocs.map(formatResponseDoc),
      cursor: nextCursor,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    throw new Error(
      getFriendlyResponseError(error, 'Could not load responses for this slam book.')
    );
  }
}

/**
 * 3. getResponseCount(userId, bookId)
 *    (Also supports calling as `getResponseCount(bookId)`)
 * Owner-only function: returns the total number of responses in `books/{bookId}/responses`
 * using Firestore's `getCountFromServer`.
 */
export async function getResponseCount(arg1, arg2) {
  const rawUserId = typeof arg2 === 'string' ? arg1 : auth?.currentUser?.uid;
  const rawBookId = typeof arg2 === 'string' ? arg2 : arg1;

  const { bookId } = assertOwnerAndBook(rawUserId, rawBookId);

  try {
    const responsesRef = collection(db, BOOKS_COLLECTION, bookId, RESPONSES_SUBCOLLECTION);
    const countSnapshot = await getCountFromServer(responsesRef);
    return countSnapshot.data().count;
  } catch (error) {
    throw new Error(
      getFriendlyResponseError(error, 'Could not load the response count for this slam book.')
    );
  }
}

/**
 * 4. updateResponse(userId, bookId, responseId, changes)
 *    (Also supports calling as `updateResponse(bookId, responseId, changes)`)
 * Owner-only function: updates `respondentName` and `answers` on an existing response.
 * Explicitly prevents modifying `createdAt` or adding any extra keys.
 */
export async function updateResponse(arg1, arg2, arg3, arg4) {
  let rawUserId;
  let rawBookId;
  let rawResponseId;
  let changes;

  if (typeof arg3 === 'string') {
    rawUserId = arg1;
    rawBookId = arg2;
    rawResponseId = arg3;
    changes = arg4 || {};
  } else {
    rawUserId = auth?.currentUser?.uid;
    rawBookId = arg1;
    rawResponseId = arg2;
    changes = arg3 || {};
  }

  const { bookId } = assertOwnerAndBook(rawUserId, rawBookId);

  const cleanResponseId = typeof rawResponseId === 'string' ? rawResponseId.trim() : '';
  if (!cleanResponseId) {
    const err = new Error('A valid response ID is required to save changes.');
    err.isValidationError = true;
    throw err;
  }

  try {
    // Validate respondentName (1–50 chars) and answers (<= 50 items, each <= 1000 chars)
    const validated = validateResponsePayload({
      respondentName: changes.respondentName,
      answers: changes.answers,
    });

    // Only respondentName and answers can ever be updated; createdAt is preserved untouched
    const updatePayload = {
      respondentName: validated.respondentName,
      answers: validated.answers,
    };

    const responseRef = doc(
      db,
      BOOKS_COLLECTION,
      bookId,
      RESPONSES_SUBCOLLECTION,
      cleanResponseId
    );
    await updateDoc(responseRef, updatePayload);

    return {
      id: cleanResponseId,
      respondentName: validated.respondentName,
      answers: validated.answers,
    };
  } catch (error) {
    throw new Error(
      getFriendlyResponseError(error, 'Could not save changes to this response.')
    );
  }
}

/**
 * 5. deleteResponse(userId, bookId, responseId)
 *    (Also supports calling as `deleteResponse(bookId, responseId)`)
 * Owner-only function: permanently deletes a single response from `books/{bookId}/responses/{responseId}`.
 */
export async function deleteResponse(arg1, arg2, arg3) {
  const rawUserId = typeof arg3 === 'string' ? arg1 : auth?.currentUser?.uid;
  const rawBookId = typeof arg3 === 'string' ? arg2 : arg1;
  const rawResponseId = typeof arg3 === 'string' ? arg3 : arg2;

  const { bookId } = assertOwnerAndBook(rawUserId, rawBookId);

  const cleanResponseId = typeof rawResponseId === 'string' ? rawResponseId.trim() : '';
  if (!cleanResponseId) {
    const err = new Error('A valid response ID is required to delete a response.');
    err.isValidationError = true;
    throw err;
  }

  try {
    const responseRef = doc(
      db,
      BOOKS_COLLECTION,
      bookId,
      RESPONSES_SUBCOLLECTION,
      cleanResponseId
    );
    await deleteDoc(responseRef);
    return true;
  } catch (error) {
    throw new Error(
      getFriendlyResponseError(error, 'Could not delete this response.')
    );
  }
}
