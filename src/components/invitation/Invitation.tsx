import { wedding } from "@/config/wedding";
import { ToastProvider } from "@/components/ui/Toast";
import { Guestbook } from "./Guestbook";
import { Hero } from "./Hero";
import { Greeting } from "./Greeting";
import { CeremonyInfo } from "./CeremonyInfo";
import { Gallery } from "./Gallery";
import { MapSection } from "./MapSection";
import { AccountSection } from "./AccountSection";
import { ContactSection } from "./ContactSection";
import { ShareFooter } from "./ShareFooter";

/**
 * 청첩장 본문. `/` 와 `/i/[token]` 이 이 컴포넌트를 공유한다.
 * 둘의 유일한 차이는 편지 섹션(`letterSlot`)의 유무다.
 */
export function Invitation({ letterSlot }: { letterSlot?: React.ReactNode }) {
  return (
    <ToastProvider>
      <Hero />
      <Greeting />
      {/* 개인화 편지는 인사말 바로 뒤 — "당신을 초대합니다" 다음에 오는 게 자연스럽다. */}
      {letterSlot}
      <CeremonyInfo />
      <Gallery />
      <MapSection />
      <AccountSection />
      <ContactSection />
      {wedding.guestbook.enabled && <Guestbook />}
      <ShareFooter />
    </ToastProvider>
  );
}
