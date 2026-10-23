export default {
  id: 'RE-13',
  name: 'Voxa / hatched registration frame',
  sourceKey: 'WEB-004',
  background: '#f2f2f0',
  simplifications: [
    'Recreates the source light placement grid, narrow hatched separator bands, registration crosses, generous type inset, and paired CTA blocks.',
    'The lower photographic and application material is reduced to neutral placement rectangles.',
    'The source wording is retained only within the recreation; no new product claims are introduced.',
  ],
  build(h) {
    const rule = '#c8ccc8';
    const ink = '#111511';
    h.text('Recreation label', 'RECREATION / WEB-004', 70, 43, 500, 14, ink, 'IBM Plex Mono', 500);
    const x = 210;
    const width = 1180;
    h.frame('Main placement frame', x, 92, width, 836, 'transparent', { border: '1px solid #c8ccc8' });
    h.line('Navigation baseline', x, 220, x + width, 220, rule, 1);
    h.text('Source nav mark', 'Voxa', 290, 128, 220, 38, ink, 'Space Grotesk', 400, { letterSpacing: '-0.045em' });
    h.text('Source nav items', 'Benefits     Workflows', 610, 143, 500, 20, '#3b403b', 'Space Grotesk', 400);
    const mark = h.group('Source navigation star', 249, 140, 31, 31);
    h.frame('Navigation mark field', 0, 0, 31, 31, ink, { radius: '6px' }, mark);
    [0, 60, 120].forEach((angle, i) => h.frame(`Navigation star arm ${i}`, 5, 15, 21, 1.5, '#f2f2f0', { rotation: `${angle}deg` }, mark));

    const hatch = (name, y, height) => {
      const band = h.group(name, x, y, width, height, { overflow: 'clip' });
      for (let i = -3; i < 62; i += 1) h.line(`${name} diagonal ${i + 3}`, i * 20, 0, i * 20 + height, height, '#cbd0ca', 0.8, band);
      h.line(`${name} top rule`, 0, 0, width, 0, rule, 1, band);
      h.line(`${name} bottom rule`, 0, height, width, height, rule, 1, band);
    };
    hatch('Upper hatch separator', 220, 49);
    hatch('Lower hatch separator', 738, 49);
    h.text('Source hero statement', 'See who is ready\nbefore your competition.', 290, 354, 1020, 72, ink, 'Space Grotesk', 400, { lineHeight: '0.98em', letterSpacing: '-0.065em' });
    h.text('Source hero supporting copy', 'Vektor reads buying signals across your entire market\nto get your team exactly which accounts to work today.', 294, 536, 990, 21, '#51564f', 'Space Grotesk', 400, { lineHeight: '1.25em', letterSpacing: '-0.02em' });
    h.frame('Source primary CTA block', 294, 634, 235, 59, '#101310');
    h.text('Source primary CTA', 'Start For Free', 322, 652, 180, 20, '#ffffff', 'Space Grotesk', 400, { textAlignment: 'center' });
    h.frame('Source secondary CTA block', 552, 634, 263, 59, 'transparent', { border: '1px solid #afb5ae' });
    h.text('Source secondary CTA', 'Talk To A Human', 579, 652, 210, 20, ink, 'Space Grotesk', 400, { textAlignment: 'center' });

    const media = h.group('Lower source media placement only', 210, 787, 1180, 141, { overflow: 'clip' });
    h.frame('Neutralized photographic placement', 0, 0, 1180, 141, '#d8ddd0', {}, media);
    h.frame('Source app placement crop', 320, 45, 860, 155, '#fafbf9', { border: '1px solid #e7eae5' }, media);
    h.frame('App placement sidebar', 320, 45, 155, 155, '#eef0eb', {}, media);
    [90, 220, 269, 738, 787, 928].forEach((y, i) => {
      [210, 1390].forEach((cx, side) => {
        h.line(`Registration ${i}-${side} horizontal`, cx - 10, y, cx + 10, y, '#424a41', 1);
        h.line(`Registration ${i}-${side} vertical`, cx, y - 10, cx, y + 10, '#424a41', 1);
      });
    });
  },
};
