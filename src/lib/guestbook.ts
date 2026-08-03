import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { guestbook } from "@/db/schema";
import { wedding } from "@/config/wedding";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 32;

/**
 * 방명록 글은 하객이 남기고 본인이 지울 수 있어야 한다.
 * 로그인을 시킬 수는 없으니 4자리 비밀번호를 받는데, 평문으로 두면
 * DB가 새는 순간 다른 사이트 비밀번호로 재사용될 수 있다 → 해시로 저장한다.
 * (4자리는 원래 약하지만, 지킬 대상이 "자기 글 삭제" 뿐이라 이 정도가 적정하다.)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString("base64")}:${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltPart, hashPart] = stored.split(":");
  if (!saltPart || !hashPart) return false;

  const derived = await scrypt(password, Buffer.from(saltPart, "base64"), KEY_LENGTH);
  const expected = Buffer.from(hashPart, "base64");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export type GuestbookView = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
};

/** 하객에게 보여줄 목록. 숨김 처리된 글은 빼고, 최신순. */
export async function listVisibleEntries(limit = 100): Promise<GuestbookView[]> {
  const rows = await db()
    .select()
    .from(guestbook)
    .where(eq(guestbook.hidden, false))
    .orderBy(desc(guestbook.createdAt))
    .limit(limit);

  return rows.map(toView);
}

/** 관리자 목록 — 숨긴 글도 함께 본다. */
export async function listAllEntries(limit = 300) {
  const rows = await db()
    .select()
    .from(guestbook)
    .orderBy(desc(guestbook.createdAt))
    .limit(limit);

  return rows.map((row) => ({ ...toView(row), hidden: row.hidden }));
}

function toView(row: typeof guestbook.$inferSelect): GuestbookView {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

export type GuestbookInput = { name: string; message: string; password: string };

export type ValidationError = { error: string };

/** 입력 검증. 통과하면 다듬어진 값을, 아니면 사용자에게 보여줄 문구를 돌려준다. */
export function validateEntry(input: Partial<GuestbookInput>): GuestbookInput | ValidationError {
  const name = String(input.name ?? "").trim();
  const message = String(input.message ?? "").trim();
  const password = String(input.password ?? "");

  if (name.length === 0) return { error: "이름을 입력해 주세요." };
  if (name.length > wedding.guestbook.maxNameLength) {
    return { error: `이름은 ${wedding.guestbook.maxNameLength}자 이내로 입력해 주세요.` };
  }
  if (message.length === 0) return { error: "메시지를 입력해 주세요." };
  if (message.length > wedding.guestbook.maxMessageLength) {
    return { error: `메시지는 ${wedding.guestbook.maxMessageLength}자 이내로 입력해 주세요.` };
  }
  if (!/^\d{4}$/.test(password)) {
    return { error: "비밀번호는 숫자 4자리로 입력해 주세요." };
  }

  return { name, message, password };
}

export function isValidationError(
  value: GuestbookInput | ValidationError,
): value is ValidationError {
  return "error" in value;
}
