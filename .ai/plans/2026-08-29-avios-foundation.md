# AVIOS Phase 1 — Carbon-native foundation

Date: 2026-08-29
Branch: `avios-development`

## Goal

Transform the Carbon fork in-place into the AVIOS foundation without replacing Carbon's shell or component system.

## Scope

- [ ] Rebrand the ERP document title from Carbon to AVIOS.
- [ ] Add Arabic (`ar`) as a first-class Lingui locale.
- [ ] Add document-level RTL direction when Arabic is active.
- [ ] Make the primary/module navigation use logical start/end CSS utilities so the existing Carbon UI mirrors correctly in RTL.
- [ ] Add a Carbon-native Poultry module to the primary navigation using the existing permission model for the initial slice.
- [ ] Add Carbon-native poultry module layout and first operational pages (Overview, Farms, Flocks) using the existing sidebar/layout/components.
- [ ] Add an initial Arabic ERP catalog covering AVIOS/Poultry navigation and the first operational slice.
- [ ] Open a PR and use GitHub Actions as the verification gate available in this environment.

## Non-goals for this commit

- Database schema for farms/flocks/LIMS/feed mill.
- New RBAC permission families or RLS policies.
- Complete translation of every legacy Carbon string.
- Replacing Carbon navigation, topbar, cards, forms, tables, or route conventions.

## Follow-up

After the foundation passes CI, implement the first data-backed vertical slice:
Farm -> House -> Flock -> Flock Digital Passport, with company-scoped schema/RLS, services, CRUD, and traceability links.
