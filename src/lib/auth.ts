import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 관리자 세션.
 *
 * 예찬·주은 두 사람이 공용 비밀번호 하나를 쓰고, 통과하면 서명된 쿠키를 받는다.
 * DB에 세션을 저장하지 않는 이유는 사용자가 둘뿐이고 로그아웃을 서버에서
 * 강제로 끊을 일이 없기 때문 — 쿠키를 지우면 끝난다.
 *
 * 지키는 것은 "하객 명단과 편지" 수준의 정보다. 그에 맞는 강도지만,
 * 비밀번호가 곧 유일한 방어선이므로 ADMIN_PASSWORD는 길게 잡아야 한다.
 *
 * ⚠️ 서버리스라 로그인 시도 횟수 제한을 메모리에 둘 수 없다(인스턴스가 매번 새로 뜬다).
 *    무차별 대입을 막는 건 비밀번호 길이뿐이다. 20자 이상을 권장한다.
 */

export const SESSION_COOKIE = "wedinvi_admin";
const SESSION_DAYS = 30;

function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET이 없습니다. .env.local에 무작위 문자열을 넣어주세요. (.env.example 참고)",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/** 문자열 비교를 상수 시간으로 — 비밀번호/서명 비교에서 타이밍 정보가 새지 않게. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // 길이가 다르면 timingSafeEqual이 던지므로 먼저 거른다.
  // (길이 노출은 실질적인 정보가 아니다.)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isPasswordCorrect(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD가 없습니다. .env.local을 확인하세요.");
  }
  return safeEqual(input, expected);
}

/** 만료 시각만 담은 토큰. 담을 신원 정보가 없다(관리자는 공용 계정). */
export function createSessionToken(now: Date = new Date()): string {
  const expiresAt = now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function isSessionTokenValid(token: string | undefined, now: Date = new Date()): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // 로컬 개발은 http라 secure를 켜면 쿠키가 저장되지 않는다.
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
