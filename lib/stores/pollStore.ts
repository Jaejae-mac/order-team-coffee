/**
 * 투표 목록 저장소 (Zustand)
 * - 서버에서 가져온 투표 목록을 클라이언트 메모리에 보관
 * - Realtime 이벤트 수신 시 이 스토어를 직접 업데이트하여 화면을 갱신
 */
"use client";

import { create } from "zustand";
import type { Poll, PollStatus, PartId } from "@/types";

interface PollStore {
  polls: Poll[];
  isLoading: boolean;
  error: string | null;

  // 전체 목록 교체 (초기 로드 시)
  setPolls: (polls: Poll[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 단일 투표 추가 (새 투표 생성 시)
  addPoll: (poll: Poll) => void;

  // 투표 상태 업데이트 (마감/재오픈 시)
  updatePollStatus: (pollId: string, status: PollStatus) => void;

  // 투표 목록에서 제거 (삭제 시)
  removePoll: (pollId: string) => void;

  // Realtime: 서버에서 투표 변경이 감지되면 업데이트 (options 없이 기본 필드만 업데이트)
  upsertPoll: (poll: Omit<Poll, "options">) => void;

  // Realtime: 새로운 투표 기록이 들어오면 해당 선택지의 결과를 실시간으로 반영
  addVoteToPoll: (pollId: string, optionId: string, voter: { name: string; part: PartId }) => void;

  // 재투표: voter를 기존 선택지에서 제거하고 새 선택지에 추가 (Realtime UPDATE 이벤트에서도 사용)
  changeVoteInPoll: (pollId: string, newOptionId: string, voter: { name: string; part: PartId }) => void;

  // Realtime DELETE 이벤트: 특정 선택지에서 voter 제거 (복수선택 재투표 시 기존 표 삭제 단계)
  removeVoteFromPoll: (pollId: string, optionId: string, voterName: string) => void;

  // 복수선택 낙관적 업데이트: voter를 모든 선택지에서 제거 후 newOptionIds 목록에만 추가
  setVotesForVoter: (pollId: string, newOptionIds: string[], voter: { name: string; part: PartId }) => void;
}

export const usePollStore = create<PollStore>((set) => ({
  polls: [],
  isLoading: false,
  error: null,

  setPolls: (polls) => set({ polls }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addPoll: (poll) =>
    set((state) => ({ polls: [poll, ...state.polls] })),

  updatePollStatus: (pollId, status) =>
    set((state) => ({
      polls: state.polls.map((p) =>
        p.id === pollId ? { ...p, status } : p
      ),
    })),

  removePoll: (pollId) =>
    set((state) => ({
      polls: state.polls.filter((p) => p.id !== pollId),
    })),

  // Realtime에서 투표 변경을 받으면 기존 투표를 교체하거나 새로 추가
  upsertPoll: (pollData) =>
    set((state) => {
      const exists = state.polls.some((p) => p.id === pollData.id);
      if (exists) {
        return {
          polls: state.polls.map((p) =>
            p.id === pollData.id ? { ...p, ...pollData } : p
          ),
        };
      }
      // 새 투표는 선택지 없이 추가 (이후 poll_options INSERT 이벤트로 채워짐)
      return {
        polls: [{ ...pollData, options: [] }, ...state.polls],
      };
    }),

  // 재투표: 모든 선택지를 스캔해서 voter를 기존 선택지에서 제거 후 새 선택지에 추가
  // Realtime UPDATE 이벤트는 old option_id를 주지 않으므로 내부 스캔 방식으로 처리
  changeVoteInPoll: (pollId, newOptionId, voter) =>
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((opt) => {
            const voterIsHere = opt.voters.some((v) => v.name === voter.name);
            const isNewOption = opt.id === newOptionId;

            if (voterIsHere && !isNewOption) {
              // 기존 선택지에서 voter 제거
              return {
                ...opt,
                vote_count: Math.max(0, opt.vote_count - 1),
                voters: opt.voters.filter((v) => v.name !== voter.name),
              };
            }
            if (!voterIsHere && isNewOption) {
              // 새 선택지에 voter 추가
              return {
                ...opt,
                vote_count: opt.vote_count + 1,
                voters: [...opt.voters, voter],
              };
            }
            return opt;
          }),
        };
      }),
    })),

  // Realtime DELETE: 특정 선택지에서 voter 한 명 제거 (복수선택 재투표의 DELETE 단계에서 호출)
  removeVoteFromPoll: (pollId, optionId, voterName) =>
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((opt) => {
            if (opt.id !== optionId) return opt;
            return {
              ...opt,
              vote_count: Math.max(0, opt.vote_count - 1),
              voters: opt.voters.filter((v) => v.name !== voterName),
            };
          }),
        };
      }),
    })),

  // 복수선택 낙관적 업데이트: voter를 모든 선택지에서 제거한 뒤, newOptionIds에 해당하는 선택지에만 추가
  setVotesForVoter: (pollId, newOptionIds, voter) =>
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((opt) => {
            const voterIsHere  = opt.voters.some((v) => v.name === voter.name);
            const isNewOption  = newOptionIds.includes(opt.id);

            if (voterIsHere && !isNewOption) {
              // 새 선택 목록에 없는 기존 선택지 → voter 제거
              return {
                ...opt,
                vote_count: Math.max(0, opt.vote_count - 1),
                voters: opt.voters.filter((v) => v.name !== voter.name),
              };
            }
            if (!voterIsHere && isNewOption) {
              // 새로 선택한 선택지에 voter 추가
              return {
                ...opt,
                vote_count: opt.vote_count + 1,
                voters: [...opt.voters, voter],
              };
            }
            return opt;
          }),
        };
      }),
    })),

  // 실시간 투표 기록 반영: 해당 선택지의 vote_count +1, voters 배열에 추가
  addVoteToPoll: (pollId, optionId, voter) =>
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((opt) => {
            if (opt.id !== optionId) return opt;
            // 중복 방지: 이미 같은 사람이 voters에 있으면 추가하지 않음
            const alreadyVoted = opt.voters.some((v) => v.name === voter.name);
            if (alreadyVoted) return opt;
            return {
              ...opt,
              vote_count: opt.vote_count + 1,
              voters: [...opt.voters, voter],
            };
          }),
        };
      }),
    })),
}));
