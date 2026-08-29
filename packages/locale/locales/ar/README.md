# Arabic locale notes

Arabic is a first-class AVIOS locale.

- Application documents set `dir="rtl"` when `ar` is active.
- UI layout code should prefer logical Tailwind utilities (`start/end`, `border-e`, `ms/me`, `ps/pe`) over physical left/right utilities where direction matters.
- Poultry/scientific identifiers such as `F-2026-001`, `PCR`, `ELISA`, `Ct`, `FCR`, kit names and units should remain LTR using bidi isolation.
- Catalog coverage is expanded incrementally as Carbon surfaces are adapted to AVIOS; missing legacy strings fall back to English through Lingui's configured fallback.
