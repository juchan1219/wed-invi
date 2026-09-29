"use client";

import Image from "next/image";
import { mapPhoto } from "@/assets/photos/manifest";
import { wedding } from "@/config/wedding";
import { MAP_APPS, openMapApp, type MapApp } from "@/lib/maps";
import { Accordion } from "@/components/ui/Accordion";
import { CopyButton } from "@/components/ui/CopyButton";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { MapAppIcon } from "./MapAppIcon";

export function MapSection() {
  const { name, hall, address, tel, transport } = wedding.venue;

  return (
    <Section id="location" label="Location" title="오시는 길">
      <Reveal>
        <div className="text-center">
          <p className="font-serif text-lg text-ink">{name}</p>
          <p className="mt-1.5 text-sm text-ink-soft">{hall}</p>
        </div>

        <button
          type="button"
          onClick={() => openMapApp("naver")}
          aria-label={`${name}, 네이버 지도에서 보기`}
          className="group relative mt-6 block w-full overflow-hidden rounded-lg border border-line text-left focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
        >
          {mapPhoto ? (
            <>
              <Image
                src={mapPhoto}
                alt={`${name} 위치 지도`}
                sizes="(max-width: 416px) 100vw, 416px"
                className="h-auto w-full object-cover transition-transform duration-300 group-active:scale-[1.015]"
                placeholder="blur"
                loading="lazy"
              />
              <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-md backdrop-blur-sm">
                <span className="h-5 w-5"><MapAppIcon app="naver" /></span>
                네이버 지도에서 보기
              </span>
            </>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-paper-deep px-8 text-center">
              <p className="text-xs leading-relaxed text-ink-faint">
                지도 캡처 이미지를{" "}
                <code className="rounded bg-line/60 px-1.5 py-0.5">photos/map.jpg</code> 로
                넣고
                <br />
                <code className="rounded bg-line/60 px-1.5 py-0.5">
                  npm run photos:prep
                </code>{" "}
                을 실행하세요.
              </p>
            </div>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-paper-deep px-4 py-3">
          <p className="text-sm leading-relaxed text-ink-soft">{address}</p>
          <CopyButton value={address} toastMessage="주소를 복사했습니다" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {MAP_APPS.map((app) => (
            <MapAppButton key={app.id} id={app.id} label={app.label} />
          ))}
        </div>

        {tel && (
          <a
            href={`tel:${tel.replace(/-/g, "")}`}
            className="mt-2 block rounded-lg border border-line py-3 text-center text-sm text-ink-soft transition-colors active:bg-paper-deep"
          >
            예식장에 전화하기 {tel}
          </a>
        )}

        <div className="mt-6 space-y-2">
          {transport.map((t) => (
            <Accordion key={t.title} title={t.title}>
              <ul className="space-y-1.5 text-sm leading-relaxed text-ink-soft">
                {t.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </Accordion>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function MapAppButton({ id, label }: { id: MapApp; label: string }) {
  return (
    <button
      type="button"
      onClick={() => openMapApp(id)}
      className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-line px-1 py-2.5 text-xs font-medium text-ink-soft transition-colors active:bg-paper-deep"
    >
      <span className="h-7 w-7 shrink-0"><MapAppIcon app={id} /></span>
      <span className="truncate">{label}</span>
    </button>
  );
}
