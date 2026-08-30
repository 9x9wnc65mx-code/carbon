import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);
const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().positive().optional()
);
const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().nonnegative().optional()
);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().optional()
);
const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().positive().optional()
);
const localDateTime = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/,
  "Enter a valid local date and time"
);
const optionalLocalDateTime = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  localDateTime.optional()
);

export const laboratoryTypes = [
  "Diagnostic",
  "Feed",
  "Slaughterhouse",
  "Hatchery",
  "Water",
  "External",
  "Other"
] as const;
export const laboratoryStatuses = ["Active", "Inactive"] as const;
export const labTestCategories = [
  "Microbiology",
  "Serology",
  "Molecular",
  "Mycology",
  "Feed Chemistry",
  "Mycotoxin",
  "Water Quality",
  "Physical",
  "Pathology",
  "Other"
] as const;
export const labTestStatuses = ["Draft", "Active", "Archived"] as const;
export const labResultTypes = [
  "Numeric",
  "Text",
  "Qualitative",
  "Positive/Negative",
  "Detected/Not Detected",
  "Titer",
  "Ct",
  "Boolean"
] as const;
export const labSourceTypes = [
  "Flock",
  "Farm",
  "Hatchery",
  "Slaughterhouse",
  "Feed",
  "Water",
  "Environment",
  "Product",
  "Other"
] as const;
export const labPriorities = ["Routine", "Urgent", "STAT"] as const;
export const labAccessionStatuses = [
  "Collected",
  "In Transit",
  "Received",
  "In Progress",
  "Completed",
  "Rejected",
  "Cancelled"
] as const;
export const labSpecimenStatuses = [
  "Available",
  "In Testing",
  "Exhausted",
  "Stored",
  "Disposed",
  "Rejected"
] as const;
export const labTestOrderStatuses = [
  "Requested",
  "In Progress",
  "Completed",
  "Rejected",
  "Cancelled"
] as const;
export const labResultFlags = [
  "Normal",
  "Abnormal",
  "Critical",
  "Positive",
  "Negative",
  "Detected",
  "Not Detected",
  "Not Applicable"
] as const;

export const laboratoryValidator = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Laboratory code is required").max(50),
  name: z.string().trim().min(1, "Laboratory name is required").max(160),
  laboratoryType: z.enum(laboratoryTypes),
  isInternal: z.preprocess((value) => value === "true" || value === true || value === "on", z.boolean()),
  accreditation: optionalText,
  contactReference: optionalText,
  timezone: z.string().trim().min(1, "Laboratory timezone is required").max(100),
  status: z.enum(laboratoryStatuses),
  notes: optionalText
});

export const labTestDefinitionValidator = z.object({
  id: z.string().optional(),
  laboratoryId: z.string().min(1, "Laboratory is required"),
  code: z.string().trim().min(1, "Test code is required").max(60),
  name: z.string().trim().min(1, "Test name is required").max(180),
  category: z.enum(labTestCategories),
  method: optionalText,
  sampleRequirements: optionalText,
  turnaroundHours: optionalPositiveInteger,
  status: z.enum(labTestStatuses),
  description: optionalText
});

export const labTestParameterValidator = z
  .object({
    testDefinitionId: z.string().min(1),
    sequenceNo: z.preprocess((value) => Number(value), z.number().int().positive()),
    code: z.string().trim().min(1, "Parameter code is required").max(60),
    name: z.string().trim().min(1, "Parameter name is required").max(180),
    resultType: z.enum(labResultTypes),
    unit: optionalText,
    decimalPlaces: optionalNonNegativeInteger,
    referenceMin: optionalNumber,
    referenceMax: optionalNumber,
    referenceText: optionalText,
    qualitativeOptionsText: optionalText,
    isRequired: z.preprocess((value) => value === "true" || value === true || value === "on", z.boolean()),
    status: z.enum(["Active", "Inactive"]),
    notes: optionalText
  })
  .superRefine((value, context) => {
    if (value.decimalPlaces != null && value.decimalPlaces > 8) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["decimalPlaces"], message: "Decimal places must be between 0 and 8" });
    }
    if (value.referenceMin != null && value.referenceMax != null && value.referenceMax < value.referenceMin) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["referenceMax"], message: "Reference maximum must be greater than or equal to minimum" });
    }
    if (value.resultType === "Qualitative" && !value.qualitativeOptionsText) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["qualitativeOptionsText"], message: "Qualitative options are required" });
    }
  });

export const labTestDiseaseTargetValidator = z.object({
  testDefinitionId: z.string().min(1),
  diseaseId: z.string().min(1, "Disease is required")
});

export const labAccessionValidator = z.object({
  laboratoryId: z.string().min(1, "Laboratory is required"),
  accessionNumber: optionalText,
  flockId: optionalText,
  clinicalEventId: optionalText,
  sourceType: z.enum(labSourceTypes),
  sourceReference: optionalText,
  sourceLocation: optionalText,
  collectedAtLocal: localDateTime,
  receivedAtLocal: optionalLocalDateTime,
  priority: z.enum(labPriorities),
  requestedBy: optionalText,
  externalReference: optionalText,
  collectionNotes: optionalText
});

export const labSpecimenValidator = z.object({
  accessionId: z.string().min(1),
  specimenCode: optionalText,
  specimenType: z.string().trim().min(1, "Specimen type is required").max(120),
  anatomicalSite: optionalText,
  poolSize: optionalPositiveInteger,
  quantity: optionalPositiveNumber,
  quantityUnit: optionalText,
  containerType: optionalText,
  preservative: optionalText,
  conditionOnReceipt: optionalText,
  status: z.enum(labSpecimenStatuses),
  notes: optionalText
});

export const labTestOrderValidator = z.object({
  accessionId: z.string().min(1),
  specimenId: z.string().min(1, "Specimen is required"),
  testDefinitionId: z.string().min(1, "Test is required"),
  analyst: optionalText,
  notes: optionalText
});

export const labResultEntryValidator = z.object({
  resultId: z.string().min(1),
  value: z.string().trim().min(1, "Result value is required"),
  resultFlag: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(labResultFlags).optional()
  ),
  comment: optionalText
});

export const labResultVerificationValidator = z.object({
  resultId: z.string().min(1)
});

export const labTestOrderStatusValidator = z.object({
  orderId: z.string().min(1),
  status: z.enum(["In Progress", "Completed", "Rejected", "Cancelled"]),
  analyst: optionalText,
  overallInterpretation: optionalText,
  notes: optionalText
});

export const labAccessionStatusValidator = z.object({
  accessionId: z.string().min(1),
  status: z.enum(["In Transit", "Received", "Rejected", "Cancelled"]),
  receivedAtLocal: optionalLocalDateTime,
  rejectionReason: optionalText
});

export type LaboratoryInput = z.infer<typeof laboratoryValidator>;
export type LabTestDefinitionInput = z.infer<typeof labTestDefinitionValidator>;
export type LabTestParameterInput = z.infer<typeof labTestParameterValidator>;
export type LabTestDiseaseTargetInput = z.infer<typeof labTestDiseaseTargetValidator>;
export type LabAccessionInput = z.infer<typeof labAccessionValidator>;
export type LabSpecimenInput = z.infer<typeof labSpecimenValidator>;
export type LabTestOrderInput = z.infer<typeof labTestOrderValidator>;
export type LabResultEntryInput = z.infer<typeof labResultEntryValidator>;
export type LabTestOrderStatusInput = z.infer<typeof labTestOrderStatusValidator>;
export type LabAccessionStatusInput = z.infer<typeof labAccessionStatusValidator>;
