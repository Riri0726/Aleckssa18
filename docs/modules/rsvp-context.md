# RSVP Context Module

> **File**: `src/context/RSVPContext.jsx`  
> **Version**: 1.0  
> **Dependencies**: `rsvpService.js`

## Overview

React Context provider that manages global state for the RSVP system. Used by guest-facing components (RSVPList, RSVPModal) to share data and selection state.

## Provided State

| Value | Type | Description |
|---|---|---|
| `groups` | Array | All groups |
| `individualGuests` | Array | Standalone individual guests |
| `organizedData` | Object | `{ individual: [], family: [], friends: [] }` |
| `selectedGroup` | Object/null | Currently selected group for RSVP |
| `groupGuests` | Array | Guests in the selected group |
| `guestsByGroup` | Object | `{ groupId: [guests] }` map |
| `selectedGuest` | Object/null | Currently selected guest (predetermined) |
| `isModalOpen` | Boolean | RSVP modal visibility |
| `loading` | Boolean | Data loading state |
| `error` | String/null | Error message |

## Provided Functions

| Function | Description |
|---|---|
| `setSelectedGroup(group)` | Select a group and load its guests |
| `setSelectedGuest(guest)` | Select a specific guest |
| `setIsModalOpen(bool)` | Open/close the RSVP modal |
| `refresh()` | Reload all data from Supabase |

## Usage

```jsx
// Wrap your component tree
import { RSVPProvider } from './context/RSVPContext';

<RSVPProvider>
  <Home />
</RSVPProvider>

// Use in child components
import { useRSVP } from '../context/RSVPContext';

const MyComponent = () => {
  const { groups, loading, refresh } = useRSVP();
  // ...
};
```

## Data Flow

1. On mount, loads all groups and guests from Supabase
2. Organizes data by role (family, friends, individual)
3. Maps guests to their groups via `guestsByGroup`
4. When a group is selected, loads its specific guests
5. `refresh()` reloads everything (called after RSVP submission)
