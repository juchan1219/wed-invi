import assert from "node:assert/strict";
import test from "node:test";
import { resizeImage } from "./resize-image";

function withImageBrowser(
  sourceWidth: number,
  sourceHeight: number,
  convertedBytes: number,
  run: (canvas: { width: number; height: number; quality: number | undefined }) => Promise<void>,
) {
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const canvas = {
    width: 0,
    height: 0,
    quality: undefined as number | undefined,
    getContext: () => ({ drawImage: () => {} }),
    toBlob(callback: (blob: Blob) => void, _type: string, quality?: number) {
      canvas.quality = quality;
      callback(new Blob([new Uint8Array(convertedBytes)], { type: "image/jpeg" }));
    },
  };

  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({ width: sourceWidth, height: sourceHeight, close: () => {} }),
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => canvas },
  });

  return run(canvas).finally(() => {
    if (originalBitmap) Object.defineProperty(globalThis, "createImageBitmap", originalBitmap);
    else Reflect.deleteProperty(globalThis, "createImageBitmap");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
}

test("a large JPEG within the pixel bounds is compressed before upload", async () => {
  await withImageBrowser(1000, 1000, 300_000, async () => {
    const original = new File([new Uint8Array(5 * 1024 * 1024)], "photo.jpg", {
      type: "image/jpeg",
    });

    const result = await resizeImage(original);

    assert.notEqual(result.file, original);
    assert.equal(result.file.size, 300_000);
    assert.deepEqual([result.width, result.height], [1000, 1000]);
  });
});

test("a landscape photo is sized for the letter instead of phone-camera resolution", async () => {
  await withImageBrowser(4000, 3000, 200_000, async (canvas) => {
    const original = new File([new Uint8Array(100_000)], "photo.jpg", {
      type: "image/jpeg",
    });

    const result = await resizeImage(original);

    assert.deepEqual([result.width, result.height], [1280, 960]);
    assert.deepEqual([canvas.width, canvas.height], [1280, 960]);
    assert.equal(canvas.quality, 0.85);
  });
});

test("a small WebP is kept when JPEG conversion would make it larger", async () => {
  await withImageBrowser(900, 700, 100_000, async () => {
    const original = new File([new Uint8Array(50_000)], "photo.webp", {
      type: "image/webp",
    });

    const result = await resizeImage(original);

    assert.equal(result.file, original);
    assert.deepEqual([result.width, result.height], [900, 700]);
  });
});

test("a converted image over the upload budget fails before network transfer", async () => {
  await withImageBrowser(4000, 3000, 4 * 1024 * 1024 + 1, async () => {
    const original = new File([new Uint8Array(100_000)], "photo.jpg", {
      type: "image/jpeg",
    });

    await assert.rejects(resizeImage(original), /4MB/);
  });
});
