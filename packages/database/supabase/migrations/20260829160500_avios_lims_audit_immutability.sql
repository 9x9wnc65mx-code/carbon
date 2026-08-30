-- Preserve the audit meaning of ordered assays and verified laboratory results.
-- Corrections to verified results must be modeled as explicit amendments later;
-- they must never overwrite the original verified record.

CREATE OR REPLACE FUNCTION "protectLabTestOrderSnapshot"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW."companyId" IS DISTINCT FROM OLD."companyId"
    OR NEW."laboratoryId" IS DISTINCT FROM OLD."laboratoryId"
    OR NEW."accessionId" IS DISTINCT FROM OLD."accessionId"
    OR NEW."specimenId" IS DISTINCT FROM OLD."specimenId"
    OR NEW."testDefinitionId" IS DISTINCT FROM OLD."testDefinitionId"
    OR NEW."testCodeSnapshot" IS DISTINCT FROM OLD."testCodeSnapshot"
    OR NEW."testNameSnapshot" IS DISTINCT FROM OLD."testNameSnapshot"
    OR NEW."categorySnapshot" IS DISTINCT FROM OLD."categorySnapshot"
    OR NEW."methodSnapshot" IS DISTINCT FROM OLD."methodSnapshot"
    OR NEW."requestedAt" IS DISTINCT FROM OLD."requestedAt"
    OR NEW."createdBy" IS DISTINCT FROM OLD."createdBy"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION 'Laboratory test order identity and snapshot fields are immutable after creation';
  END IF;

  IF OLD."status" IN ('Completed', 'Rejected', 'Cancelled')
    AND NEW."status" IS DISTINCT FROM OLD."status"
  THEN
    RAISE EXCEPTION 'A terminal laboratory test order cannot be reopened or changed to another status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "labTestOrder_protect_snapshot"
BEFORE UPDATE ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "protectLabTestOrderSnapshot"();

CREATE OR REPLACE FUNCTION "protectLabResultAudit"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" = 'Verified' OR OLD."verifiedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'Verified laboratory results are immutable and cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW."companyId" IS DISTINCT FROM OLD."companyId"
    OR NEW."testOrderId" IS DISTINCT FROM OLD."testOrderId"
    OR NEW."testDefinitionId" IS DISTINCT FROM OLD."testDefinitionId"
    OR NEW."parameterDefinitionId" IS DISTINCT FROM OLD."parameterDefinitionId"
    OR NEW."sequenceNo" IS DISTINCT FROM OLD."sequenceNo"
    OR NEW."parameterCodeSnapshot" IS DISTINCT FROM OLD."parameterCodeSnapshot"
    OR NEW."parameterNameSnapshot" IS DISTINCT FROM OLD."parameterNameSnapshot"
    OR NEW."resultTypeSnapshot" IS DISTINCT FROM OLD."resultTypeSnapshot"
    OR NEW."unitSnapshot" IS DISTINCT FROM OLD."unitSnapshot"
    OR NEW."decimalPlacesSnapshot" IS DISTINCT FROM OLD."decimalPlacesSnapshot"
    OR NEW."referenceMinSnapshot" IS DISTINCT FROM OLD."referenceMinSnapshot"
    OR NEW."referenceMaxSnapshot" IS DISTINCT FROM OLD."referenceMaxSnapshot"
    OR NEW."referenceTextSnapshot" IS DISTINCT FROM OLD."referenceTextSnapshot"
    OR NEW."qualitativeOptionsSnapshot" IS DISTINCT FROM OLD."qualitativeOptionsSnapshot"
    OR NEW."isRequiredSnapshot" IS DISTINCT FROM OLD."isRequiredSnapshot"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION 'Laboratory result identity and parameter snapshot fields are immutable';
  END IF;

  IF OLD."status" = 'Verified' OR OLD."verifiedAt" IS NOT NULL THEN
    RAISE EXCEPTION 'Verified laboratory results are immutable; create an amendment instead of overwriting the verified record';
  END IF;

  -- Verification is a distinct audit action. The value that was entered must
  -- not be altered in the same statement that verifies it.
  IF NEW."status" = 'Verified' AND OLD."status" <> 'Verified' THEN
    IF OLD."status" <> 'Entered' THEN
      RAISE EXCEPTION 'Only an entered laboratory result can be verified';
    END IF;

    IF NEW."numericValue" IS DISTINCT FROM OLD."numericValue"
      OR NEW."textValue" IS DISTINCT FROM OLD."textValue"
      OR NEW."qualitativeValue" IS DISTINCT FROM OLD."qualitativeValue"
      OR NEW."booleanValue" IS DISTINCT FROM OLD."booleanValue"
      OR NEW."resultFlag" IS DISTINCT FROM OLD."resultFlag"
      OR NEW."comment" IS DISTINCT FROM OLD."comment"
      OR NEW."enteredBy" IS DISTINCT FROM OLD."enteredBy"
      OR NEW."enteredAt" IS DISTINCT FROM OLD."enteredAt"
    THEN
      RAISE EXCEPTION 'A laboratory result value cannot be changed during verification';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "labResult_protect_audit_update"
BEFORE UPDATE ON "labResult"
FOR EACH ROW EXECUTE FUNCTION "protectLabResultAudit"();

CREATE TRIGGER "labResult_protect_audit_delete"
BEFORE DELETE ON "labResult"
FOR EACH ROW EXECUTE FUNCTION "protectLabResultAudit"();

-- A completed order is a released analytical outcome. Required parameters must
-- therefore be verified, not merely entered.
CREATE OR REPLACE FUNCTION "validateLabTestOrderCompletion"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW."status" = 'Completed' AND OLD."status" <> 'Completed' THEN
    IF EXISTS (
      SELECT 1 FROM "labResult"
      WHERE "testOrderId" = NEW."id"
        AND "companyId" = NEW."companyId"
        AND "isRequiredSnapshot" = TRUE
        AND "status" <> 'Verified'
    ) THEN
      RAISE EXCEPTION 'All required laboratory parameters must be verified before test completion';
    END IF;

    IF NEW."completedAt" IS NULL THEN NEW."completedAt" := NOW(); END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "protectLabResultAudit"() IS
'Prevents mutation/deletion of verified laboratory results and protects all parameter snapshot fields.';
