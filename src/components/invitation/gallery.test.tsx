import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import { wedding } from "@/config/wedding";

function installImageModuleHook() {
  const require = createRequire(import.meta.url);
  const loadImage = (module: NodeModule, filename: string) => {
    // 파일 이름을 src 에 남겨 어떤 사진이 렌더됐는지 테스트에서 구분한다.
    module.exports = {
      __esModule: true,
      default: {
        src: `/${filename.split("/").pop()}`,
        width: 1200,
        height: 1200,
        blurDataURL:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      },
    };
  };
  require.extensions[".jpg"] = loadImage;
  require.extensions[".webp"] = loadImage;
}

const EXPECTED_HIDDEN = [4, 12, 15, 18, 25, 26, 27, 28, 29, 30];
const EXPECTED_HIDDEN_DEFAULT = [15];
// 2026-11-04 사용자 요청: 3번에 추가한 사진은 기본·어르신용 모두에 보여야 한다.
const ADDED_THIRD_PHOTO = 3;

test("the photos hidden from the large-type invitation are the ones that were asked for", () => {
  assert.deepEqual([...wedding.gallery.hiddenInLargeType], EXPECTED_HIDDEN);
});

test("the photos hidden from the default invitation are the ones that were asked for", () => {
  assert.deepEqual([...wedding.gallery.hiddenInDefault], EXPECTED_HIDDEN_DEFAULT);
});

test("each gallery drops only its own hidden numbers and keeps the order", async () => {
  installImageModuleHook();
  const { galleryPhotos } = await import("@/assets/photos/manifest");
  const { Gallery } = await import("./Gallery");

  const shown = (largeType: boolean) => {
    const dom = new JSDOM(renderToStaticMarkup(createElement(Gallery, { largeType })));
    // next/image 가 src 를 가공하므로 파일 이름만 뽑아 번호로 되돌린다.
    const numbers = [...dom.window.document.querySelectorAll("img")]
      .map((img) => img.getAttribute("src")?.match(/gallery-(\d+)/)?.[1])
      .filter(Boolean)
      .map(Number);
    dom.window.close();
    return numbers;
  };

  const all = shown(false);
  const big = shown(true);

  const every = galleryPhotos.map((_, i) => i + 1);
  // 남은 사진의 순서는 그대로여야 한다.
  assert.deepEqual(all, every.filter((n) => !EXPECTED_HIDDEN_DEFAULT.includes(n)));
  assert.deepEqual(big, every.filter((n) => !EXPECTED_HIDDEN.includes(n)));

  // 추가한 사진은 양쪽 모두 세 번째 칸에 나온다.
  assert.equal(all[2], ADDED_THIRD_PHOTO);
  assert.equal(big[2], ADDED_THIRD_PHOTO);
  assert.equal(all.length, 29);
  assert.equal(big.length, 20);
});

test("the large-type page asks the invitation for the large-type variant", async () => {
  const { readFileSync } = await import("node:fs");
  const big = readFileSync(new URL("../../app/(site)/big/page.tsx", import.meta.url), "utf8");
  assert.match(big, /<Invitation\s+largeType\s*\/>/);
});
