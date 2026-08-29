import type { AttackTechnique } from "./types";

export interface ScamKnowledgeItem {
  id: string;
  title: string;
  technique: AttackTechnique;
  severity: "HIGH" | "CRITICAL" | "MEDIUM";
  summary: string;
  howItWorks: string[];
  redFlags: string[];
  attackerGoal: string;
  defenseProtocol: string[];
  realWorldExample: string;
}

export const SCAM_KNOWLEDGE_BASE: ScamKnowledgeItem[] = [
  {
    id: "kb-equipment-deposit",
    title: "Fake Equipment & Hardware Shipping Deposit Scam",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    summary: "Scammers pose as corporate HR and promise high-end equipment (MacBook Pro, ergonomic monitors), but require the victim to transfer a 'refundable courier insurance deposit' or buy from a 'certified vendor'.",
    howItWorks: [
      "Target receives a formal-looking offer letter with high compensation.",
      "The 'HR manager' claims high-end hardware will be shipped for remote setup.",
      "The victim is instructed to transfer ₹3,000–₹15,000 via UPI or crypto for 'courier insurance' or to an alleged 'internal vendor'.",
      "Once payment is sent, the recruiter stops responding and deletes the communication account."
    ],
    redFlags: [
      "Any request to pay upfront money for hardware delivery.",
      "Claims that the deposit is '100% refundable upon delivery'.",
      "Directions to purchase equipment through an unverified personal portal or UPI ID."
    ],
    attackerGoal: "Direct monetary extraction from job seekers using advance-fee pretexting.",
    defenseProtocol: [
      "Never pay any amount for work laptops or hardware. Real corporations absorb all logistics costs.",
      "Verify shipping details directly with corporate IT through official phone numbers."
    ],
    realWorldExample: "'Please transfer ₹4,999 to our authorized vendor DHL account for your company MacBook Pro transit insurance.'"
  },
  {
    id: "kb-remote-access",
    title: "Remote Access Trojan (RAT) / AnyDesk Technical Interview Trap",
    technique: "CREDENTIAL_HARVESTING",
    severity: "CRITICAL",
    summary: "Attackers instruct candidates to install remote desktop utilities (AnyDesk, TeamViewer, UltraViewer) under the pretext of 'configuring the interview testing environment' or 'verifying system compatibility'.",
    howItWorks: [
      "Recruiter schedules an online screening or coding test.",
      "Candidate is instructed to install AnyDesk or TeamViewer and share the 9-digit remote access code.",
      "The attacker gains live interactive control of the applicant's computer.",
      "Attacker opens banking portals, searches for password files, or triggers unauthorized fund transfers while distracting the victim."
    ],
    redFlags: [
      "Instructions to install AnyDesk, TeamViewer, or run unknown `.exe` / `.bat` scripts.",
      "Recruiter asks for active screen control or remote session IDs.",
      "Claim that company software 'requires remote manual setup'."
    ],
    attackerGoal: "Full endpoint takeover, browser session hijacking, and theft of banking OTPs/credentials.",
    defenseProtocol: [
      "Never grant remote control of your computer to an unknown interviewer.",
      "Legitimate coding assessments run strictly inside sandboxed web browsers (e.g. HackerRank, CodeSignal)."
    ],
    realWorldExample: "'Install AnyDesk from anydesk.com and send us your 9-digit desk ID so our technical lead can configure your interview terminal.'"
  },
  {
    id: "kb-ephemeral-impersonation",
    title: "Brand Impersonation via Ephemeral Messaging (Telegram / WhatsApp)",
    technique: "IMPERSONATION",
    severity: "HIGH",
    summary: "Adversaries steal corporate logos and names of executive recruiters to contact applicants on SMS/WhatsApp, quickly migrating them to Telegram for unmonitored chat-only interviews.",
    howItWorks: [
      "Applicant receives an unsolicited SMS or WhatsApp claiming they were shortlisted for a major brand.",
      "Conversation is steered to Telegram to evade carrier spam filters and enterprise audit trails.",
      "Interviews are conducted entirely over text chat with instant acceptance.",
      "Fake onboarding documents are sent to harvest personal identification and bank details."
    ],
    redFlags: [
      "Interviews conducted strictly over text chat on Telegram/WhatsApp with no video or face-to-face round.",
      "Recruiter uses free email (@gmail.com) despite representing a Fortune 500 company.",
      "Instant hiring decision within 15 minutes of messaging."
    ],
    attackerGoal: "Establishing false trust to harvest identity documents or solicit processing fees.",
    defenseProtocol: [
      "Search for the recruiter on LinkedIn and send a direct message on their verified profile.",
      "Require a video interview on corporate Teams, Zoom, or Google Meet with cameras enabled."
    ],
    realWorldExample: "'Hello, I am Emily from Google HR. We reviewed your profile and shortlisted you. Connect with our hiring manager on Telegram @GoogleCareers_Recruiter.'"
  },
  {
    id: "kb-check-overpayment",
    title: "Fake Cashier's Check & Overpayment Laundering Scam",
    technique: "ADVANCE_FEE_FRAUD",
    severity: "CRITICAL",
    summary: "The scammer sends a legitimate-looking corporate check (e.g. $3,500) to 'buy home office supplies', then asks the victim to wire back the surplus or pay an 'approved supplier' via Zelle/wire.",
    howItWorks: [
      "Employer sends a digital or physical cashier's check for an amount significantly higher than expected.",
      "Victim deposits the check; bank makes funds temporarily available under standard clearing regulations.",
      "Recruiter urgently instructs victim to wire $2,500 to a specific 'equipment supplier'.",
      "5–10 business days later, the original check bounces as counterfeit; the victim owes the bank the entire withdrawn sum."
    ],
    redFlags: [
      "Employer provides checks prior to working any billable hours.",
      "Instructions to send money back or wire funds to a third-party vendor.",
      "Extreme urgency to execute money transfers before the bank finishes full clearing."
    ],
    attackerGoal: "Money laundering and theft of victim's personal bank funds.",
    defenseProtocol: [
      "Never accept checks from unverified employers.",
      "Understand that funds 'available' in your account does not mean the check has cleared the issuer's bank."
    ],
    realWorldExample: "'We sent you a check for $4,200. Please deposit it, keep $700 for your first week, and wire $3,500 to our equipment vendor via wire transfer.'"
  },
  {
    id: "kb-task-commission",
    title: "Task-Based & YouTube/Product Review Ponzi Scheme",
    technique: "FINANCIAL_FRAUD",
    severity: "CRITICAL",
    summary: "Victims are hired for simple remote work like 'liking YouTube videos', 'submitting hotel reviews', or 'optimizing app ratings' with micro-payouts that escalate into huge deposit traps.",
    howItWorks: [
      "Victim completes 3 simple tasks (e.g. subscribing to YouTube channels) and receives ₹500 via UPI to build trust.",
      "Victim is added to a VIP Telegram group with fake 'colleagues' showcasing massive earnings.",
      "To unlock higher commission batches, the victim must 'recharge' or deposit ₹5,000, then ₹25,000.",
      "When the victim attempts to withdraw their 'earnings', the portal freezes and demands a 30% tax fee."
    ],
    redFlags: [
      "Jobs offering high pay for liking videos, rating apps, or typing captchas.",
      "Requirement to deposit your own money to unlock work batches.",
      "High-pressure group chats on Telegram celebrating unrealistic profits."
    ],
    attackerGoal: "Luring victims into high-value crypto or UPI recharge ponzi traps.",
    defenseProtocol: [
      "No authentic job requires employees to deposit money to unlock work.",
      "Immediately report task-scam Telegram groups to cyber crime portals (cybercrime.gov.in / IC3)."
    ],
    realWorldExample: "'Earn ₹3,000–₹8,000 daily by liking YouTube videos. Level 1 unlocked. Recharge ₹5,000 to access Diamond Commission Batch.'"
  },
  {
    id: "kb-pii-harvesting",
    title: "Premature PII & Synthetic Identity Theft Harvesting",
    technique: "DATA_HARVESTING",
    severity: "HIGH",
    summary: "Adversaries publish fake listings on job boards specifically to harvest government identification (Aadhaar, SSN, PAN, Passports) and utility bills to manufacture synthetic identities and open fraudulent bank lines.",
    howItWorks: [
      "Listing appears normal with a generic job description.",
      "Upon applying, the candidate is immediately asked to upload un-redacted scans of government IDs, bank statements, and tax IDs before any interview.",
      "The 'employer' goes dark with the collected data.",
      "Adversaries use the credentials to apply for micro-loans, bypass KYC, or create mule accounts."
    ],
    redFlags: [
      "Mandatory upload of full tax IDs, bank statements, or Aadhaar before a single conversation.",
      "Generic Google Forms or unbranded form collectors asking for high-risk identity documents."
    ],
    attackerGoal: "Accumulation of valid PII for identity theft, loan fraud, and financial mule networks.",
    defenseProtocol: [
      "Mask sensitive ID numbers (e.g. Masked Aadhaar) and watermark uploaded documents ('For verification at Company X only').",
      "Only submit tax and banking details after an offer letter is formally executed and signed through corporate HR."
    ],
    realWorldExample: "'Before your interview can be confirmed, upload a clear photo of your Aadhaar card (front & back), PAN card, and 3 months of bank statements.'"
  }
];
