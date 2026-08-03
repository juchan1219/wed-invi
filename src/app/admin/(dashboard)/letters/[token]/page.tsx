import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipients } from "@/db/schema";
import { ADMINS, isAdminId, type AdminId } from "@/config/admins";
import { LetterEditor } from "@/components/admin/LetterEditor";
import { getLetter } from "@/lib/letters";

// 저장 직후 돌아왔을 때 예전 내용이 뜨면 안 된다.
export const dynamic = "force-dynamic";

export default async function EditLetterPage(props: PageProps<"/admin/letters/[token]">) {
  const { token } = await props.params;
  const search = await props.searchParams;

  const authorParam = Array.isArray(search.author) ? search.author[0] : search.author;
  const author: AdminId = isAdminId(authorParam) ? authorParam : ADMINS[0].id;

  const [recipient] = await db()
    .select()
    .from(recipients)
    .where(eq(recipients.token, token))
    .limit(1);

  // 하객 자체가 없으면 편집할 대상이 없다.
  if (!recipient) notFound();

  const letter = await getLetter(token, author);

  return (
    <LetterEditor
      initial={{
        token: recipient.token,
        name: recipient.name,
        phoneLast4: recipient.phoneLast4,
        author,
        // 아직 이 사람이 안 쓴 편지면 빈 본문으로 새로 쓰기 시작한다.
        body: letter?.body ?? "",
      }}
    />
  );
}
