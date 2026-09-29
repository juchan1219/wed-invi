import assert from "node:assert/strict";
import test from "node:test";
import Icon, { contentType, size } from "./icon";

test("반지 이모지를 64×64 PNG favicon으로 생성한다", async () => {
  assert.equal(contentType, "image/png");
  assert.deepEqual(size, { width: 64, height: 64 });

  const response = Icon();
  assert.equal(response.headers.get("content-type"), "image/png");

  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(png.readUInt32BE(16), 64);
  assert.equal(png.readUInt32BE(20), 64);
});
