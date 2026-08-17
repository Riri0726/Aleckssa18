# Aleckssa's 18th Birthday — RSVP System Implementation Plan

> **Version**: 1.1  
> **Last Updated**: 2026-08-13  
> **Status**: Approved — Ready for Implementation

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-08-13 | Initial plan — architecture, schema, features, design decisions |
| 1.1 | 2026-08-13 | Added Vanta.js FOG animated background specification |

---

Build an RSVP management system for **Aleckssa's Coming of Age** debut (September 27, 2026, 5:00–9:00 PM @ Stella Suites), based on the [YannaWedding](file:///d:/PROJECT/Comissions/YannaWedding/YannaWedding) architecture but adapted for Supabase backend and a dark gothic aesthetic matching the [existing Carrd site](https://aleckssa18th.carrd.co).

## Event Details
- **Event**: Aleckssa's 18th Birthday Debut ("Coming of Age")
- **Date**: September 27, 2026
- **Time**: 5:00 PM – 9:00 PM
- **Venue**: Stella Suites

---

## Key Decisions (Resolved)

| Decision | Choice |
|---|---|
| Project Location | `d:\PROJECT\Comissions\Aleckssa18th` |
| Guest Categories | Family, Individual, Friends & Colleagues (unified, no bride/groom split) |
| Group Types | Predetermined + Non-predetermined (same as YannaWedding) |
| Companion System | Yes, individual guests with `max_count > 1` can add companions |
| Admin Auth | Supabase Auth with email/password |
| Guest Access | Direct URL `/rsvp/{group_id}` + browsable list with search |
| Dashboard | Stat cards only, no charts |
| Design Theme | Dark gothic — matching the Carrd site (dark bg, maroon accents, silver filigree, serif typography) |
| Animated Background | **Vanta.js FOG** — dark gothic colors (maroon fog, dark base, silver highlights) |
| Guest Landing Page | RSVP-only (no event info section, guests use Carrd for that) |
| Admin Design | Same dark gothic theme as guest side |
| Email Service | Not needed |
| Libraries | React + Vite, Supabase JS v2, React Router v6+, @heroicons/react, Vanta.js + Three.js (CDN) |

---

## Animated Background — Vanta.js FOG

> **Added in v1.1** — Same library used in YannaWedding but with dark gothic color palette.

### Configuration
```javascript
VANTA.FOG({
  el: rootElement,
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.00,
  minWidth: 200.00,
  highlightColor: 0xc0c0c0,   // Silver highlights
  midtoneColor: 0x5c1a1a,     // Deep maroon midtone
  lowlightColor: 0x1a0a0a,    // Very dark red lowlight
  baseColor: 0x0a0a0a,        // Near-black base
  blurFactor: 0.65,           // Slightly less blur for moodier look
  speed: 1.50,                // Slower for atmospheric effect
  zoom: 0.80                  // Slightly wider view
})
```

### CDN Dependencies
- Three.js r134: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js`
- Vanta FOG: `https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js`

### Usage
- Applied to the **guest-facing landing page** (Home.jsx) as a full-page background
- The effect runs behind the RSVP list/modal content
- Respects `prefers-reduced-motion` media query
- Mouse-responsive for interactive feel

---

## Supabase Database Schema

### Table: `groups`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `group_name` | text | e.g., "Santos Family" |
| `group_count_max` | integer | Max number of guests allowed |
| `is_predetermined` | boolean | Whether admin pre-sets guest names |
| `role` | text | `family`, `friends`, or `individual` |
| `created_at` | timestamptz | Auto-generated |
| `updated_at` | timestamptz | Nullable |

### Table: `guests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Auto-generated |
| `group_id` | uuid (FK → groups) | Nullable for standalone individual guests |
| `name` | text | Guest name |
| `email` | text | Contact email |
| `max_count` | integer | For individuals: how many companions they can bring |
| `role` | text | `family`, `friends`, `individual` |
| `in_group` | boolean | Whether guest belongs to a group |
| `is_coming` | boolean | `null` = pending, `true` = going, `false` = not going |
| `rsvp_submitted` | boolean | Whether they've responded |
| `rsvp_date` | timestamptz | When RSVP was submitted |
| `companion_of` | uuid (FK → guests) | If this guest is a companion of another individual |
| `created_at` | timestamptz | Auto-generated |
| `updated_at` | timestamptz | Nullable |

### Supabase Auth
- Single admin user with email/password login
- Row Level Security (RLS) policies:
  - `guests` and `groups`: public read for guest-facing pages, authenticated-only write for admin operations
  - Guest RSVP submissions use an anon-accessible RPC function or specific RLS policy

---

## Proposed Changes

### Project Initialization

