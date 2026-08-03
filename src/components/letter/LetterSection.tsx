import { adminLabel } from "@/config/admins";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { LetterView } from "@/lib/letters";
import { LetterMarkdown } from "./LetterMarkdown";

/**
 * 수신자에게 쓴 편지. 편지가 있을 때만 렌더된다
 * — 호출하는 쪽(`/i/[token]`)이 빈 배열이면 아예 이 컴포넌트를 만들지 않는다.
 */
export function LetterSection({
  recipientName,
  letters,
}: {
  recipientName: string;
  letters: LetterView[];
}) {
  return (
    <Section label="Letter" title={`${recipientName}님께`} className="bg-paper-deep">
      <div className="space-y-5">
        {letters.map((letter) => (
          <Reveal key={letter.author}>
            <article className="rounded-lg bg-paper px-6 py-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <LetterMarkdown body={letter.body} />
              <p className="mt-7 text-right font-serif text-sm text-ink-faint">
                {adminLabel(letter.author)} 드림
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
