"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import {
  UserAccount,
  saveSession,
  clearSession,
  getStoredSession,
  purgeLegacyDemoSessions,
} from "@/lib/security/auth-store";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  createdAt?: unknown;
  lastLoginAt?: unknown;
  scanCount?: number;
  preferences?: UserAccount["preferences"];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  account: UserAccount | null;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: (rememberDevice?: boolean) => Promise<UserAccount>;
  signInWithEmail: (email: string, pass: string, rememberDevice?: boolean) => Promise<UserAccount>;
  signUpWithEmail: (email: string, pass: string, name: string, rememberDevice?: boolean) => Promise<UserAccount>;
  signInGuest: () => Promise<UserAccount>;
  signOut: () => Promise<void>;
  updateAccountPreferences: (updates: Partial<UserAccount["preferences"]>) => Promise<void>;
  updateAccountProfile: (name?: string, role?: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const DEFAULT_PREFERENCES: UserAccount["preferences"] = {
  protectionEnabled: true,
  autoScanJobPages: true,
  showRiskBadge: true,
  soundAlerts: false,
  threatSensitivity: "STANDARD",
  whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseError(err: unknown): string {
  if (!err || typeof err !== "object") return "Authentication failed. Please try again.";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (err as any).code;
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing.";
    case "auth/network-request-failed":
      return "Network connection issue. Please verify your internet connectivity.";
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (err as any).message || "Authentication error occurred.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to build and sync UserAccount from Firebase User + Firestore doc
  const syncAccountState = useCallback(
    async (firebaseUser: User, rememberDevice: boolean = true): Promise<UserAccount> => {
      let idToken = "";
      try {
        idToken = await firebaseUser.getIdToken();
      } catch {
        idToken = `token_${firebaseUser.uid}`;
      }

      let storedDocData: Partial<UserProfile> = {};
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          storedDocData = snap.data() as UserProfile;
          await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        } else {
          const initialDoc: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName ||
              (firebaseUser.isAnonymous ? "Guest Candidate" : "Job Candidate"),
            photoURL: firebaseUser.photoURL,
            role: "Job Candidate",
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            scanCount: 0,
            preferences: DEFAULT_PREFERENCES,
          };
          await setDoc(userDocRef, initialDoc);
          storedDocData = initialDoc;
        }
      } catch (e) {
        console.warn("Firestore user sync fallback:", e);
      }

      const mergedPreferences = storedDocData.preferences || DEFAULT_PREFERENCES;
      const mergedRole = storedDocData.role || "Job Candidate";
      const mergedName =
        storedDocData.displayName ||
        firebaseUser.displayName ||
        (firebaseUser.isAnonymous ? "Guest Candidate" : "Job Candidate");
      const mergedEmail =
        firebaseUser.email ||
        (firebaseUser.isAnonymous ? "guest@joblens.security" : "candidate@joblens.security");

      const userAccount: UserAccount = {
        id: firebaseUser.uid,
        name: mergedName,
        email: mergedEmail,
        role: mergedRole,
        authToken: idToken,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        photoURL: firebaseUser.photoURL || undefined,
        preferences: mergedPreferences,
      };

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: mergedName,
        photoURL: firebaseUser.photoURL,
        role: mergedRole,
        preferences: mergedPreferences,
      };

      setAccount(userAccount);
      setProfile(userProfile);
      saveSession(userAccount, rememberDevice);

      return userAccount;
    },
    []
  );

  // Monitor Firebase Auth state changes
  useEffect(() => {
    purgeLegacyDemoSessions();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncAccountState(currentUser, true);
        } catch (err) {
          console.error("Error syncing Firebase user account:", err);
        }
      } else {
        // When signed out of Firebase, check if an offline cached session is present or clear
        const cached = getStoredSession();
        if (!cached) {
          setAccount(null);
          setProfile(null);
          clearSession();
        } else {
          setAccount(cached);
          setProfile({
            uid: cached.id,
            email: cached.email,
            displayName: cached.name,
            photoURL: cached.photoURL || null,
            role: cached.role,
            preferences: cached.preferences,
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncAccountState]);

  const signInWithGoogle = async (rememberDevice: boolean = true): Promise<UserAccount> => {
    try {
      setError(null);
      await setPersistence(
        auth,
        rememberDevice ? browserLocalPersistence : browserSessionPersistence
      );
      const res = await signInWithPopup(auth, googleProvider);
      return await syncAccountState(res.user, rememberDevice);
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const mapped = mapFirebaseError(err);
      setError(mapped);
      throw new Error(mapped);
    }
  };

  const signInWithEmail = async (
    emailVal: string,
    passVal: string,
    rememberDevice: boolean = true
  ): Promise<UserAccount> => {
    try {
      setError(null);
      await setPersistence(
        auth,
        rememberDevice ? browserLocalPersistence : browserSessionPersistence
      );
      const res = await signInWithEmailAndPassword(auth, emailVal.trim(), passVal);
      return await syncAccountState(res.user, rememberDevice);
    } catch (err: unknown) {
      console.error("Email sign in error:", err);
      const mapped = mapFirebaseError(err);
      setError(mapped);
      throw new Error(mapped);
    }
  };

  const signUpWithEmail = async (
    emailVal: string,
    passVal: string,
    nameVal: string,
    rememberDevice: boolean = true
  ): Promise<UserAccount> => {
    try {
      setError(null);
      await setPersistence(
        auth,
        rememberDevice ? browserLocalPersistence : browserSessionPersistence
      );
      const res = await createUserWithEmailAndPassword(auth, emailVal.trim(), passVal);

      if (nameVal.trim()) {
        try {
          await updateFirebaseProfile(res.user, { displayName: nameVal.trim() });
        } catch (e) {
          console.warn("Profile name update warning:", e);
        }
      }

      return await syncAccountState(res.user, rememberDevice);
    } catch (err: unknown) {
      console.error("Email registration error:", err);
      const mapped = mapFirebaseError(err);
      setError(mapped);
      throw new Error(mapped);
    }
  };

  const signInGuest = async (): Promise<UserAccount> => {
    try {
      setError(null);
      await setPersistence(auth, browserSessionPersistence);
      const res = await signInAnonymously(auth);
      return await syncAccountState(res.user, false);
    } catch (err: unknown) {
      console.error("Guest sign in error:", err);
      const mapped = mapFirebaseError(err);
      setError(mapped);
      throw new Error(mapped);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      clearSession();
      setUser(null);
      setProfile(null);
      setAccount(null);
    } catch (err: unknown) {
      console.error("Sign out error:", err);
      clearSession();
      setUser(null);
      setProfile(null);
      setAccount(null);
    }
  };

  const updateAccountPreferences = async (
    updates: Partial<UserAccount["preferences"]>
  ): Promise<void> => {
    if (!account) return;

    const newPreferences = {
      ...account.preferences,
      ...updates,
    };

    const updatedAccount: UserAccount = {
      ...account,
      preferences: newPreferences,
      lastActive: new Date().toISOString(),
    };

    setAccount(updatedAccount);
    saveSession(updatedAccount);

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { preferences: newPreferences }, { merge: true });
      } catch (err) {
        console.warn("Error updating preferences in Firestore:", err);
      }
    }
  };

  const updateAccountProfile = async (name?: string, role?: string): Promise<void> => {
    if (!account) return;

    const updatedAccount: UserAccount = {
      ...account,
      name: name !== undefined ? name : account.name,
      role: role !== undefined ? role : account.role,
      lastActive: new Date().toISOString(),
    };

    setAccount(updatedAccount);
    saveSession(updatedAccount);

    if (user) {
      try {
        if (name && auth.currentUser) {
          await updateFirebaseProfile(auth.currentUser, { displayName: name });
        }
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            displayName: updatedAccount.name,
            role: updatedAccount.role,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Error updating profile in Firestore:", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        account,
        isAuthenticated: !!user || !!account,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInGuest,
        signOut,
        updateAccountPreferences,
        updateAccountProfile,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
