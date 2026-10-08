import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";

import { ToastProvider } from "@/components/ui/Toast";

/**
 * 이 사이트는 공개다. 2026-10-08 조사에서 전화번호 6개와 계좌번호 4건이 **초기 HTML 에
 * 평문**으로 들어 있어 `curl | grep` 한 번에 전부 수집되는 것을 확인했다.
 *
 * 계좌·연락처 아코디언은 어차피 탭해야 열리므로, 탭 전에는 내용을 DOM 에 올리지 않는다
 * (`mountOnOpen`). 하객 UX 는 그대로고 초기 HTML 에서 번호가 사라진다.
 *
 * ⚠️ 한계: JS 청크에는 번호가 남는다. 막는 것은 HTML 만 긁는 대량 수집기다
 * (`docs/requirements.md` 의 "받아들인 잔존 위험").
 */

// `wedding` 은 모듈 로드 시 env 를 읽는다. CI 에는 NEXT_PUBLIC_* 이 없어 `withNumber` 가
// 전부 걸러내므로, 값을 먼저 심지 않으면 테스트가 **무의미하게 통과**한다.
// node:test 는 파일별 별도 프로세스라 다른 테스트에 새지 않는다.
const PHONE = "010-9999-8888";
const ACCOUNT = "111-222222-33333";
process.env.NEXT_PUBLIC_PHONE_GROOM = PHONE;
process.env.NEXT_PUBLIC_PHONE_GROOM_FATHER = PHONE;
process.env.NEXT_PUBLIC_PHONE_BRIDE = PHONE;
process.env.NEXT_PUBLIC_ACCOUNT_GROOM = ACCOUNT;
process.env.NEXT_PUBLIC_ACCOUNT_BRIDE = ACCOUNT;

const digits = (value: string) => value.replace(/[^0-9]/g, "");

test("the account numbers are not in the server-rendered markup", async () => {
  const { AccountSection } = await import("./AccountSection");
  const html = renderToStaticMarkup(
    createElement(ToastProvider, null, createElement(AccountSection)),
  );

  assert.doesNotMatch(html, new RegExp(ACCOUNT), "계좌번호가 초기 HTML 에 있습니다");
  assert.doesNotMatch(html, new RegExp(digits(ACCOUNT)), "하이픈 없는 계좌번호가 초기 HTML 에 있습니다");
  // 값이 심어졌는데도 비어 보이는 "무의미한 통과" 를 막는다 — 섹션 자체는 렌더돼야 한다.
  assert.match(html, /신랑측 계좌번호/);
  assert.match(html, /신부측 계좌번호/);
});

test("the phone numbers are not in the server-rendered markup", async () => {
  const { ContactSection } = await import("./ContactSection");
  const html = renderToStaticMarkup(createElement(ContactSection));

  // tel:·sms: 링크와 이름↔번호를 잇는 aria-label 이 모두 사라져야 한다.
  assert.equal(html.match(/href="tel:/g), null, "tel: 링크가 초기 HTML 에 있습니다");
  assert.equal(html.match(/href="sms:/g), null, "sms: 링크가 초기 HTML 에 있습니다");
  assert.doesNotMatch(html, new RegExp(digits(PHONE)));
  assert.match(html, /신랑측/);
  assert.match(html, /신부측/);
});

/** 지연 마운트가 기능을 죽이지 않았는지 — 탭하면 번호가 실제로 나와야 한다. */
test("tapping the accordion reveals the account number", async () => {
  const { AccountSection } = await import("./AccountSection");
  const dom = new JSDOM("<div id='root'></div>", { url: "http://localhost", pretendToBeVisual: true });
  const testGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: testGlobal.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(testGlobal, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const root = createRoot(dom.window.document.querySelector("#root")!);

  try {
    await act(async () => {
      root.render(createElement(ToastProvider, null, createElement(AccountSection)));
    });
    assert.equal(dom.window.document.body.innerHTML.includes(ACCOUNT), false, "열기 전에 보입니다");

    const open = [...dom.window.document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes("신랑측 계좌번호"),
    );
    assert.ok(open, "아코디언 버튼을 찾지 못했습니다");
    await act(async () => {
      open.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });

    assert.equal(
      dom.window.document.body.innerHTML.includes(ACCOUNT),
      true,
      "탭했는데도 계좌번호가 나오지 않습니다 — 지연 마운트가 기능을 깼습니다",
    );
  } finally {
    await act(async () => root.unmount());
    Object.assign(testGlobal, {
      window: previous.window,
      document: previous.document,
      IS_REACT_ACT_ENVIRONMENT: previous.act,
    });
    dom.window.close();
  }
});
