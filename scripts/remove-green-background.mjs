import sharp from "sharp";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("usage: node scripts/remove-green-background.mjs <input> <output>");
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
  const distance = Math.hypot(red, 255 - green, blue);
  const alpha = Math.max(0, Math.min(1, (distance - 50) / 100));

  if (alpha > 0.02 && alpha < 1) {
    rgba[target] = Math.min(255, Math.round(red / alpha));
    rgba[target + 1] = Math.max(0, Math.min(255, Math.round((green - (1 - alpha) * 255) / alpha)));
    rgba[target + 2] = Math.min(255, Math.round(blue / alpha));
  } else {
    rgba[target] = red;
    rgba[target + 1] = green;
    rgba[target + 2] = blue;
  }
  rgba[target + 3] = Math.round(alpha * 255);
}

await sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png({ compressionLevel: 9 }).toFile(output);
