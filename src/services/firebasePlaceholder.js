/**
 * ============================================================================
 * SLAMLY — FIREBASE SERVICE ROADMAP NOTES
 * ============================================================================
 * - Milestone 1 (Complete): Frontend foundation & scrapbook design system.
 * - Milestone 2 (Complete): Firebase Authentication is now implemented in:
 *     - `src/firebase/firebase.js`
 *     - `src/firebase/authErrors.js`
 *     - `src/context/AuthContext.jsx`
 * - Milestone 3 (Upcoming): Cloud Firestore book & question persistence.
 * - Milestone 4 (Upcoming): Public shareable links & friend response collection.
 * - Milestone 5 (Upcoming): jsPDF keepsake export.
 * ============================================================================
 */

export const MILESTONE_STATUS = {
  currentMilestone: 2,
  mode: 'FIREBASE_AUTH_ENABLED',
  firebaseAuthConnected: true,
  firestoreConnected: false,
};
