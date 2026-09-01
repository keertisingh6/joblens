"use client";

import { useState } from "react";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession, UserAccount } from "@/lib/security/auth-store";
import { useAuth } from "@/lib/auth-context";

interface AuthLoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export function AuthLoginView({ onLoginSuccess }: AuthLoginViewProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInGuest } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetFormState = (newMode: "signin" | "register") => {
    setAuthMode(newMode);
    setErrorMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsAuthenticating(true);
    try {
      const account = await signInWithGoogle(rememberDevice);
      onLoginSuccess(account);
    } catch (err: unknown) {
      console.warn("Google login handled:", err);
      const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
      setErrorMessage(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMessage(null);
    setIsAuthenticating(true);
    try {
      const guestAccount = await signInGuest();
      onLoginSuccess(guestAccount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed guest login";
      setErrorMessage(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    setIsAuthenticating(true);

    try {
      // Primary: authenticate via Firebase Auth
      try {
        const account = await signInWithEmail(trimmedEmail, password, rememberDevice);
        onLoginSuccess(account);
        return;
      } catch (firebaseErr: unknown) {
        // If Firebase Auth returns user-not-found or other error, attempt server route check as fallback
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw firebaseErr instanceof Error ? firebaseErr : new Error(data.error || "Authentication failed.");
        }

        const fallbackAccount: UserAccount = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "Job Candidate",
          authToken: data.token,
          createdAt: data.user.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          preferences: {
            protectionEnabled: true,
            autoScanJobPages: true,
            showRiskBadge: true,
            soundAlerts: false,
            threatSensitivity: "STANDARD",
            whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"]
          }
        };

        saveSession(fallbackAccount, rememberDevice);
        onLoginSuccess(fallbackAccount);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
      setErrorMessage(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters)");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password confirmation.");
      return;
    }

    setIsAuthenticating(true);

    try {
      // Primary: Create candidate in Firebase Auth + Firestore
      try {
        const account = await signUpWithEmail(trimmedEmail, password, trimmedName, rememberDevice);
        onLoginSuccess(account);
        return;
      } catch (fbErr: unknown) {
        // Fallback to server route if needed
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            password,
            confirmPassword,
            role: "Job Candidate"
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw fbErr instanceof Error ? fbErr : new Error(data.error || "Failed to create account.");
        }

        const fallbackAccount: UserAccount = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "Job Candidate",
          authToken: data.token,
          createdAt: data.user.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          preferences: {
            protectionEnabled: true,
            autoScanJobPages: true,
            showRiskBadge: true,
            soundAlerts: false,
            threatSensitivity: "STANDARD",
            whitelistedDomains: ["linkedin.com", "greenhouse.io", "lever.co", "myworkdayjobs.com"]
          }
        };

        saveSession(fallbackAccount, rememberDevice);
        onLoginSuccess(fallbackAccount);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card Container */}
        <div className="rounded-2xl border border-slate-800 bg-[#070b16]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-1">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome to JobLens
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Analyze job postings, recruiter domains, and offer letters to detect employment fraud.
            </p>
          </div>

          {/* Google Sign-In Button with Firebase Auth */}
          <div className="space-y-2 pt-1">
            <button
              id="google-firebase-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google (Firebase)</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#070b16] px-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                or candidate email
              </span>
            </div>
          </div>

          {/* Auth Mode Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#040813] border border-slate-800 rounded-lg text-xs font-medium">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => resetFormState("signin")}
              className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                authMode === "signin"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => resetFormState("register")}
              className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                authMode === "register"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="signin-email" className="text-xs font-medium text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs font-medium text-slate-300">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-9 pr-10 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember device toggle */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-[#070e22] text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-300">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                id="signin-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-10 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 border border-sky-400/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Forensic Gateway</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="register-name" className="text-xs font-medium text-slate-300">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="pl-9 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="register-email" className="text-xs font-medium text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="register-password" className="text-xs font-medium text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="pl-9 pr-10 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="register-confirm-password" className="text-xs font-medium text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to confirm"
                    autoComplete="new-password"
                    className="pl-9 pr-10 h-9 bg-[#070e22] border-slate-800 text-white placeholder:text-slate-500 text-xs focus:border-sky-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember device toggle */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-[#070e22] text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-300">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                id="register-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-10 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 border border-sky-400/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <>
                    <span>Create Candidate Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Guest Candidate Option */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={isAuthenticating}
              className="text-xs text-slate-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
            >
              Continue as Guest Candidate
            </button>
          </div>

          {/* Session Footnote */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-slate-400">Candidate Security Gateway</span>
            <span className="text-slate-500">Firebase Auth & Firestore</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-slate-400 text-[11px]">
          <div className="p-2.5 rounded-xl bg-[#070e22]/50 border border-slate-800/60">
            <div className="font-semibold text-slate-200">Multi-Format</div>
            <div className="text-[10px] text-slate-400">Text, emails & letters</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070e22]/50 border border-slate-800/60">
            <div className="font-semibold text-slate-200">Scam Detection</div>
            <div className="text-[10px] text-slate-400">Advance-fee & imposter flags</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070e22]/50 border border-slate-800/60">
            <div className="font-semibold text-slate-200">Gemini AI</div>
            <div className="text-[10px] text-slate-400">Multi-turn & Voice Live</div>
          </div>
        </div>
      </div>
    </div>
  );
}
