"use client";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  authToken: string;
  createdAt: string;
  lastActive: string;
  photoURL?: string;
  preferences: {
    protectionEnabled: boolean;
    autoScanJobPages: boolean;
    showRiskBadge: boolean;
    soundAlerts: boolean;
    threatSensitivity: "STANDARD" | "HIGH" | "RELAXED";
    whitelistedDomains: string[];
  };
}

export const SESSION_STORAGE_KEY = "joblens_session_v3";
const LEGACY_STORAGE_KEYS = ["joblens_ext_user_v2", "joblens_ext_user", "joblens_demo_user"];

/**
 * Safely purges any legacy demo or stale test sessions from browser storage.
 */
export function purgeLegacyDemoSessions(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch (err) {
    console.error("Failed to purge legacy demo sessions:", err);
  }
}

/**
 * Retrieves the currently active authenticated session.
 * Returns null if no valid authenticated user session exists.
 * DOES NOT return fake, demo, or hardcoded accounts.
 */
export function getStoredSession(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    purgeLegacyDemoSessions();

    // Check localStorage (persisted) first
    let raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      // Check sessionStorage (session only)
      raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    }

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id && parsed.email && parsed.authToken) {
      return parsed as UserAccount;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves authenticated session with optional "Remember this device" persistence.
 */
export function saveSession(account: UserAccount, rememberDevice: boolean = true): void {
  if (typeof window === "undefined") return;
  try {
    account.lastActive = new Date().toISOString();
    const serialized = JSON.stringify(account);

    if (rememberDevice) {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

/**
 * Clears any active authenticated session across storage mechanisms.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    purgeLegacyDemoSessions();
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

/**
 * Updates candidate preferences for the active session.
 */
export function updateUserPreferences(updates: Partial<UserAccount["preferences"]>): UserAccount | null {
  const current = getStoredSession();
  if (!current) return null;

  const updated: UserAccount = {
    ...current,
    preferences: {
      ...current.preferences,
      ...updates
    }
  };

  // Determine if it was in localStorage or sessionStorage
  const isPersistent = typeof window !== "undefined" && localStorage.getItem(SESSION_STORAGE_KEY) !== null;
  saveSession(updated, isPersistent);
  return updated;
}
