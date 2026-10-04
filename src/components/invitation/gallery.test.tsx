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

const EXPECTED_HIDDEN = [3, 11, 14, 17, 24, 25, 26, 27, 28, 29];

test("the photos hidden from the large-type invitation are the ones that were asked for", () => {
  assert.deepEqual([...wedding.gallery.hiddenInLargeType], EXPECTED_HIDDEN);
});

test("the plain gallery shows every photo and the large-type one drops the hidden numbers", async () => {
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

  assert.equal(all.length, galleryPhotos.length, "기본 갤러리는 모든 사진을 보여야 합니다");
  assert.equal(big.length, galleryPhotos.length - EXPECTED_HIDDEN.length);
  for (const n of EXPECTED_HIDDEN) {
    assert.ok(all.includes(n), `기본 갤러리에 ${n}번이 있어야 합니다`);
    assert.ok(!big.includes(n), `어르신용에서 ${n}번이 빠져야 합니다`);
  }
  // 남은 사진의 순서는 그대로여야 한다.
  assert.deepEqual(big, all.filter((n) => !EXPECTED_HIDDEN.includes(n)));
});

test("the large-type page asks the invitation for the large-type variant", async () => {
  const { readFileSync } = await import("node:fs");
  const big = readFileSync(new URL("../../app/(site)/big/page.tsx", import.meta.url), "utf8");
  assert.match(big, /<Invitation\s+largeType\s*\/>/);
});
