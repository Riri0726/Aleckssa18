/**
 * ============================================================
 * Companion Count Logic Tests
 * Bug #4: max_count represents COMPANION SLOTS ONLY (not total including main guest)
 * ============================================================
 */
import { describe, it, expect } from 'vitest';

// ============================================================
// Helper: Mirror the RSVPModal companion logic
// ============================================================

/**
 * Calculate companion slots from max_count
 * max_count = number of companions allowed (NOT including main guest)
 * 0 = solo, 1 = 1 companion, 2 = 2 companions, etc.
 */
function getCompanionSlots(guest, group) {
  const isIndividualGuest =
    group?.role === 'individual' ||
    (group?.is_predetermined && guest?.role === 'individual');

  if (!isIndividualGuest) return 0;

  return guest?.max_count ??
    group?.group_count_max ??
    group?.max_count ??
    0;
}

/**
 * Calculate total attendees (main guest + companions)
 */
function getTotalAttendees(guest, group) {
  const companionSlots = getCompanionSlots(guest, group);
  return 1 + companionSlots; // main guest + companions
}

/**
 * Check if guest can add more companions
 */
function canAddMoreGuests(guest, group, currentGuestNames) {
  const companionSlots = getCompanionSlots(guest, group);
  if (companionSlots <= 0) return false;
  // guestNames[0] is the main guest, rest are companions
  return currentGuestNames.length - 1 < companionSlots;
}

/**
 * Get the companion info message text
 */
function getCompanionInfoMessage(guest, group) {
  const companionSlots = getCompanionSlots(guest, group);
  if (companionSlots === 0) {
    return 'You are going solo! No companions allowed.';
  }
  return `You can bring up to ${companionSlots} ${companionSlots === 1 ? 'companion' : 'companions'} with you.`;
}

// ============================================================
// TEST SUITE: Companion Count Logic (Bug #4)
// ============================================================
describe('Companion Count Logic (Bug #4)', () => {
  describe('getCompanionSlots', () => {
    it('max_count=0 means solo (0 companions)', () => {
      const guest = { max_count: 0, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionSlots(guest, group)).toBe(0);
    });

    it('max_count=1 means 1 companion allowed', () => {
      const guest = { max_count: 1, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionSlots(guest, group)).toBe(1);
    });

    it('max_count=3 means 3 companions allowed', () => {
      const guest = { max_count: 3, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionSlots(guest, group)).toBe(3);
    });

    it('should return 0 for non-individual guests', () => {
      const guest = { max_count: 5, role: 'friends_debutante' };
      const group = { role: 'friends_debutante', is_predetermined: true };

      expect(getCompanionSlots(guest, group)).toBe(0);
    });

    it('should fallback to group max when guest max not set', () => {
      const guest = { role: 'individual' }; // No max_count
      const group = { role: 'individual', is_predetermined: true, group_count_max: 2 };

      expect(getCompanionSlots(guest, group)).toBe(2);
    });
  });

  describe('getTotalAttendees', () => {
    it('solo guest (max_count=0) = 1 total attendee', () => {
      const guest = { max_count: 0, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getTotalAttendees(guest, group)).toBe(1);
    });

    it('max_count=1 = 2 total attendees (self + 1 companion)', () => {
      const guest = { max_count: 1, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getTotalAttendees(guest, group)).toBe(2);
    });

    it('max_count=4 = 5 total attendees (self + 4 companions)', () => {
      const guest = { max_count: 4, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getTotalAttendees(guest, group)).toBe(5);
    });
  });

  describe('canAddMoreGuests', () => {
    it('should allow adding companions when under limit', () => {
      const guest = { max_count: 2, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };
      const guestNames = ['Main Guest']; // Only main guest, 0 companions

      expect(canAddMoreGuests(guest, group, guestNames)).toBe(true);
    });

    it('should allow adding 1 more when 1 of 2 slots filled', () => {
      const guest = { max_count: 2, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };
      const guestNames = ['Main Guest', 'Companion 1']; // 1 companion

      expect(canAddMoreGuests(guest, group, guestNames)).toBe(true);
    });

    it('should NOT allow adding when all companion slots filled', () => {
      const guest = { max_count: 2, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };
      const guestNames = ['Main Guest', 'Companion 1', 'Companion 2']; // 2 companions (full)

      expect(canAddMoreGuests(guest, group, guestNames)).toBe(false);
    });

    it('should NOT allow adding companions for solo guests (max_count=0)', () => {
      const guest = { max_count: 0, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };
      const guestNames = ['Main Guest'];

      expect(canAddMoreGuests(guest, group, guestNames)).toBe(false);
    });
  });

  describe('getCompanionInfoMessage', () => {
    it('should show "going solo" for max_count=0', () => {
      const guest = { max_count: 0, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionInfoMessage(guest, group)).toBe(
        'You are going solo! No companions allowed.'
      );
    });

    it('should show "1 companion" (singular) for max_count=1', () => {
      const guest = { max_count: 1, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionInfoMessage(guest, group)).toBe(
        'You can bring up to 1 companion with you.'
      );
    });

    it('should show "3 companions" (plural) for max_count=3', () => {
      const guest = { max_count: 3, role: 'individual' };
      const group = { role: 'individual', is_predetermined: true };

      expect(getCompanionInfoMessage(guest, group)).toBe(
        'You can bring up to 3 companions with you.'
      );
    });
  });
});
