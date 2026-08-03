import { wedding } from "@/config/wedding";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { ceremonyMonthCalendar, formatCeremonyDate, formatCeremonyTime } from "@/lib/date";
import { DdayCounter } from "./DdayCounter";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CeremonyInfo() {
  const { year, month, weeks } = ceremonyMonthCalendar();

  return (
    <Section label="Save the date">
      <Reveal className="text-center">
        <p className="font-serif text-lg text-ink">{formatCeremonyDate()}</p>
        <p className="mt-2 text-sm text-ink-soft">{formatCeremonyTime()}</p>

        <div className="mx-auto mt-9 max-w-[19rem]">
          <p className="mb-4 text-xs tracking-[0.2em] text-ink-faint">
            {year}. {String(month).padStart(2, "0")}
          </p>

          <table className="w-full table-fixed border-separate border-spacing-y-1.5">
            <thead>
              <tr>
                {WEEKDAYS.map((w, i) => (
                  <th
                    key={w}
                    scope="col"
                    className={`pb-2 text-[0.7rem] font-normal ${
                      i === 0 ? "text-accent" : "text-ink-faint"
                    }`}
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((cell, ci) => (
                    <td key={ci} className="text-center align-middle">
                      {cell.day === null ? (
                        <span className="block h-8" />
                      ) : cell.isCeremony ? (
                        <span
                          className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-paper"
                          aria-current="date"
                        >
                          {cell.day}
                        </span>
                      ) : (
                        <span
                          className={`flex h-8 items-center justify-center text-sm ${
                            ci === 0 ? "text-accent-soft" : "text-ink-soft"
                          }`}
                        >
                          {cell.day}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <DdayCounter />
        </div>

        <a
          href="/api/calendar"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs text-ink-soft transition-colors active:bg-paper-deep"
        >
          <svg aria-hidden viewBox="0 0 14 14" className="h-3.5 w-3.5">
            <rect
              x="1.5"
              y="2.5"
              width="11"
              height="10"
              rx="1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <path
              d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
          내 캘린더에 추가
        </a>

        <p className="mt-8 text-sm text-ink-faint">
          {wedding.venue.name} {wedding.venue.hall}
        </p>
      </Reveal>
    </Section>
  );
}
