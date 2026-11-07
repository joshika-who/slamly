import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { isFirebaseConfigured } from '../firebase/firebase';

const BOOKS_COLLECTION = 'books';
const RESPONSES_SUBCOLLECTION = 'responses';

export const MAX_RESPONDENT_NAME_LENGTH = 50;
export const MAX_ANSWER_LENGTH = 1000;
export const MAX_ANSWERS_COUNT = 50;

/**
 * Converts Firestore errors during response submission into friendly messages for friends.
 */
export function getFriendlyResponseError(
  error,
  fallbackMessage = 'Could not send your response right now. Please try again.'
) {
  if (!error) return fallbackMessage;

  if (error.isValidationError) {
    return error.message;
  }

  const code = error.code || '';

  switch (code) {
    case 'permission-denied':
      return 'This slam book is no longer accepting responses, or the link is no longer active.';
    case 'unavailable':
      return 'Network error: Could not reach Cloud Firestore. Please check your internet connection and try again.';
    default:
      return error.message || fallbackMessage;
  }
}

/**
 * Validates and normalizes a friend's response before writing to Firestore.
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
    const err = new Error('Please enter your name or nickname before submitting.');
    err.isValidationError = true;
    err.field = 'respondentName';
    throw err;
  }

  if (cleanedName.length > MAX_RESPONDENT_NAME_LENGTH) {
    const err = new Error(
      `Your name or nickname must be ${MAX_RESPONDENT_NAME_LENGTH} characters or fewer.`
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
          : (matchedQuestion?.text || matchedQuestion?.prompt || '').trim();
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
 * createResponse(bookId, data)
 * Stores a friend's response in `books/{bookId}/responses/{responseId}` using an auto-generated ID.
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
    throw new Error(getFriendlyResponseError(error));
  }
}

