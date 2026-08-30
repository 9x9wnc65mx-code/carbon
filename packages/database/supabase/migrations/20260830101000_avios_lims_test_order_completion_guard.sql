-- The validation function was introduced with the LIMS audit migration, but
-- completion must be wired to the table explicitly. Keep this as a forward
-- migration so environments that already applied the earlier slice receive the
-- guard without rewriting migration history.

DROP TRIGGER IF EXISTS "labTestOrder_validate_completion" ON "labTestOrder";

CREATE TRIGGER "labTestOrder_validate_completion"
BEFORE UPDATE OF "status" ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "validateLabTestOrderCompletion"();

COMMENT ON TRIGGER "labTestOrder_validate_completion" ON "labTestOrder" IS
'Prevents a laboratory test order from completing until all required result snapshots are verified.';
