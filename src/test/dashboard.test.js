/**
 * ============================================================
 * Dashboard Logic Tests
 * Bug #1: Dashboard counting should NOT require email for admin-set statuses
 * ============================================================
 */
import { describe, it, expect } from 'vitest';

// Extract the pure counting logic from Dashboard.jsx for unit testing
// These functions mirror the exact logic used in the Dashboard component

/**
 * Calculate expected guests based on max_count (total capacity)
 */
function calculateExpectedGuests(groups, allGuests) {
  let total = 0;

  total += groups.reduce((groupTotal, group) => {
    if (group.group_count_max) {
      return groupTotal + group.group_count_max;
    } else {
      const groupGuests = allGuests.filter((guest) => guest.group_id === group.id);
      const maxCount = groupGuests.reduce((sum, guest) => sum + (guest.max_count || 1), 0);
      return groupTotal + maxCount;
    }
  }, 0);

  const standaloneGuests = allGuests.filter(
    (guest) => guest.role === 'individual' && guest.in_group === false && !guest.group_id && !guest.companion_of
  );
  total += standaloneGuests.reduce((sum, guest) => sum + 1 + (guest.max_count || 0), 0);

  return total;
}

/**
 * Count responded guests — FIXED: no longer requires email
 */
function countResponded(allGuests) {
  return allGuests.filter(
    (g) => g.rsvp_submitted === true && g.is_coming !== null
  ).length;
}

/**
 * Count going guests — FIXED: no longer requires email
 */
function countGoing(allGuests) {
  return allGuests.filter(
    (g) => g.is_coming === true && g.rsvp_submitted === true
  ).length;
}

/**
 * Count not-going guests
 */
function countNotGoing(allGuests) {
  return allGuests.filter(
    (g) => g.is_coming === false && g.rsvp_submitted === true
  ).length;
}

// ============================================================
// TEST SUITE: Dashboard Counting Logic (Bug #1)
// ============================================================
describe('Dashboard Counting Logic (Bug #1)', () => {
  it('should count admin-set Going status WITHOUT requiring email', () => {
    const guests = [
      {
        id: '1', name: 'Guest A', email: '', // NO EMAIL
        is_coming: true, rsvp_submitted: true,
        role: 'individual', in_group: false, group_id: null,
      },
    ];

    expect(countResponded(guests)).toBe(1);
    expect(countGoing(guests)).toBe(1);
  });

  it('should count admin-set Not Going status WITHOUT requiring email', () => {
    const guests = [
      {
        id: '1', name: 'Guest B', email: '',
        is_coming: false, rsvp_submitted: true,
        role: 'individual', in_group: false, group_id: null,
      },
    ];

    expect(countResponded(guests)).toBe(1);
    expect(countNotGoing(guests)).toBe(1);
    expect(countGoing(guests)).toBe(0);
  });

  it('should still count regular RSVP submissions with email', () => {
    const guests = [
      {
        id: '1', name: 'Guest C', email: 'test@email.com',
        is_coming: true, rsvp_submitted: true,
        role: 'individual', in_group: false, group_id: null,
      },
    ];

    expect(countResponded(guests)).toBe(1);
    expect(countGoing(guests)).toBe(1);
  });

  it('should NOT count guests with is_coming=null as responded', () => {
    const guests = [
      {
        id: '1', name: 'Guest D', email: 'test@email.com',
        is_coming: null, rsvp_submitted: false,
        role: 'individual', in_group: false, group_id: null,
      },
    ];

    expect(countResponded(guests)).toBe(0);
    expect(countGoing(guests)).toBe(0);
    expect(countNotGoing(guests)).toBe(0);
  });

  it('should calculate pending as expected minus responded', () => {
    const groups = [
      { id: 'g1', group_count_max: 5, role: 'friends_debutante' },
    ];
    const guests = [
      { id: '1', group_id: 'g1', is_coming: true, rsvp_submitted: true, email: '', in_group: true, role: 'friends_debutante' },
      { id: '2', group_id: 'g1', is_coming: false, rsvp_submitted: true, email: '', in_group: true, role: 'friends_debutante' },
    ];

    const expected = calculateExpectedGuests(groups, guests);
    const responded = countResponded(guests);
    const pending = expected - responded;

    expect(expected).toBe(5);
    expect(responded).toBe(2);
    expect(pending).toBe(3);
  });

  it('should correctly count mixed admin-set and user-submitted guests', () => {
    const guests = [
      // Admin-set (no email)
      { id: '1', name: 'Admin Set', email: '', is_coming: true, rsvp_submitted: true, role: 'individual', in_group: false, group_id: null },
      // User-submitted (has email)
      { id: '2', name: 'User Set', email: 'user@test.com', is_coming: true, rsvp_submitted: true, role: 'individual', in_group: false, group_id: null },
      // Pending (no response)
      { id: '3', name: 'Pending', email: '', is_coming: null, rsvp_submitted: false, role: 'individual', in_group: false, group_id: null },
    ];

    expect(countResponded(guests)).toBe(2); // Both admin-set and user-submitted
    expect(countGoing(guests)).toBe(2);
    expect(countNotGoing(guests)).toBe(0);
  });

  it('should calculate expected capacity for main individual guests as 1 + max_count and ignore companions', () => {
    const groups = [];
    const guests = [
      // Main guest with 2 companion slots (expected = 3)
      { id: 'm1', role: 'individual', in_group: false, group_id: null, max_count: 2, companion_of: null },
      // Companion 1 under m1 (should not be counted in expected standalone)
      { id: 'c1', role: 'individual', in_group: false, group_id: null, max_count: 0, companion_of: 'm1' },
      // Companion 2 under m1 (should not be counted in expected standalone)
      { id: 'c2', role: 'individual', in_group: false, group_id: null, max_count: 0, companion_of: 'm1' },
    ];

    const expected = calculateExpectedGuests(groups, guests);
    expect(expected).toBe(3); // 1 main guest + 2 companions = 3 total expected capacity
  });
});
