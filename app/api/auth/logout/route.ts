/**
 * 로그아웃 API
 * - verified 쿠키를 삭제하여 세션을 무효화
 * - 클라이언트는 이후 /login으로 리다이렉트
 */
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 쿠키 삭제 (maxAge=0으로 즉시 만료 처리)
  response.cookies.set("verified", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
