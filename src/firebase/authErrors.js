/**
 * Maps Firebase Authentication error codes to clear, friendly, user-safe messages.
 *
 * Security & privacy rules:
 * - On login, auth/invalid-credential, auth/wrong-password, and auth/user-not-found
 *   all return the exact same generic message ("Incorrect email or password.")
 *   so we never reveal whether an email is registered.
 *
 * @param {unknown} error - The error thrown by Firebase Auth
 * @param {'login' | 'signup' | 'reset' | 'general'} [context='general'] - Where the error occurred
 * @returns {string} Friendly error message safe to display in the UI
 */
export function getFriendlyAuthErrorMessage(error, context = 'general') {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';

  switch (code) {
    // Login credential errors — intentionally unified into one generic message
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please check your details and try again.';

    // Signup / email errors
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in or use a different email.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address (for example: you@example.com).';

    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';

    // Rate limiting & account status errors
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again, or reset your password.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for help.';

    // Network errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';

    // Missing .env.local configuration
    case 'auth/missing-config':
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase is not configured yet. Please add your VITE_FIREBASE_* keys in .env.local and restart the server.';

    default:
      if (context === 'login') {
        return 'Unable to log in right now. Please check your details and try again.';
      }
      if (context === 'signup') {
        return 'Unable to create your account right now. Please try again.';
      }
      if (context === 'reset') {
        return 'Unable to send a password reset email right now. Please try again.';
      }
      return 'Something went wrong with authentication. Please try again.';
  }
}

