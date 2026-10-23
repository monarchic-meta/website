export default {
  id: 'RE-20',
  name: 'Coronal / cyan-magenta native bands',
  sourceKey: 'CC-005',
  classification: 'source-led-adaptation',
  background: '#050507',
  simplifications: [
    'Source-led adaptation of Coronal, the cyan/magenta luminous ring observed in @XorDev’s post https://x.com/XorDev/status/2093488121392300374.',
    'An independently constructed irregular ring uses layered native bars, thin tangential filaments, and coarse pixels to approximate the observed bright edge and black aperture.',
    'Color and transparency approximate luminosity; volumetric scattering, continuous shader detail, and the original ring geometry are not reproduced. No source shader is copied or executed; no bitmap, SVG, or code component is used.',
    'Static study only: source motion, evolving light, and interactions are not reproduced.',
  ],
  build(h) {
    const pale = '#dddfee';
    h.text('Source adaptation label', 'SOURCE-LED ADAPTATION / CC-005', 72, 62, 1000, 14, pale, 'IBM Plex Mono', 500);
    h.text('Study title', 'Coronal / native bands', 72, 106, 1000, 46, pale, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'CORONAL / @XorDev', 1080, 70, 448, 14, '#9694b2', 'IBM Plex Mono', 400, { textAlignment: 'right' });
    const ring = h.group('Coronal approximation / layered native marks', 450, 200, 800, 650);
    const cx = 400;
    const cy = 310;
    const point = (angle, offset = 0) => {
      const radius = 225 + 18 * Math.sin(angle * 3 + 0.8) + 10 * Math.sin(angle * 7 - 0.5) + offset;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 1.08];
    };
    const colorAt = (angle) => Math.sin(angle * 2 + 0.5) > 0.22 ? '#8fefff' : Math.cos(angle + 0.7) > -0.25 ? '#b44aff' : '#ee8bff';
    for (let band = 0; band < 3; band += 1) {
      const parent = h.group(`Native ring band ${band + 1}`, 0, 0, 800, 650, {}, ring);
      for (let segment = 0; segment < 96; segment += 1) {
        const angle = segment / 96 * Math.PI * 2;
        const [x, y] = point(angle, (band - 1) * 17);
        const length = 21 + (1 + Math.sin(angle * 9 + band)) * 8;
        const thickness = band === 1 ? 9 : 22;
        h.frame(`Band ${band + 1} / tangential segment ${String(segment + 1).padStart(2, '0')}`, x - length / 2, y - thickness / 2, length, thickness, band === 1 && segment % 4 === 0 ? '#e5fcff' : colorAt(angle), { rotation: `${angle * 180 / Math.PI + 90}deg`, opacity: band === 1 ? 0.93 : 0.22 }, parent);
      }
    }
    const filaments = h.group('Peripheral luminous filaments / static lines', 0, 0, 800, 650, {}, ring);
    for (let index = 0; index < 64; index += 1) {
      const angle = index / 64 * Math.PI * 2;
      const [x, y] = point(angle, 35 + 14 * Math.sin(angle * 5));
      const length = 24 + (1 + Math.sin(angle * 11)) * 21;
      h.frame(`Coronal filament ${String(index + 1).padStart(2, '0')}`, x - length / 2, y - 1, length, 2, colorAt(angle + 0.2), { rotation: `${angle * 180 / Math.PI + 60 + Math.sin(angle * 4) * 22}deg`, opacity: 0.3 + (1 + Math.sin(angle * 8)) * 0.16 }, filaments);
    }
    const pixels = h.group('Coarse ring-edge light pixels', 0, 0, 800, 650, {}, ring);
    for (let index = 0; index < 40; index += 1) {
      const angle = index / 40 * Math.PI * 2 + 0.035;
      const [x, y] = point(angle, -28 + Math.sin(index * 2.7) * 24);
      const size = 3 + index % 4;
      h.frame(`Edge light pixel ${String(index + 1).padStart(2, '0')}`, x - size / 2, y - size / 2, size, size, index % 3 === 0 ? '#e7fcff' : colorAt(angle), { opacity: 0.78 }, pixels);
    }
    h.text('Approximation qualification', 'NATIVE BANDS / PIXELS / TRANSPARENCY · NO SHADER', 72, 884, 1300, 13, '#9694b2', 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, pale, 'IBM Plex Mono', 500);
  },
};
