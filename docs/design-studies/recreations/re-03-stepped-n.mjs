export default {
  id: 'RE-03',
  name: 'Stepped N / mark across scales',
  sourceKey: 'GRA-003',
  background: '#F0F0ED',
  simplifications: [
    'Source-led recreation of the Nucleus Engineering Office printed-sheet composition, not a proposed Monarchic mark.',
    'Three repeated rows restore the observed striped N, stacked wordmark, descriptor band, fine construction grid, and right-hand circular field. A centered portrait sheet preserves their relative scale within the landscape artboard; the third row is intentionally cropped as in the observed source.',
    'Sixteen editable stair bands approximate the mark; the small typography and circular microgrid are reduced samples. Space Grotesk and IBM Plex Mono replace the source typefaces.',
  ],
  build(h) {
    const ink = '#31332F';
    const rule = '#9EA19B';
    const sheet = h.group('Repeated printed sheet / source proportions', 400, 0, 800, 1000, { overflow: 'clip' });
    const nMark = (name, x, y, size, parent) => {
      const group = h.group(name, x, y, size, size, {}, parent);
      const stem = size * 0.13;
      h.frame('Left pillar', 0, 0, stem, size, ink, {}, group);
      h.frame('Right pillar', size - stem, 0, stem, size, ink, {}, group);
      for (let i = 0; i < 16; i++) {
        h.frame(`Stair band ${i + 1}`, size * 0.72 / 15 * i, size / 16 * i, size * 0.28, size / 16 * 0.78, ink, {}, group);
      }
    };
    for (const x of [0, 155, 315, 622, 800]) h.line(`Sheet vertical rule ${x}`, x, 0, x, 1000, rule, 0.8, sheet);
    for (let index = 0; index < 3; index++) {
      const row = h.group(`Printed row ${index + 1} / repeated source module`, 0, index * 392, 800, 392, {}, sheet);
      h.line('Printed row top rule', 0, 0.5, 800, 0.5, rule, 0.8, row);
      h.line('Mark and wordmark baseline', 0, 156, 800, 156, rule, 0.8, row);
      h.line('Descriptor lower rule', 0, 216, 800, 216, rule, 0.8, row);
      h.line('Technical footer rule', 0, 387, 800, 387, rule, 0.8, row);
      nMark('Striped stepped N / row mark', 168, 4, 142, row);
      h.circle('Left gutter registration dot', 75, 65, 11, ink, {}, row);
      h.text('Source wordmark / Nucleus', 'Nucleus', 319, -8, 290, 56, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em' }, row);
      h.text('Source wordmark / Engineering', 'Engineering', 319, 45, 304, 56, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em' }, row);
      h.text('Source wordmark / Office', 'Office', 319, 98, 290, 56, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em' }, row);
      h.circle('Registered-mark outer circle', 563, 5, 40, 'transparent', { border: `2px solid ${ink}` }, row);
      h.text('Registered-mark R', 'R', 570, 10, 26, 25, ink, 'Space Grotesk', 700, { textAlignment: 'center' }, row);
      const hatch = h.group('Fine descriptor band / printed grid', 0, 157, 800, 59, { opacity: 0.55 }, row);
      for (let x = 0; x <= 800; x += 10) h.line(`Descriptor grid vertical ${x}`, x, 0, x, 59, '#B4B7B0', 0.45, hatch);
      for (let y = 0; y <= 59; y += 8) h.line(`Descriptor grid horizontal ${y}`, 0, y, 800, y, '#B4B7B0', 0.45, hatch);
      h.text('Source descriptor band', 'Nucleus Engineering Office brings together systems\nthinking, hardware development and rapid prototyping\nto turn complex ideas into working machines.', 168, 161, 450, 15, ink, 'Space Grotesk', 500, { letterSpacing: '-0.045em', lineHeight: '1.06em' }, row);
      h.text('Source technical note / small sample', 'SYSTEMS THINKING\nHARDWARE DEVELOPMENT\nRAPID PROTOTYPING\n\nDESIGN / MODEL / DEVELOP\nREFINE / TEST / BUILD\n\nNUCLEUS ENGINEERING OFFICE', 320, 250, 294, 8.5, ink, 'IBM Plex Mono', 400, { lineHeight: '1.35em' }, row);
      const circles = h.group('Right-hand circular microgrid / reduced sample', 624, 1, 176, 386, { overflow: 'clip' }, row);
      for (let gridRow = 0; gridRow < 20; gridRow++) {
        for (let column = 0; column < 11; column++) {
          if (gridRow > 1 && Math.abs(column - (5 + 4 * Math.sin(gridRow * 0.58))) > 1.6) continue;
          h.circle(`Microgrid ring ${gridRow + 1}:${column + 1}`, column * 16, gridRow * 18, 14, 'transparent', { border: '0.65px solid #a2a69d' }, circles);
        }
      }
    }
  },
};
