const letterforms = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
};

export default {
  id: 'RE-11',
  name: 'Burgundy / dot-matrix source report',
  sourceKey: 'GRA-013',
  background: '#692f36',
  simplifications: [
    'Recreates the burgundy/sage palette, large dot-matrix 86% figure, faint grid, and dot-matrix footer.',
    'The 86% figure and associated wording belong to the source poster; they are not a Monarchic metric or an independently verified claim.',
    'The source paper texture and small body copy are omitted. Dot letterforms use a coarser native-circle grid to keep every dot editable.',
  ],
  build(h) {
    const dark = '#39191f';
    const sage = '#b4d5c0';
    for (let x = 70; x <= 1530; x += 146) h.line(`Paper grid vertical ${x}`, x, 0, x, 1000, '#612a32', 1);
    for (let y = 100; y <= 900; y += 100) h.line(`Paper grid horizontal ${y}`, 0, y, 1600, y, '#612a32', 1);
    h.text('Recreation label and source-only qualification', 'RECREATION / GRA-013 · SOURCE FIGURE, NOT A MONARCHIC METRIC', 70, 28, 1460, 13, sage, 'IBM Plex Mono', 500);
    h.text('Source poster title', 'AI vs Craft', 64, 91, 880, 118, sage, 'Space Grotesk', 400, { letterSpacing: '-0.075em' });
    h.text('Source poster question', 'What happens to creative work\nwhen making becomes almost\neffortless?', 70, 246, 720, 29, sage, 'Space Grotesk', 400, { lineHeight: '1.12em', letterSpacing: '-0.03em' });
    h.text('Source report masthead', 'THE CREATIVE\nECONOMY\nBEFORE\n& AFTER AI', 1005, 105, 490, 34, dark, 'IBM Plex Mono', 500, { lineHeight: '1.12em' });

    const digits = {
      '8': ['0111110', '1100011', '1100011', '1100011', '0111110', '1100011', '1100011', '1100011', '0111110'],
      '6': ['0011110', '0110000', '1100000', '1100000', '1111110', '1100011', '1100011', '1100011', '0111110'],
    };
    const plot = (name, rows, x, y, pitch, size) => {
      rows.forEach((row, r) => [...row].forEach((cell, c) => {
        if (cell === '1') h.circle(`${name} dot ${r}-${c}`, x + c * pitch, y + r * pitch, size, dark);
      }));
    };
    plot('Eight', digits['8'], 70, 437, 34, 25);
    plot('Six', digits['6'], 360, 437, 34, 25);
    [[0, 0], [1, 0], [0, 1], [1, 1], [5, 7], [6, 7], [5, 8], [6, 8], [6, 0], [5, 1], [4, 2], [4, 3], [3, 4], [2, 5], [2, 6], [1, 7], [0, 8]].forEach(([col, row], i) => {
      h.circle(`Percent source dot ${i + 1}`, 654 + col * 34, 437 + row * 34, 25, dark);
    });
    h.text('Source figure descriptor', 'OF CREATORS\nUSE CREATIVE GEN AI', 1005, 550, 490, 35, sage, 'Space Grotesk', 400, { lineHeight: '1.12em', letterSpacing: '-0.025em' });
    const phrase = 'THE QUESTION';
    let cursor = 70;
    for (let index = 0; index < phrase.length; index += 1) {
      const character = phrase[index];
      if (character !== ' ') plot(`Footer ${index}-${character}`, letterforms[character], cursor, 837, 13, 5.5);
      cursor += character === ' ' ? 45 : 78;
    }
    h.text('Source footer question', 'If AI makes creation cheaper,\ndoes craft become more\nvaluable?', 1084, 829, 450, 28, sage, 'Space Grotesk', 400, { lineHeight: '1.18em', letterSpacing: '-0.025em' });
  },
};
