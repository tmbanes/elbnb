# Pull Request

## Overview

Created Search Accommodations Page under the dashboard with filtering, search functionality, and an interactive carousel display for accommodations and units. 

**Related issue:** #[INSERT ISSUE NUMBER HERE]

---

## Type of change

_Please insert X in the box that applies._

- [ ] Bug fix
- [x] New feature
- [ ] Refactoring (Code cleanup)
- [ ] Documentation
- [ ] Chore

---

## What was added

### New Pages
- **`app/dashboard/search-accommodations/page.tsx`** — Main search page 
- **`app/dashboard/search-accommodations/layout.tsx`** — Layout wrapper

### New Components
- **FilterDropdown.tsx** — Reusable dropdown component for all filter selections
- **ResultsCount.tsx** — Badge displaying dynamic count of matching results
- **AccommodationCard.tsx** — Card component for accommodations with image placeholder, details, and action buttons
- **UnitCard.tsx** — Card component for units with unit details and action buttons
- **Carousel.tsx** — Horizontal scrollable carousel with smooth deck-spreading hover animation
- **AccommodationFilters.tsx** — Filter bar for Accommodations tab 
- **UnitFilters.tsx** — Filter bar for All Units tab 
- **index.ts** — Barrel export file

### Features Implemented
- **Two-Tab Interface:** Accommodations and All Units tabs with separate filter configurations
- **Accommodations Tab Filters:**
  - Accommodation Type (Dormitory / Renting Space)
  - Property Type (Apartment / Boarding House / Transient / House)
  - Availability (With Vacant Slots / All Accommodations)
- **All Units Tab Filters (2-row layout):**
  - Row 1: Accommodation Type, Unit Type, Furnishing Status
  - Row 2: Availability, Property Type
- **Carousel Display:** Horizontal scrollable cards with overlapping effect
- **Deck-Spreading Animation:** Cards smoothly slide away when hovering over one

---

## Notes / Additional comments


