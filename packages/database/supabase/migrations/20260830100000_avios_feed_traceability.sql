-- AVIOS Feed & Feed Mill Traceability
-- Carbon remains the source of truth for item master, inventory quantities,
-- tracked lot identity/status/expiry, ledger movements and genealogy.
-- These tables only add poultry/feed semantics and link those existing lots
-- into laboratory and flock biological traceability.

CREATE TABLE "feedItemProfile" (
  "itemId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "feedClass" TEXT NOT NULL,
  "productionStage" TEXT,
  "physicalForm" TEXT,
  "species" TEXT NOT NULL DEFAULT 'Poultry',
  "requiresLotTraceability" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("itemId", "companyId"),
  FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "feedItemProfile_class_check" CHECK (
    "feedClass" IN ('Raw Material', 'Additive', 'Premix', 'Concentrate', 'Complete Feed', 'Other')
  ),
  CONSTRAINT "feedItemProfile_stage_check" CHECK (
    "productionStage" IS NULL OR "productionStage" IN (
      'Starter', 'Grower', 'Finisher', 'Pre-Starter', 'Breeder', 'Layer', 'All', 'Other'
    )
  ),
  CONSTRAINT "feedItemProfile_form_check" CHECK (
    "physicalForm" IS NULL OR "physicalForm" IN (
      'Mash', 'Crumble', 'Pellet', 'Powder', 'Liquid', 'Granule', 'Other'
    )
  ),
  CONSTRAINT "feedItemProfile_status_check" CHECK ("status" IN ('Active', 'Inactive'))
);

CREATE INDEX "feedItemProfile_companyId_idx" ON "feedItemProfile" ("companyId");
CREATE INDEX "feedItemProfile_feedClass_idx" ON "feedItemProfile" ("companyId", "feedClass");
CREATE INDEX "feedItemProfile_createdBy_idx" ON "feedItemProfile" ("createdBy");
CREATE INDEX "feedItemProfile_updatedBy_idx" ON "feedItemProfile" ("updatedBy");

CREATE TABLE "feedSpecificationParameter" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "sequenceNo" INTEGER NOT NULL DEFAULT 1,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "basis" TEXT NOT NULL DEFAULT 'As Fed',
  "unit" TEXT,
  "targetValue" NUMERIC,
  "minimumValue" NUMERIC,
  "maximumValue" NUMERIC,
  "referenceText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("itemId", "companyId") REFERENCES "feedItemProfile"("itemId", "companyId") ON DELETE CASCADE,
  CONSTRAINT "feedSpecificationParameter_sequence_check" CHECK ("sequenceNo" > 0),
  CONSTRAINT "feedSpecificationParameter_basis_check" CHECK ("basis" IN ('As Fed', 'Dry Matter', 'Other')),
  CONSTRAINT "feedSpecificationParameter_range_check" CHECK (
    "minimumValue" IS NULL OR "maximumValue" IS NULL OR "maximumValue" >= "minimumValue"
  ),
  CONSTRAINT "feedSpecificationParameter_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "feedSpecificationParameter_company_item_code_key" UNIQUE ("companyId", "itemId", "code")
);

CREATE INDEX "feedSpecificationParameter_item_idx" ON "feedSpecificationParameter" ("companyId", "itemId", "sequenceNo");
CREATE INDEX "feedSpecificationParameter_createdBy_idx" ON "feedSpecificationParameter" ("createdBy");
CREATE INDEX "feedSpecificationParameter_updatedBy_idx" ON "feedSpecificationParameter" ("updatedBy");

