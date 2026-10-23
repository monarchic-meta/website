export default {
  id: 'RE-04',
  name: 'Colored edge tiles / pane of glass',
  sourceKey: 'GRA-004',
  background: '#141414',
  simplifications: [
    'Source-led recreation of the viewed motion-study poster frame, not a Monarchic landing page.',
    'Colored tiles and edge rails are individual native layers; motion is represented as a static frame.',
    'The portrait perimeter rhythm is widened to fit the landscape artboard.',
  ],
  build(h) {
    const white = '#FAFAF5';
    const colors = { orange: '#FF5A00', yellow: '#FFDB00', cyan: '#26BEEE', pink: '#F7B0F8' };
    function edgeFamily(name, x, y, mirror = false) {
      const group = h.group(name, x, y, 450, 380);
      const rx = (value, width = 0) => mirror ? 450 - value - width : value;
      h.frame('Outer cyan rail', rx(80, 9), 0, 9, 92, colors.cyan, { radius: '5px' }, group);
      h.frame('Outer tile', rx(0, 88), 94, 88, 98, mirror ? colors.pink : colors.orange, { radius: '3px' }, group);
      h.frame('Upper relay', rx(188, 9), 94, 9, 98, mirror ? colors.pink : colors.orange, { radius: '5px' }, group);
      h.frame('Yellow tile', rx(88, 110), 194, 110, 100, colors.yellow, { radius: '3px' }, group);
      h.frame('Inner yellow rail', rx(304, 9), 194, 9, 100, colors.yellow, { radius: '5px' }, group);
      h.frame('Orange lower rail', rx(88, 9), 296, 9, 84, colors.orange, { radius: '5px' }, group);
      return group;
    }
    edgeFamily('Top left tile family', 40, 40);
    edgeFamily('Top right tile family', 1110, 40, true);
    edgeFamily('Bottom left tile family', 40, 580);
    edgeFamily('Bottom right tile family', 1110, 580, true);
    h.text('Source statement', 'Your first, last,\nor everything\npane of glass.', 350, 275, 900, 82, white, 'Space Grotesk', 400, { textAlignment: 'center', letterSpacing: '-0.045em', lineHeight: '1.08em' });
    const label = h.group('Source callout / static', 603, 610, 394, 69);
    h.frame('Paper callout', 0, 0, 394, 69, white, {}, label);
    h.text('Callout type', 'LET’S GET STARTED!', 12, 15, 370, 27, '#141414', 'IBM Plex Mono', 600, { textAlignment: 'center' }, label);
  },
};
