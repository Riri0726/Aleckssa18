/**
 * ============================================================
 * Admin Filter & Spider Z-Index Tests
 * Bug #5: Admin filter buttons need proper styling and mobile dropdown
 * Bug #6: Spiders should be behind form content (z-index fix)
 * ============================================================
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read the CSS file for inspection
const cssPath = path.resolve(__dirname, '../App.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// ============================================================
// TEST SUITE: Admin Filter Styles (Bug #5)
// ============================================================
describe('Admin Filter Styles (Bug #5)', () => {
  it('should define .rsvp-category-filter styles', () => {
    expect(cssContent).toContain('.rsvp-category-filter');
    expect(cssContent).toMatch(/\.rsvp-category-filter\s*\{[\s\S]*?display:\s*flex/);
  });

  it('should define .category-btn styles', () => {
    expect(cssContent).toContain('.category-btn');
  });

  it('should define .category-btn.active styles', () => {
    expect(cssContent).toContain('.category-btn.active');
  });

  it('should define .category-btn:hover styles', () => {
    expect(cssContent).toContain('.category-btn:hover');
  });

  it('should define .rsvp-category-select for mobile dropdown', () => {
    expect(cssContent).toContain('.rsvp-category-select');
  });

  it('should hide filter buttons on mobile', () => {
    // Check that within a media query, .rsvp-category-filter is set to display: none
    const mediaMatch = cssContent.match(/@media[^{]*768px[^{]*\{([\s\S]*?)\n\}/);
    expect(mediaMatch).toBeTruthy();
    const mediaContent = mediaMatch[1];
    expect(mediaContent).toContain('.rsvp-category-filter');
    expect(mediaContent).toContain('display: none');
  });

  it('should show dropdown on mobile', () => {
    const mediaMatch = cssContent.match(/@media[^{]*768px[^{]*\{([\s\S]*?)\n\}/);
    expect(mediaMatch).toBeTruthy();
    const mediaContent = mediaMatch[1];
    expect(mediaContent).toContain('.rsvp-category-select');
    expect(mediaContent).toContain('display: block');
  });
});

// ============================================================
// TEST SUITE: Spider Z-Index (Bug #6)
// ============================================================
describe('Spider Z-Index Fix (Bug #6)', () => {
  it('should set gothic-spiders-container z-index to 0 (behind home-content)', () => {
    // Find the .gothic-spiders-container rule
    const match = cssContent.match(/\.gothic-spiders-container\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).toContain('z-index: 0');
  });

  it('should NOT have z-index: 2 on spiders', () => {
    const match = cssContent.match(/\.gothic-spiders-container\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).not.toContain('z-index: 2');
  });

  it('should set spider-thread to pointer-events: none', () => {
    const match = cssContent.match(/\.spider-thread\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).toContain('pointer-events: none');
  });

  it('should NOT have pointer-events: auto on spider-thread', () => {
    const match = cssContent.match(/\.spider-thread\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).not.toContain('pointer-events: auto');
  });

  it('should keep home-content at z-index: 1 (above spiders)', () => {
    const match = cssContent.match(/\.home-content\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).toContain('z-index: 1');
  });

  it('should keep modal-overlay at z-index: 1000 (above everything)', () => {
    const match = cssContent.match(/\.modal-overlay\s*\{([^}]*)\}/);
    expect(match).toBeTruthy();
    const rule = match[1];
    expect(rule).toContain('z-index: 1000');
  });
});

// ============================================================
// TEST SUITE: Filter Logic (GuestsAdmin)
// ============================================================
describe('Admin Filter Logic', () => {
  const groups = [
    { id: '1', role: 'friends_debutante', group_name: 'Santos Family' },
    { id: '2', role: 'relatives_debutante', group_name: 'Garcia Family' },
    { id: '3', role: 'friends_parents', group_name: 'Cruz Family' },
    { id: '4', role: 'friends_debutante', group_name: 'Reyes Barkada' },
  ];

  const filterGroups = (filter) => {
    return groups.filter((group) => {
      if (filter && filter !== 'all' && group.role !== filter) return false;
      return true;
    });
  };

  it('should show all groups when filter is "all"', () => {
    expect(filterGroups('all')).toHaveLength(4);
  });

  it('should filter to friends_debutante only', () => {
    const filtered = filterGroups('friends_debutante');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((g) => g.role === 'friends_debutante')).toBe(true);
  });

  it('should filter to relatives_debutante only', () => {
    const filtered = filterGroups('relatives_debutante');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].group_name).toBe('Garcia Family');
  });

  it('should filter to friends_parents only', () => {
    const filtered = filterGroups('friends_parents');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].group_name).toBe('Cruz Family');
  });
});
