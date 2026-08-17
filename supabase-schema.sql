-- ============================================================
-- Aleckssa's 18th Birthday RSVP — Supabase Database Schema
-- Version: 2.0 (Updated Roles: friends_debutante, relatives_debutante, friends_parents, individual)
-- Run this in Supabase SQL Editor for NEW database setups
-- ============================================================

-- ===================
-- TABLE: groups
-- ===================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  group_count_max INTEGER NOT NULL DEFAULT 1,
  is_predetermined BOOLEAN NOT NULL DEFAULT false,
  role TEXT NOT NULL DEFAULT 'friends_debutante' CHECK (role IN ('friends_debutante', 'relatives_debutante', 'friends_parents', 'individual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ===================
-- TABLE: guests
-- ===================
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  max_count INTEGER DEFAULT 1,
  role TEXT NOT NULL DEFAULT 'individual' CHECK (role IN ('friends_debutante', 'relatives_debutante', 'friends_parents', 'individual')),
  in_group BOOLEAN DEFAULT false,
  is_coming BOOLEAN,  -- null = pending, true = going, false = not going
  rsvp_submitted BOOLEAN DEFAULT false,
  rsvp_date TIMESTAMPTZ,
  companion_of UUID REFERENCES guests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id);
CREATE INDEX IF NOT EXISTS idx_guests_role ON guests(role);
CREATE INDEX IF NOT EXISTS idx_guests_companion_of ON guests(companion_of);
CREATE INDEX IF NOT EXISTS idx_guests_is_coming ON guests(is_coming);

-- ===================
-- ROW LEVEL SECURITY
-- ===================

-- Enable RLS on both tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- GROUPS policies
-- Public read access (guests need to browse groups)
CREATE POLICY "groups_public_read" ON groups
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated-only write access (admin operations)
CREATE POLICY "groups_auth_insert" ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "groups_auth_update" ON groups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "groups_auth_delete" ON groups
  FOR DELETE
  TO authenticated
  USING (true);

-- GUESTS policies
-- Public read access (guests need to see group members)
CREATE POLICY "guests_public_read" ON guests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anon users to INSERT (for RSVP submissions from non-predetermined groups)
CREATE POLICY "guests_anon_insert" ON guests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anon users to UPDATE (for RSVP submissions)
CREATE POLICY "guests_anon_update" ON guests
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated-only delete access (admin operations)
CREATE POLICY "guests_auth_delete" ON guests
  FOR DELETE
  TO authenticated
  USING (true);
