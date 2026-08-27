import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters")
});

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  age: z.coerce.number().min(18, "You must be at least 18").max(90),
  household: z.coerce.number().min(1).max(12),
  ownsVehicle: z.boolean(),
  riskPreference: z.enum(["balanced", "maximum", "value"])
});

export const claimSchema = z.object({
  policyId: z.string().min(1, "Choose a policy"),
  incidentDate: z.string().min(1, "Choose a date"),
  amount: z.coerce.number().min(1, "Enter an amount"),
  description: z.string().min(20, "Add a little more detail")
});

export const settingsSchema = z.object({
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  biometricLogin: z.boolean(),
  marketing: z.boolean()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ClaimInput = z.infer<typeof claimSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
