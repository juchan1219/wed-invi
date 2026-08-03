import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center bg-paper px-7">
      <h1 className="text-center font-serif text-xl text-ink">편지 관리</h1>
      <p className="mt-2 text-center text-sm text-ink-faint">
        예찬 · 주은만 들어올 수 있어요
      </p>
      <LoginForm />
    </div>
  );
}
