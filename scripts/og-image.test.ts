import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { buildOgImage, calculateFocalCrop } from "./og-image";

test("세로 사진의 지정 초점을 1200×630 크롭 중앙에 배치한다", () => {
  assert.deepEqual(
    calculateFocalCrop({
      sourceWidth: 1280,
      sourceHeight: 1920,
      targetWidth: 1200,
      targetHeight: 630,
      zoom: 1.15,
      focalX: 0.56,
      focalY: 0.67,
    }),
    { left: 160, top: 994, width: 1113, height: 584 },
  );
});

test("가장자리 초점에서도 크롭 영역이 원본 밖으로 나가지 않는다", () => {
  assert.deepEqual(
    calculateFocalCrop({
      sourceWidth: 1000,
      sourceHeight: 1000,
      targetWidth: 1200,
      targetHeight: 630,
      zoom: 1,
      focalX: 0,
      focalY: 0,
    }),
    { left: 0, top: 0, width: 1000, height: 525 },
  );
});

test("지정한 초점을 중앙에 둔 1200×630 JPEG를 생성한다", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "wed-invi-og-"));
  const source = path.join(directory, "source.png");
  const output = path.join(directory, "og.jpg");

  try {
    await sharp({
      create: {
        width: 1280,
        height: 1920,
        channels: 3,
        background: "#008000",
      },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="40" height="40"><rect width="40" height="40" fill="#ff0000"/></svg>',
          ),
          left: 697,
          top: 1267,
        },
      ])
      .png()
      .toFile(source);

    await buildOgImage(source, output);

    const metadata = await sharp(output).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    assert.equal(metadata.format, "jpeg");

    const center = await sharp(output)
      .extract({ left: 600, top: 315, width: 1, height: 1 })
      .raw()
      .toBuffer();
    assert.ok(center[0] > 200 && center[1] < 80 && center[2] < 80);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
