export default {
  id: 'RE-14',
  name: 'Cobalt / radial dither cloud',
  sourceKey: 'WEB-006',
  background: '#ffffff',
  simplifications: [
    'Recreates the observed cobalt cloud using individually editable native short fibers, bars, and pixels; no head rendering or imported artwork is used.',
    'A dense vertically elongated ink core and fine curved splinters replace the earlier circular sunburst. Deterministic reduced sampling preserves the axial silhouette without reproducing thousands of source marks.',
    'The financial UI, character head, and secondary graphics remain omitted so the radial dither language can be studied independently.',
  ],
  build(h) {
    const cobalt = '#2637df';
    h.text('Recreation label', 'RECREATION / WEB-006', 70, 63, 500, 14, '#303331', 'IBM Plex Mono', 500);
    h.text('Motif label', 'AXIAL DITHER / SOURCE CLOUD', 70, 113, 570, 17, '#777c79', 'IBM Plex Mono', 400);
    let state = 6006;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const cx = 860;
    const cy = 510;
    const fibers = h.group('Fine axial splinters / short curved native paths', 0, 0, 1600, 1000, {}, 'art');
    for (let index = 0; index < 84; index++) {
      const angle = index / 84 * Math.PI * 2 + (random() - 0.5) * 0.15;
      const start = 25 + random() * 105;
      const reach = start + 45 + Math.pow(random(), 1.6) * 190;
      const bend = (random() - 0.5) * 40;
      const at = (t) => {
        const radius = start + (reach - start) * t;
        return [cx + Math.cos(angle) * radius * 0.56 + Math.sin(t * Math.PI) * bend,
          cy + Math.sin(angle) * radius * 1.25 + Math.sin(t * Math.PI) * bend * 0.4];
      };
      const group = h.group(`Axial fiber ${String(index + 1).padStart(3, '0')}`, 0, 0, 1600, 1000, { opacity: 0.22 + random() * 0.44 }, fibers);
      for (let segment = 0; segment < 2; segment++) h.line(`Fine fiber segment ${segment + 1}`, ...at(segment / 2), ...at((segment + 1) / 2), cobalt, 0.7 + random() * 0.6, group);
    }
    const core = h.group('Clumped blue ink / vertically elongated native marks', 0, 0, 1600, 1000);
    h.frame('Fine blue ink underprint / low-opacity native haze', cx - 52, cy - 157, 104, 314, cobalt, { radius: '50%', blur: '16px', opacity: 0.12 }, core);
    for (let index = 0; index < 180; index++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.68) * 124;
      const x = cx + Math.cos(angle) * radius * 0.66;
      const y = cy + Math.sin(angle) * radius * 1.5;
      const size = 4 + random() * 12;
      const height = index % 4 === 0 ? size * 2.5 : size;
      h.frame(`Dense dither mark ${String(index + 1).padStart(3, '0')}`, x - size / 2, y - height / 2, size, height, cobalt, { opacity: 0.5 + random() * 0.5 }, core);
    }
    for (let index = 0; index < 64; index++) {
      const y = (random() * 2 - 1) * 139;
      const envelope = Math.sqrt(1 - (y / 170) ** 2);
      const x = (random() * 2 - 1) * 48 * envelope;
      h.frame(`Central ink sliver ${index + 1}`, cx + x, cy + y, 2 + random() * 5, 12 + random() * 25, cobalt, { opacity: 0.64 + random() * 0.36 }, core);
    }
    for (let index = 0; index < 30; index++) {
      const angle = random() * Math.PI * 2;
      const radius = 190 + random() * 145;
      const size = 1.5 + random() * 2.2;
      h.frame(`Peripheral source fleck ${index + 1}`, cx + Math.cos(angle) * radius * 0.56, cy + Math.sin(angle) * radius * 1.25, size, size * 1.4, cobalt, { opacity: 0.28 + random() * 0.45 });
    }
  },
};
