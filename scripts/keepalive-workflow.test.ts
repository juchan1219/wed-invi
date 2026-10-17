import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

const WORKFLOW_URL = new URL("../.github/workflows/keepalive.yml", import.meta.url);

function extractHealthStepScript(workflow: string): string {
  const marker = "      - name: /api/health 호출\n";
  const stepStart = workflow.indexOf(marker);
  assert.notEqual(stepStart, -1, "keepalive health step should exist");

  const runMarker = "        run: |\n";
  const runStart = workflow.indexOf(runMarker, stepStart);
  assert.notEqual(runStart, -1, "keepalive health step should have a run block");

  const lines = workflow.slice(runStart + runMarker.length).split("\n");
  const scriptLines: string[] = [];

  for (const line of lines) {
    if (line && !line.startsWith("          ")) break;
    scriptLines.push(line.startsWith("          ") ? line.slice(10) : line);
  }

  return scriptLines.join("\n");
}

function runBash(script: string, env: Record<string, string>) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn("bash", ["-e", "-c", script], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("keepalive follows the production-domain redirect and reaches DB health", async () => {
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(request.url ?? "");

    if (request.url === "/api/health") {
      response.writeHead(308, { Location: "/www/api/health" });
      response.end();
      return;
    }

    if (request.url === "/www/api/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"ok":true}');
      return;
    }

    response.writeHead(404);
    response.end();
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const workflow = await readFile(WORKFLOW_URL, "utf8");
    const result = await runBash(extractHealthStepScript(workflow), {
      SITE_URL: `http://127.0.0.1:${address.port}`,
    });

    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /✓ DB가 응답했습니다\./);
    assert.deepEqual(requests, ["/api/health", "/www/api/health"]);
  } finally {
    server.close();
    await once(server, "close");
  }
});

for (const scenario of [
  { name: "a final redirect without Location", status: 302, body: "moved" },
  { name: "an empty 204 response", status: 204, body: "" },
  { name: "a 200 HTML page", status: 200, body: "<html>challenge</html>" },
  { name: "a 200 response with ok false", status: 200, body: '{"ok":false}' },
]) {
  test(`keepalive rejects ${scenario.name}`, async () => {
    const server = createServer((_request, response) => {
      response.writeHead(scenario.status);
      response.end(scenario.body);
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address();
      assert(address && typeof address === "object");
      const workflow = await readFile(WORKFLOW_URL, "utf8");
      const result = await runBash(extractHealthStepScript(workflow), {
        SITE_URL: `http://127.0.0.1:${address.port}`,
      });

      assert.notEqual(result.code, 0, `${scenario.name} must not be reported as healthy`);
      assert.doesNotMatch(result.stdout, /✓ DB가 응답했습니다\./);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
}
