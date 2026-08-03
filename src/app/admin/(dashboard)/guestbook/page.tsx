import { AdminGuestbook } from "@/components/admin/AdminGuestbook";
import { listAllEntries } from "@/lib/guestbook";

export const dynamic = "force-dynamic";

export default async function AdminGuestbookPage() {
  return <AdminGuestbook entries={await listAllEntries()} />;
}
