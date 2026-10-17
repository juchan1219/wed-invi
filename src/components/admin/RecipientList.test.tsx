import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { AuthorProvider } from "./AuthorChip";
import { RecipientList, type SerializedRecipient } from "./RecipientList";
import { ToastProvider } from "@/components/ui/Toast";

test("작성된 편지는 열기, 아직 없는 편지는 쓰기 링크로 안내한다", () => {
  const recipient: SerializedRecipient = {
    token: "sample-token",
    name: "김하객",
    phoneLast4: "1234",
    viewCount: 0,
    firstViewedAt: null,
    updatedAt: "2026-10-18T00:00:00.000Z",
    authors: ["yechan"],
  };
  const html = renderToStaticMarkup(
    createElement(ToastProvider, null,
      createElement(AuthorProvider, null, createElement(RecipientList, { recipients: [recipient] })),
    ),
  );
  const document = new JSDOM(html).window.document;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/admin/letters/sample-token"]')];

  assert.equal(links.length, 2);
  assert.match(links[0].textContent ?? "", /예찬 편지 열기/);
  assert.match(links[1].textContent ?? "", /주은 편지 쓰기/);
  assert.equal(links[0].getAttribute("href"), "/admin/letters/sample-token?author=yechan");
  assert.equal(links[1].getAttribute("href"), "/admin/letters/sample-token?author=jueun");
});
