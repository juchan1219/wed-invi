import { RecipientList } from "@/components/admin/RecipientList";
import { listRecipients } from "@/lib/admin-letters";

// 편지를 저장하고 목록으로 돌아왔을 때 반드시 최신 상태가 보여야 한다.
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const recipients = await listRecipients();

  return (
    <RecipientList
      // Date는 클라이언트 컴포넌트로 그대로 넘길 수 없어 문자열로 바꾼다.
      recipients={recipients.map((r) => ({
        ...r,
        firstViewedAt: r.firstViewedAt?.toISOString() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
