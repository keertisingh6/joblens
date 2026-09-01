"use client";

import React, { useEffect, useState } from "react";

// ============================================================================
// 10 Distinct, High-Quality, Non-Repeating Platform Vector Icons
// (Recruitment Portals, Communication Vectors & Enterprise ATS)
// ============================================================================

// 1. LinkedIn
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0A66C2" fillOpacity="0.18" stroke="#0A66C2" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M12.5 17H16.5V28H12.5V17ZM14.5 11C15.77 11 16.8 12.03 16.8 13.3C16.8 14.57 15.77 15.6 14.5 15.6C13.23 15.6 12.2 14.57 12.2 13.3C12.2 12.03 13.23 11 14.5 11ZM19 17H22.8V18.8H22.85C23.4 17.75 24.8 16.65 26.8 16.65C30.5 16.65 31.5 19.1 31.5 22.3V28H27.5V22.9C27.5 21.4 27.2 19.8 25.4 19.8C23.6 19.8 23 21.2 23 22.8V28H19V17Z"
        fill="#38BDF8"
      />
    </svg>
  );
}

// 2. Naukri
function NaukriIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0E5EB8" fillOpacity="0.18" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M12 28V12H15.6L23.4 23.2V12H27.5V28H24L16.2 16.8V28H12Z"
        fill="#93C5FD"
      />
      <circle cx="27.5" cy="12.5" r="2.2" fill="#38BDF8" />
    </svg>
  );
}

// 3. Gmail
function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#EA4335" fillOpacity="0.15" stroke="#F87171" strokeWidth="1.5" strokeOpacity="0.55" />
      <path
        d="M10 13V27H14V18.5L20 22.5L26 18.5V27H30V13L20 20L10 13Z"
        fill="#FCA5A5"
      />
    </svg>
  );
}

// 4. Indeed
function IndeedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#2164F3" fillOpacity="0.16" stroke="#2164F3" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M21 9C22.3 9 23.3 8 23.3 6.7C23.3 5.4 22.3 4.4 21 4.4C19.7 4.4 18.7 5.4 18.7 6.7C18.7 8 19.7 9 21 9ZM22.5 12.8C22.5 12.8 20.3 11.9 18.4 13.5C17.1 14.8 16.7 16.3 16.7 18.2V27H13.2V13H16.7V15.7C17.3 14.2 18.8 12.4 21.5 12.4C22.1 12.4 22.4 12.5 22.5 12.8ZM25.5 27H22V15.3C22.9 14.8 24 14.5 25.5 14.5V27Z"
        fill="#60A5FA"
      />
    </svg>
  );
}

// 5. Glassdoor
function GlassdoorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0CAA41" fillOpacity="0.16" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M12.5 11C11.1 11 10 12.1 10 13.5V26.5C10 27.9 11.1 29 12.5 29H22V25.2H14V14.8H26V20.5H29.5V13.5C29.5 12.1 28.4 11 27 11H12.5Z"
        fill="#34D399"
      />
      <rect x="18" y="18" width="4" height="4" rx="1" fill="#6EE7B7" />
    </svg>
  );
}

// 6. Internshala
function InternshalaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#008BDC" fillOpacity="0.16" stroke="#008BDC" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M20 8L22.8 16.2L31.5 19L23.4 22.5L20 31.5L17.2 23.2L8.5 20.5L16.6 17L20 8Z"
        fill="#38BDF8"
      />
      <circle cx="20" cy="19.7" r="3" fill="#E0F2FE" />
    </svg>
  );
}

// 7. Outlook
function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0078D4" fillOpacity="0.16" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="16" cy="19.5" r="6.5" stroke="#7DD3FC" strokeWidth="2.2" />
      <path d="M22.5 13.5L30 10.5V28.5L22.5 25.5V13.5Z" fill="#BAE6FD" />
    </svg>
  );
}

