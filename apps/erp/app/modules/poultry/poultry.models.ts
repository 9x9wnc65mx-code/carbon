import { z } from "zod";
import { zfd } from "zod-form-data";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

export const farmTypes = [
  "Broiler",
  "Breeder",
  "Layer",
  "Hatchery",
  "Mixed",
  "Other"
] as const;
export const farmStatuses = ["Active", "Inactive"] as const;
export const houseTypes = [
  "Broiler",
  "Breeder",
  "Layer",
  "Rearing",
  "Hatchery",
  "Other"
] as const;
export const houseStatuses = ["Active", "Inactive"] as const;
export const flockTypes = ["Broiler", "Breeder", "Layer", "Other"] as const;
export const flockSexes = ["Mixed", "Male", "Female", "Unknown"] as const;
export const flockStatuses = [
  "Planned",
  "Active",
  "Closed",
  "Cancelled"
] as const;

export const farmValidator = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Farm code is required").max(50),
  name: z.string().trim().min(1, "Farm name is required").max(120),
  farmType: z.enum(farmTypes),
  region: optionalText,
  address: optionalText,
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
  status: z.enum(farmStatuses),
  notes: optionalText
});

export const poultryHouseValidator = z.object({
  id: z.string().optional(),
  farmId: z.string().min(1, "Farm is required"),
  code: z.string().trim().min(1, "House code is required").max(50),
  name: z.string().trim().min(1, "House name is required").max(120),
  houseType: z.enum(houseTypes),
  capacityBirds: zfd.numeric(z.number().int().positive()),
  floorAreaM2: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().positive().optional()
  ),
  status: z.enum(houseStatuses),
  notes: optionalText
});

export const flockCycleValidator = z.object({
  id: z.string().optional(),
  houseId: z.string().min(1, "House is required"),
  code: z.string().trim().min(1, "Flock code is required").max(80),
  flockType: z.enum(flockTypes),
  strain: optionalText,
  sex: z.enum(flockSexes),
  hatchDate: optionalText,
  placementDate: z.string().min(1, "Placement date is required"),
  initialBirdCount: zfd.numeric(z.number().int().positive()),
  sourceReference: optionalText,
  status: z.enum(flockStatuses),
  closureDate: optionalText,
  notes: optionalText
});

export type FarmInput = z.infer<typeof farmValidator>;
export type PoultryHouseInput = z.infer<typeof poultryHouseValidator>;
export type FlockCycleInput = z.infer<typeof flockCycleValidator>;
