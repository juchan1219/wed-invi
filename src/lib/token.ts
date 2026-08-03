import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 하객별 URL 토큰.
 *
 *   HMAC-SHA256(TOKEN_SECRET, "이름|뒷자리4") → base64url 앞 12자
 *
 * 이 방식을 고른 이유:
 *   - 같은 이름+뒷자리면 항상 같은 URL이라 재발급이 안정적이다.
 *     (하객이 링크를 잃어버려도 관리자가 똑같은 주소를 다시 만들어 줄 수 있다)
 *   - URL만 보고 이름을 역산할 수 없다.
 *   - 12자 base64url = 72비트라 다른 하객의 편지를 찍어서 열 수 없다.
 *
 * ⚠️ TOKEN_SECRET을 바꾸면 이미 배포한 URL이 전부 무효가 된다.
 */

const TOKEN_LENGTH = 12;

function secret(): string {
  const value = process.env.TOKEN_SECRET;
  if (!value) {
    throw new Error(
      "TOKEN_SECRET이 없습니다. .env.local에 무작위 문자열을 넣어주세요. (.env.example 참고)",
    );
  }
  return value;
}

/**
 * 이름 표기 흔들림을 흡수한다.
 * "홍 길동", "홍길동 " 이 다른 토큰을 만들면 관리자가 같은 사람에게
 * 서로 다른 URL을 두 개 발급하는 사고가 난다.
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, "");
}

/** 숫자만 남기고 뒤 4자리. "010-1234" 처럼 붙여넣어도 "1234"가 된다. */
export function normalizeLast4(input: string): string {
  return input.replace(/\D/g, "").slice(-4);
}

export function isValidLast4(input: string): boolean {
  return /^\d{4}$/.test(input);
}

export function makeToken(name: string, phoneLast4: string): string {
  const normalized = `${normalizeName(name)}|${normalizeLast4(phoneLast4)}`;
  return createHmac("sha256", secret())
    .update(normalized, "utf8")
    .digest("base64url")
    .slice(0, TOKEN_LENGTH);
}

/** URL에서 받은 토큰이 형식상 우리 것인지. DB 조회 전에 걸러낸다. */
export function isTokenShaped(value: string): boolean {
  return new RegExp(`^[A-Za-z0-9_-]{${TOKEN_LENGTH}}$`).test(value);
}

/**
 * 저장된 토큰과 지금 만든 토큰이 같은지 상수 시간으로 비교한다.
 * (관리자 화면에서 "이 URL이 이 사람 것이 맞나"를 확인할 때 쓴다.)
 */
export function tokenMatches(token: string, name: string, phoneLast4: string): boolean {
  const expected = Buffer.from(makeToken(name, phoneLast4));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
