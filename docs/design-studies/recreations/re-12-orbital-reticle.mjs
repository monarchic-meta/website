export default {
  id: 'RE-12',
  name: 'Orbital / radar reticle geometry',
  sourceKey: 'WEB-001',
  background: '#030405',
  simplifications: [
    'Recreates the thin circular reticle, radial tick field, slanted bracket, right-edge scale, and lower spectral band from the source graphic.',
    'The aircraft, capability table, and defense copy are intentionally omitted; this is a source-geometry study.',
    'A small set of native translucent color bands substitutes for the photographed atmospheric gradient.',
  ],
  build(h) {
    const pale = '#c9d0cc';
    h.text('Recreation label', 'RECREATION / WEB-001', 70, 66, 460, 14, pale, 'IBM Plex Mono', 500);
    h.text('Source graphic study note', 'ORBITAL RETICLE\nGEOMETRY STUDY', 70, 128, 450, 17, pale, 'IBM Plex Mono', 400, { lineHeight: '1.2em' });
    const band = h.group('Native spectral band approximation', -110, 688, 1810, 220, { rotation: '13deg' });
    [
      [0, 15, '#264bf4', 0.16], [16, 18, '#3459fa', 0.2], [35, 22, '#6669d7', 0.27],
      [58, 24, '#ada5d5', 0.4], [83, 26, '#d6c3c9', 0.5], [110, 24, '#bcbddc', 0.42],
      [135, 22, '#5f70f2', 0.4], [158, 21, '#2346f0', 0.37], [180, 20, '#173de8', 0.2],
    ].forEach(([y, height, color, opacity], i) => h.frame(`Spectral strip ${i + 1}`, 0, y, 1810, height, color, { opacity }, band));

    const cx = 870;
    const cy = 500;
    for (let i = 0; i < 48; i += 1) {
      const angle = (i * 7.5 - 90) * Math.PI / 180;
      const inner = i % 6 === 0 ? 287 : 295;
      h.line(`Radial tick ${String(i).padStart(2, '0')}`, cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner, cx + Math.cos(angle) * 307, cy + Math.sin(angle) * 307, pale, 1.2);
    }
    h.circle('Central tracking ring', cx - 104, cy - 104, 208, 'transparent', { border: '1.5px solid #c9d0cc' });
    const bracket = h.group('Slanted tracking bracket', 620, 485, 500, 30, { rotation: '14deg' });
    h.line('Tracking bracket span', 0, 0, 500, 0, pale, 1.5, bracket);
    h.line('Tracking bracket left terminal', 0, 0, 0, 28, pale, 1.5, bracket);
    h.line('Tracking bracket right terminal', 500, 0, 500, 28, pale, 1.5, bracket);
    h.line('Right-edge reference rule', 1518, 140, 1518, 900, pale, 1);
    for (let i = 0; i <= 38; i += 1) {
      const y = 140 + i * 20;
      h.line(`Right scale tick ${i}`, 1518 - (i % 5 === 0 ? 31 : 16), y, 1518, y, pale, 1);
    }
    h.text('Source timecode sample', 'T-00:18', 70, 864, 360, 43, '#e7ece8', 'Space Grotesk', 400, { letterSpacing: '-0.06em' });
    h.text('Static source timecode qualifier', 'STATIC SOURCE TIMECODE', 70, 924, 400, 11, pale, 'IBM Plex Mono', 400);
  },
};
