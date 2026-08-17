# Admin Panel

> **Files**: `src/pages/Admin.jsx`, `src/pages/Dashboard.jsx`, `src/pages/GuestsAdmin.jsx`  
> **Version**: 1.0

## Overview

Protected admin panel accessible at `/admin`. Requires Supabase email/password authentication.

## Tabs

### 1. Dashboard
Stat cards showing:
- **Overview**: Total Expected Guests, Responded, Pending
- **Attendance**: Going, Not Going, Still Deciding
- **Distribution**: Total Groups, Family Groups, Friends Groups, Individual Guests
- **Breakdown**: Detailed stats per category (Family / Friends & Colleagues / Individual)

### 2. Guest Management
Full CRUD interface for managing guests and groups.

#### Group Operations
| Action | Description |
|---|---|
| Create Group | Set name, max guests, role (family/friends), predetermined toggle |
| Edit Group | Modify any group field |
| Delete Group | Removes group and all its guests (cascade) |

#### Guest Operations (within groups)
| Action | Description |
|---|---|
| Add Guest | Add a guest to a specific group |
| Quick Status | Change status to Going/Not Going/Pending |
| Delete Guest | Remove guest from group |

#### Individual Guest Operations
| Action | Description |
|---|---|
| Create Individual | Set name, email, max companions |
| Edit Individual | Modify details |
| Quick Status | Change attendance status |
| Delete Individual | Remove guest and companions |

## Filters

- **Category**: All / Family / Individual / Friends & Colleagues
- **Search**: Filter by group or guest name

## UI Pattern

- Groups displayed as expandable cards with guest rows inside
- Individual guests displayed as standalone cards
- All CRUD operations use modal dialogs
- Delete operations require confirmation
- Toast notifications for success/error feedback
