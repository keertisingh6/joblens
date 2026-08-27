import { Bell, Home, ScrollText, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import type {
  AssistantMessage,
  Claim,
  HealthMetric,
  NavItem,
  NotificationItem,
  Policy,
  Renewal,
  Reward,
  UserProfile,
  VehicleRecord
} from "@/types";

export const profile: UserProfile = {
  name: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "+91 98765 43210",
  city: "Mumbai, Maharashtra",
  plan: "Indus Protect Prime",
  avatar: "/avatar.svg"
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Policies", href: "/policies", icon: WalletCards },
  { title: "Claims", href: "/claims", icon: ShieldCheck },
  { title: "Profile", href: "/profile", icon: UserRound }
];

export const secondaryNavItems: NavItem[] = [
  { title: "Life Events", href: "/life-events", icon: ScrollText },
  { title: "Emergency", href: "/emergency", icon: ShieldCheck },
  { title: "Rewards", href: "/rewards", icon: WalletCards },
  { title: "Health", href: "/health", icon: Home },
  { title: "Motor", href: "/vehicle", icon: WalletCards },
  { title: "Notifications", href: "/notifications", icon: Bell }
];

export const policies: Policy[] = [
  {
    id: "IND-HLT-4421",
    name: "Health Raksha Family",
    provider: "Niva Bupa via IndusInd",
    category: "Health",
    status: "Active",
    premium: 1840,
    coverage: 2500000,
    renewalDate: "2026-09-18",
    members: ["Aarav", "Priya", "Kabir"],
    score: 94,
    color: "from-red-700 to-amber-500",
    benefits: ["Cashless hospital network", "Telemedicine consults", "Annual health rewards"]
  },
  {
    id: "IND-MTR-9130",
    name: "Motor Suraksha Plus",
    provider: "ICICI Lombard via IndusInd",
    category: "Vehicle",
    status: "Expiring",
    premium: 1260,
    coverage: 850000,
    renewalDate: "2026-08-05",
    members: ["Hyundai Creta"],
    score: 88,
    color: "from-zinc-900 to-red-700",
    benefits: ["Roadside assistance", "Garage booking", "No-claim bonus tracking"]
  },
  {
    id: "IND-HOM-6088",
    name: "Home Shield Assist",
    provider: "Tata AIG via IndusInd",
    category: "Home",
    status: "Active",
    premium: 740,
    coverage: 5000000,
    renewalDate: "2027-02-14",
    members: ["Mumbai apartment"],
    score: 91,
    color: "from-amber-600 to-orange-500",
    benefits: ["Home assistance", "Appliance cover", "Emergency repair concierge"]
  },
  {
    id: "IND-TRV-2044",
    name: "Travel Ease Global",
    provider: "Bajaj Allianz via IndusInd",
    category: "Travel",
    status: "Review",
    premium: 390,
    coverage: 1200000,
    renewalDate: "2026-12-02",
    members: ["Family"],
    score: 82,
    color: "from-sky-700 to-red-600",
    benefits: ["Visa document support", "Lost baggage claims", "Medical evacuation"]
  }
];

export const claims: Claim[] = [
  {
    id: "CLM-10482",
    title: "Cashless hospital pre-authorisation",
    policyId: "IND-HLT-4421",
    status: "Under Review",
    amount: 48600,
    submittedAt: "2026-07-02",
    updatedAt: "2026-07-12",
    nextStep: "Hospital notes are being verified. Expected approval in 4 working hours.",
    documents: ["hospital-estimate.pdf", "doctor-note.pdf", "abha-card.png"],
    timeline: [
      { label: "Submitted", date: "2026-07-02", completed: true },
      { label: "Documents verified", date: "2026-07-05", completed: true },
      { label: "Medical review", date: "2026-07-12", completed: true },
      { label: "Cashless approval", date: "2026-07-17", completed: false }
    ]
  },
  {
    id: "CLM-10371",
    title: "Bumper repair garage booking",
    policyId: "IND-MTR-9130",
    status: "Approved",
    amount: 24500,
    submittedAt: "2026-06-19",
    updatedAt: "2026-06-25",
    nextStep: "Preferred network garage slot is reserved for July 28.",
    documents: ["damage-photo.jpg", "garage-estimate.pdf"],
    timeline: [
      { label: "Submitted", date: "2026-06-19", completed: true },
      { label: "Adjuster review", date: "2026-06-22", completed: true },
      { label: "Approved", date: "2026-06-25", completed: true },
      { label: "Repair completed", date: "2026-07-28", completed: false }
    ]
  },
  {
    id: "CLM-10220",
    title: "Delayed baggage essentials",
    policyId: "IND-TRV-2044",
    status: "Paid",
    amount: 8200,
    submittedAt: "2026-05-04",
    updatedAt: "2026-05-11",
    nextStep: "Payment completed to IndusInd savings account.",
    documents: ["airline-letter.pdf", "receipts.pdf"],
    timeline: [
      { label: "Submitted", date: "2026-05-04", completed: true },
      { label: "Carrier verified", date: "2026-05-07", completed: true },
      { label: "Approved", date: "2026-05-09", completed: true },
      { label: "Paid", date: "2026-05-11", completed: true }
    ]
  }
];

export const notifications: NotificationItem[] = [
  {
    id: "N-1",
    title: "Motor renewal window opens",
    body: "Motor Suraksha Plus can be renewed with a projected 8% savings if bundled with home assistance by Aug 1.",
    time: "18 min ago",
    priority: "High",
    read: false
  },
  {
    id: "N-2",
    title: "Claim review updated",
    body: "Hospital cashless request entered medical review and is on track for a decision today.",
    time: "2 hr ago",
    priority: "Medium",
    read: false
  },
  {
    id: "N-3",
    title: "Reward unlocked",
    body: "You earned 1,200 Indus Protect points for completing your annual health profile.",
    time: "Yesterday",
    priority: "Low",
    read: true
  }
];

export const rewards: Reward[] = [
  { id: "R-1", title: "Apollo wellness voucher", points: 4800, category: "Wellness", unlocked: true },
  { id: "R-2", title: "Free RSA upgrade", points: 3200, category: "Motor", unlocked: true },
  { id: "R-3", title: "Family health check-up", points: 6500, category: "Health", unlocked: false },
  { id: "R-4", title: "Airport lounge pass", points: 5800, category: "Travel", unlocked: false }
];

export const healthMetrics: HealthMetric[] = [
  { label: "Preventive care", value: "92%", trend: "+8%", status: "Good" },
  { label: "Sleep consistency", value: "7.2h", trend: "+0.4h", status: "Good" },
  { label: "Stress index", value: "41", trend: "-6", status: "Watch" },
  { label: "Activity streak", value: "19d", trend: "+5d", status: "Good" }
];

export const vehicleRecords: VehicleRecord[] = [
  { label: "Registration", value: "CA 8AUR294", due: "2027-03-20", status: "Current" },
  { label: "Maintenance", value: "Tire rotation", due: "2026-08-08", status: "Due Soon" },
  { label: "Telematics score", value: "96/100", due: "Live", status: "Current" },
  { label: "Inspection", value: "Annual safety", due: "2026-10-11", status: "Current" }
];

export const renewals: Renewal[] = [
  {
    id: "REN-1",
    policyId: "IND-MTR-9130",
    dueDate: "2026-08-05",
    currentPremium: 1260,
    projectedPremium: 1160,
    recommendation: "Bundle with home assistance to lock in a lower motor premium."
  },
  {
    id: "REN-2",
    policyId: "IND-HLT-4421",
    dueDate: "2026-09-18",
    currentPremium: 1840,
    projectedPremium: 1890,
    recommendation: "Keep the plan. Network fit and cashless approval speed are strong."
  }
];

export const assistantMessages: AssistantMessage[] = [
  {
    id: "A-1",
    role: "assistant",
    content: "I reviewed your active policies. Your strongest move is renewing motor early and keeping health unchanged.",
    createdAt: "9:04 AM"
  },
  {
    id: "A-2",
    role: "user",
    content: "Can I reduce my monthly premium without lowering health cover?",
    createdAt: "9:05 AM"
  },
  {
    id: "A-3",
    role: "assistant",
    content: "Yes. Bundle motor with home assistance and verify safe-driving behaviour. That saves about Rs 100 per month while keeping health cover intact.",
    createdAt: "9:05 AM"
  }
];

export const spendingData = [
  { month: "Jan", premium: 4230, claims: 0 },
  { month: "Feb", premium: 4230, claims: 9200 },
  { month: "Mar", premium: 4330, claims: 0 },
  { month: "Apr", premium: 4330, claims: 24500 },
  { month: "May", premium: 4360, claims: 8200 },
  { month: "Jun", premium: 4360, claims: 0 },
  { month: "Jul", premium: 4360, claims: 48600 }
];

export const riskData = [
  { name: "Health", value: 34 },
  { name: "Motor", value: 26 },
  { name: "Life", value: 22 },
  { name: "Travel", value: 10 },
  { name: "Home", value: 8 }
];
