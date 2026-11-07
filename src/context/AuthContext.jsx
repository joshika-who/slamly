import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase';

export const AuthContext = createContext(null);

/**
 * AuthProvider manages Firebase Authentication state across the entire Slamly app.
 * - Registers ONE onAuthStateChanged listener and unsubscribes on unmount.
 * - Relies on Firebase's native browser session persistence (no custom localStorage hacks).
 * - Exposes: user, loading, isFirebaseConfigured, signup, login, logout, resetPassword.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Ensures Firebase is configured before attempting an Auth request.
   */
  const ensureAuthReady = () => {
    if (!isFirebaseConfigured || !auth) {
      const configError = new Error('Firebase is not configured.');
      configError.code = 'auth/missing-config';
      throw configError;
    }
  };

  /**
   * Creates a new user with email & password and saves their full name to displayName.
   */
  const signup = async (fullName, email, password) => {
    ensureAuthReady();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      password
    );

    if (trimmedName) {
      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });
      // Trigger a fresh reference so React components immediately see the updated displayName
      setUser({
        ...userCredential.user,
        displayName: trimmedName,
      });
    }

    return userCredential.user;
  };

  /**
   * Signs in an existing user with email and password.
   */
  const login = async (email, password) => {
    ensureAuthReady();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    return userCredential.user;
  };

  /**
   * Signs out the currently authenticated user.
   */
  const logout = async () => {
    ensureAuthReady();
    await signOut(auth);
  };

  /**
   * Sends a Firebase password reset email to the given address.
   */
  const resetPassword = async (email) => {
    ensureAuthReady();
    await sendPasswordResetEmail(auth, email.trim());
  };

  const value = {
    user,
    loading,
    isFirebaseConfigured,
    signup,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the current authentication state and helper functions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}

