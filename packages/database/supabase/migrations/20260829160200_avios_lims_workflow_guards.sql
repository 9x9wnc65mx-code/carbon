CREATE OR REPLACE FUNCTION "validateLabTestDefinitionActivation"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."status" = 'Active' AND OLD."status" IS DISTINCT FROM 'Active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM "labTestParameter"
      WHERE "testDefinitionId" = NEW."id"
        AND "companyId" = NEW."companyId"
        AND "status" = 'Active'
    ) THEN
      RAISE EXCEPTION 'A laboratory test requires at least one active parameter before activation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "labTestDefinition_validate_activation"
BEFORE UPDATE OF "status" ON "labTestDefinition"
FOR EACH ROW EXECUTE FUNCTION "validateLabTestDefinitionActivation"();

CREATE OR REPLACE FUNCTION "preventLastActiveLabParameterRemoval"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  test_is_active BOOLEAN;
  remaining_active INTEGER;
BEGIN
  SELECT ("status" = 'Active') INTO test_is_active
  FROM "labTestDefinition"
  WHERE "id" = OLD."testDefinitionId"
    AND "companyId" = OLD."companyId";

  IF test_is_active AND (
    TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD."status" = 'Active' AND NEW."status" <> 'Active')
  ) THEN
    SELECT COUNT(*) INTO remaining_active
    FROM "labTestParameter"
    WHERE "testDefinitionId" = OLD."testDefinitionId"
      AND "companyId" = OLD."companyId"
      AND "status" = 'Active'
      AND "id" <> OLD."id";

    IF remaining_active = 0 THEN
      RAISE EXCEPTION 'An active laboratory test must retain at least one active parameter';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "labTestParameter_prevent_last_active_removal"
BEFORE UPDATE OF "status" OR DELETE ON "labTestParameter"
FOR EACH ROW EXECUTE FUNCTION "preventLastActiveLabParameterRemoval"();

CREATE OR REPLACE FUNCTION "validateLabAccessionCompletion"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."status" = 'Completed' AND OLD."status" IS DISTINCT FROM 'Completed' THEN
    IF NOT EXISTS (
      SELECT 1 FROM "labTestOrder"
      WHERE "accessionId" = NEW."id" AND "companyId" = NEW."companyId"
    ) THEN
      RAISE EXCEPTION 'A laboratory accession cannot be completed without test orders';
    END IF;

    IF EXISTS (
      SELECT 1 FROM "labTestOrder"
      WHERE "accessionId" = NEW."id"
        AND "companyId" = NEW."companyId"
        AND "status" NOT IN ('Completed', 'Rejected', 'Cancelled')
    ) THEN
      RAISE EXCEPTION 'All laboratory test orders must be terminal before accession completion';
    END IF;

    IF NEW."completedAt" IS NULL THEN NEW."completedAt" := NOW(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "labAccession_validate_completion"
BEFORE UPDATE OF "status" ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "validateLabAccessionCompletion"();

CREATE OR REPLACE FUNCTION "refreshLabAccessionFromOrders"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  accession_id TEXT;
  company_id TEXT;
  open_count INTEGER;
  total_count INTEGER;
BEGIN
  accession_id := NEW."accessionId";
  company_id := NEW."companyId";

  SELECT COUNT(*), COUNT(*) FILTER (WHERE "status" NOT IN ('Completed', 'Rejected', 'Cancelled'))
    INTO total_count, open_count
  FROM "labTestOrder"
  WHERE "accessionId" = accession_id
    AND "companyId" = company_id;

  IF total_count > 0 AND open_count = 0 THEN
    UPDATE "labAccession"
    SET "status" = 'Completed',
        "completedAt" = COALESCE("completedAt", NOW()),
        "updatedAt" = NOW()
    WHERE "id" = accession_id
      AND "companyId" = company_id
      AND "status" NOT IN ('Rejected', 'Cancelled');
  ELSIF NEW."status" = 'In Progress' THEN
    UPDATE "labAccession"
    SET "status" = 'In Progress', "updatedAt" = NOW()
    WHERE "id" = accession_id
      AND "companyId" = company_id
      AND "status" NOT IN ('Rejected', 'Cancelled', 'Completed');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "labTestOrder_refresh_accession"
AFTER UPDATE OF "status" ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "refreshLabAccessionFromOrders"();
