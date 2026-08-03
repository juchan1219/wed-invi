import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isSessionTokenValid } from "@/lib/auth";

/**
 * 관리자 영역 보호.
 *
 * Next.js 16부터 middleware가 proxy로 이름이 바뀌었고, 런타임은 nodejs로 고정이다.
 * 덕분에 node:crypto로 세션 서명을 여기서 바로 검증할 수 있다.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isSessionTokenValid(request.cookies.get(SESSION_COOKIE)?.value);

  // 로그인 페이지: 이미 로그인했으면 목록으로 보낸다.
  if (pathname === "/admin/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (authenticated) return NextResponse.next();

  // API는 리다이렉트하면 fetch 쪽에서 HTML을 받게 되므로 401로 끊는다.
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 경로만 남긴다(오픈 리다이렉트 방지).
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 로그인 API 자체는 인증 없이 접근할 수 있어야 한다.
  matcher: ["/admin/:path*", "/api/admin/((?!login).*)"],
};
