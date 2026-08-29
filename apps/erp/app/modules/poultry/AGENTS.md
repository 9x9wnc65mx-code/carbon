# Poultry Operations module

AVIOS poultry-domain code lives here while preserving Carbon's ERP architecture and shared infrastructure.

## Scope

- Farms and houses
- Breeders, hatchery and chick origin
- Flocks and Flock Digital Passport
- Veterinary LIMS integration
- Feed/feed-mill exposure links
- Slaughterhouse lifecycle links
- Poultry traceability, alerts and analytics

## Conventions

- Follow the repository root `AGENTS.md` and closest `.claude/rules/*` guides.
- Reuse Carbon QMS, inventory, purchasing, documents, workflows and traceability primitives instead of duplicating them.
- All data-backed poultry records must be scoped by `companyId` in both schema/RLS and application queries.
- Keep technical identifiers and scientific abbreviations LTR inside RTL UI (`bdi dir="ltr"` or an equivalent shared helper).
- Use Carbon components and route/layout conventions; do not introduce an alternate application shell.
- Until a dedicated poultry RBAC scope is introduced deliberately, the initial UI foundation is gated by the existing `production` view permission.

## Validation

Use the smallest relevant checks after changes, including ERP typecheck/lint and Lingui checks for translated UI.
