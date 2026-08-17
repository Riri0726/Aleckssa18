# Supabase Client Module

> **File**: `src/supabase.js`  
> **Version**: 1.0  
> **Dependencies**: `@supabase/supabase-js`

## Overview

Initializes and exports a Supabase client instance used throughout the application for database operations and authentication.

## Configuration

The client requires two environment variables:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

### Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials
3. Restart the dev server

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Usage

```javascript
import { supabase } from '../supabase';

// Query data
const { data, error } = await supabase.from('guests').select('*');

// Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@email.com',
  password: 'password',
});
```

## Error Handling

If credentials are missing, the client logs a warning but still initializes with placeholder values. This allows the app to start in development without crashing, but all Supabase operations will fail until real credentials are provided.

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor to create tables, indexes, and RLS policies. See the file for the full schema.
