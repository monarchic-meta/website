export default {
  id: 'RE-08',
  name: 'Cyan pixel flower / emissive lattice',
  sourceKey: 'GRA-008',
  background: '#030A16',
  simplifications: [
    'Source-led recreation of the viewed cyan pixel flower, not an original Monarchic motif.',
    'Ten overlapping petals are sampled on a coarse native-frame lattice; the original fine character cells and glow are reduced.',
    'A few native background grid lines replace the much denser source microgrid.',
  ],
  build(h) {
    const grid = h.group('Faint background grid', 80, 60, 1440, 880);
    for (let x = 0; x <= 1440; x += 120) h.line(`Grid vertical ${x}`, x, 0, x, 880, '#09172B', 1, grid);
    for (let y = 0; y <= 880; y += 110) h.line(`Grid horizontal ${y}`, 0, y, 1440, y, '#09172B', 1, grid);
    const bloom = h.group('Pixel bloom / editable petals', 400, 60, 800, 790);
    const families = Array.from({ length: 10 }, (_, i) => h.group(`Petal ${i + 1} / pixel family`, 0, 0, 800, 790, {}, bloom));
    const hub = h.group('Hub pixels', 0, 0, 800, 790, {}, bloom);
    for (let row = -13; row <= 13; row++) {
      for (let column = -13; column <= 13; column++) {
        const x = column * 30;
        const y = row * 30;
        let closest = Infinity;
        let petal = 0;
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI * 2) / 10 - Math.PI / 2;
          const dx = x - Math.cos(angle) * 188;
          const dy = y - Math.sin(angle) * 188;
          const u = dx * Math.cos(angle) + dy * Math.sin(angle);
          const v = -dx * Math.sin(angle) + dy * Math.cos(angle);
          const q = (u / 157) ** 2 + (v / 62) ** 2;
          if (q < closest) { closest = q; petal = i; }
        }
        const center = Math.hypot(x, y) < 114;
        if (closest > 1 && !center) continue;
        const level = center ? 2 : closest < 0.30 ? 2 : closest < 0.68 ? 1 : 0;
        const color = ['#0756A0', '#099FDE', '#39D4F5'][level];
        h.frame(`Pixel ${column}:${row}`, 389 + x, 359 + y, 20, 20, color, { radius: '2px', opacity: 0.84 + level * 0.06 }, center ? hub : families[petal]);
      }
    }
    const stem = h.group('Curved pixel stem', 610, 650, 230, 300);
    for (let i = 0; i < 15; i++) {
      const t = i * 18;
      const x = 190 - 0.63 * t + 0.0006 * t * t;
      h.frame(`Stem pixel ${i + 1}`, x, t, 12, 18, i % 3 === 0 ? '#1285C7' : '#064777', { radius: '2px' }, stem);
    }
  },
};