// 8. WhatsApp
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#25D366" fillOpacity="0.15" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.55" />
      <path
        d="M20 10C14.5 10 10 14.5 10 20C10 21.9 10.6 23.7 11.6 25.3L10.5 29.5L14.9 28.4C16.4 29.2 18.2 29.7 20 29.7C25.5 29.7 30 25.2 30 20C30 14.5 25.5 10 20 10ZM24.8 23.5C24.5 24.3 23.3 24.9 22.5 25.1C21.9 25.2 21.1 25.2 19.2 24.4C16.6 23.4 15 20.8 14.8 20.6C14.7 20.5 13.6 19 13.6 17.5C13.6 16 14.4 15.3 14.7 15C15 14.7 15.3 14.7 15.6 14.7C15.8 14.7 16 14.7 16.2 14.7C16.5 14.6 16.7 14.5 17 15.1C17.3 15.8 17.9 17.3 18 17.5C18.1 17.6 18.1 17.8 18 18.1C17.9 18.2 17.7 18.4 17.6 18.5C17.4 18.7 17.3 18.8 17.1 19C17 19.1 16.8 19.3 17 19.6C17.3 20.1 18.1 21.3 19.3 22.3C20.6 23.5 21.7 23.8 22.1 24C22.4 24.1 22.7 24.1 22.9 23.8C23.2 23.5 23.8 22.7 24.1 22.3C24.4 21.8 24.7 21.9 25 22.1C25.3 22.2 27 23 27.3 23.2C27.6 23.3 27.8 23.5 27.8 23.7C27.8 23.8 27.8 24.5 24.8 23.5Z"
        fill="#86EFAC"
      />
    </svg>
  );
}

// 9. Telegram
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#229ED9" fillOpacity="0.16" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d="M12 19.5L26.5 13.5C27.1 13.2 27.7 13.7 27.5 14.3L25 26.2C24.8 26.8 24.1 27 23.6 26.5L19.7 23.2L17.7 25C17.4 25.3 17 25.1 17 24.7V21.8L24.1 16C24.4 15.7 24.1 15.2 23.8 15.4L15 21L12 19.5Z"
        fill="#E0F2FE"
      />
    </svg>
  );
}

// 10. Workday / Career Portal ATS
function WorkdayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#E28525" fillOpacity="0.15" stroke="#FB923C" strokeWidth="1.5" strokeOpacity="0.55" />
      <path
        d="M11 26.5L15 13.5H18.5L20.8 21.2L23.1 13.5H26.5L30.5 26.5H27L25 18.5L22.5 26.5H19.5L17 18.5L15 26.5H11Z"
        fill="#FDBA74"
      />
      <circle cx="20.8" cy="10.5" r="1.8" fill="#FED7AA" />
    </svg>
  );
}

// ============================================================================
// Layout Grid: Exactly 10 Perimeter Floating Elements
// Left Edge (5) & Right Edge (5) — Zero Central Overlap
// ============================================================================

interface PerimeterIconConfig {
  id: string;
  name: string;
  Component: React.ComponentType<{ className?: string }>;
  edge: "left" | "right";
  topPercent: number; // Vertical distribution percentage (0-100)
  horizontalOffset: string; // e.g. "3%", "4%"
  size: number;
  opacityClass: string;
  animName: string;
  duration: number;
  delay: number;
}

