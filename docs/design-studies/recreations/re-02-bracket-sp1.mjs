export default {
  id: 'RE-02',
  name: 'SP-1 / rounded blocks and loader',
  sourceKey: 'GRA-002-03',
  background: '#BEBFC1',
  simplifications: [
    'Source-led SP-1 recreation, not a Monarchic logo; the large glyphs are constructed from editable native blocks.',
    'The faint background now contains two outlined SP-1 wordmark repeats, including brackets, rather than unrelated rounded rectangles. Editable stroked Space Grotesk text substitutes for the source custom outline letterforms.',
    'The source loader is a static eight-dot arrangement; no animation or deployed functionality is implied.',
  ],
  build(h) {
    const bg = '#BEBFC1';
    const white = '#FBFBF7';
    const black = '#111211';
    const ghosts = h.group('Outlined SP-1 / background repeats', 60, 0, 1480, 1000, { overflow: 'clip' });
    for (const [y, suffix] of [[-40, 'top'], [720, 'bottom']]) {
      h.text(`Ghost SP-1 outline / ${suffix}`, '[SP-1]', 25, y, 1430, 370, 'transparent', 'Space Grotesk', 500, { textStrokeColor: '#EEEEEA', textStrokeWidth: 0.65, letterSpacing: '0.025em', lineHeight: '0.95em', opacity: 0.48, textAlignment: 'center' }, ghosts);
    }
    const left = h.group('Left rounded bracket', 100, 285, 175, 420);
    h.frame('Bracket outer', 0, 0, 175, 420, white, { radius: '66px' }, left);
    h.frame('Bracket inner counter', 48, 48, 150, 324, bg, { radius: '30px' }, left);
    h.frame('Bracket opening', 105, 46, 80, 328, bg, {}, left);
    const right = h.group('Right rounded bracket', 1325, 285, 175, 420);
    h.frame('Bracket outer', 0, 0, 175, 420, white, { radius: '66px' }, right);
    h.frame('Bracket inner counter', -23, 48, 150, 324, bg, { radius: '30px' }, right);
    h.frame('Bracket opening', -10, 46, 80, 328, bg, {}, right);
    const s = h.group('S / rounded strokes', 340, 360, 265, 270);
    for (const [name, x, y, w, height] of [
      ['Upper horizontal', 0, 0, 265, 57],
      ['Middle horizontal', 0, 106, 265, 57],
      ['Lower horizontal', 0, 212, 265, 57],
      ['Upper left return', 0, 18, 57, 135],
      ['Lower right return', 208, 122, 57, 129],
    ]) h.frame(name, x, y, w, height, white, { radius: '28px' }, s);
    const p = h.group('P / round counter', 675, 360, 280, 270);
    h.frame('P bowl', 0, 0, 280, 165, white, { radius: '82px' }, p);
    h.frame('P stem', 0, 0, 57, 270, white, {}, p);
    h.frame('P counter', 57, 57, 166, 51, bg, { radius: '25px' }, p);
    h.frame('Hyphen', 1000, 478, 120, 52, white);
    const one = h.group('One / stepped stem', 1165, 360, 108, 270);
    h.frame('One cap', 0, 0, 108, 57, white, {}, one);
    h.frame('One stem', 51, 0, 57, 270, white, {}, one);
    const loader = h.group('Eight-dot loader', 1320, 65, 180, 180);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      h.circle(`Loader dot ${i + 1}`, 80 + Math.cos(a) * 54, 80 + Math.sin(a) * 54, 19, black, {}, loader);
    }
    const operator = h.group('Operator / black blocks', 1330, 520, 125, 100);
    h.circle('Operator head', 38, 0, 48, black, {}, operator);
    h.frame('Left arm', 0, 4, 26, 60, black, { radius: '4px' }, operator);
    h.frame('Right arm', 98, 4, 26, 60, black, { radius: '4px' }, operator);
    h.frame('Operator base', 25, 63, 75, 28, black, { radius: '4px' }, operator);
    h.text('Operational note / top', 'DEPLOY FIRST\nMEASURE OUTPUT\nOPTIMIZE SYSTEMS\nEXPAND FLEET', 100, 82, 470, 25, black, 'IBM Plex Mono', 500, { lineHeight: '1.15em' });
    h.text('Operational note / left', 'DAY SHIFT\nNIGHT SHIFT\nPEAK SEASON SURGE\nSUSTAINED OPERATION', 100, 460, 265, 19, black, 'IBM Plex Mono', 500, { lineHeight: '1.2em' });
    h.text('Facility note', '3PL WAREHOUSE FACILITIES\nHIGH-VOLUME\nPACKAGING CELLS\nLIVE PRODUCTION FLOORS', 100, 805, 590, 22, black, 'IBM Plex Mono', 500, { lineHeight: '1.2em' });
    h.text('Location note', 'NEW YORK\nU.S.A\n—\nACTIVE', 1250, 805, 250, 22, black, 'IBM Plex Mono', 500, { textAlignment: 'right', lineHeight: '1.2em' });
  },
};
