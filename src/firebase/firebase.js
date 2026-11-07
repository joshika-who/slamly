import { initializeApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Web Configuration read from Vite environment variables (.env.local).
 * Never commit real keys in .env.local to Git — only .env.example is tracked.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * App Check configuration (Milestone 7A):
 * - VITE_RECAPTCHA_SITE_KEY: public reCAPTCHA site key from Firebase App Check.
 * - VITE_RECAPTCHA_PROVIDER: optional, set to "enterprise" to use ReCaptchaEnterpriseProvider,
 *   or leave unset / "v3" to use ReCaptchaV3Provider (default).
 * - VITE_APPCHECK_DEBUG_TOKEN: local development debug token (used ONLY when import.meta.env.DEV is true).
 */
const recaptchaSiteKey =
  typeof import.meta.env.VITE_RECAPTCHA_SITE_KEY === 'string'
    ? import.meta.env.VITE_RECAPTCHA_SITE_KEY.trim()
    : '';
const recaptchaProviderType =
  typeof import.meta.env.VITE_RECAPTCHA_PROVIDER === 'string'
    ? import.meta.env.VITE_RECAPTCHA_PROVIDER.trim().toLowerCase()
    : 'v3';
const appCheckDebugToken =
  typeof import.meta.env.VITE_APPCHECK_DEBUG_TOKEN === 'string'
    ? import.meta.env.VITE_APPCHECK_DEBUG_TOKEN.trim()
    : '';

/**
 * Helper flag indicating whether all required Firebase environment variables
 * have been provided in .env.local (or Vercel Environment Variables).
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app = null;
let appCheck = null;
let auth = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);

  // Initialise Firebase App Check immediately after initializeApp and BEFORE getAuth / getFirestore
  if (typeof window !== 'undefined' && typeof self !== 'undefined') {
    // Support local development debug token ONLY in dev builds (never in production builds)
    if (import.meta.env.DEV && appCheckDebugToken) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN =
        appCheckDebugToken === 'true' ? true : appCheckDebugToken;
    }

    if (recaptchaSiteKey) {
      try {
        const provider =
          recaptchaProviderType === 'enterprise'
            ? new ReCaptchaEnterpriseProvider(recaptchaSiteKey)
            : new ReCaptchaV3Provider(recaptchaSiteKey);

        appCheck = initializeAppCheck(app, {
          provider,
          isTokenAutoRefreshEnabled: true,
        });
      } catch (error) {
        console.warn(
          '[Slamly App Check] Could not initialise Firebase App Check:',
          error?.message || error
        );
      }
    } else {
      console.warn(
        '[Slamly App Check] VITE_RECAPTCHA_SITE_KEY is not set. Skipping Firebase App Check initialisation.'
      );
    }
  }

  auth = getAuth(app);
} else {
  console.warn(
    '[Slamly Firebase Setup] VITE_FIREBASE_* environment variables are missing. ' +
      'Copy .env.example to .env.local and add your Firebase Web App config values.'
  );
}

export { app, appCheck, auth };
export default app;

