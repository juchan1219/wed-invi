"use client";

import { useState } from "react";
import { wedding } from "@/config/wedding";
import { copyText } from "@/lib/clipboard";
import { isKakaoConfigured, shareToKakao } from "@/lib/kakao";
import { useToast } from "@/components/ui/Toast";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

/**
 * 하객 한 명의 개인화 URL을 공유한다.
 * 관리자가 폰에서 바로 카카오톡으로 보내는 게 주 사용 흐름이다.
 */
export function ShareButtons({ token, name }: { token: string; name: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const url = `${wedding.site.url}/i/${token}`;
  // 카카오톡 메시지 제목에만 이름을 넣는다. OG 태그에는 넣지 않는다
  // — 링크가 제3자에게 전달됐을 때 수신자 이름이 노출되지 않도록.
  const title = `${name}님, 저희 결혼합니다`;
  const description = `${formatCeremonyDateShort()} ${formatCeremonyTime()} · ${wedding.venue.name}`;

  async function handleCopy() {
    const ok = await copyText(url);
    toast(ok ? "링크를 복사했습니다" : "복사에 실패했어요");
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title, text: description, url });
    } catch {
      // 사용자가 공유 시트를 닫은 경우 — 알릴 필요 없다.
    }
  }

  async function handleKakao() {
    setBusy(true);
    const ok = await shareToKakao({
      title,
      description,
      imageUrl: new URL(wedding.site.ogImage, wedding.site.url).toString(),
      url,
    });
    setBusy(false);
    if (!ok) toast("카카오톡 공유를 열지 못했어요");
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {isKakaoConfigured() && (
        <ShareButton onClick={handleKakao} disabled={busy}>
          카카오톡
        </ShareButton>
      )}
      <ShareButton onClick={handleNativeShare}>공유</ShareButton>
      <ShareButton onClick={handleCopy}>링크 복사</ShareButton>
      <a
        href={`/i/${token}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft"
      >
        미리보기
      </a>
    </div>
  );
}

function ShareButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors active:bg-paper-deep disabled:opacity-50"
    >
      {children}
    </button>
  );
}