#### [NEW] Project scaffold at `d:\PROJECT\Comissions\Aleckssa18th`
- Initialize React + Vite project
- Install dependencies: `@supabase/supabase-js`, `react-router-dom`, `@heroicons/react`
- Configure Vite for development

---

### Documentation Structure

#### [NEW] `docs/` folder with versioned documentation
```
docs/
├── implementation_plan_v1.1.md    # This file (versioned)
├── modules/
│   ├── supabase-client.md         # Supabase client setup & usage
│   ├── rsvp-service.md            # RSVP service API reference
│   ├── rsvp-context.md            # React context usage guide
│   ├── guest-rsvp-flow.md         # Guest-facing RSVP flow docs
│   ├── admin-panel.md             # Admin panel features & usage
│   ├── auth.md                    # Authentication setup & protected routes
│   └── vanta-background.md        # Vanta.js FOG background setup
└── CHANGELOG.md                   # Project-level change log
```

---

### Supabase Client

#### [NEW] [supabase.js](file:///d:/PROJECT/Comissions/Aleckssa18th/src/supabase.js)
- Supabase client initialization with environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Replaces `firebase.js` from YannaWedding

---

### Services Layer

#### [NEW] [rsvpService.js](file:///d:/PROJECT/Comissions/Aleckssa18th/src/services/rsvpService.js)
- **`guestService`**: Adapted from YannaWedding's `guestService` + `adminService`
  - `getAllGuests()` — Fetch all guests with group info via Supabase joins
  - `createIndividualGuest(guestData)` — Create standalone individual guest
  - `createGroupWithGuests(groupData, guestNames)` — Batch create group + guests
  - `updateGuestRSVP(guestId, { email, is_coming })` — Guest RSVP submission
  - `updateGuest(guestId, updates)` — Admin guest edit
  - `deleteGuest(guestId)` — Cascade delete (companions included)
  - `getAllGroups()` — Fetch all groups
  - `deleteGroup(groupId)` — Cascade delete group + its guests
  - `getGuestCounts()` — Dashboard stats (by role instead of bride/groom)
  - `addUnknownGroupGuests(groupId, email, names, isComing)` — For non-predetermined groups
  - `createGuest(guest)`, `updateGroup()`, `listGuestsByGroup()`, etc.
- **Key difference from YannaWedding**: No `guest_type` (bride/groom) field — all guests are unified

---

### Context Layer

#### [NEW] [RSVPContext.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/context/RSVPContext.jsx)
- Same structure as YannaWedding's RSVPContext
- Manages: `groups`, `individualGuests`, `organizedData`, `selectedGroup`, `groupGuests`, `guestsByGroup`, `selectedGuest`, modal state
- Data organized by role: `{ individual: [], family: [], friends: [] }`
- `refresh()` function for data reloads

---

### Guest-Facing Pages

#### [NEW] [Home.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/pages/Home.jsx)
- RSVP-only landing page (no event info section)
- **Vanta.js FOG** animated background with dark gothic colors
- Minimal header with "Aleckssa's 18th Birthday RSVP" in gothic serif font
- Includes `RSVPList` component for browsing/searching groups
- Includes `RSVPModal` component for the actual RSVP form

#### [NEW] [RSVPList.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/components/RSVPList.jsx)
- Adapted from YannaWedding's RSVPList
- **Key difference**: No "bride/groom side" selector — single unified guest list
- Search bar to filter groups/guests by name
- Category filter: All / Family / Individual / Friends & Colleagues
- Clickable group cards that open the RSVP modal
- Shows RSVP status badges (pending/going/not going)

#### [NEW] [RSVPModal.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/components/RSVPModal.jsx)
- Same RSVP flow as YannaWedding:
  - **Predetermined groups**: Show guest name list → select self → confirm attendance + email
  - **Non-predetermined groups**: Enter names + email → confirm attendance
  - **Individual guests**: Confirm attendance + companion names (if max_count > 1)
- Locked state for already-submitted RSVPs
- Toast notifications on success/error

---

### Admin Pages

#### [NEW] [Login.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/pages/Login.jsx)
- Supabase Auth email/password login form
- Dark gothic styling
- Redirect to admin dashboard on success

#### [NEW] [Admin.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/pages/Admin.jsx)
- Main admin layout with tab navigation: Dashboard | Guest Management
- Dark gothic admin theme with maroon accents

#### [NEW] [Dashboard.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/pages/Dashboard.jsx)
- **Stat cards only** (no charts):
  - Total Expected Guests / Responded / Pending
  - Going / Not Going / Still Deciding  
  - Group Distribution: Total Groups / Family Groups / Friends Groups / Individual Guests
  - Breakdown by category (Family / Individual / Friends & Colleagues)

