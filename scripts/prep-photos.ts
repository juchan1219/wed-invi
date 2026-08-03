/**
 * 사진 원본 → 웹용 축소본 + 정적 import 매니페스트 + OG 이미지.
 *
 *   photos/            사진 원본을 넣는 곳 (git 제외)
 *   src/assets/photos/ 축소본 + manifest.ts (커밋 대상)
 *   public/og.jpg      소셜 공유 미리보기 이미지 (커밋 대상)
 *
 * 실행:  npm run photos:prep
 *
 * ── 파일 이름 규칙 ────────────────────────────────────────────
 *   hero.jpg          첫 화면 사진.  없으면 갤러리 첫 장으로 대체된다.
 *   gallery-01.jpg    갤러리 사진. 이름순 정렬이라 01, 02, ... 로 번호를 매긴다.
 *   map.jpg           오시는 길 지도 썸네일 (직접 캡처한 지도 이미지).
 *   og.jpg            카카오톡/SNS 미리보기용. 없으면 hero를 1200×630으로 잘라 쓴다.
 *   그 외 이름         무시된다.
 *
 * 여기서 만든 축소본을 next/image에 **정적 import**로 넘기기 때문에
 * width/height/blurDataURL이 빌드 시 자동으로 붙고, AVIF/WebP 변환과
 * srcset은 런타임에 Vercel이 처리한다.
 */
import { readdir, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "photos");
const OUT_DIR = path.join(ROOT, "src", "assets", "photos");
const OG_PATH = path.join(ROOT, "public", "og.jpg");

/** 긴 변 최대 픽셀. 레티나 모바일 전체화면에도 충분하다. */
const MAX_EDGE = 2400;
const JPEG_QUALITY = 82;

/** OG 이미지 규격 — 페이스북/카카오 공통 권장값. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** 사진이 하나도 없을 때 쓰는 배경색 (globals.css의 --color-accent-soft) */
const PLACEHOLDER_COLOR = { r: 201, g: 184, b: 165 };

const INPUT_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic"]);

type Processed = { slug: string; file: string; bytesIn: number; bytesOut: number };

function toIdentifier(slug: string): string {
  return "p_" + slug.replace(/[^a-zA-Z0-9]/g, "_");
}

function isGallery(slug: string): boolean {
  return slug.startsWith("gallery-");
}

async function main() {
  let entries: string[];
  try {
    entries = await readdir(SRC_DIR);
  } catch {
    console.error(`✗ ${SRC_DIR} 폴더가 없습니다. 사진 원본을 넣을 폴더를 만들어 주세요.`);
    process.exit(1);
  }

  const inputs = entries
    .filter((f) => INPUT_EXT.has(path.extname(f).toLowerCase()))
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "en"));

  // 출력 폴더를 비우고 다시 만든다 — 원본에서 지운 사진이 남지 않도록.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(OG_PATH), { recursive: true });

  if (inputs.length === 0) {
    console.warn(
      `! ${SRC_DIR} 에 사진이 없습니다.\n` +
        `  hero.jpg / gallery-01.jpg / map.jpg 형식으로 넣고 다시 실행하세요.`,
    );
  }

  const results: Processed[] = [];
  const mb = (n: number) => (n / 1024 / 1024).toFixed(2);

  for (const input of inputs) {
    const slug = path.basename(input, path.extname(input));
    // og는 매니페스트에 넣지 않는다 — public/og.jpg로만 나간다.
    if (slug === "og") continue;

    const outFile = `${slug}.jpg`;
    const inPath = path.join(SRC_DIR, input);

    const { size: bytesOut } = await sharp(inPath, { failOn: "none" })
      // EXIF Orientation을 실제 픽셀에 반영하고 태그는 지운다.
      // (이걸 안 하면 세로 사진이 브라우저에서 눕는다.)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(path.join(OUT_DIR, outFile));

    const bytesIn = (await sharp(inPath).metadata()).size ?? 0;
    results.push({ slug, file: outFile, bytesIn, bytesOut });
    console.log(`  ${input} → ${outFile}  ${mb(bytesIn)}MB → ${mb(bytesOut)}MB`);
  }

  await writeFile(path.join(OUT_DIR, "manifest.ts"), buildManifest(results), "utf8");
  const ogSource = await buildOgImage(inputs, results);

  // ── 요약 ────────────────────────────────────────────────────
  const totalIn = results.reduce((s, r) => s + r.bytesIn, 0);
  const totalOut = results.reduce((s, r) => s + r.bytesOut, 0);
  console.log(`\n✓ ${results.length}장 처리 (${mb(totalIn)}MB → ${mb(totalOut)}MB)`);

  const gallery = results.filter((r) => isGallery(r.slug));
  const hero = results.find((r) => r.slug === "hero");
  const map = results.find((r) => r.slug === "map");

  console.log(
    `  첫 화면: ${
      hero ? "hero.jpg" : gallery.length ? `${gallery[0].file} (hero.jpg 없음 → 대체)` : "없음"
    }`,
  );
  console.log(`  갤러리: ${gallery.length}장`);
  console.log(`  지도 썸네일: ${map ? "map.jpg" : "없음 (오시는 길 섹션에 안내 문구가 뜹니다)"}`);
  console.log(`  OG 이미지: public/og.jpg ← ${ogSource}`);

  const ignored = results.filter(
    (r) => !isGallery(r.slug) && r.slug !== "hero" && r.slug !== "map",
  );
  if (ignored.length) {
    console.warn(
      `\n! 화면에 노출되지 않는 사진이 ${ignored.length}장 있습니다: ` +
        `${ignored.map((r) => r.file).join(", ")}\n` +
        `  hero / gallery-NN / map / og 중 하나로 이름을 바꾸면 노출됩니다.`,
    );
  }
}

