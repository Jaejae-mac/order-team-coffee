/**
 * 메인 대시보드 페이지
 * - 서버에서 초기 세션 및 투표 목록을 가져와 렌더링
 * - 클라이언트에서 Realtime 구독을 시작해 실시간 업데이트
 * - 인증 쿠키가 없으면 /login으로 리다이렉트
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MainDashboard from "@/components/dashboard/MainDashboard";
import { getSessions } from "@/lib/actions/sessionActions";
import { getPolls } from "@/lib/actions/pollActions";
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

  // 서버에서 초기 세션 + 투표 목록 병렬 조회
  const [sessionResult, pollResult] = await Promise.all([
    getSessions(part),
    getPolls(part),
  ]);

  if (sessionResult.error) {
    console.error("세션 초기 로드 오류:", sessionResult.error);
  }
  if (pollResult.error) {
    console.error("투표 초기 로드 오류:", pollResult.error);
  }

  return (
    <MainDashboard
      initialSessions={sessionResult.data ?? []}
      initialPolls={pollResult.data ?? []}
      initialPart={part}
    />
  );
}
