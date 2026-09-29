"use client";

import { useState } from "react";
import { wedding } from "@/config/wedding";
import { copyText } from "@/lib/clipboard";
import { isKakaoConfigured, shareToKakao } from "@/lib/kakao";
import { useToast } from "@/components/ui/Toast";
import { Reveal } from "@/components/ui/Reveal";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

/**
 * 하객이 청첩장을 다른 사람에게 전달할 때 쓴다.
 *
 * ⚠️ 여기서 공유하는 주소는 항상 기본 URL(`/`)이다.
 * 개인화 URL(/i/<토큰>)을 그대로 넘기면 받은 사람이
 * 남에게 쓴 편지를 보게 되므로 절대 현재 주소를 쓰지 않는다.
 */
export function ShareFooter() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const shareUrl = wedding.site.url;
  const shareTitle = wedding.site.title;
  const shareText = `${formatCeremonyDateShort()} ${formatCeremonyTime()} · ${wedding.venue.name}`;

  async function handleCopy() {
    const ok = await copyText(shareUrl);
    toast(ok ? "청첩장 주소를 복사했습니다" : "복사에 실패했어요");
  }

  async function handleNativeShare() {
    // navigator.share는 사용자 제스처 안에서만 동작한다.
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
    } catch {
      // 사용자가 공유 시트를 닫은 경우 — 알릴 필요 없다.
    }
  }

  async function handleKakao() {
    setBusy(true);
    const ok = await shareToKakao({
      title: shareTitle,
      description: shareText,
      imageUrl: new URL(wedding.site.ogImage, wedding.site.url).toString(),
      url: shareUrl,
    });
    setBusy(false);
    if (!ok) toast("카카오톡 공유를 열지 못했어요");
  }

  return (
    <footer className="px-7 pt-8 pb-16">
      <Reveal className="text-center">
        <div className="mx-auto mb-8 h-px w-16 bg-line" aria-hidden />

        <p className="text-sm text-ink-soft">청첩장을 전달해 주세요</p>

        <div
          aria-label="청첩장 공유"
          className="mt-5 flex flex-wrap justify-center gap-2"
          style={{ flexWrap: "wrap" }}
        >
          {isKakaoConfigured() && (
            <button
              type="button"
              onClick={handleKakao}
              disabled={busy}
              className="rounded-full border border-line px-5 py-2.5 text-xs text-ink-soft transition-colors active:bg-paper-deep disabled:opacity-50"
            >
              카카오톡
            </button>
          )}
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-full border border-line px-5 py-2.5 text-xs text-ink-soft transition-colors active:bg-paper-deep"
          >
            공유하기
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-line px-5 py-2.5 text-xs text-ink-soft transition-colors active:bg-paper-deep"
          >
            링크 복사
          </button>
        </div>

        <p className="mt-12 font-serif text-sm text-ink-faint">
          created by {wedding.groom.name} {wedding.bride.name}
        </p>
      </Reveal>
    </footer>
  );
}
