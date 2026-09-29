import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminCredentialFields } from "./AdminCredentialFields";

test("관리자 로그인 자격 증명을 비밀번호 관리자가 인식할 수 있게 렌더링한다", () => {
  const html = renderToStaticMarkup(
    <form>
      <AdminCredentialFields password="" onPasswordChange={() => {}} />
    </form>,
  );
  const document = new JSDOM(html).window.document;

  const username = document.querySelector<HTMLInputElement>(
    'input[name="username"]',
  );
  assert.ok(username);
  assert.equal(username.autocomplete, "username");
  assert.equal(username.value, "admin");
  assert.equal(username.readOnly, true);

  const password = document.querySelector<HTMLInputElement>(
    'input[name="password"]',
  );
  assert.ok(password);
  assert.equal(password.type, "password");
  assert.equal(password.autocomplete, "current-password");
});