const PERIMETER_ICONS: PerimeterIconConfig[] = [
  // --- LEFT SCREEN EDGE ---
  {
    id: "linkedin",
    name: "LinkedIn",
    Component: LinkedInIcon,
    edge: "left",
    topPercent: 8,
    horizontalOffset: "3.5%",
    size: 44,
    opacityClass: "opacity-25",
    animName: "drift-subtle-1",
    duration: 22,
    delay: 0
  },
  {
    id: "naukri",
    name: "Naukri",
    Component: NaukriIcon,
    edge: "left",
    topPercent: 27,
    horizontalOffset: "4.5%",
    size: 40,
    opacityClass: "opacity-20",
    animName: "drift-subtle-2",
    duration: 26,
    delay: 2
  },
  {
    id: "internshala",
    name: "Internshala",
    Component: InternshalaIcon,
    edge: "left",
    topPercent: 48,
    horizontalOffset: "3%",
    size: 38,
    opacityClass: "opacity-15",
    animName: "drift-subtle-3",
    duration: 30,
    delay: 1
  },
  {
    id: "gmail",
    name: "Gmail",
    Component: GmailIcon,
    edge: "left",
    topPercent: 68,
    horizontalOffset: "4%",
    size: 42,
    opacityClass: "opacity-20",
    animName: "drift-subtle-1",
    duration: 24,
    delay: 3
  },
  {
    id: "telegram",
    name: "Telegram",
    Component: TelegramIcon,
    edge: "left",
    topPercent: 87,
    horizontalOffset: "4.5%",
    size: 38,
    opacityClass: "opacity-15",
    animName: "drift-subtle-2",
    duration: 28,
    delay: 4
  },

  // --- RIGHT SCREEN EDGE ---
  {
    id: "indeed",
    name: "Indeed",
    Component: IndeedIcon,
    edge: "right",
    topPercent: 8,
    horizontalOffset: "3.5%",
    size: 44,
    opacityClass: "opacity-25",
    animName: "drift-subtle-2",
    duration: 23,
    delay: 1.5
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    Component: GlassdoorIcon,
    edge: "right",
    topPercent: 27,
    horizontalOffset: "4.5%",
    size: 40,
    opacityClass: "opacity-15",
    animName: "drift-subtle-1",
    duration: 29,
    delay: 3.5
  },
  {
    id: "outlook",
    name: "Outlook",
    Component: OutlookIcon,
    edge: "right",
    topPercent: 48,
    horizontalOffset: "3%",
    size: 40,
    opacityClass: "opacity-20",
    animName: "drift-subtle-3",
    duration: 25,
    delay: 0.5
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    Component: WhatsAppIcon,
    edge: "right",
    topPercent: 68,
    horizontalOffset: "4%",
    size: 42,
    opacityClass: "opacity-22",
    animName: "drift-subtle-2",
    duration: 27,
    delay: 2.5
  },
  {
    id: "workday",
    name: "Workday / Career ATS",
    Component: WorkdayIcon,
    edge: "right",
    topPercent: 87,
    horizontalOffset: "4.5%",
    size: 40,
    opacityClass: "opacity-20",
    animName: "drift-subtle-1",
    duration: 31,
    delay: 4.5
  }
];

export function CyberBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Scoped Organic Floating Keyframes: Gentle drift confined to perimeter */}
      <style jsx>{`
        @keyframes drift-subtle-1 {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          33% {
            transform: translate3d(-4px, -8px, 0) rotate(-1deg);
          }
          66% {
            transform: translate3d(6px, -12px, 0) rotate(0.8deg);
          }
        }

        @keyframes drift-subtle-2 {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          40% {
            transform: translate3d(6px, -10px, 0) rotate(1deg);
          }
          75% {
            transform: translate3d(-4px, -14px, 0) rotate(-0.8deg);
          }
        }

        @keyframes drift-subtle-3 {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          35% {
            transform: translate3d(-5px, 6px, 0) rotate(0.8deg);
          }
          70% {
            transform: translate3d(6px, -8px, 0) rotate(-1deg);
          }
        }
      `}</style>

      {/* Layer 0: Dark Premium Base Canvas */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Layer 1: Atmospheric Deep Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(23,37,84,0.35),rgba(3,7,18,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_10%_30%,rgba(14,165,233,0.03),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_90%_70%,rgba(99,102,241,0.03),transparent_70%)]" />

      {/* Layer 2: Subtle Ambient Tech Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />

      {/* Center Clearance Vignette: Guarantees the center login form is completely clear */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_760px_at_50%_45%,transparent_20%,rgba(3,7,18,0.85)_80%)]" />

      {/* Layer 3: Exactly 10 Subtle Floating Platform Icons at the Outer Edges */}
      <div className="absolute inset-0 hidden sm:block">
        {PERIMETER_ICONS.map((item) => {
          const positionStyle: React.CSSProperties = {
            position: "absolute",
            top: `${item.topPercent}%`,
            ...(item.edge === "left"
              ? { left: item.horizontalOffset }
              : { right: item.horizontalOffset }),
            width: item.size,
            height: item.size,
            animation: prefersReducedMotion
              ? "none"
              : `${item.animName} ${item.duration}s ease-in-out infinite ${item.delay}s`
          };

          return (
            <div
              key={item.id}
              style={positionStyle}
              className={`transition-opacity duration-700 pointer-events-none select-none ${item.opacityClass} hover:opacity-40`}
            >
              <item.Component className="w-full h-full drop-shadow-md" />
            </div>
          );
        })}
      </div>

      {/* Layer 4: Soft Upper Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-sky-500/[0.03] via-indigo-600/[0.015] to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}
