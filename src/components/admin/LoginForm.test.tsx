import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/admin/login",
  });
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    HTMLInputElement: { configurable: true, writable: true, value: dom.window.HTMLInputElement },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
  });
  return {
    container: dom.window.document.querySelector("#root")!,
    dom,
  };
}

function enter(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
}

test("로그인 요청 중에는 진행 상태를 표시하고 성공 후 화면이 바뀔 때까지 중복 제출을 막는다", async () => {
  const loginModule = await import("./LoginForm");
  const AdminLoginPanel = (loginModule as unknown as {
    AdminLoginPanel?: React.ComponentType<{
      authenticate: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      onAuthenticated: () => void;
    }>;
  }).AdminLoginPanel;
  assert.equal(typeof AdminLoginPanel, "function", "테스트 가능한 실제 로그인 패널이 필요하다");

  const environment = installDom();
  const { createRoot } = await import("react-dom/client");
  let root: Root | undefined;
  let resolveLogin!: (result: { ok: true } | { ok: false; error: string }) => void;
  const requestedPasswords: string[] = [];
  let authenticated = 0;
  const authenticate = (password: string) => {
    requestedPasswords.push(password);
    return new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
      resolveLogin = resolve;
    });
  };

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(AdminLoginPanel!, {
      authenticate,
      onAuthenticated: () => { authenticated += 1; },
    }));
  });

  const form = environment.container.querySelector("form")!;
  const input = form.querySelector<HTMLInputElement>('input[name="password"]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  await act(async () => enter(input, "secret"));
  assert.equal(button.disabled, false);

  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-busy"), "true");
  assert.equal(button.querySelector('[role="status"]')?.textContent, "로그인 확인 중");

  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });
  assert.deepEqual(requestedPasswords, ["secret"]);

  await act(async () => resolveLogin({ ok: true }));
  assert.equal(authenticated, 1);
  assert.equal(button.disabled, true, "화면 전환이 끝나기 전에 버튼을 다시 활성화하면 안 된다");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});

test("로그인이 실패하면 버튼을 다시 활성화하고 오류를 알린다", async () => {
  const { AdminLoginPanel } = await import("./LoginForm") as unknown as {
    AdminLoginPanel: React.ComponentType<{
      authenticate: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      onAuthenticated: () => void;
    }>;
  };
  assert.equal(typeof AdminLoginPanel, "function", "테스트 가능한 실제 로그인 패널이 필요하다");
  const environment = installDom();
  const { createRoot } = await import("react-dom/client");
  let root: Root | undefined;

  await act(async () => {
    root = createRoot(environment.container);
    root.render(createElement(AdminLoginPanel, {
      authenticate: async () => ({ ok: false as const, error: "비밀번호가 올바르지 않습니다." }),
      onAuthenticated: () => assert.fail("실패한 로그인은 인증 완료로 처리하면 안 된다"),
    }));
  });

  const form = environment.container.querySelector("form")!;
  const input = form.querySelector<HTMLInputElement>('input[name="password"]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  await act(async () => enter(input, "wrong"));
  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });

  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute("aria-busy"), "false");
  assert.equal(form.querySelector('[role="alert"]')?.textContent, "비밀번호가 올바르지 않습니다.");

  await act(async () => root?.unmount());
  environment.dom.window.close();
});
