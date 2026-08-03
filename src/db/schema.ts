import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * 하객 한 명 = 한 행. 기본키인 token이 곧 개인화 URL(/i/<token>)이다.
 * token은 HMAC(이름|뒷자리4)로 만들어지므로 같은 사람은 항상 같은 URL을 갖는다.
 */
export const recipients = pgTable("recipients", {
  token: text("token").primaryKey(),
  name: text("name").notNull(),
  /** 휴대폰 뒷 4자리. 동명이인을 구분하는 용도라 문자열로 둔다(앞자리 0 보존). */
  phoneLast4: text("phone_last4").notNull(),
  /** 하객이 링크를 열어봤는지 — 관리자 목록에서 "아직 안 봤어요" 배지로 쓴다. */
  viewCount: integer("view_count").notNull().default(0),
  firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 편지. 한 하객에게 예찬·주은이 각각 한 통씩 쓸 수 있다
 * — (token, author) 유니크 제약이 그 규칙을 스키마 레벨에서 보장한다.
 */
export const letters = pgTable(
  "letters",
  {
    id: serial("id").primaryKey(),
    token: text("token")
      .notNull()
      .references(() => recipients.token, { onDelete: "cascade" }),
    /** 'yechan' | 'jueun' — src/config/admins.ts 의 AdminId와 같은 값 */
    author: text("author").notNull(),
    /** 마크다운 원문 */
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("letters_token_author_unique").on(table.token, table.author),
    // 청첩장 렌더링 시 토큰으로 편지를 찾는 것이 가장 잦은 질의다.
    index("letters_token_idx").on(table.token),
  ],
);

/** 방명록. 하객이 남기고, 본인은 4자리 비밀번호로, 관리자는 언제든 지울 수 있다. */
export const guestbook = pgTable("guestbook", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  /** 4자리 비밀번호의 scrypt 해시. 평문은 저장하지 않는다. */
  passwordHash: text("password_hash").notNull(),
  /** 관리자가 숨긴 글. 삭제 대신 숨김을 기본으로 둬 실수를 되돌릴 수 있게 한다. */
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Recipient = typeof recipients.$inferSelect;
export type Letter = typeof letters.$inferSelect;
export type GuestbookEntry = typeof guestbook.$inferSelect;
