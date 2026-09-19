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
import { LetterFab } from "@/components/letter/LetterFab";
import { LetterProvider } from "@/components/letter/LetterProvider";
import type { LetterView } from "@/lib/letters";

/**
 * 청첩장 본문. `/` 와 `/i/[token]` 이 이 컴포넌트를 공유한다.
 * 둘의 유일한 차이는 개인화 편지(`letter`)의 유무다. 편지가 있으면 `LetterProvider`가 전체를 감싸
 * 춤 마지막 장면에 "{이름}님께 편지가 왔어요" 버튼을 띄우고, 누르면 접힌 편지지가 펼쳐진다.
 * 본문에는 편지 자리를 두지 않는다(2026-09-19 사용자 요청) — 건너뛰기·동작 줄이기 경로는 `WeddingDance`가 맡는다.
 * 캘린더부터는 오른쪽 위 플로팅 편지 버튼(`LetterFab`)이 뜬다. 편지가 없으면 둘 다 없다.
 */
export function Invitation({ letter }: { letter?: { recipientName: string; letters: LetterView[] } }) {
  const invitation = (
    <ToastProvider>
      <WeddingDance contentTargetId="invitation-content" />
      <div id="invitation-content">
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

  if (!letter) return invitation;
  return (
    <LetterProvider recipientName={letter.recipientName} letters={letter.letters}>
      {invitation}
      <LetterFab startId="invitation-content" />
    </LetterProvider>
  );
}
