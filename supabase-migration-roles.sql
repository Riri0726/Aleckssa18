-- ============================================================
-- Aleckssa's 18th Birthday RSVP — Migration Script
-- Run this in Supabase SQL Editor to update EXISTING data
-- ============================================================

-- Step 1: Drop existing constraints FIRST so Postgres allows updating role values
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_role_check;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_role_check;

-- Step 2: Update existing role values in groups table
UPDATE groups SET role = 'relatives_debutante' WHERE role = 'family';
UPDATE groups SET role = 'friends_debutante' WHERE role = 'friends';

-- Step 3: Update existing role values in guests table
UPDATE guests SET role = 'relatives_debutante' WHERE role = 'family';
UPDATE guests SET role = 'friends_debutante' WHERE role = 'friends';

-- Step 4: Add new CHECK constraints with updated roles
ALTER TABLE groups ADD CONSTRAINT groups_role_check 
  CHECK (role IN ('friends_debutante', 'relatives_debutante', 'friends_parents', 'individual'));

ALTER TABLE guests ADD CONSTRAINT guests_role_check 
  CHECK (role IN ('friends_debutante', 'relatives_debutante', 'friends_parents', 'individual'));
