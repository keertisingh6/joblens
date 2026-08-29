"use client";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  authToken: string;
  createdAt: string;
  lastActive: string;
  onboardingCompleted: boolean;
  preferences: {
    protectionEnabled: boolean;
    autoScanJobPages: boolean;
    showRiskBadge: boolean;
    soundAlerts: boolean;
    threatSensitivity: "STANDARD" | "AGGRESSIVE" | "RELAXED";
    whitelistedDomains: string[];
  };
}

const AUTH_STORAGE_KEY = "joblens_ext_user_v2";

export const DEFAULT_USER: UserAccount = {
  id: "usr_lens_demo",
  name: "Keerti Singh",
  email: "keerti.analyst@cybersec.org",
  role: "Job Seeker / Security Analyst",
  authToken: "jbl_sec_tok_991823a8f",
  createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  lastActive: new Date().toISOString(),
  onboardingCompleted: true,
  preferences: {
    protectionEnabled: true,
    autoScanJobPages: true,
    showRiskBadge: true,
    soundAlerts: false,
    threatSensitivity: "STANDARD",
    whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"]
  }
};

export function getUserAccount(): UserAccount {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      // Initialize with default or prompt onboarding
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserAccount(account: UserAccount): void {
  if (typeof window === "undefined") return;
  try {
    account.lastActive = new Date().toISOString();
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
  } catch (err) {
    console.error("Failed to save user account:", err);
  }
}

export function updateUserPreferences(updates: Partial<UserAccount["preferences"]>): UserAccount {
  const current = getUserAccount();
  const updated: UserAccount = {
    ...current,
    preferences: {
      ...current.preferences,
      ...updates
    }
  };
  saveUserAccount(updated);
  return updated;
}

export function completeOnboarding(profile: {
  name: string;
  email: string;
  role: string;
  sensitivity?: "STANDARD" | "AGGRESSIVE" | "RELAXED";
}): UserAccount {
  const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const newAccount: UserAccount = {
    id: `usr_${Date.now()}`,
    name: profile.name || "Job Candidate",
    email: profile.email || "candidate@joblens.security",
    role: profile.role || "Job Seeker",
    authToken: `jbl_tok_${randomHex}`,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    onboardingCompleted: true,
    preferences: {
      protectionEnabled: true,
      autoScanJobPages: true,
      showRiskBadge: true,
      soundAlerts: false,
      threatSensitivity: profile.sensitivity || "STANDARD",
      whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"]
    }
  };
  saveUserAccount(newAccount);
  return newAccount;
}

export function resetAccountToNewInstall(): UserAccount {
  const blankAccount: UserAccount = {
    id: `usr_${Date.now()}`,
    name: "",
    email: "",
    role: "",
    authToken: "",
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    onboardingCompleted: false,
    preferences: {
      protectionEnabled: true,
      autoScanJobPages: true,
      showRiskBadge: true,
      soundAlerts: false,
      threatSensitivity: "STANDARD",
      whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"]
    }
  };
  saveUserAccount(blankAccount);
  return blankAccount;
}
