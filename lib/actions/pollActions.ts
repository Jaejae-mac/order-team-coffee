/**
 * 투표 관련 Server Actions
 * - 모든 DB 쓰기 작업은 service_role 키를 쓰는 서버 클라이언트를 통해 수행
 * - 각 Action 최상단에서 인증 쿠키를 확인하여 미인증 접근을 차단
 */
"use server";

/**
 * Supabase PostgrestError는 Error 인스턴스가 아닌 plain object이므로
 * instanceof Error 체크 대신 이 헬퍼를 사용해 메시지를 추출함
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import {
  CreatePollSchema,
  CastVoteSchema,
  type CreatePollInput,
  type CastVoteInput,
} from "@/lib/validations/pollSchema";
import type { ActionResult, Poll, PollOption, PartId } from "@/types";

/** 인증 확인 헬퍼 — verified 쿠키가 없으면 에러 반환 */
async function requireAuth(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const verified = cookieStore.get("verified")?.value;
  if (verified !== "true") {
    return { ok: false, error: "인증이 필요합니다." };
  }
  return { ok: true };
}

/**
 * DB에서 받은 raw 데이터를 Poll 타입으로 변환하는 헬퍼
 * - poll_options와 poll_votes를 JOIN한 결과를 처리
 */
function mapRawPoll(raw: {
  id: string;
  title: string;
  description: string;
  creator: string;
  creator_part: string;
  status: string;
  closes_at: string;
  created_at: string;
  poll_options: Array<{
    id: string;
    poll_id: string;
    label: string;
    position: number;
    created_at: string;
    poll_votes: Array<{
      id: string;
      poll_id: string;
      option_id: string;
      voter_name: string;
      voter_part: string;
      created_at: string;
    }>;
  }>;
}): Poll {
  const options: PollOption[] = (raw.poll_options ?? [])
    .sort((a, b) => a.position - b.position)
    .map((opt) => ({
      id:         opt.id,
      poll_id:    opt.poll_id,
      label:      opt.label,
      position:   opt.position,
      created_at: opt.created_at,
      vote_count: (opt.poll_votes ?? []).length,
      voters:     (opt.poll_votes ?? []).map((v) => ({
        name: v.voter_name,
        part: v.voter_part as PartId,
      })),
    }));

  return {
    id:           raw.id,
    title:        raw.title,
    description:  raw.description,
    creator:      raw.creator,
    creator_part: raw.creator_part as PartId,
    status:       raw.status as Poll["status"],
    closes_at:    raw.closes_at,
    created_at:   raw.created_at,
    options,
  };
}

/** 투표 목록 조회 — 마감된 투표를 Lazy Close 처리 후 반환 */
export async function getPolls(part: PartId): Promise<ActionResult<Poll[]>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    // 1. 마감 기한이 지났지만 아직 open인 투표를 먼저 closed로 업데이트 (Lazy Close)
    await supabase
      .from("polls")
      .update({ status: "closed" })
      .eq("creator_part", part)
      .eq("status", "open")
      .lt("closes_at", new Date().toISOString());

    // 2. 선택지와 투표 기록을 함께 조회
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*, poll_options(*, poll_votes(*))")
      .eq("creator_part", part)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!polls) return { data: [], error: null };

    return { data: polls.map(mapRawPoll), error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 목록 조회에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 투표 생성 — 투표와 선택지를 함께 생성 */
export async function createPoll(input: CreatePollInput): Promise<ActionResult<Poll>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = CreatePollSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    // 1. 투표 생성
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title:        d.title,
        description:  d.description,
        creator:      d.creator,
        creator_part: d.creatorPart,
        status:       "open",
        closes_at:    d.closesAt,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // 2. 선택지 일괄 생성 (position 순서 유지)
    const optionRows = d.options.map((label, idx) => ({
      poll_id:  poll.id,
      label,
      position: idx,
    }));

    const { data: options, error: optError } = await supabase
      .from("poll_options")
      .insert(optionRows)
      .select();

    if (optError) throw optError;

    // 새로 만든 투표는 투표 기록이 없으므로 vote_count=0, voters=[] 로 초기화
    const result: Poll = {
      ...poll,
      creator_part: poll.creator_part as PartId,
      status:       poll.status as Poll["status"],
      options: (options ?? []).map((opt) => ({
        id:         opt.id,
        poll_id:    opt.poll_id,
        label:      opt.label,
        position:   opt.position,
        created_at: opt.created_at,
        vote_count: 0,
        voters:     [],
      })),
    };

    return { data: result, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 생성에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 투표 참여 — 1인 1표 보장 (DB UNIQUE 제약 + 서버 이중 검사) */
export async function castVote(input: CastVoteInput): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = CastVoteSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    // 1. 투표 상태 확인
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("status, closes_at")
      .eq("id", d.pollId)
      .single();

    if (fetchError || !poll) return { data: null, error: "투표를 찾을 수 없습니다." };
    if (poll.status === "closed") return { data: null, error: "마감된 투표입니다." };
    if (new Date(poll.closes_at) < new Date()) return { data: null, error: "마감 기한이 지난 투표입니다." };

    // 2. 중복 투표 서버 사전 체크 (DB UNIQUE 제약 전 친절한 에러 메시지 제공)
    const { data: existing } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", d.pollId)
      .eq("voter_name", d.voterName)
      .single();

    if (existing) return { data: null, error: "이미 투표하셨습니다." };

    // 3. 투표 기록 저장
    const { error } = await supabase.from("poll_votes").insert({
      poll_id:    d.pollId,
      option_id:  d.optionId,
      voter_name: d.voterName,
      voter_part: d.voterPart,
    });

    if (error) {
      // DB UNIQUE 위반 시 (동시 투표 경합)
      if (error.code === "23505") return { data: null, error: "이미 투표하셨습니다." };
      throw error;
    }

    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 투표 마감 (open → closed) */
export async function closePoll(pollId: string): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("status")
      .eq("id", pollId)
      .single();

    if (fetchError || !poll) return { data: null, error: "투표를 찾을 수 없습니다." };
    if (poll.status === "closed") return { data: null, error: "이미 마감된 투표입니다." };

    const { error } = await supabase
      .from("polls")
      .update({ status: "closed" })
      .eq("id", pollId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 마감에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 투표 재오픈 (closed → open) — 생성자 본인만 가능 */
export async function reopenPoll(pollId: string, creatorName: string): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("status, creator")
      .eq("id", pollId)
      .single();

    if (fetchError || !poll) return { data: null, error: "투표를 찾을 수 없습니다." };
    if (poll.creator !== creatorName) return { data: null, error: "투표 생성자만 재오픈할 수 있습니다." };
    if (poll.status === "open") return { data: null, error: "이미 진행 중인 투표입니다." };

    const { error } = await supabase
      .from("polls")
      .update({ status: "open" })
      .eq("id", pollId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 재오픈에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 투표 삭제 — 생성자 본인만 가능, 연결된 선택지/기록도 cascade 삭제 */
export async function deletePoll(pollId: string, creatorName: string): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const supabase = createServerClient();

    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("creator")
      .eq("id", pollId)
      .single();

    if (fetchError || !poll) return { data: null, error: "투표를 찾을 수 없습니다." };
    if (poll.creator !== creatorName) return { data: null, error: "투표 생성자만 삭제할 수 있습니다." };

    const { error } = await supabase.from("polls").delete().eq("id", pollId);
    if (error) throw error;

    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 삭제에 실패했습니다.");
    return { data: null, error: message };
  }
}
