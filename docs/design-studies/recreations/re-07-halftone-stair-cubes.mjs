export default {
  id: 'RE-07',
  name: 'Five ascending halftone cubes',
  sourceKey: 'GRA-007',
  background: '#EEE6D5',
  simplifications: [
    'Source-led recreation of the viewed five-cube halftone staircase, not an original Monarchic illustration.',
    'Each cube has three native frame faces; the right face uses a staggered eight-by-ten grid of separately editable dots.',
    'The five cubes now touch in a continuous steep staircase, retaining the observed portrait-like silhouette inside the landscape artboard. Paper grain and dense ink speckle remain omitted.',
  ],
  build(h) {
    const paper = '#EEE6D5';
    const ink = '#101713';
    for (let i = 0; i < 5; i++) {
      const cube = h.group(`Cube ${i + 1} / three faces`, 480 + i * 100, 740 - i * 165, 200, 250, { overflow: 'visible' });
      h.frame('Top / dotted perimeter', 42.265, 7.735, 115.47, 100, paper, { rotation: '30deg', skewX: '-30deg', border: `1px dotted ${ink}` }, cube);
      h.frame('Left / solid ink', 0, 86.6, 100, 130, ink, { skewY: '30deg' }, cube);
      const dotted = h.frame('Right / halftone face', 100, 86.6, 100, 130, paper, { skewY: '-30deg', overflow: 'clip' }, cube);
      for (let row = 0; row < 10; row++) {
        for (let column = 0; column < 8; column++) {
          h.circle(`Halftone dot ${row + 1}:${column + 1}`, 4 + column * 12.5 + row % 2 * 3.125, 4 + row * 13, 5.6, ink, {}, dotted);
        }
      }
    }
  },
};
