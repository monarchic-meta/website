// Manual authoring source for the Framer studies; this is not imported by the site.
export function compileRecipe(recipe) {
  const layers = [];
  let sequence = 0;
  const px = (value) => `${value}px`;
  function add(type, name, x, y, width, height, extra, parent = 'art') {
    for (const [key, value] of Object.entries({ x, y, width })) {
      if (!Number.isFinite(value)) throw new Error(`${recipe.id}: invalid ${key} in ${name}`);
    }
    if (width <= 0 || (height !== 'auto' && (!Number.isFinite(height) || height <= 0))) {
      throw new Error(`${recipe.id}: invalid dimensions in ${name}`);
    }
    const id = `${recipe.id.toLowerCase()}-part-${String(++sequence).padStart(4, '0')}`;
    layers.push({
      id, type, parent,
      attributes: {
        name, position: 'absolute', left: px(x), top: px(y), width: px(width),
        height: height === 'auto' ? height : px(height), ...extra,
      },
    });
    return id;
  }
  const h = {
    frame(name, x, y, width, height, fill, extra = {}, parent) {
      return add('FrameNode', name, x, y, width, height, { fill, ...extra }, parent);
    },
    group(name, x, y, width, height, extra = {}, parent) {
      const id = h.frame(name, x, y, width, height, null, { overflow: 'visible', ...extra }, parent);
      layers.at(-1).isGroup = true;
      return id;
    },
    circle(name, x, y, size, fill, extra = {}, parent) {
      return h.frame(name, x, y, size, size, fill, { radius: '50%', ...extra }, parent);
    },
    text(name, value, x, y, width, size, color, font = 'Space Grotesk', weight = 400, extra = {}, parent) {
      const id = add('RichTextNode', name, x, y, width, 'auto', {
        text: value, tag: 'p', fontName: font, fontWeight: weight, fontSize: px(size),
        lineHeight: '1em', textColor: color, ...extra,
      }, parent);
      if (value.includes('\n')) {
        const layer = layers.at(-1);
        layer.textLines = value.split('\n');
        layer.textRunAttributes = {};
        for (const key of ['fontName', 'fontWeight', 'fontSize', 'textColor', 'letterSpacing']) {
          if (Object.hasOwn(layer.attributes, key)) {
            layer.textRunAttributes[key] = layer.attributes[key];
            delete layer.attributes[key];
          }
        }
        delete layer.attributes.text;
      }
      return id;
    },
    line(name, x1, y1, x2, y2, color, thickness = 1, parent) {
      const width = Math.hypot(x2 - x1, y2 - y1);
      if (!width) throw new Error(`${recipe.id}: zero-length line in ${name}`);
      return h.frame(name, (x1 + x2 - width) / 2, (y1 + y2 - thickness) / 2,
        width, thickness, color, { rotation: `${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg` }, parent);
    },
  };
  recipe.build(h);
  const ids = new Map(layers.map((layer) => [layer.id, layer]));
  for (const layer of layers) {
    if (layer.parent !== 'art' && !ids.has(layer.parent)) throw new Error(`${recipe.id}: missing parent`);
    if (layer.type === 'RichTextNode' && layer.parent !== 'art') {
      const container = ids.get(layer.parent);
      if (container.type !== 'FrameNode') throw new Error(`${recipe.id}: text parent must be a frame`);
      if (container.attributes.fill || container.attributes.border) {
        container.attributes.padding ??= '16px';
        container.attributes.layout = 'stack';
        container.attributes.stackDirection = 'vertical';
      }
    }
  }
  for (const layer of layers) {
    if (layer.type === 'FrameNode' && layer.attributes.padding !== undefined) {
      layer.attributes.layout = 'stack';
      layer.attributes.stackDirection = 'vertical';
    }
  }
  return {
    id: recipe.id, name: recipe.name, sourceKey: recipe.sourceKey,
    classification: recipe.classification ?? 'source-led-recreation', width: 1600, height: 1000,
    background: recipe.background, simplifications: recipe.simplifications,
    layers,
  };
}
