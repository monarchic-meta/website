export default {
  id: 'RE-15',
  name: 'Orange / linked raster isometric cubes',
  sourceKey: 'WEB-007',
  background: '#ffffff',
  simplifications: [
    'Recreates the source three-cube diagonal arrangement, orange/yellow raster slices, faint square grid, connectors, and small coordinate tags.',
    'Every face is built from editable vertical Frame strips; no shader, image, SVG, or code component is embedded.',
    'The original fine raster is coarsened to a seven-pixel pitch, and connector curves are simplified to straight segments.',
  ],
  build(h) {
    h.text('Recreation label', 'RECREATION / WEB-007', 66, 49, 510, 14, '#303633', 'IBM Plex Mono', 500);
    for (let x = 220; x <= 1510; x += 100) h.line(`Source grid vertical ${x}`, x, 108, x, 930, '#edf0eb', 1);
    for (let y = 130; y <= 930; y += 100) h.line(`Source grid horizontal ${y}`, 180, y, 1510, y, '#edf0eb', 1);
    const orange = '#f69c17';
    const connector = [[225, 896], [410, 782], [575, 687], [620, 627], [760, 627], [760, 458], [852, 458], [1080, 317], [1080, 225], [1340, 225]];
    for (let i = 1; i < connector.length; i += 1) h.line(`Orange source connector ${i}`, ...connector[i - 1], ...connector[i], orange, 1.5);

    const cube = (name, cx, cy, radius, phase) => {
      let index = 0;
      for (let x = -radius; x <= radius; x += 7) {
        const distance = Math.abs(x);
        const topY = -radius * 0.6 + distance * 0.6;
        const joinY = radius * 0.6 - distance * 0.6;
        const bottomY = radius * 1.8 - distance * 0.6;
        const stripe = index % 7;
        const topColor = stripe === phase ? '#ffcb47' : '#f89916';
        const sideColor = x < 0 ? (stripe % 3 === 0 ? '#ff8c19' : '#f66010') : (stripe % 3 === 0 ? '#f17911' : '#e64b0a');
        if (joinY - topY > 0.5) h.frame(`${name} top raster ${index}`, cx + x, cy + topY, 3.8, joinY - topY, topColor);
        h.frame(`${name} side raster ${index}`, cx + x, cy + joinY, 3.8, bottomY - joinY, sideColor);
        index += 1;
      }
    };
    cube('Lower cube', 580, 603, 111, 1);
    cube('Middle cube', 850, 383, 126, 3);
    cube('Upper cube', 1110, 165, 98, 4);
    [[500, 590, '210, 301'], [780, 369, '294, 210']].forEach(([x, y, value], i) => {
      h.frame(`Source coordinate tag ${i} field`, x, y, 113, 23, '#f5a318');
      h.text(`Source coordinate tag ${i} label`, value, x + 7, y + 4, 100, 12, '#ffffff', 'IBM Plex Mono', 400);
    });
    for (let i = 0; i < 26; i += 1) {
      const x = 320 + ((i * 197) % 1050);
      const y = 130 + ((i * 127) % 725);
      h.frame(`Outlying raster source pixel ${i + 1}`, x, y, 2.5, 4 + (i % 4) * 2, i % 3 === 0 ? '#f1670d' : '#f8c52c', { opacity: i % 3 === 0 ? 0.85 : 0.45 });
    }
  },
};
