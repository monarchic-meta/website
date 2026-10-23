export default {
  id: 'RE-06',
  name: 'Dot-matrix glyph / vertical event type',
  sourceKey: 'GRA-006',
  background: '#080908',
  simplifications: [
    'Source-led recreation of the viewed dot-matrix event composition, not original Monarchic lettering.',
    'The abstract source glyph is approximated with a coarse native circle lattice rather than every printed dot.',
    'IBM Plex Mono substitutes for the source dot-matrix body font; rotated event columns remain native editable text.',
  ],
  build(h) {
    const white = '#E5E7DF';
    const glyph = h.group('Dot glyph / editable lattice', 110, 100, 670, 440);
    const points = new Set();
    const paths = [
      [[0, 0], [2, 2], [5, 2], [5, 0], [5, 7], [2, 7], [0, 8], [0, 10], [4, 10], [4, 12], [1, 14]],
      [[8, 0], [11, 0], [13, 2], [13, 5], [9, 5], [8, 7], [10, 10], [13, 10], [15, 8], [15, 5]],
      [[17, 1], [20, 3], [22, 3], [22, 0], [22, 10], [19, 10], [19, 8]],
      [[7, 4], [9, 3], [12, 3]],
    ];
    for (const path of paths) {
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1];
        const [bx, by] = path[i];
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let step = 0; step <= steps; step++) {
          points.add(`${Math.round(ax + ((bx - ax) * step) / steps)},${Math.round(ay + ((by - ay) * step) / steps)}`);
        }
      }
    }
    for (const point of ['10,13', '11,13', '10,14', '11,14', '18,13', '18,14']) points.add(point);
    for (const point of points) {
      const [x, y] = point.split(',').map(Number);
      h.circle(`Glyph dot ${x}:${y}`, x * 28, y * 28, 9, white, {}, glyph);
    }
    const columns = h.group('Vertical event type', 0, 0, 1600, 1000);
    h.text('US BY NIGHT / vertical', 'US BY NIGHT', 700, 490, 840, 42, white, 'IBM Plex Mono', 400, { rotation: '90deg', letterSpacing: '0.03em', lineHeight: '1em' }, columns);
    h.text('ANTWERP / vertical', 'ANTWERP, BE.', 950, 490, 600, 38, white, 'IBM Plex Mono', 400, { rotation: '90deg', letterSpacing: '0.03em', lineHeight: '1em' }, columns);
    h.text('Dates / vertical', 'SEPT 23.24.25', 1170, 490, 380, 27, white, 'IBM Plex Mono', 400, { rotation: '90deg', lineHeight: '1em' }, columns);
    h.text('Year / vertical', '2026', 1410, 490, 140, 27, white, 'IBM Plex Mono', 400, { rotation: '90deg', lineHeight: '1em' }, columns);
    h.text('Coordinate strip', '[ 51.2194° N, 4.4025° E ]', 110, 725, 680, 25, white, 'IBM Plex Mono', 400, { letterSpacing: '0.04em' });
    h.text('Event date strip', '23.  24.  25.\nSEPTEMBER', 110, 805, 540, 32, white, 'IBM Plex Mono', 400, { letterSpacing: '0.08em', lineHeight: '1.3em' });
  },
};
