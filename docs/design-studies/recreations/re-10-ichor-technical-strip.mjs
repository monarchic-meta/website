export default {
  id: 'RE-10',
  name: 'ICHOR / technical material strip',
  sourceKey: 'GRA-010',
  background: '#e7e7e4',
  simplifications: [
    'Recreates source registration crosses, lime accent, bent bar, technical text strip, and cropped vertical ICHOR lettering.',
    'The folded fabric is deliberately reduced to a plain field; no raster texture or blur is used.',
    'The source corner-triangle symbol is approximated by editable clipped squares, and available fonts replace the source wordmark.',
  ],
  build(h) {
    const ink = '#080909';
    const cross = (name, x, y) => {
      h.line(`${name} horizontal`, x - 17, y, x + 17, y, ink, 1.2);
      h.line(`${name} vertical`, x, y - 17, x, y + 17, ink, 1.2);
      h.line(`${name} left notch`, x - 17, y - 5, x - 8, y - 5, ink, 1.2);
    };
    [[158, 182], [158, 653], [1290, 182]].forEach(([x, y], i) => cross(`Registration cross ${i + 1}`, x, y));
    h.text('Recreation label', 'RECREATION / GRA-010', 158, 84, 430, 14, ink, 'IBM Plex Mono', 500);
    h.text('Source wordmark', 'ICHOR', 158, 275, 300, 57, ink, 'Space Grotesk', 700, { letterSpacing: '-0.07em' });
    h.text('Industrial source copy', 'INDUSTRIAL\nCHEMICAL\nHOLDINGS AND\nOFFSHORE\nREFINEMENT', 158, 343, 205, 14, ink, 'IBM Plex Mono', 400, { lineHeight: '1.05em' });
    h.text('Consortium source copy', 'DAEDELUS\nCONSORTIUM', 340, 343, 170, 14, ink, 'IBM Plex Mono', 400, { lineHeight: '1.05em' });
    h.text('Secondary source mark', 'ICHOR', 300, 394, 170, 43, ink, 'Space Grotesk', 700, { letterSpacing: '-0.06em' });
    h.text('Membership copy', 'MEMBER\nCORPORATION', 158, 512, 240, 14, ink, 'IBM Plex Mono', 400, { lineHeight: '1.1em' });

    const accent = h.group('Lime material marker', 474, 288, 37, 37, { overflow: 'clip' });
    h.frame('Lime square', 0, 0, 37, 37, '#3aff00', {}, accent);
    h.frame('Yellow diagonal half', 11, -17, 54, 54, '#fff400', { rotation: '45deg' }, accent);

    h.frame('Upper open technical bar', 536, 288, 191, 39, 'transparent', { border: '1.7px solid #080909', skewX: '-40deg' });
    h.frame('Lower open technical bar', 695, 398, 178, 39, 'transparent', { border: '1.7px solid #080909', skewX: '-40deg' });
    const bar = h.group('Bent solid transfer bar', 535, 286, 340, 152);
    h.frame('Bent bar lower run', 0, 108, 105, 43, ink, {}, bar);
    h.frame('Bent bar diagonal', 74, 58, 173, 43, ink, { rotation: '-45deg' }, bar);
    h.frame('Bent bar upper run', 201, 0, 139, 43, ink, {}, bar);

    h.text('Technical source annotation', 'FUNCTION: FLUID\nTRANSFER UNIT\nAG#: 0x038\nFLUID TYPE:\nCLASS: III\nBIOHAZARD FLUID', 902, 286, 245, 16, ink, 'IBM Plex Mono', 500, { lineHeight: '1.12em' });
    const mark = h.group('Source modular corner mark', 1158, 286, 152, 152, { overflow: 'clip' });
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const cell = h.group(`Corner-mark cell ${row}-${col}`, col * 38, row * 38, 38, 38, { overflow: 'clip' }, mark);
        h.frame(`Corner-mark diagonal ${row}-${col}`, -27, -27, 54, 54, ink, { rotation: '45deg' }, cell);
      }
    }

    const vertical = h.group('Intentional right-edge source type crop', 1350, 220, 250, 730, { overflow: 'clip' });
    h.text('Vertical ICHOR', 'ICHOR', -304, 250, 880, 228, ink, 'Space Grotesk', 600, { rotation: '-90deg', letterSpacing: '-0.06em' }, vertical);
    h.line('Lower specification rule left', 158, 860, 680, 860, ink, 1.2);
    const zig = [[680, 860], [680, 844], [711, 877], [711, 844], [742, 877], [742, 844], [773, 877], [773, 844], [804, 877], [804, 860]];
    for (let i = 1; i < zig.length; i += 1) h.line(`Lower zigzag ${i}`, ...zig[i - 1], ...zig[i], ink, 1.2);
    h.line('Lower specification rule right', 804, 860, 1290, 860, ink, 1.2);
    h.line('Lower rule terminal', 1290, 844, 1290, 877, ink, 1.2);
    h.text('Protection source annotation', 'LEVEL 5A\nPROTECTION', 1175, 791, 130, 12, ink, 'IBM Plex Mono', 500, { textAlignment: 'right', lineHeight: '1.1em' });
  },
};
