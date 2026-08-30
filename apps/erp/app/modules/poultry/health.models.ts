import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);
const localDateTime = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/,
  "Enter a valid local date and time"
);
const optionalLocalDateTime = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  localDateTime.optional()
);
const requiredPositiveNumber = z.preprocess(
  (value) => Number(value),
  z.number().positive("Dose must be greater than zero")
);
const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().positive().optional()
);
const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().nonnegative().optional()
);

export const clinicalEventTypes = [
  "Clinical Observation",
  "Diagnosis",
  "Necropsy",
  "Mortality Investigation",
  "Follow-up",
  "Other"
] as const;
export const clinicalBodySystems = [
  "Respiratory",
  "Enteric",
  "Locomotor",
  "Nervous",
  "Systemic",
  "Reproductive",
  "Mixed",
  "Other"
] as const;
export const clinicalSeverities = ["Mild", "Moderate", "Severe", "Critical"] as const;
export const diagnosisRoles = ["Suspected", "Confirmed", "Differential", "Ruled Out"] as const;
export const treatmentStatuses = ["Planned", "Active", "Completed", "Stopped", "Cancelled"] as const;

export const clinicalEventValidator = z.object({
  caseReference: z.string().trim().min(1, "Case reference is required").max(80),
  observedAtLocal: localDateTime,
  eventType: z.enum(clinicalEventTypes),
  bodySystem: z.enum(clinicalBodySystems),
  severity: z.enum(clinicalSeverities),
  title: z.string().trim().min(1, "Clinical title is required").max(160),
  clinicalSigns: optionalText,
  affectedBirdCount: optionalNonNegativeInteger,
  mortalityCount: optionalNonNegativeInteger,
  notes: optionalText,
  diseaseId: optionalText,
  diagnosisRole: z.enum(diagnosisRoles).optional()
});

export const clinicalEventResolutionValidator = z.object({
  eventId: z.string().min(1),
  status: z.enum(["Monitoring", "Resolved", "Closed"]),
  resolution: optionalText,
  resolvedAtLocal: optionalLocalDateTime
});

export const treatmentCourseValidator = z.object({
  clinicalEventId: optionalText,
  drugId: z.string().min(1, "Drug is required"),
  indication: z.string().trim().min(1, "Indication is required").max(300),
  prescribedAtLocal: localDateTime,
  plannedStartAtLocal: optionalLocalDateTime,
  plannedEndAtLocal: optionalLocalDateTime,
  route: z.string().trim().min(1, "Route is required").max(80),
  doseValue: requiredPositiveNumber,
  doseUnit: z.string().trim().min(1, "Dose unit is required").max(80),
  frequency: z.string().trim().min(1, "Frequency is required").max(120),
  prescribedBy: optionalText,
  notes: optionalText
});

export const treatmentAdministrationValidator = z.object({
  courseId: z.string().min(1),
  administeredAtLocal: localDateTime,
  route: z.string().trim().min(1, "Route is required").max(80),
  doseValue: requiredPositiveNumber,
  doseUnit: z.string().trim().min(1, "Dose unit is required").max(80),
  productBatch: optionalText,
  expiryDate: optionalText,
  performedBy: optionalText,
  birdsTreated: optionalPositiveInteger,
  notes: optionalText
});

export const treatmentStatusValidator = z.object({
  courseId: z.string().min(1),
  status: z.enum(["Completed", "Stopped", "Cancelled"]),
  outcome: optionalText,
  notes: optionalText
});

export type ClinicalEventInput = z.infer<typeof clinicalEventValidator>;
export type ClinicalEventResolutionInput = z.infer<typeof clinicalEventResolutionValidator>;
export type TreatmentCourseInput = z.infer<typeof treatmentCourseValidator>;
export type TreatmentAdministrationInput = z.infer<typeof treatmentAdministrationValidator>;
export type TreatmentStatusInput = z.infer<typeof treatmentStatusValidator>;
