import type { LucideIcon } from "lucide-react";

export type PolicyCategory = "Health" | "Vehicle" | "Life" | "Travel" | "Home";
export type PolicyStatus = "Active" | "Review" | "Expiring" | "Paused";
export type ClaimStatus = "Submitted" | "Under Review" | "Approved" | "Paid" | "Action Needed";
export type Priority = "Low" | "Medium" | "High";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  plan: string;
  avatar: string;
}

export interface Policy {
  id: string;
  name: string;
  provider: string;
  category: PolicyCategory;
  status: PolicyStatus;
  premium: number;
  coverage: number;
  renewalDate: string;
  members: string[];
  score: number;
  color: string;
  benefits: string[];
}

export interface Claim {
  id: string;
  title: string;
  policyId: string;
  status: ClaimStatus;
  amount: number;
  submittedAt: string;
  updatedAt: string;
  nextStep: string;
  documents: string[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  label: string;
  date: string;
  completed: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  priority: Priority;
  read: boolean;
}

export interface Reward {
  id: string;
  title: string;
  points: number;
  category: string;
  unlocked: boolean;
}

export interface HealthMetric {
  label: string;
  value: string;
  trend: string;
  status: "Good" | "Watch" | "Improve";
}

export interface VehicleRecord {
  label: string;
  value: string;
  due: string;
  status: "Current" | "Due Soon" | "Attention";
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

export interface Renewal {
  id: string;
  policyId: string;
  dueDate: string;
  currentPremium: number;
  projectedPremium: number;
  recommendation: string;
}
