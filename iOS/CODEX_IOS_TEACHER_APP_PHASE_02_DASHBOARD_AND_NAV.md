# Phase 02 — Dashboard and Icon Navigation

## Goal
Expose all required teacher features through a tile dashboard with one icon per feature.

## Scope
- Build dashboard grid with six tiles.
- Ensure each tile maps to one required feature and symbol.
- Add teacher context header and today snapshot sections.

## Tasks
1. Create `Features/Dashboard/DashboardView.swift`.
2. Define tile model with title, subtitle, symbol, and destination.
3. Wire six feature destinations:
   - Timeline
   - Add Post
   - Schedule
   - To-Do
   - Policies & Resources
   - Announcements
4. Add analytics events for tile taps.

## Acceptance
- Dashboard displays six clearly labeled icon tiles.
- Each tile navigates to the correct feature view.
