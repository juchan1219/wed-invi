import { wedding } from "@/config/wedding";
import { ToastProvider } from "@/components/ui/Toast";
import { Guestbook } from "./Guestbook";
import { Greeting } from "./Greeting";
import { CeremonyInfo } from "./CeremonyInfo";
import { Gallery } from "./Gallery";
import { MapSection } from "./MapSection";
import { AccountSection } from "./AccountSection";
import { ContactSection } from "./ContactSection";
import { ShareFooter } from "./ShareFooter";
import { WeddingDance } from "./story/WeddingDance";

/**
 * 청첩장 본문. `/` 와 `/i/[token]` 이 이 컴포넌트를 공유한다.
 * 둘의 유일한 차이는 편지 섹션(`letterSlot`)의 유무다.
 */
export function Invitation({ letterSlot }: { letterSlot?: React.ReactNode }) {
  return (
    <ToastProvider>
      <WeddingDance contentTargetId="invitation-content" />
      <div id="invitation-content">
        {/* 스토리 직후 개인화 편지를 먼저 보여 준다. 편지가 없으면 날짜로 바로 이어진다. */}
        {letterSlot}
        <CeremonyInfo />
        <Greeting />
      </div>
      <Gallery />
      <MapSection />
      <AccountSection />
      <ContactSection />
      {wedding.guestbook.enabled && <Guestbook />}
      <ShareFooter />
    </ToastProvider>
  );
}
