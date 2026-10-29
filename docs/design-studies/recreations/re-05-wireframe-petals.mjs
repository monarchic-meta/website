export default {
  id: 'RE-05',
  name: 'Wireframe petals / technical crosshair',
  sourceKey: 'GRA-005',
  background: '#202125',
  simplifications: [
    'Source-led recreation of the sparse technical boards and six-blade wireframe motif.',
    'Three intersecting twisted ribbon surfaces replace the earlier concentric ellipses. Their longitudinal wires and transverse rungs are editable native line segments; the six-lobed silhouette is sampled from the observed mesh rather than source vector data.',
    'Perspective, fine wire density, and the full source board sequence remain simplified. All wires, crosshairs, nodes and labels are native frames or text, not a flattened illustration.',
  ],
  build(h) {
    const wire = '#687389';
    const guide = '#454951';
    const ink = '#D7DBD5';
    const axes = h.group('Technical crosshair', 80, 60, 1440, 880);
    h.line('Horizontal axis', 0, 440, 1440, 440, guide, 1, axes);
    h.line('Vertical axis', 720, 0, 720, 880, guide, 1, axes);
    const flower = h.group('Six-blade wireframe / three twisted ribbons', 380, 100, 840, 800);
    for (const angle of [0, 60, -60]) {
      const family = h.group(`Twisted mesh ribbon ${angle} degrees`, 0, 0, 840, 800, { opacity: 0.82 }, flower);
      const rotation = angle * Math.PI / 180;
      const project = (u, v) => {
        const x = u * 350;
        const halfWidth = 12 + 61 * Math.pow(1 - u * u, 0.7);
        const y = 37 * Math.sin(u * Math.PI) + v * halfWidth * Math.cos(u * 2.15);
        const depth = v * halfWidth * Math.sin(u * 2.15);
        return [420 + x * Math.cos(rotation) - y * Math.sin(rotation) + depth * 0.18,
          400 + x * Math.sin(rotation) + y * Math.cos(rotation) + depth * 0.25];
      };
      for (let wireIndex = 0; wireIndex < 6; wireIndex++) {
        const v = wireIndex / 5 * 2 - 1;
        for (let segment = 0; segment < 14; segment++) {
          const a = project(segment / 14 * 2 - 1, v);
          const b = project((segment + 1) / 14 * 2 - 1, v);
          h.line(`Longitudinal wire ${wireIndex + 1} / segment ${segment + 1}`, ...a, ...b, wire, 1, family);
        }
      }
      for (let rung = 0; rung < 15; rung++) {
        const u = rung / 14 * 2 - 1;
        h.line(`Transverse mesh rung ${rung + 1}`, ...project(u, -1), ...project(u, 1), wire, 1, family);
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
