import { wedding, type Person } from "@/config/wedding";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

export function Greeting() {
  return (
    <Section label="Invitation" title={wedding.greeting.title}>
      <Reveal className="text-center">
        <div className="space-y-1 text-body leading-8 text-ink-soft">
          {wedding.greeting.body.map((line, i) =>
            // 빈 문자열은 문단 사이 여백으로 쓴다.
            line === "" ? (
              <div key={i} className="h-4" />
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
        </div>

        <div className="mt-10 space-y-2 text-sm text-ink">
          <ParentLine
            father={wedding.groom.father}
            mother={wedding.groom.mother}
            relation={wedding.groom.relation}
            child={wedding.groom.name}
          />
          <ParentLine
            father={wedding.bride.father}
            mother={wedding.bride.mother}
            relation={wedding.bride.relation}
            child={wedding.bride.name}
          />
        </div>
      </Reveal>
    </Section>
  );
}

/** "김아버지 · 이어머니 의 장남 김예찬" — 한국 청첩장의 표준 표기. */
function ParentLine({
  father,
  mother,
  relation,
  child,
}: {
  father: Person;
  mother: Person;
  relation: string;
  child: string;
}) {
  return (
    <p>
      <PersonName person={father} />
      <span className="mx-1.5 text-accent-soft">·</span>
      <PersonName person={mother} />
      <span className="ml-2 text-ink-faint">의 {relation}</span>
      <span className="ml-2 font-serif">{child}</span>
    </p>
  );
}

function PersonName({ person }: { person: Person }) {
  return (
    <span>
      {person.deceased && <span className="mr-0.5 text-ink-faint">故</span>}
      {person.name}
    </span>
  );
}
