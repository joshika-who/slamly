import { getFirestore } from 'firebase/firestore';
import { app, isFirebaseConfigured } from './firebase';

/**
 * Exports the Cloud Firestore instance initialized from the existing Firebase app.
 * Does not initialize Firebase a second time.
 */
const db = isFirebaseConfigured && app ? getFirestore(app) : null;

export { db };
export default db;

