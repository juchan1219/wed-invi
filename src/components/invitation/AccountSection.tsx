"use client";

import { wedding, type Account } from "@/config/wedding";
import { Accordion } from "@/components/ui/Accordion";
import { CopyButton } from "@/components/ui/CopyButton";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

export function AccountSection() {
  return (
    <Section label="Account" title="마음 전하실 곳">
      <Reveal>
        <p className="mb-7 text-center text-sm leading-7 text-ink-soft">
          {/* 어르신용(`/big`)에서는 글자가 커서 세 줄로 끊어 읽히게 한다. 기본 크기는 두 줄. */}
          참석이 어려우신 분들을 위해{" "}
          <br className="large-type-only" />
          계좌번호를 남깁니다.
          <br />
          너그러운 마음으로 양해 부탁드립니다.
        </p>

        <div className="space-y-2">
          <Accordion title="신랑측 계좌번호" mountOnOpen>
            <AccountList accounts={wedding.accounts.groom} />
          </Accordion>
          <Accordion title="신부측 계좌번호" mountOnOpen>
            <AccountList accounts={wedding.accounts.bride} />
          </Accordion>
        </div>
      </Reveal>
    </Section>
  );
}

function AccountList({ accounts }: { accounts: readonly Account[] }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-ink-faint">등록된 계좌가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {accounts.map((account) => (
        <li key={`${account.bank}-${account.number}`} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">{account.label}</p>
              <p className="mt-1 text-sm text-ink">
                {account.bank} {account.number}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">예금주 {account.holder}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {/* 은행 앱에 붙여넣기 좋도록 숫자만 복사한다. */}
              <CopyButton
                value={account.number.replace(/[^0-9]/g, "")}
                toastMessage="계좌번호를 복사했습니다"
              />
              {account.kakaopayUrl && (
                <a
                  href={account.kakaopayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-3 py-1.5 text-center text-xs text-ink-soft"
                >
                  송금
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
