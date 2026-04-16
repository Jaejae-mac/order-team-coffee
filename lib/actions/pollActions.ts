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
  ChangeVoteSchema,
  CastMultipleVotesSchema,
  CreateDateCollectPollSchema,
  type CreatePollInput,
  type CastVoteInput,
  type ChangeVoteInput,
  type CastMultipleVotesInput,
  type CreateDateCollectPollInput,
} from "@/lib/validations/pollSchema";
import { getWeekdaysInMonth } from "@/lib/utils/dateUtils";
import type { ActionResult, Poll, PollOption, PollType, PartId } from "@/types";

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
  poll_type?: string;
  target_month?: string | null;
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
    id:             raw.id,
    title:          raw.title,
    description:    raw.description,
    creator:        raw.creator,
    creator_part:   raw.creator_part as PartId,
    status:         raw.status as Poll["status"],
    closes_at:      raw.closes_at,
    allow_multiple: (raw as { allow_multiple?: boolean }).allow_multiple ?? false,
    poll_type:      (raw.poll_type ?? "regular") as PollType,
    target_month:   raw.target_month ?? undefined,
    created_at:     raw.created_at,
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
        title:          d.title,
        description:    d.description,
        creator:        d.creator,
        creator_part:   d.creatorPart,
        status:         "open",
        closes_at:      d.closesAt,
        allow_multiple: d.allowMultiple,
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
      creator_part:   poll.creator_part as PartId,
      status:         poll.status as Poll["status"],
      allow_multiple: poll.allow_multiple ?? false,
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

/** 복수선택 투표 참여/재투표 — Delete-then-Insert 방식으로 첫투표와 재투표를 통합 처리 */
export async function castMultipleVotes(input: CastMultipleVotesInput): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = CastMultipleVotesSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    // 1. 투표 상태 및 복수선택 여부 확인
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("status, closes_at, allow_multiple")
      .eq("id", d.pollId)
      .single();

    if (fetchError || !poll) return { data: null, error: "투표를 찾을 수 없습니다." };
    if (poll.status === "closed") return { data: null, error: "마감된 투표입니다." };
    if (new Date(poll.closes_at) < new Date()) return { data: null, error: "마감 기한이 지난 투표입니다." };
    if (!poll.allow_multiple) return { data: null, error: "단일선택 투표입니다." };

    // 2. 선택한 optionIds가 이 poll의 유효한 선택지인지 검증
    const { data: validOptions, error: optError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("poll_id", d.pollId)
      .in("id", d.optionIds);

    if (optError) throw optError;
    if (!validOptions || validOptions.length !== d.optionIds.length) {
      return { data: null, error: "유효하지 않은 선택지가 포함되어 있습니다." };
    }

    // 3. 기존 투표 기록 전부 삭제 (재투표 포함한 통합 처리)
    const { error: deleteError } = await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", d.pollId)
      .eq("voter_name", d.voterName);

    if (deleteError) throw deleteError;

    // 4. 새 선택지들을 일괄 삽입
    const insertRows = d.optionIds.map((optionId) => ({
      poll_id:    d.pollId,
      option_id:  optionId,
      voter_name: d.voterName,
      voter_part: d.voterPart,
    }));

    const { error: insertError } = await supabase.from("poll_votes").insert(insertRows);

    if (insertError) {
      if (insertError.code === "23505") return { data: null, error: "중복 투표가 감지되었습니다." };
      throw insertError;
    }

    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "복수선택 투표에 실패했습니다.");
    return { data: null, error: message };
  }
}

/** 재투표 — 기존 투표를 다른 선택지로 변경 (마감 전에만 가능) */
export async function changeVote(input: ChangeVoteInput): Promise<ActionResult<void>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = ChangeVoteSchema.safeParse(input);
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
    if (poll.status === "closed") return { data: null, error: "마감된 투표는 변경할 수 없습니다." };
    if (new Date(poll.closes_at) < new Date()) return { data: null, error: "마감 기한이 지난 투표입니다." };

    // 2. 기존 투표 기록 존재 확인
    const { data: existing, error: existingError } = await supabase
      .from("poll_votes")
      .select("id, option_id")
      .eq("poll_id", d.pollId)
      .eq("voter_name", d.voterName)
      .single();

    if (existingError || !existing) return { data: null, error: "투표 기록을 찾을 수 없습니다. 먼저 투표해주세요." };
    if (existing.option_id === d.newOptionId) return { data: null, error: "이미 같은 선택지에 투표하셨습니다." };

    // 3. 투표 선택지 변경 (option_id만 UPDATE)
    const { error } = await supabase
      .from("poll_votes")
      .update({ option_id: d.newOptionId })
      .eq("poll_id", d.pollId)
      .eq("voter_name", d.voterName);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (err) {
    const message = getErrorMessage(err, "투표 변경에 실패했습니다.");
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

/** 회식날짜취합 투표 생성 — 선택 월의 영업일(월~금)을 선택지로 자동 생성 */
export async function createDateCollectPoll(
  input: CreateDateCollectPollInput
): Promise<ActionResult<Poll>> {
  const auth = await requireAuth();
  if (!auth.ok) return { data: null, error: auth.error };

  try {
    const parsed = CreateDateCollectPollSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const supabase = createServerClient();
    const d = parsed.data;

    // 1. 해당 월의 영업일(월~금) 목록 계산
    const [year, month] = d.targetMonth.split("-").map(Number);
    const weekdays = getWeekdaysInMonth(year, month);
    if (weekdays.length === 0) {
      return { data: null, error: "해당 월에 영업일이 없습니다." };
    }

    // 2. 투표 생성 (poll_type: date_collect, allow_multiple: true 고정)
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title:          d.title,
        description:    d.description,
        creator:        d.creator,
        creator_part:   d.creatorPart,
        status:         "open",
        closes_at:      d.closesAt,
        allow_multiple: true,
        poll_type:      "date_collect",
        target_month:   d.targetMonth,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // 3. 영업일 목록을 선택지로 일괄 생성 (label = 'YYYY-MM-DD', position = 순서)
    const optionRows = weekdays.map((dateStr, idx) => ({
      poll_id:  poll.id,
      label:    dateStr,
      position: idx,
    }));

    const { data: options, error: optError } = await supabase
      .from("poll_options")
      .insert(optionRows)
      .select();

    if (optError) throw optError;

    const result: Poll = {
      ...poll,
      creator_part:   poll.creator_part as PartId,
      status:         poll.status as Poll["status"],
      allow_multiple: true,
      poll_type:      "date_collect",
      target_month:   poll.target_month ?? undefined,
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
    const message = getErrorMessage(err, "날짜취합 투표 생성에 실패했습니다.");
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
