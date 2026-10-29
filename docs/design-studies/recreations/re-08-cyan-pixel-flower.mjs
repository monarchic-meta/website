export default {
  id: 'RE-08',
  name: 'Cyan pixel flower / emissive lattice',
  sourceKey: 'GRA-008',
  background: '#030A16',
  simplifications: [
    'Source-led recreation of the viewed dimensional cyan pixel flower, not an original Monarchic motif.',
    'Fourteen overlapping, asymmetrically placed petal fields replace the evenly spaced flat starburst. Native character-cell-like blocks sample bright rims, dark folds, changing petal widths, and a smaller offset hub; all parts remain editable.',
    'The original fine character texture, continuous shading, and glow remain coarsened. A native fine grid and curved pixel stem retain the observed digital surface and silhouette without imported artwork.',
  ],
  build(h) {
    const grid = h.group('Faint background microgrid', 80, 60, 1440, 880, { opacity: 0.55 });
    for (let x = 0; x <= 1440; x += 24) h.line(`Grid vertical ${x}`, x, 0, x, 880, '#0b1729', 0.7, grid);
    for (let y = 0; y <= 880; y += 24) h.line(`Grid horizontal ${y}`, 0, y, 1440, y, '#0b1729', 0.7, grid);
    const bloom = h.group('Dimensional pixel bloom / overlapping petal fields', 400, 80, 800, 790);
    const petals = [
      [-32, -139, -1.82, 122, 54], [35, -166, -1.36, 137, 59],
      [135, -109, -0.72, 130, 64], [176, -25, -0.13, 116, 69],
      [138, 81, 0.53, 111, 68], [55, 157, 1.3, 130, 63],
      [-56, 163, 1.9, 126, 63], [-143, 94, 2.52, 124, 65],
      [-178, -7, 3.18, 122, 63], [-135, -113, 3.89, 115, 60],
      [-74, -36, -2.2, 89, 43], [84, -27, -0.52, 100, 45],
      [-63, 59, 2.6, 92, 43], [58, 83, 1.3, 79, 37],
    ];
    const glow = h.group('Petal emission / low-opacity native haze', 0, 0, 800, 790, {}, bloom);
    petals.forEach(([x, y, angle, length, width], index) => h.frame(`Petal ${index + 1} / soft emission`, 400 + x - length, 345 + y - width, length * 2, width * 2, '#12a8da', { radius: '50%', rotation: `${angle * 180 / Math.PI}deg`, blur: '6px', opacity: 0.07 }, glow));
    const families = petals.map((_, index) => h.group(`Petal ${index + 1} / shaded native cells`, 0, 0, 800, 790, {}, bloom));
    const hub = h.group('Offset hub / tonal cells', 0, 0, 800, 790, {}, bloom);
    const palette = ['#03223f', '#064c78', '#0b75a8', '#1599cb', '#25c4ec', '#70e4fa'];
    for (let row = -18; row <= 18; row++) {
      for (let column = -18; column <= 18; column++) {
        const x = column * 18;
        const y = row * 18;
        let visible = null;
        for (let index = 0; index < petals.length; index++) {
          const [px, py, angle, length, width] = petals[index];
          const dx = x - px; const dy = y - py;
          const u = dx * Math.cos(angle) + dy * Math.sin(angle);
          const v = -dx * Math.sin(angle) + dy * Math.cos(angle) - 12 * Math.sin(u / length * 2 + index * 0.7);
          const q = (u / length) ** 2 + (v / width) ** 2;
          if (q <= 1) visible = { index, u: u / length, v: v / width, q };
        }
        const inHub = ((x - 17) / 57) ** 2 + ((y + 4) / 53) ** 2 < 1;
        if (!visible && !inHub) continue;
        let shade;
        if (inHub) {
          shade = 0.45 + 0.19 * Math.sin(column * 1.8 + row * 0.7) + 0.18 * (1 - Math.hypot(x - 17, y + 4) / 95);
        } else {
          const fold = Math.exp(-(((visible.v + 0.22) / 0.16) ** 2));
          shade = 0.1 + 0.65 * Math.pow(Math.abs(visible.v), 1.2) + 0.1 * (visible.u + 1) / 2 + (visible.q > 0.75 ? 0.32 : 0) - fold * 0.15;
          shade += 0.06 * Math.sin(column * 1.9 + row * 2.7);
        }
        const level = Math.max(0, Math.min(5, Math.round(shade * 5)));
        h.frame(`Cell ${column}:${row} / tonal level ${level}`, 393 + x, 338 + y, 14, 14, palette[level], { border: `0.6px solid ${palette[Math.max(0, level - 1)]}`, opacity: 0.94 }, inHub ? hub : families[visible.index]);
      }
    }
    const stem = h.group('Curved pixel stem', 560, 640, 260, 330);
    for (let index = 0; index < 19; index++) {
      const t = index * 17;
      const x = 170 - 0.5 * t + 0.0005 * t * t;
      h.frame(`Stem cell ${index + 1}`, x, t, 10, 16, index % 3 === 0 ? '#158fc5' : '#07517c', { border: '0.6px solid #0a6389' }, stem);
    }
  },
};
