import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("usage: node scripts/remove-white-background.mjs <input> <output>");
}

const { data, info } = await sharp(input)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rgba = Buffer.alloc(info.width * info.height * 4);
for (let index = 0; index < info.width * info.height; index += 1) {
  const source = index * 3;
  const target = index * 4;
  const red = data[source];
  const green = data[source + 1];
  const blue = data[source + 2];
  const distance = Math.hypot(255 - red, 255 - green, 255 - blue);
  const alpha = Math.max(0, Math.min(1, (distance - 8) / 68));

  rgba[target] = alpha > 0 ? Math.max(0, Math.round((red - 255 * (1 - alpha)) / alpha)) : 0;
  rgba[target + 1] = alpha > 0 ? Math.max(0, Math.round((green - 255 * (1 - alpha)) / alpha)) : 0;
  rgba[target + 2] = alpha > 0 ? Math.max(0, Math.round((blue - 255 * (1 - alpha)) / alpha)) : 0;
  rgba[target + 3] = Math.round(alpha * 255);
}

const image = sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
});

if (path.extname(output).toLowerCase() === ".webp") {
  await image.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(output);
} else {
  await image.png({ compressionLevel: 9 }).toFile(output);
}
