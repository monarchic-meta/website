// Reusable native composition preview. SVG output has fallback font metrics and is not Framer saved-state proof.
// Source media stays outside Git. Live-art images must come from the actual factory at each declared slot size.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2), option = k => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; }, root = path.dirname(fileURLToPath(import.meta.url)), dir = path.join(root, 'native'), out = option('--output'), artifactRoot = option('--artifact-root'), liveDir = option('--live-dir') || (artifactRoot ? path.join(artifactRoot, 'authoring/live-slot-renders') : null), rasterizer = option('--rasterizer');
if (!out || !path.isAbsolute(out))
    throw Error('Use --output /absolute/artifact-directory, optionally --artifact-root /absolute/hero-single-pages-2026-10-31 --live-dir /absolute/renders --rasterizer /nix/store/.../bin/magick');
fs.mkdirSync(out, { recursive: true });
const esc = s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'), num = (x, d = 0) => Number.isFinite(parseFloat(x)) ? parseFloat(x) : d;
for (const file of fs.readdirSync(dir).filter(f => /^HERO-\d+\.json$/.test(f) && (!process.env.HERO_IDS || process.env.HERO_IDS.split(',').includes(f.slice(0, -5))))) {
    const r = JSON.parse(fs.readFileSync(dir + '/' + file));
    for (const target of ['desktop', 'phone']) {
        const width = target === 'phone' ? r.phoneWidth : r.width, height = target === 'phone' ? r.phoneHeight : r.height;
        const children = parent => r.parts.filter(p => p.parent === parent).map(p => { const a = { ...p.attrs, ...(target === 'phone' ? p.phone : {}) }; if (a.visible === false)
            return ''; const x = num(a.left), y = num(a.top), w = num(a.width), h = num(a.height, p.type === 'RichTextNode' ? num(a.lineHeight, 20) * String(a.text).split('\n').length : 0), rot = num(a.rotation), bw = num(a.borderWidth || a.borderTop || a.border), stroke = a.borderColor || a.border?.match(/#[a-fA-F0-9]+/)?.[0] || '#444', transform = `translate(${x} ${y})${rot ? ' rotate(' + rot + ' ' + w / 2 + ' ' + h / 2 + ')' : ''}`; let body = ''; if (p.type === 'LiveArtSlot') {
            const livePath = liveDir && path.join(liveDir, r.id + '-' + target + '-component.png');
            if (livePath && fs.existsSync(livePath)) {
                const meta = JSON.parse(fs.readFileSync(path.join(liveDir, r.id + '-' + target + '.json')));
                body = `<image width="${w}" height="${meta.captureHeight}" preserveAspectRatio="none" href="data:image/png;base64,${fs.readFileSync(livePath).toString('base64')}"/>`;
            }
            else
                body = `<rect width="${w}" height="${h}" fill="#777"/><text x="12" y="24" font-size="16" fill="white">LIVE CODE SLOT / NO SUBSTITUTE ART</text>`;
        }
        else if (p.type === 'RichTextNode') {
            const size = num(a.fontSize, 16), line = num(a.lineHeight, 20), anchor = a.textAlign === 'center' ? 'middle' : a.textAlign === 'right' ? 'end' : 'start', tx = anchor === 'middle' ? w / 2 : anchor === 'end' ? w : 0;
            body = `<text x="${tx}" text-anchor="${anchor}" font-family="${esc(a.fontName || 'Arial')},${/Georgia|Times|serif/i.test(a.fontName ?? '') ? 'Times,serif' : /Mono/i.test(a.fontName ?? '') ? 'monospace' : 'sans-serif'}" font-size="${size}" fill="${esc(a.textColor)}" font-weight="${a.fontWeight || 400}" dominant-baseline="hanging">` + String(a.text).split('\n').map((lineText, i) => `<tspan x="${tx}" y="${i * line}">${esc(lineText)}</tspan>`).join('') + '</text>';
        }
        else if (p.bindingKey && r.imageBindings?.some(b => b.key === p.bindingKey)) {
            const image = r.imageBindings.find(b => b.key === p.bindingKey);
            const content = fs.readFileSync(path.isAbsolute(image.path) ? image.path : path.resolve(artifactRoot ?? process.cwd(), image.path)).toString('base64');
            body = `<image width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${content}"/>`;
        }
        else if (a.radius === '50%')
            body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${Math.max(0, w / 2 - bw / 2)}" ry="${Math.max(0, h / 2 - bw / 2)}" fill="${esc(a.fill || 'none')}" stroke="${esc(stroke)}" stroke-width="${bw}"/>`;
        else
            body = `<rect width="${w}" height="${h}" rx="${String(a.radius).endsWith('%') ? num(a.radius) * w / 100 : num(a.radius)}" fill="${esc(a.fill || 'none')}" stroke="${esc(stroke)}" stroke-width="${bw}"${a.borderStyle === 'dotted' ? ' stroke-dasharray="1 3"' : ''}/>`; const clip = a.overflow === 'hidden'; return `<g transform="${transform}" opacity="${a.opacity ?? 1}"${clip ? ' clip-path="url(#clip-' + p.key + ')"' : ''}>${clip ? '<defs><clipPath id="clip-' + p.key + '"><rect width="' + w + '" height="' + h + '"/></clipPath></defs>' : ''}${body}${children(p.key)}</g>`; }).join('');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${r.id} / native opening / ${target}</title><desc>Local nested native preview with fallback fonts; not Framer saved or final typography proof.</desc><rect width="100%" height="100%" fill="${r.background}"/>${children('stage')}</svg>`;
        fs.writeFileSync(out + '/' + r.id + '-' + target + '.svg', svg);
        if (rasterizer)
            execFileSync(rasterizer, ['-background', 'none', out + '/' + r.id + '-' + target + '.svg', out + '/' + r.id + '-' + target + '.png']);
        const opening = target === 'phone' ? r.phoneOpeningHeight : r.openingHeight;
        if (opening && rasterizer)
            execFileSync(rasterizer, [out + '/' + r.id + '-' + target + '.png', '-crop', width + 'x' + opening + '+0+0', '+repage', out + '/' + r.id + '-' + target + '-opening.png']);
        console.log(r.id, target, width, height);
    }
}
