export default {
  id: 'RE-01',
  name: 'Finding signal / staggered editorial band',
  sourceKey: 'GRA-001-03',
  background: '#90979A',
  simplifications: [
    'Source-led recreation of the viewed Finding signal poster, not a Monarchic identity.',
    'The portrait composition is reflowed onto a landscape artboard; the orange band intentionally touches both side edges.',
    'Space Grotesk substitutes for the source typeface; fine paper texture and the smallest copy are omitted.',
  ],
  build(h) {
    const ink = '#151716';
    const rules = h.group('Editorial rules', 40, 40, 1520, 920);
    for (const y of [60, 192, 342, 552, 762, 872]) {
      h.line(`Horizontal rule ${y}`, 0, y, 1520, y, '#727A7C', 1, rules);
    }
    h.text('Source masthead', 'BRS–HDS', 80, 54, 410, 32, ink, 'Space Grotesk', 700);
    h.text('Date slug', 'DESIGN WARMUP\n18 SEP 2026', 1260, 54, 270, 15, ink, 'IBM Plex Mono', 500, { lineHeight: '1.15em' });
    h.text('Finding', 'Finding', 76, 112, 990, 169, ink, 'Space Grotesk', 700, { letterSpacing: '-0.07em', lineHeight: '0.95em' });
    h.text('Market-regime note', '( MARKET )\n( REGIME )', 1020, 156, 230, 17, ink, 'IBM Plex Mono', 400, { lineHeight: '1em' });
    const band = h.group('Signal / orange band', 0, 315, 1600, 118, { overflow: 'visible' });
    h.frame('Full-bleed orange stripe', 0, 0, 1600, 118, '#FF5A00', {}, band);
    h.text('Signal', 'signal', 810, -30, 700, 170, ink, 'Space Grotesk', 700, { letterSpacing: '-0.075em', lineHeight: '1em' }, band);
    h.text('Band index', '(02)', 80, 14, 100, 15, ink, 'IBM Plex Mono', 500, {}, band);
    h.text('Band microcopy', 'Market inference   [active]\nFinancial context  [learning]\nCapital movement   [tracking]', 230, 12, 450, 13, ink, 'IBM Plex Mono', 400, { lineHeight: '1.2em' }, band);
    h.text('Risk-layer note', '( RISK LAYER )', 640, 88, 180, 13, ink, 'IBM Plex Mono', 500, {}, band);
    h.text('Across', 'across', 76, 462, 1020, 174, ink, 'Space Grotesk', 700, { letterSpacing: '-0.07em', lineHeight: '0.95em' });
    h.text('A', 'a', 1390, 462, 160, 174, ink, 'Space Grotesk', 700, { letterSpacing: '-0.07em', lineHeight: '0.95em' });
    h.text('Pipeline note', '( RESEARCH PIPELINE )', 920, 494, 400, 15, ink, 'IBM Plex Mono', 400);
    h.text('Complexity', 'complexity', 76, 659, 1435, 178, ink, 'Space Grotesk', 700, { letterSpacing: '-0.065em', lineHeight: '0.95em' });
    h.text('Research code', '( DSGN–WRMP )', 80, 848, 320, 15, ink, 'IBM Plex Mono', 500);
    h.text('Small contextual copy', 'AI can continuously observe\ncompanies, sectors and capital flows.\nA dynamic picture of opportunity and risk.', 850, 842, 530, 15, ink, 'IBM Plex Mono', 400, { lineHeight: '1.15em' });
    h.text('Year', '2026', 1380, 915, 170, 33, ink, 'Space Grotesk', 700);
  },
};
