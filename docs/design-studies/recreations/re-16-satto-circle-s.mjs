export default {
  id: 'RE-16',
  name: 'Satto / fifteen-circle S and spatial copy',
  sourceKey: 'WEB-012',
  background: '#fafafa',
  simplifications: [
    'Recreates the source exact fifteen-circle S arrangement and scattered repeated text clusters.',
    'Available Space Grotesk replaces the source neutral sans. The composition is adapted to a 1600 by 1000 landscape artboard.',
    'Source text is confined to this labelled recreation, and circle occlusion of a few central words is intentional.',
  ],
  build(h) {
    const ink = '#000000';
    const cluster = (name, value, x, y, width = 285) => h.text(name, value, x, y, width, 18, ink, 'Space Grotesk', 400, { lineHeight: '0.98em', letterSpacing: '-0.05em' });
    cluster('Source top cluster left', 'BUILT FOR DESIGNERS, STUDIOS\nAND VISUAL THINKERS', 468, 31, 380);
    cluster('Source top cluster right', 'BUILT FOR DESIGNERS, STUDIOS\nAND VISUAL THINKERS', 1215, 31, 385);
    cluster('Source identity cluster left', 'SATTO STUDIO\nFRAMER MARKETPLACE\nAWWWARDS\nCONTRA', 64, 213);
    cluster('Source identity cluster middle', 'SATTO STUDIO\nFRAMER MARKETPLACE\nAWWWARDS\nCONTRA', 1002, 213);
    cluster('Source template cluster middle', 'PULVINAR\nFRAMER\nTEMPLATE\n13 PAGES', 572, 356, 190);
    cluster('Source template cluster right', 'PULVINAR\nFRAMER\nTEMPLATE\n13 PAGES', 1314, 356, 190);
    cluster('Source design credit left', 'S26\nDESIGN & DEV\nSATTO', 64, 553, 220);
    cluster('Source design credit middle', 'S26\nDESIGN & DEV\nSATTO', 944, 553, 220);
    cluster('Source discipline cluster middle', 'FOR:\nPHOTOGRAPHY\nVIDEO PRODUCTION\nDIGITAL\nPORTFOLIO', 542, 705, 285);
    cluster('Source discipline cluster right', 'FOR:\nPHOTOGRAPHY\nVIDEO PRODUCTION\nDIGITAL\nPORTFOLIO', 1265, 705, 285);
    cluster('Source features cluster left', 'RESPONSIVE\nCMS\nEASY CUSTOMIZATION\nCODE COMPONENT\nSEO', 64, 827, 330);
    cluster('Source features cluster middle', 'RESPONSIVE\nCMS\nEASY CUSTOMIZATION\nCODE COMPONENT\nSEO', 1002, 827, 330);
    const cells = [[1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [1, 3], [2, 3], [3, 3], [4, 4], [0, 5], [4, 5], [1, 6], [2, 6], [3, 6]];
    cells.forEach(([column, row], index) => h.circle(`S circle ${String(index + 1).padStart(2, '0')}`, 562 + column * 96, 194 + row * 96, 86, ink));
    h.text('Recreation label', 'RECREATION / WEB-012', 64, 960, 530, 13, ink, 'IBM Plex Mono', 500);
  },
};
