import Image from "next/image";
import { heroPhoto } from "@/assets/photos/manifest";
import { wedding } from "@/config/wedding";
import { formatCeremonyDateShort, formatCeremonyTime } from "@/lib/date";

/**
 * 첫 화면. LCP 요소이므로 히어로 사진에만 priority를 주고
 * 나머지 사진은 전부 lazy로 둔다.
 */
export function Hero() {
  return (
    <header className="px-7 pt-14 pb-12 text-center">
      <p className="text-[0.65rem] tracking-[0.35em] text-accent uppercase">
        We&rsquo;re getting married
      </p>

      <div className="mt-8 overflow-hidden rounded-t-full">
        {heroPhoto ? (
          <Image
            src={heroPhoto}
            alt={`${wedding.groom.name}, ${wedding.bride.name} 웨딩 사진`}
            // 컨테이너 폭이 최대 26rem(416px)이므로 그보다 큰 후보는 받을 필요가 없다.
            sizes="(max-width: 416px) 100vw, 416px"
            className="h-auto w-full object-cover"
            placeholder="blur"
            quality={85}
            priority
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>

      <div className="mt-9">
        <p className="font-serif text-2xl tracking-wide text-ink">
          {wedding.groom.name}
          <span className="mx-3 text-accent-soft">·</span>
          {wedding.bride.name}
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          {formatCeremonyDateShort()} · {formatCeremonyTime()}
        </p>
        <p className="mt-1.5 text-sm text-ink-faint">
          {wedding.venue.name} {wedding.venue.hall}
        </p>
      </div>
    </header>
  );
}

/** 사진을 아직 안 넣었을 때. 빈 화면 대신 무엇을 해야 하는지 알려준다. */
function PhotoPlaceholder() {
  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-paper-deep px-8 text-center">
      <p className="text-sm text-ink-faint">메인 사진이 없습니다</p>
      <p className="text-xs leading-relaxed text-ink-faint">
        <code className="rounded bg-line/60 px-1.5 py-0.5">photos/hero.jpg</code>
        <br />를 넣고{" "}
        <code className="rounded bg-line/60 px-1.5 py-0.5">npm run photos:prep</code>
      </p>
    </div>
  );
}
