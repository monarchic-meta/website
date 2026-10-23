export default {
  id: 'RE-14',
  name: 'Cobalt / radial dither cloud',
  sourceKey: 'WEB-006',
  background: '#ffffff',
  simplifications: [
    'Recreates the source cobalt radial-pixel cloud using individually editable native bars and pixels; no head rendering or imported artwork is used.',
    'The source image contains thousands of marks. This construction uses a deterministic coarse sampling below 350 nodes.',
    'The financial UI, character head, and secondary graphics are omitted so the radial dither language can be studied independently.',
  ],
  build(h) {
    const cobalt = '#2637df';
    h.text('Recreation label', 'RECREATION / WEB-006', 70, 63, 500, 14, '#303331', 'IBM Plex Mono', 500);
    h.text('Motif label', 'RADIAL DITHER', 70, 113, 420, 17, '#777c79', 'IBM Plex Mono', 400);
    let state = 6006;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const cx = 860;
    const cy = 510;
    for (let i = 0; i < 144; i += 1) {
      const angle = (i / 144) * Math.PI * 2 + (random() - 0.5) * 0.05;
      const start = 35 + random() * 125;
      const length = 40 + Math.pow(random(), 1.6) * 285;
      const radius = start + length / 2;
      const thickness = i % 9 === 0 ? 4.2 : 2.8;
      h.frame(`Radial fiber ${String(i + 1).padStart(3, '0')}`, cx + Math.cos(angle) * radius - length / 2, cy + Math.sin(angle) * radius * 0.92 - thickness / 2, length, thickness, cobalt, { rotation: `${angle * 180 / Math.PI}deg`, opacity: 0.35 + random() * 0.55 });
    }
    for (let i = 0; i < 158; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 1.5) * 180;
      const size = radius < 70 ? 8 + random() * 12 : 4 + random() * 7;
      h.frame(`Cloud dither pixel ${String(i + 1).padStart(3, '0')}`, cx + Math.cos(angle) * radius - size / 2, cy + Math.sin(angle) * radius * 0.92 - size / 2, size, size, cobalt, { opacity: 0.3 + random() * 0.7 });
    }
    for (let i = 0; i < 30; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 290 + random() * 145;
      const size = 3 + random() * 2;
      h.frame(`Peripheral source speck ${i + 1}`, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.92, size, size, cobalt, { opacity: 0.45 + random() * 0.5 });
    }
  },
};
