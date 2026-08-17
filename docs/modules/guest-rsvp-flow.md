# Guest RSVP Flow

> **Files**: `src/components/RSVPList.jsx`, `src/components/RSVPModal.jsx`, `src/pages/Home.jsx`  
> **Version**: 1.0

## Overview

The guest-facing RSVP flow allows invitees to find their name and respond to the invitation. This document describes the complete flow from landing to submission.

## Access Methods

1. **Browse + Search**: Guests visit `/` and search for their name or group
2. **Direct URL**: Guests access `/rsvp/{groupId}` to go directly to their group's RSVP

## Flow Diagram

```
Guest visits / or /rsvp/:groupId
         │
         ▼
┌─────────────────┐
│   RSVPList      │ ← Browse/search groups
│   (Home.jsx)    │    Filter by category
└────────┬────────┘
         │ Click group card
         ▼
┌─────────────────┐    ┌────────────────────┐
│   RSVPModal     │───▶│ Predetermined?     │
│                 │    └────────┬───────────┘
│                 │       Yes / │ \ No
│                 │           ▼    ▼
│                 │    ┌──────┐  ┌──────────┐
│                 │    │Select│  │Enter names│
│                 │    │ Name │  │+ email    │
│                 │    └──┬───┘  └────┬─────┘
│                 │       ▼           │
│                 │    ┌──────────┐   │
│                 │    │Confirm   │◀──┘
│                 │    │attendance│
│                 │    └──┬───────┘
│                 │       ▼
│                 │    ┌──────────┐
│                 │    │Submit    │
│                 │    │RSVP      │
│                 │    └──────────┘
└─────────────────┘
```

## RSVP Types

### 1. Predetermined Group
- Admin pre-sets guest names in the group
- Guest sees a grid of names and selects themselves
- Locked names (already responded) are grayed out
- After selecting, guest confirms attendance and provides email

### 2. Non-Predetermined Group
- Admin sets a max guest count but no names
- Guest provides email and enters all attending guest names
- Remaining slots are filled with "Not Attending" placeholders

### 3. Individual Guest
- Created as a standalone guest (not in any group)
- If `max_count > 1`, guest can add companion names
- If `max_count = 1`, simple attendance confirmation

## Status States

| Status | `is_coming` | `rsvp_submitted` | Description |
|---|---|---|---|
| Pending | `null` | `false` | No response yet |
| Going | `true` | `true` | Confirmed attendance |
| Not Going | `false` | `true` | Declined |

## Toast Notifications

After RSVP submission, a toast notification appears:
- **Success (Going)**: "RSVP submitted successfully! We look forward to seeing you!"
- **Success (Not Going)**: "RSVP submitted successfully! Thank you for letting us know."
- **Error**: "Failed to submit RSVP. Please try again."
