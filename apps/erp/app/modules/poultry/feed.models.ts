import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().optional()
);
const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().positive().optional()
);
const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().positive().optional()
);
const localDateTime = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/,
  "Enter a valid local date and time"
);
const optionalLocalDateTime = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  localDateTime.optional()
);

export const feedClasses = [
  "Raw Material",
  "Additive",
  "Premix",
  "Concentrate",
  "Complete Feed",
  "Other"
] as const;
export const feedProductionStages = [
  "Starter",
  "Grower",
  "Finisher",
  "Pre-Starter",
  "Breeder",
  "Layer",
  "All",
  "Other"
] as const;
export const feedPhysicalForms = [
  "Mash",
  "Crumble",
  "Pellet",
  "Powder",
  "Liquid",
  "Granule",
  "Other"
] as const;
export const feedSpecificationBases = ["As Fed", "Dry Matter", "Other"] as const;
export const feedCoaStatuses = [
  "Pending",
  "Available",
  "Accepted",
  "Rejected",
  "Not Required"
] as const;
export const feedSamplingStatuses = [
  "Not Sampled",
  "Sampled",
  "Testing",
  "Completed"
] as const;
export const feedExposureTypes = [
  "Delivery",
  "Consumption",
  "Transition",
  "Other"
] as const;

export const feedItemProfileValidator = z.object({
  itemId: z.string().min(1, "Carbon item is required"),
  feedClass: z.enum(feedClasses),
  productionStage: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(feedProductionStages).optional()
  ),
  physicalForm: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(feedPhysicalForms).optional()
  ),
  species: z.string().trim().min(1).max(80),
  requiresLotTraceability: z.preprocess(
    (value) => value === "true" || value === true || value === "on",
    z.boolean()
  ),
  status: z.enum(["Active", "Inactive"]),
  notes: optionalText
});

export const feedSpecificationParameterValidator = z
  .object({
    itemId: z.string().min(1),
    sequenceNo: z.preprocess(
      (value) => Number(value),
      z.number().int().positive()
    ),
    code: z.string().trim().min(1, "Specification code is required").max(60),
    name: z.string().trim().min(1, "Specification name is required").max(180),
    basis: z.enum(feedSpecificationBases),
    unit: optionalText,
    targetValue: optionalNumber,
    minimumValue: optionalNumber,
    maximumValue: optionalNumber,
    referenceText: optionalText,
    status: z.enum(["Active", "Inactive"]),
    notes: optionalText
  })
  .superRefine((value, context) => {
    if (
      value.minimumValue != null &&
      value.maximumValue != null &&
      value.maximumValue < value.minimumValue
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maximumValue"],
        message: "Maximum value must be greater than or equal to minimum value"
      });
    }
  });

export const feedTrackedLotProfileValidator = z.object({
  trackedEntityId: z.string().min(1, "Carbon tracked lot is required"),
  itemId: z.string().min(1),
  supplierLotNumber: optionalText,
  millBatchNumber: optionalText,
  manufactureDate: optionalText,
  originCountry: optionalText,
  coaReference: optionalText,
  coaStatus: z.enum(feedCoaStatuses),
  samplingStatus: z.enum(feedSamplingStatuses),
  qualityNotes: optionalText
});

export const flockFeedExposureValidator = z
  .object({
    trackedEntityId: z.string().min(1, "Feed lot is required"),
    itemId: z.string().min(1),
    exposureType: z.enum(feedExposureTypes),
    startedAtLocal: localDateTime,
    endedAtLocal: optionalLocalDateTime,
    quantity: optionalPositiveNumber,
    quantityUnit: optionalText,
    documentReference: optionalText,
    sourceLocation: optionalText,
    notes: optionalText
  })
  .superRefine((value, context) => {
    if (value.quantity != null && !value.quantityUnit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantityUnit"],
        message: "Quantity unit is required when quantity is entered"
      });
    }
  });

export type FeedItemProfileInput = z.infer<typeof feedItemProfileValidator>;
export type FeedSpecificationParameterInput = z.infer<
  typeof feedSpecificationParameterValidator
>;
export type FeedTrackedLotProfileInput = z.infer<typeof feedTrackedLotProfileValidator>;
export type FlockFeedExposureInput = z.infer<typeof flockFeedExposureValidator>;
