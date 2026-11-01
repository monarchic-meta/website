#!/usr/bin/env node
// Local authoring preview only. It has no Framer connection or production import.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (key) => {
  const at = args.indexOf(key);
  return at < 0 ? null : args[at + 1];
};
const output = option("--output");
if (!output || !path.isAbsolute(output)) {
  throw new Error("Use --output /absolute/path/outside-the-repository");
}
const imageMapPath = option("--images");
const images = imageMapPath ? JSON.parse(fs.readFileSync(imageMapPath)) : {};
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const number = (value) => Number.parseFloat(value ?? "0");
const records = [];
fs.mkdirSync(output, { recursive: true });

for (const file of fs.readdirSync(path.join(root, "native")).filter((f) => /^OH-\d{3}\.json$/.test(f)).sort()) {
  const recipe = JSON.parse(fs.readFileSync(path.join(root, "native", file)));
  for (const target of ["desktop", "phone"]) {
    const width = target === "phone" ? recipe.phoneWidth : recipe.width;
    const height = target === "phone" ? recipe.phoneHeight : recipe.height;
    const pieces = [];
    let resolvedArt = false;
    for (const part of recipe.parts) {
      const attrs = { ...part.attrs, ...(target === "phone" ? part.phone : {}) };
      if (attrs.visible === false) continue;
      const x = number(attrs.left), y = number(attrs.top), w = number(attrs.width), h = number(attrs.height);
      if (part.type === "LiveArtSlot") {
        const art = images[recipe.id]?.[target];
        if (art) {
          if (!path.isAbsolute(art)) throw new Error("Artwork image paths must be absolute: " + art);
          const data = fs.readFileSync(art).toString("base64");
          pieces.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${data}"/>`);
          resolvedArt = true;
        }
        continue;
      }
      if (part.type === "FrameNode") {
        const rotation = attrs.rotation ? ` transform="rotate(${number(attrs.rotation)} ${x + w / 2} ${y + h / 2})"` : "";
        pieces.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${escape(attrs.fill ?? "none")}"${rotation}/>`);
        continue;
      }
      if (part.type !== "RichTextNode") throw new Error("Unsupported native preview part: " + part.type);
      const size = number(attrs.fontSize), line = number(attrs.lineHeight), weight = attrs.fontWeight ?? 400;
      const baseline = y + size * 0.79 + (line - size) / 2;
      const spacing = attrs.letterSpacing ? ` letter-spacing="${escape(attrs.letterSpacing)}"` : "";
      const rows = String(attrs.text).split("\n");
      const anchor = attrs.textAlign === "center" ? "middle" : attrs.textAlign === "right" ? "end" : "start";
      const textX = anchor === "middle" ? x + w / 2 : anchor === "end" ? x + w : x;
      const rotation = attrs.rotation ? ` transform="rotate(${number(attrs.rotation)} ${x + w / 2} ${y + rows.length * line / 2})"` : "";
      const text = rows.map((value, i) => `<tspan x="${textX}" y="${baseline + i * line}">${escape(value)}</tspan>`).join("");
      pieces.push(`<text fill="${escape(attrs.textColor)}" font-family="${escape(attrs.fontName ?? "Inter")},Arial,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}"${spacing}${rotation}>${text}</text>`);
    }
    const title = `${recipe.id} / ${recipe.title} / ${target}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${escape(title)}</title><desc>Local native-layout preview; ${resolvedArt ? "composited with separately rendered original artwork" : "native-only, live artwork not supplied"}. Fallback font metrics do not prove Framer layout.</desc><rect width="100%" height="100%" fill="${recipe.background}"/>${pieces.join("")}</svg>\n`;
    const name = `${recipe.id}-${target}.svg`;
    fs.writeFileSync(path.join(output, name), svg);
    records.push({ id: recipe.id, mode: recipe.mode, target, title: recipe.title, path: name, width, height, resolvedArt });
  }
}
fs.writeFileSync(path.join(output, "index.json"), JSON.stringify({ scope: "Local composition preview, not Framer save or final font evidence", records }, null, 2) + "\n");
fs.writeFileSync(path.join(output, "index.html"), `<!doctype html><html><meta charset="utf-8"><title>Original hero composition review</title><style>body{margin:24px;background:#bbb;font:16px sans-serif}article{margin:0 0 36px}img{max-width:100%;height:auto;display:block}h2{font:16px monospace}</style>${records.map((r) => `<article><h2>${escape(r.id + " / " + r.title + " / " + r.target + (r.resolvedArt ? " / composite" : " / native only"))}</h2><img src="${r.path}" width="${r.width}" height="${r.height}"></article>`).join("")}</html>\n`);
process.stdout.write(JSON.stringify({ passed: true, previews: records.length, composited: records.filter((r) => r.resolvedArt).length, output }) + "\n");
