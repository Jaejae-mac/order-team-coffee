import { z } from "zod";

/** 주문 추가/수정 시 유효성 검사 스키마 */
export const AddOrderSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(20),
  part: z.enum(["channel", "business", "pay"]),
  menu: z.string().min(1, "음료를 선택해주세요.").max(100),
  size: z.string().min(1, "사이즈를 선택해주세요.").max(20),
  temp: z.enum(["HOT", "ICE"]),
  memo: z.string().max(200, "메모는 200자 이하로 입력해주세요.").default(""),
});

export const EditOrderSchema = AddOrderSchema.partial({
  name: true,
  part: true,
});

export type AddOrderInput = z.infer<typeof AddOrderSchema>;
export type EditOrderInput = z.infer<typeof EditOrderSchema>;
