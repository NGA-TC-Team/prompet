import { z } from "zod";

export const promptInputSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(120, "제목은 120자 이내"),
  body: z.string().min(1, "본문을 입력하세요"),
  tags: z.array(z.string().min(1).max(40)).max(20, "태그는 최대 20개"),
  sourceUrl: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), { message: "http(s) URL이어야 합니다" }),
});

export type PromptInput = z.infer<typeof promptInputSchema>;

export const promptSchema = promptInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export type Prompt = z.infer<typeof promptSchema>;

const tagColorSchema = z.enum([
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
]);

export const sharedPromptSchema = promptInputSchema
  .pick({ title: true, body: true, tags: true, sourceUrl: true })
  .extend({ tagColors: z.record(z.string(), tagColorSchema).optional() });

export type SharedPrompt = z.infer<typeof sharedPromptSchema>;
