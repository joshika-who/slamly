/**
 * ============================================================================
 * SLAMLY — FUTURE FIREBASE & PDF SERVICE ARCHITECTURE PLACEHOLDER
 * ============================================================================
 * Per Milestone 1 requirements:
 * - Firebase Authentication, Cloud Firestore, Firebase Storage, and jsPDF are
 *   intentionally NOT initialized in Milestone 1.
 * - No credentials, API keys, or fake localStorage databases are used here.
 *
 * Planned Milestone 2+ Integration Map:
 * 1. `authService`: Firebase Auth (`createUserWithEmailAndPassword`,
 *    `signInWithEmailAndPassword`, `onAuthStateChanged`).
 * 2. `bookService`: Cloud Firestore (`books/{bookId}` owned by `ownerUid`,
 *    public share lookup via unguessable `shareToken`).
 * 3. `responseService`: Cloud Firestore (`books/{bookId}/responses/{respId}`)
 *    where friends can create a response without an account if `book.isOpen`,
 *    while only `ownerUid` can read/edit/delete responses.
 * 4. `pdfExportService`: `jsPDF` generator formatting pages into a printable
 *    scrapbook keepsake PDF.
 * ============================================================================
 */

export const MILESTONE_STATUS = {
  currentMilestone: 1,
  mode: 'FRONTEND_PREVIEW_ONLY',
  firebaseConnected: false,
  note: 'Preview mode: no real account or database record is created in Milestone 1.',
};

