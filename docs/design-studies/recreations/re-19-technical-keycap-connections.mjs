export default {
  id: 'RE-19',
  name: 'Technical UI / keycaps and connections',
  sourceKey: 'CC-012',
  classification: 'source-led-adaptation',
  background: '#080a0c',
  simplifications: [
    'Creative-source adaptation of the technical cards, keycaps, terminal, and connection diagram observed in @icanvardar’s post https://x.com/icanvardar/status/2094171308795826332; the posting account is credited without asserting independent authorship of every source asset.',
    'The card arrangement is recomposed on a plain dark field. Photographic scenery and source application functionality are omitted; all content is a static graphic sample, not a Monarchic product claim.',
    'Native frames, text, and rectilinear connection segments replace the animated-SVG presentation and curved paths. IBM Plex Mono and Space Grotesk replace source fonts.',
    'Static study only: source motion, animated connections, terminal behavior, and interactions are not reproduced. No imported SVG, bitmap, or code component is used.',
  ],
  build(h) {
    const ink = '#dfe3e8';
    const muted = '#7b838e';
    const edge = '#30353e';
    const purple = '#9b97e8';
    h.text('Source adaptation label', 'CREATIVE-SOURCE ADAPTATION / CC-012', 72, 62, 1050, 14, ink, 'IBM Plex Mono', 500);
    h.text('Study title', 'Keycaps / terminal / paths', 72, 106, 1040, 46, ink, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'POST / @icanvardar', 1120, 70, 408, 14, muted, 'IBM Plex Mono', 400, { textAlignment: 'right' });
    const panel = h.group('Recomposed technical interface / static sample', 220, 220, 1160, 616);
    h.frame('Outer interface surface', 0, 0, 1160, 616, '#0d1013', { radius: '28px', border: '1px solid #252b31' }, panel);
    const card = (name, x, y, width, height) => {
      const group = h.group(name, x, y, width, height, {}, panel);
      h.frame(`${name} / surface`, 0, 0, width, height, '#11151a', { radius: '20px', border: `1px solid ${edge}` }, group);
      h.frame(`${name} / inset`, 14, 14, width - 28, height - 28, 'transparent', { radius: '12px', border: '1px solid #1b222a' }, group);
      return group;
    };
    const host = card('Local host / connection card', 28, 28, 538, 336);
    const ticket = card('Single-use / keycap card', 594, 28, 538, 336);
    const terminal = card('Shell / static terminal card', 28, 390, 1104, 198);
    const keycap = (name, x, y, width, label, parent) => {
      const group = h.group(name, x, y, width, 64, {}, parent);
      h.frame(`${name} / lower edge`, 0, 5, width, 59, '#080a0d', { radius: '12px', border: `1px solid ${edge}` }, group);
      h.frame(`${name} / face`, 5, 0, width - 10, 56, '#181d24', { radius: '9px', border: '1px solid #3d4351' }, group);
      h.text(`${name} / editable legend`, label, 14, 18, width - 28, 21, ink, 'IBM Plex Mono', 400, { textAlignment: 'center' }, group);
      return group;
    };
    h.text('Local-host sample annotation', 'LOCAL HOST / STATIC SAMPLE', 42, 34, 440, 12, muted, 'IBM Plex Mono', 400, {}, host);
    keycap('Loopback address keycap', 42, 104, 192, '127.0.0.1', host);
    h.frame('Remote endpoint block', 386, 83, 64, 104, '#161b22', { radius: '12px', border: `1px solid ${edge}` }, host);
    h.line('Connection / address to elbow', 234, 135, 306, 135, purple, 2, host);
    h.line('Connection / upper turn', 306, 135, 306, 109, purple, 2, host);
    h.line('Connection / upper route', 306, 109, 386, 109, purple, 2, host);
    h.line('Connection / lower turn', 306, 135, 306, 160, '#646b77', 2, host);
    h.line('Connection / lower route', 306, 160, 386, 160, '#646b77', 2, host);
    [[234, 135], [306, 135], [386, 109], [386, 160]].forEach(([x, y], index) => h.circle(`Connection terminal ${index + 1}`, x - 4, y - 4, 8, index < 2 ? purple : muted, {}, host));
    h.text('Source local-host card heading', 'Revoke instantly', 42, 240, 450, 22, ink, 'Space Grotesk', 500, {}, host);
    h.text('Diagram qualification', 'RECOMPOSED CONNECTION GEOMETRY', 42, 279, 450, 11, muted, 'IBM Plex Mono', 400, {}, host);

    h.text('Keycap sample annotation', 'KEYCAPS / STATIC SAMPLE', 42, 34, 440, 12, muted, 'IBM Plex Mono', 400, {}, ticket);
    keycap('Caret keycap', 132, 88, 112, '^', ticket);
    keycap('Dollar keycap', 264, 88, 112, '$', ticket);
    h.frame('Sample ticket strip', 132, 176, 244, 40, '#22223b', { radius: '8px', border: '1px solid #454361' }, ticket);
    h.text('Sample ticket annotation', 'STATIC / SINGLE USE', 146, 188, 216, 12, '#c5c2f3', 'IBM Plex Mono', 400, { textAlignment: 'center' }, ticket);
    h.text('Source keycap card heading', 'Single-use tickets', 42, 240, 450, 22, ink, 'Space Grotesk', 500, {}, ticket);
    h.text('Keycap qualification', 'NATIVE FRAMES / EDITABLE LEGENDS', 42, 279, 450, 11, muted, 'IBM Plex Mono', 400, {}, ticket);

    h.frame('Terminal window / backing', 32, 34, 286, 128, '#15161d', { radius: '9px', border: '1px solid #34333e' }, terminal);
    h.frame('Terminal window / title rule', 32, 62, 286, 1, '#2c2d37', {}, terminal);
    ['#d27272', '#d0b26c', '#7fa78c'].forEach((color, index) => h.circle(`Terminal window control ${index + 1}`, 46 + index * 16, 46, 6, color, {}, terminal));
    h.text('Terminal prompt / display only', '> _', 52, 92, 232, 24, '#c4c6cf', 'IBM Plex Mono', 400, {}, terminal);
    h.text('Source terminal card heading', 'Your shell, unchanged', 370, 64, 660, 29, ink, 'Space Grotesk', 500, {}, terminal);
    h.text('Static terminal qualification', 'DISPLAY ONLY / NO TERMINAL OR NETWORK ACTIVITY', 370, 112, 660, 12, muted, 'IBM Plex Mono', 400, {}, terminal);
    h.text('Composition qualification', 'NATIVE CARD / KEYCAP / PATH STUDY · RECOMPOSED FROM SOURCE', 72, 884, 1300, 13, muted, 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, ink, 'IBM Plex Mono', 500);
  },
};
