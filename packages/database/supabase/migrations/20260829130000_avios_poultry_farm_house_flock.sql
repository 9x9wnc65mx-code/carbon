-- AVIOS poultry registry: Farm -> House -> Flock Cycle
-- The flock digital passport is intentionally a read model over flockCycle
-- and linked domains, not a duplicated passport table.

CREATE TABLE "farm" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "farmType" TEXT NOT NULL DEFAULT 'Broiler',
  "region" TEXT,
  "address" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "farm_type_check" CHECK ("farmType" IN ('Broiler', 'Breeder', 'Layer', 'Hatchery', 'Mixed', 'Other')),
  CONSTRAINT "farm_status_check" CHECK ("status" IN ('Active', 'Inactive'))
);

CREATE INDEX "farm_companyId_idx" ON "farm" ("companyId");
CREATE INDEX "farm_createdBy_idx" ON "farm" ("createdBy");
CREATE INDEX "farm_updatedBy_idx" ON "farm" ("updatedBy");
ALTER TABLE "farm" ADD CONSTRAINT "farm_companyId_code_key" UNIQUE ("companyId", "code");

CREATE TABLE "poultryHouse" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "houseType" TEXT NOT NULL DEFAULT 'Broiler',
  "capacityBirds" INTEGER NOT NULL,
  "floorAreaM2" NUMERIC,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("farmId", "companyId") REFERENCES "farm"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "poultryHouse_type_check" CHECK ("houseType" IN ('Broiler', 'Breeder', 'Layer', 'Rearing', 'Hatchery', 'Other')),
  CONSTRAINT "poultryHouse_capacity_check" CHECK ("capacityBirds" > 0),
  CONSTRAINT "poultryHouse_area_check" CHECK ("floorAreaM2" IS NULL OR "floorAreaM2" > 0),
  CONSTRAINT "poultryHouse_status_check" CHECK ("status" IN ('Active', 'Inactive'))
);

CREATE INDEX "poultryHouse_companyId_idx" ON "poultryHouse" ("companyId");
CREATE INDEX "poultryHouse_farmId_idx" ON "poultryHouse" ("farmId");
CREATE INDEX "poultryHouse_createdBy_idx" ON "poultryHouse" ("createdBy");
CREATE INDEX "poultryHouse_updatedBy_idx" ON "poultryHouse" ("updatedBy");
ALTER TABLE "poultryHouse" ADD CONSTRAINT "poultryHouse_companyId_farmId_code_key" UNIQUE ("companyId", "farmId", "code");

CREATE TABLE "flockCycle" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "houseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "flockType" TEXT NOT NULL DEFAULT 'Broiler',
  "strain" TEXT,
  "sex" TEXT NOT NULL DEFAULT 'Mixed',
  "hatchDate" DATE,
  "placementDate" DATE NOT NULL,
  "initialBirdCount" INTEGER NOT NULL,
  "sourceReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "closureDate" DATE,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("houseId", "companyId") REFERENCES "poultryHouse"("id", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "flockCycle_type_check" CHECK ("flockType" IN ('Broiler', 'Breeder', 'Layer', 'Other')),
  CONSTRAINT "flockCycle_sex_check" CHECK ("sex" IN ('Mixed', 'Male', 'Female', 'Unknown')),
  CONSTRAINT "flockCycle_count_check" CHECK ("initialBirdCount" > 0),
  CONSTRAINT "flockCycle_status_check" CHECK ("status" IN ('Planned', 'Active', 'Closed', 'Cancelled')),
  CONSTRAINT "flockCycle_dates_check" CHECK ("closureDate" IS NULL OR "closureDate" >= "placementDate")
);

CREATE INDEX "flockCycle_companyId_idx" ON "flockCycle" ("companyId");
CREATE INDEX "flockCycle_houseId_idx" ON "flockCycle" ("houseId");
CREATE INDEX "flockCycle_createdBy_idx" ON "flockCycle" ("createdBy");
CREATE INDEX "flockCycle_updatedBy_idx" ON "flockCycle" ("updatedBy");
CREATE INDEX "flockCycle_status_idx" ON "flockCycle" ("companyId", "status");
ALTER TABLE "flockCycle" ADD CONSTRAINT "flockCycle_companyId_code_key" UNIQUE ("companyId", "code");

ALTER TABLE "public"."farm" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SELECT" ON "public"."farm"
FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."farm"
FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."farm"
FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."farm"
FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[])
);

ALTER TABLE "public"."poultryHouse" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SELECT" ON "public"."poultryHouse"
FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."poultryHouse"
FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."poultryHouse"
FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."poultryHouse"
FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[])
);

ALTER TABLE "public"."flockCycle" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SELECT" ON "public"."flockCycle"
FOR SELECT USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_role())::text[])
);
CREATE POLICY "INSERT" ON "public"."flockCycle"
FOR INSERT WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[])
);
CREATE POLICY "UPDATE" ON "public"."flockCycle"
FOR UPDATE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[])
);
CREATE POLICY "DELETE" ON "public"."flockCycle"
FOR DELETE USING (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[])
);

COMMENT ON TABLE "farm" IS 'AVIOS poultry farm/site registry.';
COMMENT ON TABLE "poultryHouse" IS 'Physical poultry houses belonging to an AVIOS farm.';
COMMENT ON TABLE "flockCycle" IS 'Biological flock lifecycle. This is the identity backbone for the AVIOS flock digital passport.';
