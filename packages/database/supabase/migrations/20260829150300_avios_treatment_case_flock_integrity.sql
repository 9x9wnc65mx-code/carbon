ALTER TABLE "flockClinicalEvent"
ADD CONSTRAINT "flockClinicalEvent_id_flock_company_key"
UNIQUE ("id", "flockId", "companyId");

ALTER TABLE "flockTreatmentCourse"
ADD CONSTRAINT "flockTreatmentCourse_clinicalEvent_flock_company_fkey"
FOREIGN KEY ("clinicalEventId", "flockId", "companyId")
REFERENCES "flockClinicalEvent" ("id", "flockId", "companyId")
ON DELETE RESTRICT;
