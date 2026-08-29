import { z } from "zod";
import { zfd } from "zod-form-data";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().nonnegative().optional()
);

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().positive().optional()
);

export const pathogenTypes = [
  "Viral",
  "Bacterial",
  "Parasitic",
  "Fungal",
  "Other"
] as const;
export const catalogStatuses = ["Active", "Inactive"] as const;
export const vaccineTypes = [
  "Live",
  "Inactivated",
  "Recombinant",
  "Vector",
  "Subunit",
  "Other"
] as const;
export const vaccinationProgramStatuses = ["Draft", "Active", "Archived"] as const;
export const vaccinationRoutes = [
  "Spray",
  "Drinking Water",
  "Eye Drop",
  "Injection SC",
  "Injection IM",
  "Wing Web",
  "In Ovo",
  "Other"
] as const;

export const diseaseCatalogValidator = z.object({
  code: z.string().trim().min(1, "Disease code is required").max(50),
  name: z.string().trim().min(1, "Disease name is required").max(160),
  scientificName: optionalText,
  pathogenType: z.enum(pathogenTypes),
  status: z.enum(catalogStatuses),
  notes: optionalText
});

export const vaccineCatalogValidator = z.object({
  code: z.string().trim().min(1, "Vaccine code is required").max(60),
  tradeName: z.string().trim().min(1, "Vaccine trade name is required").max(160),
  manufacturer: optionalText,
  vaccineType: z.enum(vaccineTypes),
  defaultRoute: optionalText,
  diseaseId: z.string().min(1, "At least one target disease is required"),
  status: z.enum(catalogStatuses),
  notes: optionalText
});

export const vaccineDiseaseTargetValidator = z.object({
  vaccineId: z.string().min(1),
  diseaseId: z.string().min(1)
});

export const drugCatalogValidator = z.object({
  code: z.string().trim().min(1, "Drug code is required").max(60),
  tradeName: z.string().trim().min(1, "Drug trade name is required").max(160),
  activeIngredient: optionalText,
  drugClass: optionalText,
  defaultRoute: optionalText,
  meatWithdrawalDays: optionalNonNegativeInteger,
  eggWithdrawalDays: optionalNonNegativeInteger,
  status: z.enum(catalogStatuses),
  notes: optionalText
});

export const vaccinationProgramValidator = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Program code is required").max(60),
  name: z.string().trim().min(1, "Program name is required").max(160),
  flockType: z.enum(["Broiler", "Breeder", "Layer", "Other"]),
  strain: optionalText,
  status: z.enum(vaccinationProgramStatuses),
  description: optionalText
});

export const vaccinationProgramStepValidator = z.object({
  id: z.string().optional(),
  programId: z.string().min(1),
  sequenceNo: zfd.numeric(z.number().int().positive()),
  targetAgeDays: zfd.numeric(z.number().int().nonnegative()),
  vaccineId: optionalText,
  diseaseId: z.string().min(1, "Target disease is required"),
  route: z.string().trim().min(1, "Administration route is required"),
  doseValue: optionalPositiveNumber,
  doseUnit: optionalText,
  notes: optionalText
});

export const vaccinationProgramStepDiseaseValidator = z.object({
  programStepId: z.string().min(1),
  diseaseId: z.string().min(1)
});

export const vaccinationAssignmentValidator = z.object({
  programId: z.string().min(1, "Vaccination program is required"),
  notes: optionalText
});

export const vaccinationEventCompletionValidator = z.object({
  eventId: z.string().min(1),
  vaccineId: z.string().min(1, "Actual vaccine product is required"),
  route: z.string().trim().min(1, "Administration route is required"),
  doseValue: optionalPositiveNumber,
  doseUnit: optionalText,
  administeredAt: z.string().min(1, "Administration date/time is required"),
  productBatch: optionalText,
  expiryDate: optionalText,
  performedBy: optionalText,
  notes: optionalText
});

export const vaccinationEventSkipValidator = z.object({
  eventId: z.string().min(1),
  notes: optionalText
});

export type DiseaseCatalogInput = z.infer<typeof diseaseCatalogValidator>;
export type VaccineCatalogInput = z.infer<typeof vaccineCatalogValidator>;
export type DrugCatalogInput = z.infer<typeof drugCatalogValidator>;
export type VaccinationProgramInput = z.infer<typeof vaccinationProgramValidator>;
export type VaccinationProgramStepInput = z.infer<typeof vaccinationProgramStepValidator>;
export type VaccinationEventCompletionInput = z.infer<typeof vaccinationEventCompletionValidator>;
