import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("usage: node scripts/remove-checker-background.mjs <input> <output>");
}

const { data, info } = await sharp(input)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
const connected = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function isChecker(index) {
  const offset = index * 3;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  return Math.min(red, green, blue) >= 232 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 7;
}

function enqueue(index) {
  if (connected[index] || !isChecker(index)) return;
  connected[index] = 1;
  queue[tail] = index;
  tail += 1;
}

for (let x = 0; x < info.width; x += 1) {
  enqueue(x);
  enqueue((info.height - 1) * info.width + x);
}
for (let y = 0; y < info.height; y += 1) {
  enqueue(y * info.width);
  enqueue(y * info.width + info.width - 1);
}

while (head < tail) {
  const index = queue[head];
  head += 1;
  const x = index % info.width;
  if (x > 0) enqueue(index - 1);
  if (x + 1 < info.width) enqueue(index + 1);
  if (index >= info.width) enqueue(index - info.width);
  if (index + info.width < pixelCount) enqueue(index + info.width);
}

const rgba = Buffer.alloc(pixelCount * 4);
for (let index = 0; index < pixelCount; index += 1) {
  const source = index * 3;
  const target = index * 4;
  rgba[target] = data[source];
  rgba[target + 1] = data[source + 1];
  rgba[target + 2] = data[source + 2];
  rgba[target + 3] = connected[index] ? 0 : 255;
}

const image = sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
});

if (path.extname(output).toLowerCase() === ".webp") {
  await image.webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(output);
} else {
  await image.png({ compressionLevel: 9 }).toFile(output);
}
