# RSVP Service Module

> **File**: `src/services/rsvpService.js`  
> **Version**: 1.0  
> **Dependencies**: `supabase.js`

## Overview

Contains all Supabase data operations for the RSVP system. Exports two service objects:

- **`guestService`** — Primary service for guest/group operations
- **`adminService`** — Legacy-compatible admin operations (mirrors YannaWedding interface)

## guestService API

### Guest Operations

| Method | Description | Params |
|---|---|---|
| `createIndividualGuest(guestData)` | Create standalone individual guest | `{ name, email, max_count }` |
| `getAllGuests()` | Get all guests with group info | — |
| `getGuestsByRole()` | Get guests organized by role | — |
| `getGuestCounts()` | Get dashboard stats by role | — |
| `updateGuestRSVP(guestId, data)` | Update RSVP response | `{ email, is_coming }` |
| `updateGuest(guestId, updates)` | Update guest details | Any guest fields |
| `deleteGuest(guestId)` | Delete guest + companions | Guest UUID |

### Group Operations

| Method | Description | Params |
|---|---|---|
| `createGroupWithGuests(groupData, guestNames)` | Create group + guests | Group data + array of names |
| `getAllGroups()` | Get all groups | — |
| `deleteGroup(groupId)` | Delete group (cascades to guests) | Group UUID |

## adminService API

Mirrors the YannaWedding `adminService` interface for easy porting:

| Method | Description |
|---|---|
| `createGroup(group)` | Create a group |
| `listGroups()` | List all groups |
| `updateGroup(groupId, updates)` | Update group details |
| `deleteGroup(groupId)` | Delete group + guests |
| `createGuest(guest)` | Create a guest |
| `listGuestsByGroup(groupId)` | List guests in a group |
| `listAllGuests()` | List all guests |
| `updateGuestRSVP(guestId, data)` | Submit RSVP |
| `addUnknownGroupGuests(groupId, email, names, isComing)` | Add guests to non-predetermined group |
| `updateGuest(guestId, updates)` | Update guest |
| `deleteGuest(guestId)` | Delete guest |

## Key Differences from YannaWedding

- Uses **Supabase** instead of Firebase Firestore
- **No `guest_type`** field (bride/groom removed)
- Cascade deletes handled by Supabase FK constraints (no need for manual batch deletes)
- Individual guest companion cascade still handled manually in `guestService.deleteGuest()`

## Usage Example

```javascript
import { guestService, adminService } from '../services/rsvpService';

// Create a family group with 3 pre-set guests
await guestService.createGroupWithGuests(
  { group_name: 'Santos Family', group_count_max: 5, is_predetermined: true, role: 'family' },
  ['Juan Santos', 'Maria Santos', 'Pedro Santos']
);

// Submit RSVP
await adminService.updateGuestRSVP(guestId, {
  email: 'juan@email.com',
  is_coming: true,
});
```
