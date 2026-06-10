import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets/source/mark.svg");
const OUT = path.join(ROOT, "assets");
const NAVY = "#0A101C";
const DENSITY = 300;

const squareViewBox = 'viewBox="0 28 200 200"';

async function renderSquareMark(size) {
  const svg = (await readFile(SOURCE, "utf8")).replace(
    'viewBox="0 0 200 300"',
    squareViewBox,
  );
  return sharp(Buffer.from(svg), { density: DENSITY })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function renderPortraitMark(width, height) {
  const svg = await readFile(SOURCE, "utf8");
  return sharp(Buffer.from(svg), { density: DENSITY })
    .resize(width, height)
    .png()
    .toBuffer();
}

function onNavy(buffer) {
  return sharp(buffer).flatten({ background: NAVY }).png().toBuffer();
}

const icon = await onNavy(await renderSquareMark(1024));
await writeFile(path.join(OUT, "icon.png"), icon);

const adaptiveMark = await renderSquareMark(680);
const adaptive = await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: adaptiveMark, gravity: "center" }])
  .png()
  .toBuffer();
await writeFile(path.join(OUT, "adaptive-icon.png"), adaptive);

const splash = await renderPortraitMark(600, 900);
await writeFile(path.join(OUT, "splash-icon.png"), splash);

const favicon = await sharp(icon).resize(48, 48).png().toBuffer();
await writeFile(path.join(OUT, "favicon.png"), favicon);

console.log("rendered: icon.png adaptive-icon.png splash-icon.png favicon.png");
