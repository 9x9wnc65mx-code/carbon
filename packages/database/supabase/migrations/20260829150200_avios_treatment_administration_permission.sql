-- Recording an actual administration changes withdrawal/status on its parent
-- course through an invoker trigger, so the operation requires production_update.
DROP POLICY "INSERT" ON "public"."flockTreatmentAdministration";
CREATE POLICY "INSERT" ON "public"."flockTreatmentAdministration"
FOR INSERT
WITH CHECK (
  "companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[])
);
