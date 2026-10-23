export default {
  id: 'RE-18',
  name: 'Canopy / suspended white point mesh',
  sourceKey: 'CC-001',
  classification: 'source-led-adaptation',
  background: '#080909',
  simplifications: [
    'Source-led adaptation of the white point canopy and trailing mesh observed in @yuruyurau’s post https://x.com/yuruyurau/status/2093710258120331463.',
    'An independently constructed projected dome and ten hanging point strands retain the broad canopy, narrow throat, and open trailing contours. The source formula is not copied or executed.',
    'The source has a much denser moving point surface. This coarse static construction uses individually editable native circles; no bitmap, SVG, shader, or code component is used.',
    'Static study only: source motion, changing perspective, and interactions are not reproduced.',
  ],
  build(h) {
    const white = '#e7e9e8';
    h.text('Source adaptation label', 'SOURCE-LED ADAPTATION / CC-001', 72, 62, 1000, 14, white, 'IBM Plex Mono', 500);
    h.text('Study title', 'White point canopy', 72, 106, 900, 46, white, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'SOURCE / @yuruyurau', 1080, 70, 448, 14, '#a0a5a4', 'IBM Plex Mono', 400, { textAlignment: 'right' });
    const canopy = h.group('Suspended canopy / twelve editable point rings', 340, 220, 920, 340);
    const cx = 460;
    const cy = 260;
    for (let ring = 1; ring <= 12; ring += 1) {
      const radius = ring / 12;
      const row = h.group(`Canopy point ring ${String(ring).padStart(2, '0')}`, 0, 0, 920, 340, {}, canopy);
      for (let point = 0; point < 32; point += 1) {
        const angle = point / 32 * Math.PI * 2;
        const x = cx + 414 * radius * Math.cos(angle);
        const y = cy - 190 * Math.sqrt(1 - radius * radius) + 73 * radius * Math.sin(angle);
        const size = 2.6 + 1.4 * radius;
        h.circle(`Canopy point ${ring}-${String(point + 1).padStart(2, '0')}`, x - size / 2, y - size / 2, size, white, { opacity: 0.32 + radius * 0.43 + (Math.sin(angle) + 1) * 0.1 }, row);
      }
    }
    const trailing = h.group('Ten open trailing point strands', 610, 466, 380, 382);
    for (let strand = 0; strand < 10; strand += 1) {
      const phase = strand / 10 * Math.PI * 2;
      for (let point = 0; point < 16; point += 1) {
        const t = point / 15;
        const width = 18 + 90 * Math.pow(Math.sin(t * Math.PI), 2) + 92 * Math.exp(-t * 11);
        const x = 190 + Math.cos(phase + t * 4.8) * width;
        const y = 12 + 350 * t + 9 * Math.sin(phase + t * 5);
        const size = 2.6 + (1 - t) * 0.7;
        h.circle(`Trailing strand ${strand + 1} / point ${String(point + 1).padStart(2, '0')}`, x - size / 2, y - size / 2, size, white, { opacity: 0.35 + (1 - t) * 0.4 }, trailing);
      }
    }
    h.text('Geometry qualification', 'COARSE NATIVE POINT SAMPLE / INDEPENDENT GEOMETRY', 72, 884, 1200, 13, '#a0a5a4', 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, white, 'IBM Plex Mono', 500);
  },
};
