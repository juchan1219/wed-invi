import sharp from "sharp";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("usage: node scripts/convert-story-image.mjs <input> <output>");
}

await sharp(input)
  .rotate()
  .resize({ width: 2400, withoutEnlargement: true })
  .webp({ quality: 88, effort: 6 })
  .toFile(output);
