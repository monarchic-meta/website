export default {
  id: 'RE-20',
  name: 'Coronal / cyan-magenta native bands',
  sourceKey: 'CC-005',
  classification: 'source-led-adaptation',
  background: '#050507',
  simplifications: [
    'Source-led adaptation of Coronal, the cyan/magenta luminous ring observed in @XorDev’s post https://x.com/XorDev/status/2093488121392300374.',
    'An independently constructed, near-circular corona uses broad blurred native ellipses, asymmetric hot sectors, segmented curling filaments, and two outward plumes around a dark aperture. The earlier thin polygonal outline is replaced by a thicker layered light field.',
    'Native blur, color, and transparency approximate luminosity; volumetric scattering, continuous shader detail, and the original ring geometry are not reproduced. No source shader is copied or executed; no bitmap, SVG, or code component is used.',
    'Static study only: source motion, evolving light, and interactions are not reproduced.',
  ],
  build(h) {
    const pale = '#dddfee';
    h.text('Source adaptation label', 'SOURCE-LED ADAPTATION / CC-005', 72, 62, 1000, 14, pale, 'IBM Plex Mono', 500);
    h.text('Study title', 'Coronal / native bands', 72, 106, 1000, 46, pale, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'CORONAL / @XorDev', 1080, 70, 448, 14, '#9694b2', 'IBM Plex Mono', 400, { textAlignment: 'right' });
    const ring = h.group('Coronal approximation / native luminous layers', 450, 200, 800, 650);
    const cx = 400;
    const cy = 310;
    const point = (angle, offset = 0) => {
      const radius = 225 + 8 * Math.sin(angle * 3 + 0.8) + 4 * Math.sin(angle * 7 - 0.5) + offset;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 1.03];
    };
    const colorAt = (angle) => Math.cos(angle * 2 + 0.4) > 0 ? '#b845ff' : '#65e9ff';
    const plumes = h.group('Broad peripheral plasma / two native plumes', 0, 0, 800, 650, {}, ring);
    for (const [name, x, y, color, rotation] of [
      ['Upper-left violet', 202, 86, '#9634e8', -28],
      ['Lower cyan', 426, 526, '#36bbef', 28],
    ]) {
      for (let layer = 0; layer < 3; layer++) {
        h.frame(`${name} / haze layer ${layer + 1}`, x - 36 + layer * 7, y - 88 + layer * 16, 72 - layer * 9, 182 - layer * 19, color, { radius: '50%', rotation: `${rotation}deg`, blur: `${18 - layer * 4}px`, opacity: 0.12 + layer * 0.035 }, plumes);
      }
    }
    const haze = h.group('Coronal volume / soft native cells', 0, 0, 800, 650, {}, ring);
    const inner = h.group('Coronal volume / turbulent inner light field', 0, 0, 800, 650, {}, ring);
    const cores = h.group('Coronal hot sectors / compact native cells', 0, 0, 800, 650, {}, ring);
    for (let index = 0; index < 48; index++) {
      const angle = index / 48 * Math.PI * 2;
      const [x, y] = point(angle);
      const swell = (1 + Math.sin(angle * 3 - 0.6)) / 2;
      h.frame(`Soft coronal volume ${String(index + 1).padStart(2, '0')}`, x - 49, y - 37 - swell * 12, 98, 74 + swell * 24, colorAt(angle), { radius: '50%', rotation: `${angle * 180 / Math.PI + 90}deg`, blur: '14px', opacity: 0.2 + swell * 0.2 }, haze);
      const [hotX, hotY] = point(angle, -20 + 16 * Math.sin(angle * 11));
      const length = 31 + 22 * (1 + Math.sin(index * 2.4)) / 2;
      const thickness = 16 + 24 * (1 + Math.sin(index * 1.7)) / 2;
      h.frame(`Hot coronal sector ${String(index + 1).padStart(2, '0')}`, hotX - length / 2, hotY - thickness / 2, length, thickness, colorAt(angle), { radius: '50%', rotation: `${angle * 180 / Math.PI + 90 + 17 * Math.sin(index)}deg`, blur: '4px', opacity: 0.27 + swell * 0.34 + (1 + Math.sin(index * 2.8)) * 0.12 }, cores);
    }
    for (let index = 0; index < 28; index++) {
      const angle = index / 28 * Math.PI * 2 + 0.07 * Math.sin(index * 1.4);
      const [x, y] = point(angle, -51 + 18 * Math.sin(index * 1.7));
      h.frame(`Inner plasma cloud ${index + 1}`, x - 46, y - 37, 92, 74, colorAt(angle + 0.17), { radius: '50%', rotation: `${angle * 180 / Math.PI + 70}deg`, blur: '9px', opacity: 0.22 + (1 + Math.sin(index * 2.3)) * 0.1 }, inner);
    }
    h.frame('Deep black aperture / softened inner edge', cx - 130, cy - 140, 260, 280, '#050507', { radius: '50%', blur: '12px', opacity: 0.98 }, ring);
    const filaments = h.group('Curling plasma / editable short line segments', 0, 0, 800, 650, { opacity: 0.55 }, ring);
    for (let strand = 0; strand < 28; strand++) {
      const angle = strand / 28 * Math.PI * 2 + 0.055 * Math.sin(strand * 2.7);
      const at = (t) => point(angle + 0.44 * t + 0.08 * Math.sin(t * Math.PI * 2 + strand * 2.31), -55 + 24 * Math.sin(t * Math.PI * 2 + strand * 2.31) + 15 * t);
      for (let segment = 0; segment < 8; segment++) {
        h.line(`Plasma curl ${strand + 1} / segment ${segment + 1}`, ...at(segment / 8), ...at((segment + 1) / 8), colorAt(angle + 0.15), 1, filaments);
      }
    }
    const branches = h.group('Ragged outer arcs / branching wisps', 0, 0, 800, 650, { opacity: 0.36 }, ring);
    for (let strand = 0; strand < 12; strand++) {
      const angle = strand / 12 * Math.PI * 2 + 0.13 * Math.sin(strand * 3.1);
      const at = (t) => point(angle + 0.33 * t + 0.055 * Math.sin(t * Math.PI * 2 + strand), 9 + 53 * Math.sin(t * Math.PI * 0.7) + 12 * Math.sin(t * 4 + strand));
      for (let segment = 0; segment < 6; segment++) {
        h.line(`Outer wisp ${strand + 1} / segment ${segment + 1}`, ...at(segment / 6), ...at((segment + 1) / 6), colorAt(angle), 0.9, branches);
      }
    }
    const arcs = h.group('Ragged bright arcs / uneven local streaks', 0, 0, 800, 650, {}, ring);
    for (let arc = 0; arc < 22; arc++) {
      const angle = arc / 22 * Math.PI * 2 + 0.07 * Math.sin(arc * 1.8);
      const at = (t) => point(angle + t * (0.1 + 0.09 * Math.sin(arc * 2.7)), -24 + 22 * Math.sin(arc * 1.4) + 8 * Math.sin(t * Math.PI * 2 + arc));
      for (let segment = 0; segment < 4; segment++) {
        const a = at(segment / 4); const b = at((segment + 1) / 4);
        const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
        h.frame(`Bright arc ${arc + 1} / segment ${segment + 1}`, (a[0] + b[0] - width) / 2, (a[1] + b[1]) / 2 - 1.2, width, 2.4, arc % 5 === 0 ? '#dffbff' : colorAt(angle), { rotation: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg`, blur: '1.4px', opacity: 0.45 + (1 + Math.sin(arc * 2.1)) * 0.21 }, arcs);
      }
    }
    const tendrils = h.group('Plume tendrils / native segmented curves', 0, 0, 800, 650, { opacity: 0.48 }, ring);
    for (const [name, startAngle, direction] of [['Upper-left', -2.3, -1], ['Lower', 1.4, 1]]) {
      for (let strand = 0; strand < 3; strand++) {
        const at = (t) => {
          const [x, y] = point(startAngle + (strand - 1) * 0.09 + t * 0.23, 12 + t * 20);
          return [x + Math.sin(t * Math.PI * 1.5 + strand) * 19 * t, y + direction * 110 * t];
        };
        for (let segment = 0; segment < 8; segment++) {
          h.line(`${name} tendril ${strand + 1} / segment ${segment + 1}`, ...at(segment / 8), ...at((segment + 1) / 8), direction < 0 ? '#b053f4' : '#79ddfb', 1.2, tendrils);
        }
      }
    }
    const highlights = h.group('Asymmetric white-hot light pockets', 0, 0, 800, 650, {}, ring);
    const hotAngles = [-1.16, -1.02, -0.94, -0.8, -0.71, 1.9, 2.02, 2.13, 2.27, 2.36];
    for (let index = 0; index < hotAngles.length; index++) {
      const angle = hotAngles[index];
      const [x, y] = point(angle, -5 + 12 * Math.sin(index * 2.7));
      const size = 9 + (1 + Math.sin(angle * 3 - 0.6)) * 5;
      h.frame(`White-hot pocket ${String(index + 1).padStart(2, '0')}`, x - size, y - size / 3, size * 2, size * 0.66, '#dffbff', { radius: '50%', rotation: `${angle * 180 / Math.PI + 90}deg`, blur: '4px', opacity: 0.48 + (1 + Math.sin(angle * 3 - 0.6)) * 0.23 }, highlights);
    }
    h.text('Approximation qualification', 'NATIVE LIGHT CELLS / BLUR / FILAMENTS · NO SHADER', 72, 884, 1300, 13, '#9694b2', 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, pale, 'IBM Plex Mono', 500);
  },
};
