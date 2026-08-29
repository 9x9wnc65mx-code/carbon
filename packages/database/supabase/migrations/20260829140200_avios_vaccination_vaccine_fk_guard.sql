-- Preserve historical vaccine references. Catalog products are deactivated,
-- not physically removed while they are referenced by programs/events.

ALTER TABLE "vaccinationProgramStep"
  DROP CONSTRAINT "vaccinationProgramStep_vaccineId_companyId_fkey";
ALTER TABLE "vaccinationProgramStep"
  ADD CONSTRAINT "vaccinationProgramStep_vaccineId_companyId_fkey"
  FOREIGN KEY ("vaccineId", "companyId")
  REFERENCES "vaccineCatalog"("id", "companyId")
  ON DELETE RESTRICT;

ALTER TABLE "flockVaccinationEvent"
  DROP CONSTRAINT "flockVaccinationEvent_vaccineId_companyId_fkey";
ALTER TABLE "flockVaccinationEvent"
  ADD CONSTRAINT "flockVaccinationEvent_vaccineId_companyId_fkey"
  FOREIGN KEY ("vaccineId", "companyId")
  REFERENCES "vaccineCatalog"("id", "companyId")
  ON DELETE RESTRICT;
