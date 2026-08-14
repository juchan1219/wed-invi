import { ceremonyDate, wedding } from "@/config/wedding";

/**
 * 예식은 한국에서 열린다. 하객이 해외에 있어도, 서버가 UTC로 돌아도
 * "12월 19일 토요일 오후 12시 30분"은 똑같이 보여야 하므로 모든 포맷을 Asia/Seoul로 고정한다.
 */
const TZ = "Asia/Seoul";

type YMD = { year: number; month: number; day: number };

/** 주어진 시각을 서울 기준 연/월/일로 쪼갠다. */
function seoulYMD(date: Date): YMD {
  // en-CA는 YYYY-MM-DD로 포맷된다 — 파싱하기 가장 안전한 로캘.
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  return { year, month, day };
}

/** 날짜 차이 계산용. 시/분을 버리고 '그 날 자정'의 절대값으로 환산한다. */
function toDayIndex({ year, month, day }: YMD): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** 예식까지 남은 일수. 0이면 오늘, 음수면 이미 지났다. */
export function daysUntilCeremony(now: Date = new Date()): number {
  return toDayIndex(seoulYMD(ceremonyDate())) - toDayIndex(seoulYMD(now));
}

/** "2026년 12월 19일 토요일" */
export function formatCeremonyDate(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(ceremonyDate());
}

/** "2026. 12. 19" — 짧게 쓰는 자리용 */
export function formatCeremonyDateShort(): string {
  const { year, month, day } = seoulYMD(ceremonyDate());
  return `${year}. ${String(month).padStart(2, "0")}. ${String(day).padStart(2, "0")}`;
}

/** ICU의 dayPeriod 번역에 의존하지 않고 24시간제 숫자를 한국어 시각으로 만든다. */
export function formatKoreanTimeParts(hour24: number, minute: number): string {
  const meridiem = hour24 < 12 ? "오전" : "오후";
  const hour12 = hour24 % 12 || 12;
  return minute === 0
    ? `${meridiem} ${hour12}시`
    : `${meridiem} ${hour12}시 ${minute}분`;
}

/** "오후 1시" / "오후 1시 30분" — 정각이면 분을 생략한다. */
export function formatCeremonyTime(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ceremonyDate());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return formatKoreanTimeParts(hour, minute);
}

export type CalendarCell = { day: number | null; isCeremony: boolean };

/**
 * 예식이 있는 달의 달력 표. 일요일 시작, 6주 격자가 아니라
 * 실제로 필요한 주 수만 만든다(빈 줄이 생기지 않게).
 */
export function ceremonyMonthCalendar(): {
  year: number;
  month: number;
  weeks: CalendarCell[][];
} {
  const { year, month, day: ceremonyDay } = seoulYMD(ceremonyDate());

  // UTC 기준으로 계산해도 '몇 일까지 있는 달인지', '1일이 무슨 요일인지'는 동일하다.
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: CalendarCell[] = [
    ...Array.from({ length: firstWeekday }, () => ({ day: null, isCeremony: false })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      isCeremony: i + 1 === ceremonyDay,
    })),
  ];
  // 마지막 주를 7칸으로 채운다.
  while (cells.length % 7 !== 0) cells.push({ day: null, isCeremony: false });

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, month, weeks };
}

/** iCalendar가 요구하는 UTC 타임스탬프 형식: 20261017T040000Z */
function toICalStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** 캘린더 앱에 넣을 .ics 본문. Route Handler가 그대로 내려준다. */
export function buildICalendar(): string {
  const start = ceremonyDate();
  const end = new Date(start.getTime() + wedding.ceremony.durationMinutes * 60_000);
  const summary = `${wedding.groom.name} ♥ ${wedding.bride.name} 결혼식`;
  const location = `${wedding.venue.name} ${wedding.venue.hall}, ${wedding.venue.address}`;

  // RFC 5545는 CRLF 개행을 요구한다.
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wed-invi//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    // UID는 매 요청 같은 값이어야 중복 등록이 안 생긴다.
    `UID:${toICalStamp(start)}-wedding@wed-invi`,
    `DTSTAMP:${toICalStamp(start)}`,
    `DTSTART:${toICalStamp(start)}`,
    `DTEND:${toICalStamp(end)}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `LOCATION:${escapeICalText(location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICalText(`내일은 ${summary} 입니다`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** 쉼표·세미콜론·개행은 iCal에서 특수문자라 이스케이프해야 한다. */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
