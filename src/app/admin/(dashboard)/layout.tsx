import type { Metadata } from "next";
import Link from "next/link";
import { AuthorChip, AuthorProvider } from "@/components/admin/AuthorChip";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "편지 관리",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthorProvider>
        <div className="mx-auto min-h-screen w-full max-w-2xl bg-paper">
          <Header />
          <main className="px-5 pb-24">{children}</main>
        </div>
      </AuthorProvider>
    </ToastProvider>
  );
}

function Header() {
  return (
    // 하객 목록이 길어지므로 헤더를 붙여둔다 — chip을 쓰려고 맨 위까지 올라갈 필요가 없게.
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-3">
        <nav className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-ink">
            편지
          </Link>
          <Link href="/admin/guestbook" className="text-sm text-ink-faint">
            방명록
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <AuthorChip />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
