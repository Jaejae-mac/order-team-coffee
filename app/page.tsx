/**
 * 메인 대시보드 페이지
 * - 서버에서 초기 세션 목록을 가져와 렌더링
 * - 클라이언트에서 Realtime 구독을 시작해 실시간 업데이트
 * - 인증 쿠키가 없으면 /login으로 리다이렉트
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MainDashboard from "@/components/dashboard/MainDashboard";
import { getSessions } from "@/lib/actions/sessionActions";
import type { PartId } from "@/types";

interface PageProps {
  searchParams: Promise<{ part?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  // 인증 쿠키 확인 (미들웨어와 이중 보호)
  const cookieStore = await cookies();
  const verified = cookieStore.get("verified")?.value;
  if (verified !== "true") redirect("/login");

  const params = await searchParams;
  const part = (params.part ?? "channel") as PartId;

  // 서버에서 초기 세션 목록 조회 (Supabase 미연결 시 빈 배열로 처리)
  const { data: initialSessions, error } = await getSessions(part);

  if (error) {
    console.error("세션 초기 로드 오류:", error);
  }

  return (
    <MainDashboard
      initialSessions={initialSessions ?? []}
      initialPart={part}
    />
  );
}
