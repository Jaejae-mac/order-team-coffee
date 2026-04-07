/**
 * Supabase Realtime 구독 훅 (투표)
 * - polls / poll_votes 테이블 변경을 실시간으로 감지
 * - 변경이 감지되면 pollStore를 업데이트해 화면을 자동 갱신
 *
 * 주의: 컴포넌트가 화면에 나타날 때 구독을 시작하고, 사라질 때 해제함
 */
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePollStore } from "@/lib/stores/pollStore";
import type { PartId, Poll, PollVote } from "@/types";

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
}

export function useRealtimePolls(part: PartId) {
  useEffect(() => {
    const supabase = createClient();

    // 1. polls 테이블 구독 — 파트별 필터 적용
    const pollChannel = supabase
      .channel(`polls:${part}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `creator_part=eq.${part}`,
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload<Omit<Poll, "options">>;
          if (p.eventType === "INSERT" || p.eventType === "UPDATE") {
            usePollStore.getState().upsertPoll({
              ...p.new,
              creator_part: p.new.creator_part as PartId,
              status: p.new.status as Poll["status"],
            });
          } else if (p.eventType === "DELETE" && p.old.id) {
            usePollStore.getState().removePoll(p.old.id);
          }
        }
      )
      .subscribe();

    // 2. poll_votes 테이블 구독 — 새 투표 기록을 실시간으로 반영
    const voteChannel = supabase
      .channel(`poll_votes:${part}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload<PollVote>;
          if (p.eventType === "INSERT") {
            usePollStore.getState().addVoteToPoll(
              p.new.poll_id,
              p.new.option_id,
              { name: p.new.voter_name, part: p.new.voter_part as PartId }
            );
          }
        }
      )
      .subscribe();

    // 컴포넌트가 사라질 때 구독 해제 (메모리 누수 방지)
    return () => {
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(voteChannel);
    };
  }, [part]);
}
