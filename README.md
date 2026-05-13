# ELBNB 🏠
### *Pahingahan para sa Pangarap.*

ELBnb is a centralized housing management platform developed for the University of the Philippines Los Baños. It replaces manual and fragmented accommodation processes by integrating application submission, approval workflows, room assignment, occupancy monitoring, and billing into a single web-based system — built for Iskos and Iskas, by people who know the Elbi life.

> *"From Elbi, For Elbi."*

---

## Why ELbnb?

Finding a home in Los Baños shouldn't be another hurdle to your degree. Between hell weeks, long walks from Upper Campus, and late-night org meetings — you give your 100% to your studies. You deserve a place that gives 100% back.

ELBNB isn't just a housing directory. It's a curated ecosystem of dorms and apartments that prioritizes security, proximity, and a conducive environment for the modern student.

---

## Features

### 🏢 Housing Inventory Management
Browse accommodations and individual units with real filters — type, price range, furnishing status, sex policy, and availability. Whether you want a solo studio or a shared setup, finding your fit takes seconds.

### 📋 Application Submission & Review
Students fill out and submit applications directly on the platform. Admins and managers get a full review panel — assign units, approve, reject, and track every application's status from pending to finalized.

### 💳 Billing & Invoicing
Invoices are built and sent directly from the review panel. First month's rental, security deposits, reservation fees, and custom line items are all supported — with per-invoice payment status tracking (`pending`, `paid`).

### 🔔 Real-Time Notifications
Stay in the loop without refreshing. In-app notifications powered by Supabase Realtime, plus web push notifications, so nothing slips through the cracks.

---

## Built For Everyone

| Role | What They Can Do |
|------|-----------------|
| **Students** | Browse available units, check real-time occupancy, and book your move-in with just a few clicks |
| **Managers** | Manage resident lists, track maintenance, and oversee multiple buildings from one dashboard |
| **Admins** | Configure dormitory inventory, manage user roles, and generate comprehensive campus housing reports |

---


## Tech Stack

**Next.js 16** · **React 19** · **TypeScript** · **Supabase** · **Tailwind CSS v4** · **shadcn/ui** · **Radix UI** · **TanStack Table** · **React Hook Form** · **Zod** · **Resend** · **jsPDF** · **pnpm**

---

## Scripts

```bash
pnpm dev          # Start development server (with Turbopack)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
```

---

## Contributing

Developed as part of the requirements for **CMSC 128 A1-4L** at the University of the Philippines Los Baños (AY 2025–2026).

Branch off `develop` for features and fixes. Follow conventional commits (`feat:`, `fix:`, `chore:`). Open a pull request back into `develop`.

---

© 2026 ELBNB. All rights reserved.
