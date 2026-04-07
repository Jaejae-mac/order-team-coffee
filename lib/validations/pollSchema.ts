/**
 * 투표 관련 Zod 검증 스키마
 * - 투표 생성 시 입력값 유효성 검사
 * - 투표 참여 시 입력값 유효성 검사
 */
import { z } from "zod";

// 투표 생성 스키마
export const CreatePollSchema = z.object({
  title:       z.string().min(1, "제목을 입력해주세요.").max(100, "제목은 100자 이내로 입력해주세요."),
  description: z.string().max(500, "내용은 500자 이내로 입력해주세요.").default(""),
  options: z
    .array(z.string().min(1, "선택지를 입력해주세요.").max(100, "선택지는 100자 이내로 입력해주세요."))
    .min(2, "선택지를 2개 이상 입력해주세요.")
    .max(10, "선택지는 최대 10개까지 입력 가능합니다."),
  closesAt:    z.string().min(1, "마감 기한을 입력해주세요."),  // ISO 8601 문자열
  creator:     z.string().min(1).max(20),
  creatorPart: z.enum(["channel", "business", "pay"]),
});

// 투표 참여 스키마
export const CastVoteSchema = z.object({
  pollId:    z.string().uuid("올바른 투표 ID가 아닙니다."),
  optionId:  z.string().uuid("올바른 선택지 ID가 아닙니다."),
  voterName: z.string().min(1).max(20),
  voterPart: z.enum(["channel", "business", "pay"]),
});

export type CreatePollInput = z.infer<typeof CreatePollSchema>;
export type CastVoteInput   = z.infer<typeof CastVoteSchema>;
