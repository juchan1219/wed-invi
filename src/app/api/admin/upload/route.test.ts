import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

test("the upload route rejects files above the function request budget", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previousEnv = env.NODE_ENV;
  const previousToken = env.BLOB_READ_WRITE_TOKEN;
  env.NODE_ENV = "production";
  delete env.BLOB_READ_WRITE_TOKEN;

  try {
    const form = new FormData();
    form.append("file", new File([new Uint8Array(4 * 1024 * 1024 + 1)], "photo.jpg", {
      type: "image/jpeg",
    }));
    form.append("width", "1000");
    form.append("height", "1000");

    const response = await POST(new Request("http://localhost/api/admin/upload", {
      method: "POST",
      body: form,
    }));

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /4MB/);
  } finally {
    if (previousEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousEnv;
    if (previousToken === undefined) delete env.BLOB_READ_WRITE_TOKEN;
    else env.BLOB_READ_WRITE_TOKEN = previousToken;
  }
});
