import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

function readM4aDurationSeconds(buffer: Buffer): number {
  const marker = buffer.indexOf(Buffer.from("mvhd"));
  assert.notEqual(marker, -1, "M4A에 mvhd 메타데이터가 있어야 한다");
  const version = buffer[marker + 4];
  if (version === 1) {
    const timescale = buffer.readUInt32BE(marker + 24);
    const duration = buffer.readBigUInt64BE(marker + 28);
    return Number(duration) / timescale;
  }
  const timescale = buffer.readUInt32BE(marker + 16);
  const duration = buffer.readUInt32BE(marker + 20);
  return duration / timescale;
}

test("배경음악은 49초 앞부분이 제거된 모바일용 M4A다", async () => {
  const file = path.join(process.cwd(), "public", "audio", "merry-go-round-49s-128k-v1.m4a");
  const [buffer, metadata] = await Promise.all([readFile(file), stat(file)]);
  assert.equal(buffer.subarray(4, 8).toString("ascii"), "ftyp");
  assert.ok(metadata.size < 5 * 1024 * 1024, `음원은 5MB 미만이어야 한다: ${metadata.size} bytes`);
  const duration = readM4aDurationSeconds(buffer);
  assert.ok(duration >= 261 && duration <= 263, `49초 크롭 후 길이는 약 262초여야 한다: ${duration}`);
});
