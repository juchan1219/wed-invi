import path from "node:path";
import { buildOgImage } from "./og-image";

const root = process.cwd();
const source = path.join(root, "src", "assets", "photos", "gallery-01.jpg");
const output = path.join(root, "public", "og.jpg");

buildOgImage(source, output)
  .then(() => console.log(`✓ ${path.relative(root, source)} → ${path.relative(root, output)}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
