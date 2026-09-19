import { after } from "next/server";
import { Invitation } from "@/components/invitation/Invitation";
import { getRecipient, recordView } from "@/lib/letters";

/**
 * 개인화 청첩장.
 *
 * 토큰이 형식에 안 맞거나 · 등록되지 않은 하객이거나 · 편지가 한 통도 없으면
 * **404를 내지 않고** 기본 청첩장을 그대로 보여준다.
 * 하객 입장에서 "잘못된 주소"라는 에러 화면을 보는 것보다
 * 평범한 청첩장이 열리는 편이 낫기 때문이다.
 */
export default async function Page(props: PageProps<"/i/[token]">) {
  const { token } = await props.params;
  const recipient = await getRecipient(token);
  const hasLetters = recipient !== null && recipient.letters.length > 0;

  if (recipient) {
    // 열람 기록은 응답을 보낸 뒤에 — 하객이 기다릴 이유가 없다.
    after(() => recordView(recipient.token));
  }

  return (
    <Invitation
      letter={hasLetters ? { recipientName: recipient.name, letters: recipient.letters } : undefined}
    />
  );
}
