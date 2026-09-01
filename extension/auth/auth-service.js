/**
 * JobLens Extension True Firebase Authentication Service
 * Direct integration with Firebase Authentication REST API
 * Provides verifiable JWT tokens, session persistence, and real user accounts.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.JobLensAuthService = factory();
  }
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this, function () {

  // Client Firebase API Key from project config
  const FIREBASE_API_KEY = "AIzaSyDVXTGdK9vEp2r1wxN1Ly_PEv-_tMBJ5-c";
  const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
  const TOKEN_BASE_URL = "https://securetoken.googleapis.com/v1";

  function parseFirebaseError(errorObj) {
    const message = errorObj?.error?.message || (typeof errorObj === "string" ? errorObj : "");
    switch (message) {
      case "EMAIL_NOT_FOUND":
      case "INVALID_LOGIN_CREDENTIALS":
      case "INVALID_PASSWORD":
        return "Invalid email or password. Please verify your credentials.";
      case "EMAIL_EXISTS":
        return "An account with this email address already exists. Please sign in instead.";
      case "USER_DISABLED":
        return "This candidate security account has been disabled.";
      case "TOO_MANY_ATTEMPTS_TRY_LATER":
        return "Access temporarily blocked due to repeated failed attempts. Please try again later.";
      case "WEAK_PASSWORD : Password should be at least 6 characters":
      case "WEAK_PASSWORD":
        return "Password is too weak. Please use at least 6 characters.";
      case "INVALID_EMAIL":
        return "Please enter a valid email address.";
      default:
        return message || "Authentication failed. Please check network connectivity.";
    }
  }

  async function signInWithEmailPassword(email, password) {
    const res = await fetch(`${AUTH_BASE_URL}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(parseFirebaseError(data));
    }

    return {
      uid: data.localId,
      email: data.email,
      name: data.displayName || email.split("@")[0],
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      isAnonymous: false,
      authenticatedAt: new Date().toISOString()
    };
  }

  async function signUpWithEmailPassword(email, password, displayName) {
    const res = await fetch(`${AUTH_BASE_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(parseFirebaseError(data));
    }

    let resolvedName = displayName?.trim() || email.split("@")[0];

    // Update display name if provided
    if (displayName && displayName.trim()) {
      try {
        await fetch(`${AUTH_BASE_URL}/accounts:update?key=${FIREBASE_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: data.idToken,
            displayName: resolvedName,
            returnSecureToken: true
          })
        });
      } catch (e) {
        console.warn("Display name update non-fatal error:", e);
      }
    }

    return {
      uid: data.localId,
      email: data.email,
      name: resolvedName,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      isAnonymous: false,
      authenticatedAt: new Date().toISOString()
    };
  }

  async function signInAsGuest() {
    const res = await fetch(`${AUTH_BASE_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(parseFirebaseError(data));
    }

    return {
      uid: data.localId,
      email: "guest.candidate@joblens.security",
      name: "Guest Candidate",
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      isAnonymous: true,
      authenticatedAt: new Date().toISOString()
    };
  }

  async function refreshSessionToken(refreshToken) {
    if (!refreshToken) throw new Error("No refresh token available");

    const res = await fetch(`${TOKEN_BASE_URL}/token?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error("Session expired. Please sign in again.");
    }

    return {
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      uid: data.user_id,
      expiresIn: data.expires_in
    };
  }

  async function verifyIdToken(idToken) {
    if (!idToken) return false;
    try {
      const res = await fetch(`${AUTH_BASE_URL}/accounts:lookup?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      return res.ok && data.users && data.users.length > 0;
    } catch {
      return false;
    }
  }

  return {
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signInAsGuest,
    refreshSessionToken,
    verifyIdToken
  };
});