#### [NEW] [GuestsAdmin.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/pages/GuestsAdmin.jsx)
- Adapted from YannaWedding's GuestsAdmin
- **Key difference**: No `guest_type` (bride/groom) field in forms
- Three tabs/filters: Family | Individual | Friends & Colleagues
- **Group CRUD**: Create/Edit/Delete groups (family or friends)
- **Guest CRUD**: Create/Edit/Delete guests within groups
- **Individual CRUD**: Create/Edit/Delete standalone individual guests
- Search, quick status edit, delete confirmations, toast notifications

#### [NEW] [ProtectedRoute.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/components/ProtectedRoute.jsx)
- Supabase session check wrapper
- Redirects to login if not authenticated

---

### Routing

#### [NEW] [App.jsx](file:///d:/PROJECT/Comissions/Aleckssa18th/src/App.jsx)
Routes:
| Path | Component | Access |
|---|---|---|
| `/` | Home (RSVP landing) | Public |
| `/rsvp/:groupId` | Home (with pre-selected group) | Public |
| `/login` | Login | Public |
| `/admin` | Admin (Dashboard + Guest Mgmt) | Protected |

---

### Styling

#### [NEW] [index.css](file:///d:/PROJECT/Comissions/Aleckssa18th/src/index.css)
Design system with CSS custom properties:
- **Colors**: Dark background (`#0a0a0a`), maroon accents (`#5c1a1a` to `#8b2252`), silver/gray text, ornamental borders
- **Typography**: Google Fonts — elegant serif for headings (e.g., Playfair Display or Cormorant Garamond), clean sans-serif for body (Inter)
- **Patterns**: CSS-based filigree/ornamental border patterns
- **Components**: Cards with subtle maroon borders, glassmorphic modals, dark inputs with maroon focus rings

#### [NEW] [App.css](file:///d:/PROJECT/Comissions/Aleckssa18th/src/App.css)
- Page-specific styles for admin and guest views
- Modal styles, form styles, stat card layouts
- Toast notification styles
- Responsive grid layouts

---

### Supabase Setup Script

#### [NEW] [supabase-schema.sql](file:///d:/PROJECT/Comissions/Aleckssa18th/supabase-schema.sql)
- SQL migration script to create tables, indexes, and RLS policies
- Can be run in Supabase SQL Editor to set up the database

---

## Architecture Overview

```
Aleckssa18th/
├── index.html
├── vite.config.js
├── package.json
├── supabase-schema.sql          # Database setup script
├── .env.example                 # Template for Supabase keys
├── docs/                        # Project documentation (versioned)
│   ├── implementation_plan_v1.1.md
│   ├── CHANGELOG.md
│   └── modules/
│       ├── supabase-client.md
│       ├── rsvp-service.md
│       ├── rsvp-context.md
│       ├── guest-rsvp-flow.md
│       ├── admin-panel.md
│       ├── auth.md
│       └── vanta-background.md
└── src/
    ├── main.jsx                 # Entry point with RSVPProvider
    ├── App.jsx                  # Router setup
    ├── App.css                  # Component-level styles
    ├── index.css                # Design system + global styles
    ├── supabase.js              # Supabase client init
    ├── context/
    │   └── RSVPContext.jsx      # Global state management
    ├── services/
    │   └── rsvpService.js       # Supabase data operations
    ├── components/
    │   ├── RSVPList.jsx         # Guest browsable RSVP list
    │   ├── RSVPModal.jsx        # RSVP form modal
    │   └── ProtectedRoute.jsx   # Auth guard
    └── pages/
        ├── Home.jsx             # Guest landing (RSVP only) + Vanta FOG bg
        ├── Login.jsx            # Admin login
        ├── Admin.jsx            # Admin layout
        ├── Dashboard.jsx        # Stats overview
        └── GuestsAdmin.jsx      # CRUD management
```

---

## Verification Plan

### Dev Server
- Run `npm run dev` and verify all routes render correctly
- Test guest RSVP flow (browsing, selecting, submitting)
- Test admin CRUD operations (create/edit/delete groups and guests)

### Supabase Integration
- Verify Supabase client connects with env variables
- Test all CRUD operations against Supabase
- Verify RLS policies work (public read, authenticated write)

### Manual Verification
- Navigate through guest RSVP flow end-to-end
- Test admin dashboard stat accuracy
- Verify responsive design on mobile
- Confirm the dark gothic theme matches the Carrd reference site
- Verify Vanta.js FOG animation runs smoothly

> [!IMPORTANT]
> Before starting implementation, you'll need to:
> 1. Create a Supabase project and provide the URL + anon key
> 2. We'll set up the schema using the SQL script we generate
> 3. Create an admin user in Supabase Auth (email/password)
>
> For local development, we'll use placeholder `.env` values and you can swap them in once the Supabase project is ready.
