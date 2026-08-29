-- Tighten LIMS integrity so parameter result rows can only be generated for the
-- exact test definition ordered, and direct client inserts cannot forge rows.

ALTER TABLE "labAccession"
ADD CONSTRAINT "labAccession_clinical_event_requires_flock_check"
CHECK ("clinicalEventId" IS NULL OR "flockId" IS NOT NULL);

ALTER TABLE "labTestParameter"
ADD CONSTRAINT "labTestParameter_id_test_company_key"
UNIQUE ("id", "testDefinitionId", "companyId");

ALTER TABLE "labTestOrder"
ADD CONSTRAINT "labTestOrder_id_test_company_key"
UNIQUE ("id", "testDefinitionId", "companyId");

ALTER TABLE "labResult"
ADD COLUMN "testDefinitionId" TEXT;

UPDATE "labResult" r
SET "testDefinitionId" = o."testDefinitionId"
FROM "labTestOrder" o
WHERE o."id" = r."testOrderId"
  AND o."companyId" = r."companyId";

ALTER TABLE "labResult"
ALTER COLUMN "testDefinitionId" SET NOT NULL;

ALTER TABLE "labResult"
ADD CONSTRAINT "labResult_order_test_company_fkey"
FOREIGN KEY ("testOrderId", "testDefinitionId", "companyId")
REFERENCES "labTestOrder" ("id", "testDefinitionId", "companyId")
ON DELETE CASCADE;

ALTER TABLE "labResult"
ADD CONSTRAINT "labResult_parameter_test_company_fkey"
FOREIGN KEY ("parameterDefinitionId", "testDefinitionId", "companyId")
REFERENCES "labTestParameter" ("id", "testDefinitionId", "companyId")
ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "generateLabResultRows"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO "labResult" (
    "companyId", "testOrderId", "testDefinitionId", "parameterDefinitionId", "sequenceNo",
    "parameterCodeSnapshot", "parameterNameSnapshot", "resultTypeSnapshot", "unitSnapshot",
    "referenceMinSnapshot", "referenceMaxSnapshot", "referenceTextSnapshot", "isRequiredSnapshot"
  )
  SELECT
    NEW."companyId", NEW."id", NEW."testDefinitionId", p."id", p."sequenceNo",
    p."code", p."name", p."resultType", p."unit",
    p."referenceMin", p."referenceMax", p."referenceText", p."isRequired"
  FROM "labTestParameter" p
  WHERE p."testDefinitionId" = NEW."testDefinitionId"
    AND p."companyId" = NEW."companyId"
    AND p."status" = 'Active'
  ORDER BY p."sequenceNo";

  UPDATE "labSpecimen"
  SET "status" = CASE WHEN "status" = 'Available' THEN 'In Testing' ELSE "status" END,
      "updatedAt" = NOW()
  WHERE "id" = NEW."specimenId"
    AND "accessionId" = NEW."accessionId"
    AND "companyId" = NEW."companyId";

  UPDATE "labAccession"
  SET "status" = CASE WHEN "status" IN ('Collected', 'In Transit', 'Received') THEN 'In Progress' ELSE "status" END,
      "updatedAt" = NOW()
  WHERE "id" = NEW."accessionId"
    AND "laboratoryId" = NEW."laboratoryId"
    AND "companyId" = NEW."companyId";

  RETURN NEW;
END;
$$;

DROP POLICY "INSERT" ON "public"."labResult";

COMMENT ON COLUMN "labResult"."testDefinitionId" IS
'Immutable relationship anchor proving the result parameter belongs to the ordered test definition.';
