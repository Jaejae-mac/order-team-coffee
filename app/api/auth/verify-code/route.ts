/**
 * 접근 코드 검증 API
 * - 클라이언트에서 POST로 접근 코드를 보내면 서버에서 환경변수와 비교
 * - 성공 시 httpOnly 쿠키를 발급하여 이후 페이지 접근을 허용
 * - IP 기반 Rate Limiting 적용 (15분 내 5회 초과 시 차단)
 */
import { NextRequest, NextResponse } from "next/server";

// 시도 횟수 추적 (Vercel 서버리스에서는 인스턴스별 독립 — 운영 시 Vercel KV 권장)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15분

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting — IP 기반 시도 횟수 제한
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const record = attempts.get(ip);

    if (record && now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "너무 많은 시도가 있었습니다. 15분 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
      record.count++;
    } else {
      // 새 윈도우 시작 또는 윈도우 만료
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    // 2. 접근 코드 검증
    const body = await request.json() as { code?: string };
    const { code } = body;

    if (!code || code !== process.env.ACCESS_CODE) {
      return NextResponse.json(
        { error: "접근 코드가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 3. 성공 시 시도 횟수 초기화 + httpOnly 쿠키 발급
    attempts.delete(ip);

    const response = NextResponse.json({ success: true });
    response.cookies.set("verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24시간
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
