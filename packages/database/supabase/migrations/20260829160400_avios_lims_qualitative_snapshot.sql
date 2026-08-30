ALTER TABLE "labResult"
ADD COLUMN "decimalPlacesSnapshot" INTEGER,
ADD COLUMN "qualitativeOptionsSnapshot" JSONB;

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
    "decimalPlacesSnapshot", "referenceMinSnapshot", "referenceMaxSnapshot", "referenceTextSnapshot",
    "qualitativeOptionsSnapshot", "isRequiredSnapshot"
  )
  SELECT
    NEW."companyId", NEW."id", NEW."testDefinitionId", p."id", p."sequenceNo",
    p."code", p."name", p."resultType", p."unit",
    p."decimalPlaces", p."referenceMin", p."referenceMax", p."referenceText",
    p."qualitativeOptions", p."isRequired"
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

CREATE OR REPLACE FUNCTION "validateLabResultEntry"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  populated_count INTEGER;
BEGIN
  IF NEW."status" IN ('Entered', 'Verified') THEN
    populated_count :=
      (CASE WHEN NEW."numericValue" IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."textValue" IS NOT NULL AND btrim(NEW."textValue") <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."qualitativeValue" IS NOT NULL AND btrim(NEW."qualitativeValue") <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."booleanValue" IS NOT NULL THEN 1 ELSE 0 END);

    IF populated_count <> 1 THEN
      RAISE EXCEPTION 'An entered laboratory result must contain exactly one result value';
    END IF;

    IF NEW."resultTypeSnapshot" IN ('Numeric', 'Titer', 'Ct') AND NEW."numericValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a numeric result';
    ELSIF NEW."resultTypeSnapshot" = 'Text' AND NEW."textValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a text result';
    ELSIF NEW."resultTypeSnapshot" IN ('Qualitative', 'Positive/Negative', 'Detected/Not Detected') AND NEW."qualitativeValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a qualitative result';
    ELSIF NEW."resultTypeSnapshot" = 'Boolean' AND NEW."booleanValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a boolean result';
    END IF;

    IF NEW."resultTypeSnapshot" = 'Positive/Negative' AND NEW."qualitativeValue" NOT IN ('Positive', 'Negative') THEN
      RAISE EXCEPTION 'Positive/Negative parameters only accept Positive or Negative';
    END IF;

    IF NEW."resultTypeSnapshot" = 'Detected/Not Detected' AND NEW."qualitativeValue" NOT IN ('Detected', 'Not Detected') THEN
      RAISE EXCEPTION 'Detected/Not Detected parameters only accept Detected or Not Detected';
    END IF;

    IF NEW."resultTypeSnapshot" = 'Qualitative' AND NEW."qualitativeOptionsSnapshot" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(NEW."qualitativeOptionsSnapshot") option_value
        WHERE option_value = NEW."qualitativeValue"
      ) THEN
      RAISE EXCEPTION 'Qualitative result is not one of the parameter snapshot options';
    END IF;

    IF NEW."enteredAt" IS NULL THEN NEW."enteredAt" := NOW(); END IF;
  END IF;

  IF NEW."status" = 'Verified' AND (NEW."verifiedAt" IS NULL OR NEW."verifiedBy" IS NULL) THEN
    RAISE EXCEPTION 'Verified laboratory results require verifier and verification time';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON COLUMN "labResult"."qualitativeOptionsSnapshot" IS
'Allowed qualitative values copied from the parameter definition when the test order is created.';
