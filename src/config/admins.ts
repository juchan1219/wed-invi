/**
 * 편지를 쓰는 사람. 관리자 화면의 chip과 DB의 letters.author가 이 id를 공유한다.
 * 여기만 고치면 chip / 필터 / 편지 노출 순서가 전부 따라온다.
 */
export const ADMINS = [
  { id: "yechan", label: "예찬" },
  { id: "jueun", label: "주은" },
] as const;

export type AdminId = (typeof ADMINS)[number]["id"];

export const ADMIN_IDS = ADMINS.map((a) => a.id) as readonly AdminId[];

export function isAdminId(value: unknown): value is AdminId {
  return typeof value === "string" && ADMIN_IDS.includes(value as AdminId);
}

export function adminLabel(id: AdminId): string {
  return ADMINS.find((a) => a.id === id)?.label ?? id;
}
