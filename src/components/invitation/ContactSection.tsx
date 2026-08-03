"use client";

import { wedding, type Person } from "@/config/wedding";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

type Contact = { label: string; name: string; phone?: string };

export function ContactSection() {
  const groomSide: Contact[] = [
    { label: "신랑", name: wedding.groom.name, phone: wedding.groom.phone },
    ...parentContacts(wedding.groom.father, wedding.groom.mother, "신랑"),
  ];
  const brideSide: Contact[] = [
    { label: "신부", name: wedding.bride.name, phone: wedding.bride.phone },
    ...parentContacts(wedding.bride.father, wedding.bride.mother, "신부"),
  ];

  return (
    <Section label="Contact" title="연락하기">
      <Reveal>
        <div className="space-y-2">
          <Accordion title="신랑측">
            <ContactList contacts={groomSide} />
          </Accordion>
          <Accordion title="신부측">
            <ContactList contacts={brideSide} />
          </Accordion>
        </div>
      </Reveal>
    </Section>
  );
}

/** 고인은 연락처 목록에서 제외한다. */
function parentContacts(father: Person, mother: Person, side: string): Contact[] {
  return [
    { label: `${side} 아버지`, person: father },
    { label: `${side} 어머니`, person: mother },
  ]
    .filter(({ person }) => !person.deceased)
    .map(({ label, person }) => ({ label, name: person.name, phone: person.phone }));
}

function ContactList({ contacts }: { contacts: Contact[] }) {
  const reachable = contacts.filter((c) => c.phone);

  if (reachable.length === 0) {
    return <p className="text-sm text-ink-faint">등록된 연락처가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {reachable.map((contact) => {
        const digits = contact.phone!.replace(/-/g, "");
        return (
          <li
            key={`${contact.label}-${contact.name}`}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">{contact.label}</p>
              <p className="mt-1 text-sm text-ink">{contact.name}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href={`tel:${digits}`}
                aria-label={`${contact.name}에게 전화`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft"
              >
                <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
                  <path
                    d="M3 2.5h2.2l1.1 2.7-1.4 1a8.5 8.5 0 0 0 3.9 3.9l1-1.4 2.7 1.1V12a1.5 1.5 0 0 1-1.6 1.5A10.6 10.6 0 0 1 1.5 4.1 1.5 1.5 0 0 1 3 2.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href={`sms:${digits}`}
                aria-label={`${contact.name}에게 문자`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft"
              >
                <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
                  <path
                    d="M2 3.5h12v8H6.5L3.5 14v-2.5H2v-8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