/**
 * OG 이미지. og.jpg가 있으면 그걸 쓰고, 없으면 hero(또는 갤러리 첫 장)를
 * 1200×630으로 중앙 크롭한다. 사진이 아예 없으면 단색 이미지라도 만들어 둔다
 * — 파일이 없으면 카카오톡 미리보기가 깨지기 때문.
 */
async function buildOgImage(inputs: string[], results: Processed[]): Promise<string> {
  const explicit = inputs.find((f) => path.basename(f, path.extname(f)) === "og");
  const fallbackSlug = results.find((r) => r.slug === "hero") ?? results.find((r) => isGallery(r.slug));

  const source = explicit
    ? path.join(SRC_DIR, explicit)
    : fallbackSlug
      ? path.join(OUT_DIR, fallbackSlug.file)
      : null;

  if (!source) {
    await sharp({
      create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: PLACEHOLDER_COLOR },
    })
      .jpeg({ quality: 80 })
      .toFile(OG_PATH);
    return "사진이 없어 단색 이미지로 생성 (photos/og.jpg 를 넣으면 교체됩니다)";
  }

  await sharp(source, { failOn: "none" })
    .rotate()
    .resize({ width: OG_WIDTH, height: OG_HEIGHT, fit: "cover", position: "attention" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OG_PATH);

  return explicit ? "photos/og.jpg" : `${path.basename(source)} (중앙 크롭)`;
}

function buildManifest(results: Processed[]): string {
  const imports = results
    .map((r) => `import ${toIdentifier(r.slug)} from "./${r.file}";`)
    .join("\n");

  const gallery = results.filter((r) => isGallery(r.slug)).map((r) => toIdentifier(r.slug));
  const hero = results.find((r) => r.slug === "hero");
  const map = results.find((r) => r.slug === "map");

  const heroExpr = hero ? toIdentifier(hero.slug) : gallery.length > 0 ? gallery[0] : "null";

  return `// 이 파일은 \`npm run photos:prep\` 이 생성합니다. 직접 고치지 마세요.
// 사진을 추가/교체하려면 photos/ 폴더의 원본을 바꾸고 스크립트를 다시 실행하세요.
import type { StaticImageData } from "next/image";
${imports ? "\n" + imports + "\n" : "\n"}
/** 갤러리 사진 (gallery-*.jpg, 이름순) */
export const galleryPhotos: StaticImageData[] = [${gallery.join(", ")}];

/** 첫 화면 사진. hero.jpg가 없으면 갤러리 첫 장, 그것도 없으면 null. */
export const heroPhoto: StaticImageData | null = ${heroExpr};

/** 오시는 길 지도 썸네일 (map.jpg). 없으면 null. */
export const mapPhoto: StaticImageData | null = ${map ? toIdentifier(map.slug) : "null"};
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
