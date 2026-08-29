# AVIOS next vertical slice

After the foundation passes CI, implement the first data-backed slice:

Farm -> House -> Flock -> Flock Digital Passport

Requirements:
- Carbon migration conventions and forward-dated migration.
- `companyId` on every table with composite tenant keys and RLS.
- Carbon-style services/models/routes/forms/tables.
- Full create/edit/read lifecycle.
- Bidi isolation for technical identifiers.
- Link flock to origin/feed/lab/QMS/traceability progressively without duplicating Carbon genealogy.
