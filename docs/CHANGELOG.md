# Changelog

All notable changes to the Aleckssa 18th RSVP project.

## [1.1.0] - 2026-08-13

### Added
- Vanta.js FOG animated background for guest-facing landing page
- Dark gothic color configuration for fog effect

## [1.0.0] - 2026-08-13

### Added
- Initial project scaffold (React + Vite)
- Supabase integration (client, schema, RLS policies)
- Guest-facing RSVP system
  - Browsable guest list with category filter + search
  - RSVP modal with predetermined/non-predetermined group support
  - Individual guest companion system
  - Direct URL access (`/rsvp/:groupId`)
- Admin panel
  - Dashboard with stat cards (no charts)
  - Guest management with full CRUD
  - Group management with full CRUD
  - Individual guest management
  - Quick status editing
- Supabase Auth for admin login
- Dark gothic design theme matching aleckssa18th.carrd.co
- Module documentation in `docs/modules/`
