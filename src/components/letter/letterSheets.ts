import { adminLabel, type AdminId } from "@/config/admins";

/**
 * 편지지 한 장의 머리·꼬리. 편지가 2통이면 "1 / 2"를 달고, 첫 장 끝에서 다음 편지로 넘어간다.
 * 편지 순서는 `getRecipient`가 정한 작성자 순서(예찬 → 주은)를 그대로 따른다.
 */
export function describeLetterSheet(letters: readonly { author: AdminId }[], index: number) {
  const nextLetter = letters[index + 1];
  return {
    author: adminLabel(letters[index]!.author),
    counter: letters.length > 1 ? `${index + 1} / ${letters.length}` : null,
    next: nextLetter ? `다음 편지 · ${adminLabel(nextLetter.author)}` : null,
  };
}

/**
 * 편지 버튼 문구: "{이름}님께 편지가 왔어요" (2026-09-19 사용자 요청).
 * 좁은 화면에서 넘치면 "님께" 뒤에서만 줄이 바뀌도록 두 조각으로 준다.
 */
export function letterButtonLabel(recipientName: string) {
  return { to: `${recipientName}님께`, message: "편지가 왔어요" };
}
