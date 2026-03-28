/**
 * 인증 미들웨어 — 모든 요청에서 쿠키를 확인하고 미인증 사용자를 /login으로 보냄
 * Next.js 15 표준: 파일명 middleware.ts, default export
 */
import { NextRequest, NextResponse } from "next/server";

// 인증 없이 접근 가능한 경로들
const PUBLIC_PATHS = ["/login", "/api/auth/verify-code", "/api/auth/logout"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  // 정적 파일, Next.js 내부 경로 통과
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // verified 쿠키가 없으면 로그인 페이지로 이동
  // nextUrl.clone()을 사용해야 Edge Runtime에서 안정적으로 동작함
  const verified = request.cookies.get("verified")?.value;
  if (verified !== "true") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 미들웨어가 실행될 경로 (정적 파일 제외)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
