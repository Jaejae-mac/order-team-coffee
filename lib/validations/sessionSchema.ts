import { z } from "zod";

/** 세션 생성 시 유효성 검사 스키마 */
export const CreateSessionSchema = z.object({
  storeId: z.enum(["starbucks", "mega", "coffeebean", "custom"]),
  storeName: z.string().min(1, "매장명을 입력해주세요.").max(50),
  storeEmoji: z.string().min(1),
  storeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "올바른 색상값이 아닙니다."),
  storeBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "올바른 색상값이 아닙니다."),
  creator: z.string().min(1, "이름을 입력해주세요.").max(20),
  creatorPart: z.enum(["channel", "business", "pay"]),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
