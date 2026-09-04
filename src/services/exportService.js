// ============================================================
// EXPORT SERVICE — CSV and PDF export for the guest list
// ============================================================

/**
 * Build a flat, ordered list of export rows from allGuests + groups.
 *
 * Row shape: { name, response, note }
 *   name      — display name
 *   response  — "Going" | "Not Going" | "Pending"
 *   note      — e.g. "Friends of Debutante · Santos Family" or "Individual"
 *
 * Ordering:
 *   1. Group guests (grouped by group, sorted by role label)
 *   2. Individual main guests, each followed immediately by their companions
 */
export function buildExportRows(allGuests, groups) {
  const rows = [];

  const responseLabel = (guest) => {
    if (guest.is_coming === true) return 'Going';
    if (guest.is_coming === false) return 'Not Going';
    return 'Pending';
  };

  const roleLabel = (role) => {
    switch (role) {
      case 'friends_debutante': return 'Friends of Debutante';
      case 'relatives_debutante': return 'Relatives of Debutante';
      case 'friends_parents': return 'Friends of Parents';
      default: return 'Individual';
    }
  };

  // --- 1. Group guests ---
  for (const group of groups) {
    const members = allGuests.filter((g) => g.group_id === group.id);
    for (const guest of members) {
      rows.push({
        name: guest.name,
        response: responseLabel(guest),
        note: `${roleLabel(group.role)} · ${group.group_name}`,
      });
    }
  }

  // --- 2. Individual main guests (no group, not a companion) ---
  const mainIndividuals = allGuests.filter(
    (g) => g.role === 'individual' && !g.group_id && !g.companion_of
  );

  for (const main of mainIndividuals) {
    rows.push({
      name: main.name,
      response: responseLabel(main),
      note: 'Individual',
    });

    // Companions immediately after their main guest
    const companions = allGuests.filter((g) => g.companion_of === main.id);
    for (const comp of companions) {
      const displayName =
        comp.name && comp.name !== 'Not Attending'
          ? `${comp.name} (Companion of ${main.name})`
          : `Companion of ${main.name}`;
      rows.push({
        name: displayName,
        response: responseLabel(comp),
        note: `Companion · ${main.name}`,
      });
    }
  }

  return rows;
}

// ---------------------------------------------------------------
// CSV
// ---------------------------------------------------------------
export function exportCSV(rows, filename = 'guest-list.csv') {
  const header = ['Name', 'Response', 'Category'];
  const csvLines = [
    header.join(','),
    ...rows.map((r) =>
      [r.name, r.response, r.note]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------
// PDF  (uses jsPDF — loaded lazily so the bundle stays lean)
// ---------------------------------------------------------------
export async function exportPDF(rows, eventTitle = "Aleckssa's 18th", filename = 'guest-list.pdf') {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // ---- Palette (dark theme rendered as deep maroon on white) ----
  const MAROON = [92, 26, 26];
  const DARK   = [30, 10, 10];
  const MUTED  = [120, 80, 80];
  const WHITE  = [255, 255, 255];
  const LIGHT_BG = [252, 247, 247];

  // ---- Helper: set fill + draw ----
  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);
  const setTxt  = (rgb) => doc.setTextColor(...rgb);

  // ---- Title block ----
  setFill(MAROON);
  doc.rect(0, 0, PAGE_W, 28, 'F');

  setTxt(WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(eventTitle, MARGIN, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Guest Response List  ·  Generated ${dateStr}`, MARGIN, 22);

  // ---- Summary line ----
  const going    = rows.filter((r) => r.response === 'Going').length;
  const notGoing = rows.filter((r) => r.response === 'Not Going').length;
  const pending  = rows.filter((r) => r.response === 'Pending').length;

  setTxt(DARK);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total: ${rows.length}   ·   Going: ${going}   ·   Not Going: ${notGoing}   ·   Pending: ${pending}`,
    MARGIN,
    36
  );

  // ---- Table ----
  const COL = {
    name:     { x: MARGIN,      w: 88 },
    response: { x: MARGIN + 90, w: 32 },
    category: { x: MARGIN + 124, w: CONTENT_W - 124 },
  };
  const ROW_H = 7;
  const HEADER_H = 8;
  let y = 42;

  // Table header
  setFill(MAROON);
  doc.rect(MARGIN, y, CONTENT_W, HEADER_H, 'F');
  setTxt(WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Name', COL.name.x + 2, y + 5.5);
  doc.text('Response', COL.response.x + 2, y + 5.5);
  doc.text('Category', COL.category.x + 2, y + 5.5);
  y += HEADER_H;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const responseColor = (resp) => {
    if (resp === 'Going') return [22, 120, 60];
    if (resp === 'Not Going') return [160, 40, 40];
    return [120, 100, 40];
  };

  rows.forEach((row, i) => {
    // Page break
    if (y + ROW_H > 285) {
      doc.addPage();
      y = 14;
      // Repeat header on new page
      setFill(MAROON);
      doc.rect(MARGIN, y, CONTENT_W, HEADER_H, 'F');
      setTxt(WHITE);
      doc.setFont('helvetica', 'bold');
      doc.text('Name', COL.name.x + 2, y + 5.5);
      doc.text('Response', COL.response.x + 2, y + 5.5);
      doc.text('Category', COL.category.x + 2, y + 5.5);
      doc.setFont('helvetica', 'normal');
      y += HEADER_H;
    }

    // Alternating row bg
    setFill(i % 2 === 0 ? WHITE : LIGHT_BG);
    doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');

    // Companion rows get slight indent
    const isCompanion = row.note.startsWith('Companion ·');
    const nameX = COL.name.x + 2 + (isCompanion ? 4 : 0);

    setTxt(isCompanion ? MUTED : DARK);
    doc.text(row.name, nameX, y + 4.8, { maxWidth: COL.name.w - 4 });

    setTxt(responseColor(row.response));
    doc.text(row.response, COL.response.x + 2, y + 4.8);

    setTxt(MUTED);
    doc.text(row.note, COL.category.x + 2, y + 4.8, { maxWidth: COL.category.w - 2 });

    // Bottom border for each row
    setDraw([220, 210, 210]);
    doc.line(MARGIN, y + ROW_H, MARGIN + CONTENT_W, y + ROW_H);

    y += ROW_H;
  });

  // Outer border
  setDraw(MAROON);
  setFill([0,0,0]); // reset
  doc.rect(MARGIN, 42, CONTENT_W, y - 42, 'S');

  doc.save(filename);
}