CREATE TABLE "feedTrackedLotProfile" (
  "trackedEntityId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "supplierLotNumber" TEXT,
  "millBatchNumber" TEXT,
  "manufactureDate" DATE,
  "originCountry" TEXT,
  "coaReference" TEXT,
  "coaStatus" TEXT NOT NULL DEFAULT 'Pending',
  "samplingStatus" TEXT NOT NULL DEFAULT 'Not Sampled',
  "qualityNotes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("trackedEntityId", "companyId"),
  FOREIGN KEY ("trackedEntityId") REFERENCES "trackedEntity"("id") ON DELETE CASCADE,
  FOREIGN KEY ("itemId", "companyId") REFERENCES "feedItemProfile"("itemId", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "feedTrackedLotProfile_coa_check" CHECK ("coaStatus" IN ('Pending', 'Available', 'Accepted', 'Rejected', 'Not Required')),
  CONSTRAINT "feedTrackedLotProfile_sampling_check" CHECK ("samplingStatus" IN ('Not Sampled', 'Sampled', 'Testing', 'Completed'))
);

CREATE INDEX "feedTrackedLotProfile_item_idx" ON "feedTrackedLotProfile" ("companyId", "itemId");
CREATE INDEX "feedTrackedLotProfile_coa_idx" ON "feedTrackedLotProfile" ("companyId", "coaStatus");
CREATE INDEX "feedTrackedLotProfile_createdBy_idx" ON "feedTrackedLotProfile" ("createdBy");
CREATE INDEX "feedTrackedLotProfile_updatedBy_idx" ON "feedTrackedLotProfile" ("updatedBy");

CREATE TABLE "flockFeedExposure" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "trackedEntityId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "exposureType" TEXT NOT NULL DEFAULT 'Delivery',
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endedAt" TIMESTAMP WITH TIME ZONE,
  "quantity" NUMERIC,
  "quantityUnit" TEXT,
  "documentReference" TEXT,
  "sourceLocation" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("trackedEntityId", "companyId") REFERENCES "feedTrackedLotProfile"("trackedEntityId", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("itemId", "companyId") REFERENCES "feedItemProfile"("itemId", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "flockFeedExposure_type_check" CHECK ("exposureType" IN ('Delivery', 'Consumption', 'Transition', 'Other')),
  CONSTRAINT "flockFeedExposure_quantity_check" CHECK ("quantity" IS NULL OR "quantity" > 0),
  CONSTRAINT "flockFeedExposure_dates_check" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt")
);

CREATE INDEX "flockFeedExposure_flock_idx" ON "flockFeedExposure" ("companyId", "flockId", "startedAt" DESC);
CREATE INDEX "flockFeedExposure_lot_idx" ON "flockFeedExposure" ("companyId", "trackedEntityId");
CREATE INDEX "flockFeedExposure_item_idx" ON "flockFeedExposure" ("companyId", "itemId");
CREATE INDEX "flockFeedExposure_createdBy_idx" ON "flockFeedExposure" ("createdBy");
CREATE INDEX "flockFeedExposure_updatedBy_idx" ON "flockFeedExposure" ("updatedBy");

-- Laboratory accessions may point directly at a Carbon tracked lot. The accession
-- remains the LIMS chain-of-custody record; the tracked entity remains the lot identity.
ALTER TABLE "labAccession" ADD COLUMN "trackedEntityId" TEXT;
ALTER TABLE "labAccession"
  ADD CONSTRAINT "labAccession_trackedEntityId_fkey"
  FOREIGN KEY ("trackedEntityId") REFERENCES "trackedEntity"("id") ON DELETE RESTRICT;
CREATE INDEX "labAccession_trackedEntityId_idx" ON "labAccession" ("companyId", "trackedEntityId");

-- Validate that an item belongs to the same company, and when full lot
-- traceability is requested, that Carbon is configured for Batch tracking.
CREATE OR REPLACE FUNCTION "validateFeedItemProfile"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  item_company TEXT;
  tracking_type TEXT;
BEGIN
  SELECT "companyId", "itemTrackingType"::TEXT
    INTO item_company, tracking_type
  FROM "item"
  WHERE "id" = NEW."itemId";

  IF item_company IS NULL THEN
    RAISE EXCEPTION 'Feed profile item does not exist';
  END IF;
  IF item_company <> NEW."companyId" THEN
    RAISE EXCEPTION 'Feed profile item must belong to the same company';
  END IF;
  IF NEW."requiresLotTraceability" AND tracking_type <> 'Batch' THEN
    RAISE EXCEPTION 'Feed items requiring lot traceability must use Carbon Batch tracking';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "feedItemProfile_validate"
BEFORE INSERT OR UPDATE OF "itemId", "companyId", "requiresLotTraceability" ON "feedItemProfile"
FOR EACH ROW EXECUTE FUNCTION "validateFeedItemProfile"();

-- A feed lot profile must extend the exact Carbon tracked entity/item/company tuple.
CREATE OR REPLACE FUNCTION "validateFeedTrackedLotProfile"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  entity_company TEXT;
  entity_item TEXT;
BEGIN
  SELECT "companyId", "itemId"
    INTO entity_company, entity_item
  FROM "trackedEntity"
  WHERE "id" = NEW."trackedEntityId";

  IF entity_company IS NULL THEN
    RAISE EXCEPTION 'Tracked feed lot does not exist';
  END IF;
  IF entity_company <> NEW."companyId" THEN
    RAISE EXCEPTION 'Tracked feed lot must belong to the same company';
  END IF;
  IF entity_item IS NULL OR entity_item <> NEW."itemId" THEN
    RAISE EXCEPTION 'Tracked feed lot item does not match the feed item profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "feedTrackedLotProfile_validate"
BEFORE INSERT OR UPDATE OF "trackedEntityId", "companyId", "itemId" ON "feedTrackedLotProfile"
FOR EACH ROW EXECUTE FUNCTION "validateFeedTrackedLotProfile"();

CREATE OR REPLACE FUNCTION "validateFlockFeedExposure"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  lot_item TEXT;
BEGIN
  SELECT "itemId" INTO lot_item
  FROM "feedTrackedLotProfile"
  WHERE "trackedEntityId" = NEW."trackedEntityId"
    AND "companyId" = NEW."companyId";

  IF lot_item IS NULL THEN
    RAISE EXCEPTION 'Flock feed exposure requires a registered feed tracked lot';
  END IF;
  IF lot_item <> NEW."itemId" THEN
    RAISE EXCEPTION 'Flock feed exposure item does not match the tracked feed lot';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "flockFeedExposure_validate"
BEFORE INSERT OR UPDATE OF "companyId", "trackedEntityId", "itemId" ON "flockFeedExposure"
FOR EACH ROW EXECUTE FUNCTION "validateFlockFeedExposure"();

-- For feed accessions, enforce same-company lot identity and require the lot to be
-- registered as a feed lot extension. Non-feed accessions may still reference a
-- tracked product/entity without requiring feed metadata.
CREATE OR REPLACE FUNCTION "validateLabAccessionTrackedEntity"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  entity_company TEXT;
BEGIN
  IF NEW."trackedEntityId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "companyId" INTO entity_company
  FROM "trackedEntity"
  WHERE "id" = NEW."trackedEntityId";

  IF entity_company IS NULL OR entity_company <> NEW."companyId" THEN
    RAISE EXCEPTION 'Laboratory tracked entity must belong to the same company';
  END IF;

  IF NEW."sourceType" = 'Feed' AND NOT EXISTS (
    SELECT 1 FROM "feedTrackedLotProfile"
    WHERE "trackedEntityId" = NEW."trackedEntityId"
      AND "companyId" = NEW."companyId"
  ) THEN
    RAISE EXCEPTION 'Feed laboratory accessions must reference a registered feed tracked lot';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "labAccession_validate_tracked_entity"
BEFORE INSERT OR UPDATE OF "trackedEntityId", "companyId", "sourceType" ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "validateLabAccessionTrackedEntity"();

ALTER TABLE "public"."feedItemProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedSpecificationParameter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedTrackedLotProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockFeedExposure" ENABLE ROW LEVEL SECURITY;

-- Feed master/lot metadata belongs to the inventory domain.
CREATE POLICY "SELECT" ON "public"."feedItemProfile" FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."feedItemProfile" FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."feedItemProfile" FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."feedItemProfile" FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_delete'))::text[])
);

CREATE POLICY "SELECT" ON "public"."feedSpecificationParameter" FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."feedSpecificationParameter" FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."feedSpecificationParameter" FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."feedSpecificationParameter" FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_delete'))::text[])
);

CREATE POLICY "SELECT" ON "public"."feedTrackedLotProfile" FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."feedTrackedLotProfile" FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."feedTrackedLotProfile" FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."feedTrackedLotProfile" FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('inventory_delete'))::text[])
);

-- Exposure is part of the flock production record; it never posts inventory.
CREATE POLICY "SELECT" ON "public"."flockFeedExposure" FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."flockFeedExposure" FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."flockFeedExposure" FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."flockFeedExposure" FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[])
);

COMMENT ON TABLE "feedItemProfile" IS
'AVIOS feed semantics layered over the existing Carbon item master. Does not duplicate item identity or inventory behavior.';
COMMENT ON TABLE "feedTrackedLotProfile" IS
'Feed QA/provenance extension for a Carbon trackedEntity lot. Quantity, lot readableId, inventory status and expiry remain owned by trackedEntity/inventory.';
COMMENT ON TABLE "flockFeedExposure" IS
'Biological exposure link between a flock and an existing Carbon feed tracked lot. This record never moves inventory or writes itemLedger.';
COMMENT ON COLUMN "labAccession"."trackedEntityId" IS
'Optional Carbon tracked entity sampled by this accession; used by feed/product lot testing and traceability.';
