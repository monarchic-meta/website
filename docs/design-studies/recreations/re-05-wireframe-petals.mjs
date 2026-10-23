export default {
  id: 'RE-05',
  name: 'Wireframe petals / technical crosshair',
  sourceKey: 'GRA-005',
  background: '#202125',
  simplifications: [
    'Source-led recreation of the sparse technical boards and six-blade wireframe motif.',
    'Three editable ellipse families approximate the source curved mesh; perspective and mesh density are reduced.',
    'All wires, crosshairs, nodes and labels are native frames or text, not a flattened illustration.',
  ],
  build(h) {
    const wire = '#687389';
    const guide = '#454951';
    const ink = '#D7DBD5';
    const axes = h.group('Technical crosshair', 80, 60, 1440, 880);
    h.line('Horizontal axis', 0, 440, 1440, 440, guide, 1, axes);
    h.line('Vertical axis', 720, 0, 720, 880, guide, 1, axes);
    const flower = h.group('Six-blade wireframe / three axes', 380, 100, 840, 800);
    for (const angle of [0, 60, -60]) {
      const family = h.group(`Wire ellipse family ${angle} degrees`, 0, 0, 840, 800, {}, flower);
      for (let i = 0; i < 8; i++) {
        const width = 840 - i * 26;
        const height = 112 + i * 17;
        h.frame(`Mesh ellipse ${i + 1}`, 420 - width / 2, 400 - height / 2, width, height, 'transparent', { radius: '50%', rotation: `${angle}deg`, border: `1px solid ${wire}`, opacity: 0.8 - i * 0.035 }, family);
      }
    }
    const survey = h.group('Circle and diamond / detail', 110, 105, 220, 220);
    h.circle('Outer survey circle', 0, 0, 220, 'transparent', { border: `1px solid ${guide}` }, survey);
    h.circle('Inner survey circle', 28, 28, 164, 'transparent', { border: `1px solid ${guide}` }, survey);
    h.frame('Survey diamond', 54, 54, 112, 112, 'transparent', { border: `1px solid ${wire}`, rotation: '45deg' }, survey);
    h.line('Survey horizontal', 0, 110, 220, 110, guide, 1, survey);
    h.line('Survey vertical', 110, 0, 110, 220, guide, 1, survey);
    for (const [name, x, y, color] of [
      ['Left magenta node', 170, 495, '#B75CD9'],
      ['Right yellow node', 1425, 495, '#F4D737'],
      ['Center yellow node', 795, 495, '#F4D737'],
      ['Upper blue node', 795, 310, '#416CDA'],
      ['Lower blue node', 795, 680, '#416CDA'],
    ]) h.circle(name, x, y, 10, color);
    h.text('Upper technical label', 'THE BILLING & PAYMENTS\nPLATFORM FOR MODERN\nCOMPANIES.', 1060, 130, 440, 20, ink, 'IBM Plex Mono', 400, { textAlignment: 'right', lineHeight: '1.2em' });
    h.text('Lower technical label', 'THE FINANCIAL STACK\nFOR THE AI ECONOMY', 1110, 805, 390, 19, ink, 'IBM Plex Mono', 400, { lineHeight: '1.2em' });
    h.text('Lower left label', 'THE INFRASTRUCTURE\nPOWERING AI BUSINESSES', 110, 805, 480, 19, ink, 'IBM Plex Mono', 400, { lineHeight: '1.2em' });
  },
};
