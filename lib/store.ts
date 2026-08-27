"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { assistantMessages, notifications, profile } from "@/lib/data";
import type { AssistantMessage, NotificationItem, UserProfile } from "@/types";

interface AppState {
  user: UserProfile;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  notifications: NotificationItem[];
  assistantMessages: AssistantMessage[];
  login: (email: string) => void;
  logout: () => void;
  completeOnboarding: (name: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addAssistantMessage: (content: string) => void;
  addAssistantReply: (content: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: profile,
      isAuthenticated: false,
      onboardingComplete: false,
      notifications,
      assistantMessages,
      login: (email) =>
        set((state) => ({
          isAuthenticated: true,
          user: { ...state.user, email }
        })),
      logout: () => set({ isAuthenticated: false }),
      completeOnboarding: (name) =>
        set((state) => ({
          onboardingComplete: true,
          user: { ...state.user, name }
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          )
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true }))
        })),
      addAssistantMessage: (content) =>
        set((state) => ({
          assistantMessages: [
            ...state.assistantMessages,
            {
              id: crypto.randomUUID(),
              role: "user",
              content,
              createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            }
          ]
        })),
      addAssistantReply: (content) =>
        set((state) => ({
          assistantMessages: [
            ...state.assistantMessages,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content,
              createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            }
          ]
        }))
    }),
    { name: "aurora-insure-store" }
  )
);
