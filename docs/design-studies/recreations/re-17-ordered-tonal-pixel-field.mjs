export default {
  id: 'RE-17',
  name: 'Ordered / pink-yellow tonal pixel field',
  sourceKey: 'CC-003',
  classification: 'source-led-adaptation',
  background: '#efc8c8',
  simplifications: [
    'Creative-source adaptation of the limited pink, yellow, and blue-gray tonal stipple observed in @GaloAndStuff’s post https://x.com/GaloAndStuff/status/2094074141557117090; it does not recreate the game world or its composition.',
    'An independently composed abstract curved field uses actual 4-by-4 Bayer threshold quantization into three colors. The exact algorithm used by the source was not verified.',
    'The field is coarsely sampled; adjacent same-color cells in a row become named editable native bars. No bitmap, SVG, shader source, or code component is used.',
    'Static study only: source motion and interactive behavior are not reproduced.',
  ],
  build(h) {
    const ink = '#424855';
    const pink = '#efc8c8';
    const yellow = '#d6b442';
    const palette = [ink, pink, yellow];
    h.text('Source adaptation label', 'CREATIVE-SOURCE ADAPTATION / CC-003', 72, 62, 1000, 14, ink, 'IBM Plex Mono', 500);
    h.text('Study title', 'Ordered tonal field', 72, 106, 900, 46, ink, 'Space Grotesk', 500, { letterSpacing: '-0.04em' });
    h.text('Posting-account credit', 'SOURCE / @GaloAndStuff', 1080, 70, 448, 14, ink, 'IBM Plex Mono', 400, { textAlignment: 'right' });

    const grid = h.group('Abstract three-color Bayer field / native row runs', 184, 222, 1232, 616);
    const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    const cols = 96;
    const rows = 48;
    const step = 1232 / cols;
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const colorAt = (col, row) => {
      const u = (col + 0.5) / cols * 2 - 1;
      const v = (row + 0.5) / rows * 2 - 1;
      const yellowSweep = clamp((v - 0.04 + 0.55 * Math.sin(1.5 * u + 1.1)) * 1.6);
      const ringDistance = Math.abs(Math.hypot((u + 0.78) / 1.16, (v + 0.43) / 0.56) - 1);
      const darkRibbon = Math.exp(-ringDistance * ringDistance / 0.067) * clamp((0.52 - u) * 1.5);
      const shade = clamp(0.5 + 0.5 * yellowSweep - 0.62 * darkRibbon * (1 - yellowSweep * 0.48));
      const scaled = shade * 2;
      const lower = Math.floor(scaled);
      const threshold = (bayer[row % 4][col % 4] + 0.5) / 16;
      return Math.min(2, lower + (scaled - lower > threshold ? 1 : 0));
    };
    for (let row = 0; row < rows; row += 1) {
      let col = 0;
      while (col < cols) {
        const first = col;
        const index = colorAt(col, row);
        while (col < cols && colorAt(col, row) === index) col += 1;
        if (index === 1) continue;
        h.frame(`Bayer row ${String(row + 1).padStart(2, '0')} / cells ${first + 1}–${col} / ${index === 0 ? 'blue-gray' : 'yellow'}`, first * step, row * step, (col - first) * step, step, palette[index], {}, grid);
      }
    }

    h.text('Tonal quantization note', 'THREE COLORS / ORDERED DENSITY / ABSTRACT SURFACE', 72, 884, 1120, 13, ink, 'IBM Plex Mono', 400);
    h.text('Static limitation', 'STATIC STUDY · MOTION NOT REPRODUCED', 72, 929, 1120, 13, ink, 'IBM Plex Mono', 500);
    [ink, pink, yellow].forEach((color, index) => h.frame(`Editable palette swatch ${index + 1}`, 1340 + index * 58, 894, 42, 42, color, { border: '1px solid #424855' }));
  },
};
