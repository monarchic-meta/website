export default {
  id: 'RE-07',
  name: 'Five ascending halftone cubes',
  sourceKey: 'GRA-007',
  background: '#EEE6D5',
  simplifications: [
    'Source-led recreation of the viewed five-cube halftone staircase, not an original Monarchic illustration.',
    'Each cube has three native frame faces; the right face uses a coarse six-by-eight grid of separately editable dots.',
    'Paper grain and dense ink speckle are omitted; the diagonal is widened for the landscape artboard.',
  ],
  build(h) {
    const paper = '#EEE6D5';
    const ink = '#101713';
    for (let i = 0; i < 5; i++) {
      const cube = h.group(`Cube ${i + 1} / three faces`, 150 + i * 250, 650 - i * 135, 200, 250, { overflow: 'visible' });
      h.frame('Top / dotted perimeter', 42.265, 7.735, 115.47, 100, paper, { rotation: '30deg', skewX: '-30deg', border: `1px dotted ${ink}` }, cube);
      h.frame('Left / solid ink', 0, 86.6, 100, 130, ink, { skewY: '30deg' }, cube);
      const dotted = h.frame('Right / halftone face', 100, 86.6, 100, 130, paper, { skewY: '-30deg', overflow: 'clip' }, cube);
      for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 6; column++) {
          h.circle(`Halftone dot ${row + 1}:${column + 1}`, 6 + column * 16.6, 5 + row * 16.2, 6.8, ink, {}, dotted);
        }
      }
    }
  },
};
