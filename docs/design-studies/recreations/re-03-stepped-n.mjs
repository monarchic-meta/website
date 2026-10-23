export default {
  id: 'RE-03',
  name: 'Stepped N / mark across scales',
  sourceKey: 'GRA-003',
  background: '#F0F0ED',
  simplifications: [
    'Source-led recreation of the Nucleus Engineering Office stepped N motif, not a proposed Monarchic mark.',
    'Twelve editable stair bands replace the finer source striping; two smaller copies expose the scale family.',
    'The repeated printed-sheet grid is reduced to a few construction rules and source typography.',
  ],
  build(h) {
    const ink = '#31332F';
    function nMark(name, x, y, size) {
      const group = h.group(name, x, y, size, size);
      const stem = size * 0.13;
      h.frame('Left pillar', 0, 0, stem, size, ink, {}, group);
      h.frame('Right pillar', size - stem, 0, stem, size, ink, {}, group);
      for (let i = 0; i < 12; i++) {
        h.frame(`Stair band ${i + 1}`, ((size * 0.72) / 11) * i, (size / 12) * i, size * 0.28, (size / 12) * 0.78, ink, {}, group);
      }
      return group;
    }
    const construction = h.group('Sheet construction rules', 60, 60, 1480, 880);
    h.line('Left vertical rule', 0, 0, 0, 880, '#8A8D87', 1, construction);
    h.line('Main split', 640, 0, 640, 880, '#8A8D87', 1, construction);
    h.line('Right vertical rule', 1480, 0, 1480, 880, '#8A8D87', 1, construction);
    h.line('Top rule', 0, 35, 1480, 35, '#8A8D87', 1, construction);
    h.line('Primary baseline', 0, 650, 1480, 650, '#8A8D87', 1, construction);
    h.line('Lower rule', 0, 880, 1480, 880, '#8A8D87', 1, construction);
    nMark('Primary stepped N', 110, 140, 540);
    h.text('Source wordmark / Nucleus', 'Nucleus', 750, 145, 760, 108, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em', lineHeight: '1em' });
    h.text('Source wordmark / Engineering', 'Engineering', 750, 260, 780, 108, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em', lineHeight: '1em' });
    h.text('Source wordmark / Office', 'Office', 750, 375, 700, 108, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em', lineHeight: '1em' });
    h.circle('Registered-mark outer circle', 1435, 140, 75, 'transparent', { border: `5px solid ${ink}` });
    h.text('Registered-mark R', 'R', 1443, 147, 59, 48, ink, 'Space Grotesk', 700, { textAlignment: 'center' });
    h.text('Source descriptor', 'SYSTEMS THINKING, HARDWARE DEVELOPMENT\nAND RAPID PROTOTYPING.', 750, 535, 720, 20, ink, 'IBM Plex Mono', 500, { lineHeight: '1.25em' });
    nMark('Small stepped N', 110, 760, 145);
    nMark('Medium stepped N', 360, 735, 180);
    h.text('Technical note', 'NUCLEUS ENGINEERING\nOFFICE / EMBEDDED SYSTEMS\n-----------------------------\nDIVISION PROGRAM / NEO-01\nDEVELOPMENT ACCESS / INTERNAL', 750, 770, 690, 19, ink, 'IBM Plex Mono', 500, { lineHeight: '1.25em' });
  },
};
