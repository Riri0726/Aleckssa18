# Authentication Module

> **Files**: `src/pages/Login.jsx`, `src/components/ProtectedRoute.jsx`  
> **Version**: 1.0  
> **Dependencies**: `@supabase/supabase-js`

## Overview

Admin authentication using Supabase Auth with email/password credentials. Only the admin routes are protected; guest-facing pages are fully public.

## Setup

1. In your Supabase dashboard, go to **Authentication > Users**
2. Create an admin user with email and password
3. The admin can then log in at `/login`

## Components

### Login.jsx
- Email/password form at `/login`
- On success, redirects to `/admin`
- Displays error messages for invalid credentials

### ProtectedRoute.jsx
- Wrapper component for protected routes
- Checks Supabase session on mount
- Listens for auth state changes
- Shows loading state while verifying
- Redirects to `/login` if no session

## Usage

```jsx
// In App.jsx
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  }
/>
```

## Auth Flow

```
User visits /admin
       │
       ▼
ProtectedRoute checks session
       │
  Has session? ──No──▶ Redirect to /login
       │
      Yes
       │
       ▼
  Render Admin
```

## Logout

The admin header includes a "Sign Out" button that calls `supabase.auth.signOut()` and redirects to `/login`.

## Security Notes

- RLS policies ensure only authenticated users can create, update, or delete groups/guests
- Guest RSVP submissions (insert/update) are allowed for anonymous users via specific RLS policies
- The anon key is safe to expose in the frontend — RLS enforces access control
