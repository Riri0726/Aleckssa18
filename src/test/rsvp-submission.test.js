/**
 * ============================================================
 * RSVP Submission Logic Tests
 * Bug #2: Double submission prevention
 * Bug #3: Fill remaining slots as "Not Going"
 * ============================================================
 */
import { describe, it, expect } from 'vitest';

// ============================================================
// Helper: Simulate isAlreadyAnswered logic (from RSVPModal)
// ============================================================
function isAlreadyAnswered(selectedGroup, selectedGuest, guestsByGroup) {
  if (!selectedGroup) return false;

  if (selectedGroup.is_predetermined) {
    if (selectedGuest) {
      return selectedGuest.is_coming !== null;
    }
    const currentGroupGuests = guestsByGroup[selectedGroup.id] || [];
    return currentGroupGuests.length > 0 && currentGroupGuests.every((g) => g.is_coming !== null);
  } else {
    const currentGroupGuests = guestsByGroup[selectedGroup.id] || [];
    return currentGroupGuests.some((g) => g.is_coming !== null);
  }
}

// ============================================================
// Helper: Calculate how many "Not Attending" placeholders to create
// for non-predetermined groups (Bug #3)
// ============================================================
function calculateMissingSlots(group, existingGuests, newGuestCount) {
  const totalMax = group.group_count_max || 0;
  if (totalMax === 0) return 0;

  const totalAfterSubmission = existingGuests.length + newGuestCount;
  return Math.max(0, totalMax - totalAfterSubmission);
}

// ============================================================
// Helper: Calculate missing companion slots for individuals (Bug #3)
// ============================================================
function calculateMissingCompanions(companionSlots, companionNamesProvided) {
  return Math.max(0, companionSlots - companionNamesProvided);
}

// ============================================================
// TEST SUITE: Double Submission Prevention (Bug #2)
// ============================================================
describe('Double Submission Prevention (Bug #2)', () => {
  describe('Non-predetermined groups', () => {
    it('should NOT be locked when no guests have responded', () => {
      const group = { id: 'g1', is_predetermined: false, group_count_max: 5 };
      const guestsByGroup = { 'g1': [] };

      expect(isAlreadyAnswered(group, null, guestsByGroup)).toBe(false);
    });

    it('should be locked when ANY guest has responded', () => {
      const group = { id: 'g1', is_predetermined: false, group_count_max: 5 };
      const guestsByGroup = {
        'g1': [
          { id: '1', is_coming: true },
        ],
      };

      expect(isAlreadyAnswered(group, null, guestsByGroup)).toBe(true);
    });

    it('should be locked even if only "not going" responses exist', () => {
      const group = { id: 'g1', is_predetermined: false, group_count_max: 5 };
      const guestsByGroup = {
        'g1': [
          { id: '1', is_coming: false },
        ],
      };

      expect(isAlreadyAnswered(group, null, guestsByGroup)).toBe(true);
    });
  });

  describe('Predetermined groups', () => {
    it('should NOT be locked when selected guest has NOT responded', () => {
      const group = { id: 'g1', is_predetermined: true };
      const guest = { id: '1', is_coming: null };
      const guestsByGroup = {
        'g1': [
          { id: '1', is_coming: null },
          { id: '2', is_coming: true },
        ],
      };

      expect(isAlreadyAnswered(group, guest, guestsByGroup)).toBe(false);
    });

    it('should be locked when selected guest has already responded (going)', () => {
      const group = { id: 'g1', is_predetermined: true };
      const guest = { id: '1', is_coming: true };
      const guestsByGroup = { 'g1': [{ id: '1', is_coming: true }] };

      expect(isAlreadyAnswered(group, guest, guestsByGroup)).toBe(true);
    });

    it('should be locked when selected guest has already responded (not going)', () => {
      const group = { id: 'g1', is_predetermined: true };
      const guest = { id: '1', is_coming: false };
      const guestsByGroup = { 'g1': [{ id: '1', is_coming: false }] };

      expect(isAlreadyAnswered(group, guest, guestsByGroup)).toBe(true);
    });

    it('should be locked when ALL guests have responded (no guest selected)', () => {
      const group = { id: 'g1', is_predetermined: true };
      const guestsByGroup = {
        'g1': [
          { id: '1', is_coming: true },
          { id: '2', is_coming: false },
        ],
      };

      expect(isAlreadyAnswered(group, null, guestsByGroup)).toBe(true);
    });

    it('should NOT be locked when some guests still pending (no guest selected)', () => {
      const group = { id: 'g1', is_predetermined: true };
      const guestsByGroup = {
        'g1': [
          { id: '1', is_coming: true },
          { id: '2', is_coming: null }, // Still pending
        ],
      };

      expect(isAlreadyAnswered(group, null, guestsByGroup)).toBe(false);
    });
  });

  it('should return false when no group is selected', () => {
    expect(isAlreadyAnswered(null, null, {})).toBe(false);
  });
});

// ============================================================
// TEST SUITE: Fill Remaining Slots as Not Going (Bug #3)
// ============================================================
describe('Fill Remaining Slots (Bug #3)', () => {
  describe('Non-predetermined groups', () => {
    it('should calculate missing slots when group has capacity for 5 and 3 go', () => {
      const group = { id: 'g1', group_count_max: 5 };
      const existingGuests = []; // No previous guests
      const newGuestCount = 3; // 3 people going

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(2);
    });

    it('should calculate 0 missing slots when all capacity is filled', () => {
      const group = { id: 'g1', group_count_max: 5 };
      const existingGuests = [];
      const newGuestCount = 5;

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(0);
    });

    it('should calculate missing slots when "not going" (1 placeholder created)', () => {
      const group = { id: 'g1', group_count_max: 5 };
      const existingGuests = [];
      const newGuestCount = 1; // 1 "Family Cannot Attend" placeholder

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(4);
    });

    it('should account for previously existing guests', () => {
      const group = { id: 'g1', group_count_max: 5 };
      const existingGuests = [{ id: '1' }, { id: '2' }]; // 2 already exist
      const newGuestCount = 2; // 2 more going

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(1);
    });

    it('should return 0 when group has no max count set', () => {
      const group = { id: 'g1', group_count_max: 0 };
      const existingGuests = [];
      const newGuestCount = 3;

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(0);
    });

    it('should not go negative if more guests than capacity', () => {
      const group = { id: 'g1', group_count_max: 3 };
      const existingGuests = [{ id: '1' }, { id: '2' }];
      const newGuestCount = 3;

      expect(calculateMissingSlots(group, existingGuests, newGuestCount)).toBe(0);
    });
  });

  describe('Individual guest companions', () => {
    it('should fill missing companions when 1 of 3 companion slots used', () => {
      expect(calculateMissingCompanions(3, 1)).toBe(2);
    });

    it('should fill all companions when none provided', () => {
      expect(calculateMissingCompanions(2, 0)).toBe(2);
    });

    it('should fill 0 when all companion slots used', () => {
      expect(calculateMissingCompanions(2, 2)).toBe(0);
    });

    it('should handle 0 companion slots', () => {
      expect(calculateMissingCompanions(0, 0)).toBe(0);
    });
  });
});
