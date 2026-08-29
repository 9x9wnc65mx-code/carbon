-- Recording an actual administration is a create operation. The resulting
-- withdrawal/status recalculation is performed only by this trigger function,
-- which cannot be called as a normal SQL function because it returns TRIGGER.
DROP POLICY "INSERT" ON "public"."flockTreatmentAdministration";
CREATE POLICY "INSERT" ON "public"."flockTreatmentAdministration"
FOR INSERT
WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[])
);

ALTER FUNCTION "refreshTreatmentWithdrawal"() SECURITY DEFINER;
ALTER FUNCTION "refreshTreatmentWithdrawal"() SET search_path TO public, pg_catalog;
