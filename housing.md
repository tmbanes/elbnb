## Housing Inventory Management — File Structure

### Pages

| Path                                             | Description                                       |
| ------------------------------------------------ | ------------------------------------------------- |
| `app/dashboard/housing/page.tsx`                 | Housing dashboard overview                        |
| `app/dashboard/housing/properties/page.tsx`      | Unified property list (dorms + rental spaces)     |
| `app/dashboard/housing/properties/[id]/page.tsx` | Property detail page (conditional render by type) |
| `app/dashboard/housing/managers/page.tsx`        | Property Manager list page                        |
| `app/dashboard/housing/managers/[id]/page.tsx`   | Property Manager profile page                     |

---

### API Routes

| Path                                                 | Description                                     |
| ---------------------------------------------------- | ----------------------------------------------- |
| `app/api/housing/managers/route.ts`                  | GET all managers, POST create manager           |
| `app/api/housing/managers/[id]/route.ts`             | PATCH update manager, DELETE manager            |
| `app/api/housing/dorms/route.ts`                     | GET all dorms, POST create dorm                 |
| `app/api/housing/dorms/[id]/route.ts`                | GET dorm detail, PATCH update, DELETE dorm      |
| `app/api/housing/dorms/[id]/rooms/route.ts`          | POST add room to a dorm                         |
| `app/api/housing/dorms/[id]/rooms/[roomId]/route.ts` | PATCH update room, DELETE room                  |
| `app/api/housing/rental-spaces/route.ts`             | GET all rental spaces, POST create rental space |
| `app/api/housing/rental-spaces/[id]/route.ts`        | GET detail, PATCH update, DELETE rental space   |

---

### Components

| Path                                         | Description                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `components/housing/AddPropertyButton.tsx`   | "Add Property" button + type-selection prompt with disabled-state logic |
| `components/housing/AddDormModal.tsx`        | 4-step modal for creating and editing a dormitory                       |
| `components/housing/AddRentalSpaceModal.tsx` | 3-step modal for creating and editing a rental space                    |
| `components/housing/AddManagerModal.tsx`     | Modal for creating and editing a Property Manager                       |
| `components/housing/PropertyCard.tsx`        | Property row/card with type badge and action buttons                    |
| `components/housing/PropertyDetail.tsx`      | Detail view — conditionally renders dorm or rental space sections       |
| `components/housing/RoomTable.tsx`           | Room list table with live occupancy bars and room actions               |
| `components/housing/OccupancyBar.tsx`        | Progress bar showing occupied vs total beds                             |
| `components/housing/ManagerCard.tsx`         | Manager info card with Reassign Manager button                          |
| `components/housing/ManagerDropdown.tsx`     | Reusable searchable dropdown for selecting a Property Manager           |

---

### Services

| Path                          | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `services/browser/housing.ts` | Client-side service functions — API calls made from the browser           |
| `services/server/housing.ts`  | Server-side service functions — Supabase RPC calls using service role key |

---

### Types

| Path               | Description                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- |
| `types/housing.ts` | TypeScript interfaces for Property, Dormitory, RentalSpace, Room, and PropertyManager |
