export default {
  id: 'RE-18',
  name: 'Canopy / suspended white point mesh',
  sourceKey: 'CC-001',
  classification: 'source-led-adaptation',
  background: '#080909',
  simplifications: [
    'Source-led adaptation of the white point canopy and trailing mesh observed in @yuruyurau’s post https://x.com/yuruyurau/status/2093710258120331463.',
    'An independently constructed projected dome, doubled elliptical rim, converging neck, and ten twisting point strands study the observed tall silhouette and hourglass throat. The source formula is not copied or executed.',
    'Points are concentrated on the dome and overlapping throat rather than spread across an umbrella-shaped fan; native meridians, latitude ellipses, and connected trails restore the visible warp and flow. The source still has a much denser moving surface. This bounded static sample uses editable native circles, line segments, and ellipse outlines, without a bitmap, SVG, shader, or code component.',
    'Static study only: source motion, changing perspective, and interactions are not reproduced.',
  ],
  build(h) {
    const white = '#e7e9e8';
    h.text('Source adaptation label', 'SOURCE-LED ADAPTATION / CC-001', 72, 62, 1000, 14, white, 'IBM Plex Mono', 500);
    h.text('Study title', 'White point canopy', 72, 106, 900, 46, white, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'SOURCE / @yuruyurau', 1080, 70, 448, 14, '#a0a5a4', 'IBM Plex Mono', 400, { textAlignment: 'right' });
    const canopy = h.group('Suspended dome / fourteen editable point rings', 480, 230, 640, 310);
    const capContours = h.group('Dome / connected meridian warp', 0, 0, 640, 310, { opacity: 0.32 }, canopy);
    const cx = 320;
    const cy = 200;
    const capPoint = (radius, angle) => [cx + 250 * radius * Math.cos(angle), cy - 140 * Math.sqrt(1 - radius * radius) + 48 * radius * Math.sin(angle)];
    for (let ring = 1; ring <= 14; ring += 1) {
      const radius = Math.pow(ring / 14, 0.72);
      const row = h.group(`Canopy point ring ${String(ring).padStart(2, '0')}`, 0, 0, 640, 310, {}, canopy);
      for (let point = 0; point < 36; point += 1) {
        const angle = point / 36 * Math.PI * 2 + ring % 2 * Math.PI / 36;
        const [x, y] = capPoint(radius, angle);
        const size = 1.45 + 0.65 * radius;
        h.circle(`Canopy point ${ring}-${String(point + 1).padStart(2, '0')}`, x - size / 2, y - size / 2, size, white, { opacity: Math.min(1, 0.55 + radius * 0.31 + (Math.sin(angle) + 1) * 0.1) }, row);
      }
      h.frame(`Dome contour / latitude ${ring}`, cx - 250 * radius, cy - 140 * Math.sqrt(1 - radius * radius) - 48 * radius, 500 * radius, 96 * radius, 'transparent', { radius: '50%', border: '0.65px solid #e7e9e8', opacity: 0.24 + radius * 0.3 }, row);
    }
    for (let meridian = 0; meridian < 16; meridian++) {
      const angle = meridian / 16 * Math.PI * 2;
      for (let segment = 0; segment < 13; segment++) {
        h.line(`Dome meridian ${meridian + 1} / segment ${segment + 1}`, ...capPoint(Math.pow((segment + 1) / 14, 0.72), angle), ...capPoint(Math.pow((segment + 2) / 14, 0.72), angle), white, 0.65, capContours);
      }
    }
    h.frame('Canopy rim / outer ellipse', 70, 152, 500, 96, 'transparent', { radius: '50%', border: '1.2px solid #dce2df', opacity: 0.92 }, canopy);
    h.frame('Canopy rim / inner ellipse', 75, 157, 490, 90, 'transparent', { radius: '50%', border: '0.8px solid #e7e9e8', opacity: 0.78 }, canopy);
    const neck = h.group('Converging rim / narrow hourglass throat', 480, 400, 640, 180);
    const neckContours = h.group('Throat / faint connected meridians', 0, 0, 640, 180, { opacity: 0.48 }, neck);
    for (let strand = 0; strand < 14; strand++) {
      const phase = strand / 14 * Math.PI * 2;
      let previous;
      for (let point = 0; point < 9; point++) {
        const t = point / 8;
        const radius = 228 * Math.pow(1 - t, 2.4) + 22;
        const angle = phase + t * 0.85;
        const x = 320 + radius * Math.cos(angle);
        const y = 30 + 128 * t + 48 * Math.sin(phase) * (1 - t);
        if (previous) h.line(`Throat contour ${strand + 1} / segment ${point}`, ...previous, x, y, white, 0.8, neckContours);
        previous = [x, y];
        h.circle(`Throat strand ${strand + 1} / point ${point + 1}`, x - 1, y - 1, 2, white, { opacity: 0.6 + 0.36 * t }, neck);
      }
    }
    const trailing = h.group('Ten intertwined open trailing contours', 610, 550, 380, 310);
    const trailContours = h.group('Trailing mesh / faint connected curves', 0, 0, 380, 310, { opacity: 0.58 }, trailing);
    for (let strand = 0; strand < 10; strand += 1) {
      const phase = strand / 10 * Math.PI * 2;
      let previous;
      for (let point = 0; point < 20; point += 1) {
        const t = point / 19;
        const width = 18 + 72 * Math.pow(Math.sin(t * Math.PI), 2) + 30 * t;
        const x = 190 + Math.cos(phase + t * 4.2) * width + 22 * Math.sin(phase + t * 2.3) * t;
        const y = 8 + 280 * t + 8 * Math.sin(phase + t * 5) * t;
        const size = 1.6 + (1 - t) * 0.6;
        if (previous) h.line(`Trailing contour ${strand + 1} / segment ${point}`, ...previous, x, y, white, 0.8, trailContours);
        previous = [x, y];
        h.circle(`Trailing strand ${strand + 1} / point ${String(point + 1).padStart(2, '0')}`, x - size / 2, y - size / 2, size, white, { opacity: 0.45 + (1 - t) * 0.5 }, trailing);
      }
    }
    h.text('Geometry qualification', 'COARSE NATIVE POINT SAMPLE / INDEPENDENT GEOMETRY', 72, 884, 1200, 13, '#a0a5a4', 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, white, 'IBM Plex Mono', 500);
  },
};
