import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [input, outputDirectory = "public/story/wedding-dance"] = process.argv.slice(2);
if (!input) throw new Error("usage: node scripts/prepare-dance-poses.mjs <2x3-reference.png> [output-directory]");

const metadata = await sharp(input).metadata();
if (!metadata.width || !metadata.height) throw new Error("reference image dimensions are unavailable");

const cellWidth = Math.floor(metadata.width / 3);
const cellHeight = Math.floor(metadata.height / 2);
const cells = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [0, 1],
];

await mkdir(outputDirectory, { recursive: true });

for (const [index, [column, row]] of cells.entries()) {
  const { data, info } = await sharp(input)
    .extract({ left: column * cellWidth, top: row * cellHeight, width: cellWidth, height: cellHeight })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);

  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const source = pixel * 3;
    const target = pixel * 4;
    const red = data[source];
    const green = data[source + 1];
    const blue = data[source + 2];
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    // The supplied sheet has a warm paper texture. Values above 232 belong to
    // that paper; the hand-drawn ink stays well below it.
    const alpha = Math.max(0, Math.min(1, (232 - luminance) / 92));
    rgba[target] = 20;
    rgba[target + 1] = 20;
    rgba[target + 2] = 20;
    rgba[target + 3] = Math.round(alpha * 255);
  }

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 640, height: 640, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(path.join(outputDirectory, `pose-${index + 1}.webp`));
}
