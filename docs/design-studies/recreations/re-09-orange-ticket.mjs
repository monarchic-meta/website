export default {
  id: 'RE-09',
  name: 'Orange / diagonal website ticket',
  sourceKey: 'GRA-009',
  background: '#ff6328',
  simplifications: [
    'Recreates the source ticket, diagonal placement, website typography, icon row, and barcode as editable native geometry.',
    'Space Grotesk replaces the source typeface; the barcode is a visual study and does not encode data.',
    'Source wording and identity appear only inside the clearly labelled recreation.',
  ],
  build(h) {
    const ink = '#111111';
    h.text('Recreation label', 'RECREATION / GRA-009', 64, 62, 360, 14, ink, 'IBM Plex Mono', 500);
    const sheet = h.group('Tilted source ticket', 370, 365, 860, 270, { rotation: '75deg' });
    h.frame('White ticket stock', 0, 0, 860, 270, '#ffffff', {}, sheet);
    h.frame('Pale arrow gutter', 0, 232, 860, 38, '#e7e7e7', {}, sheet);
    h.text('Source strapline', 'Creative partners in an AI-first world.', 30, 21, 385, 13, ink, 'Space Grotesk', 400, {}, sheet);
    h.text('Source positioning', 'Intentional experiences', 450, 21, 270, 13, ink, 'Space Grotesk', 400, {}, sheet);
    h.text('Edition', '1 of 1', 774, 21, 64, 13, ink, 'Space Grotesk', 400, {}, sheet);
    h.text('Website prefix', 'www', 28, 66, 185, 72, '#737373', 'Space Grotesk', 400, { letterSpacing: '-0.07em' }, sheet);
    h.text('Website', 'pixelorb.studio', 210, 66, 625, 72, ink, 'Space Grotesk', 400, { letterSpacing: '-0.07em' }, sheet);

    const iconY = 153;
    [645, 694, 743, 792].forEach((x, i) => {
      if (i !== 1) h.circle(`Icon ${i + 1} ring`, x, iconY, 32, 'transparent', { border: '1.3px solid #111111' }, sheet);
    });
    h.line('Globe equator', 645, iconY + 16, 677, iconY + 16, ink, 1, sheet);
    h.line('Globe meridian', 661, iconY, 661, iconY + 32, ink, 1, sheet);
    h.frame('Globe inner longitude', 652, iconY + 1, 18, 30, 'transparent', { radius: '50%', border: '1px solid #111111' }, sheet);
    [0, 45, 90, 135].forEach((angle, i) => {
      h.frame(`Asterisk arm ${i}`, 694, iconY + 15, 32, 1.3, ink, { rotation: `${angle}deg` }, sheet);
    });
    h.line('Target horizontal', 739, iconY + 16, 779, iconY + 16, ink, 1, sheet);
    h.line('Target vertical', 759, iconY - 4, 759, iconY + 36, ink, 1, sheet);
    h.line('Arrow diagonal', 800, iconY + 24, 816, iconY + 8, ink, 1.3, sheet);
    h.line('Arrow top', 805, iconY + 8, 816, iconY + 8, ink, 1.3, sheet);
    h.line('Arrow right', 816, iconY + 8, 816, iconY + 19, ink, 1.3, sheet);

    let barX = 642;
    for (let i = 0; i < 64; i += 1) {
      const width = [1, 2, 1, 3, 1, 1, 2, 1][i % 8];
      h.frame(`Barcode bar ${String(i + 1).padStart(2, '0')}`, barX, 196, width, i % 11 === 0 ? 31 : 27, ink, {}, sheet);
      barX += width + (i % 4 === 0 ? 2 : 1);
    }
    for (let i = 0; i < 7; i += 1) {
      const x = 25 + i * 131;
      h.line(`Gutter arrow ${i} shaft`, x, 251, x + 12, 251, ink, 1, sheet);
      h.line(`Gutter arrow ${i} upper`, x + 8, 247, x + 12, 251, ink, 1, sheet);
      h.line(`Gutter arrow ${i} lower`, x + 8, 255, x + 12, 251, ink, 1, sheet);
    }
  },
};
