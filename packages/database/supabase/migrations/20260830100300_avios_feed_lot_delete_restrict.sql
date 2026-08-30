-- Preserve feed QA evidence if a Carbon tracked entity deletion is attempted.
ALTER TABLE "feedTrackedLotProfile"
  DROP CONSTRAINT "feedTrackedLotProfile_trackedEntityId_fkey";

ALTER TABLE "feedTrackedLotProfile"
  ADD CONSTRAINT "feedTrackedLotProfile_trackedEntityId_fkey"
  FOREIGN KEY ("trackedEntityId") REFERENCES "trackedEntity"("id") ON DELETE RESTRICT;
