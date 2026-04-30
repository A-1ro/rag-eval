import { z } from "zod";

export const ChunkSchema = z.object({
  content: z.string(),
  source: z.string().nullish(),
});
export type Chunk = z.infer<typeof ChunkSchema>;

export const TrackRequestSchema = z.object({
  question: z.string(),
  answer: z.string(),
  chunks: z.array(ChunkSchema).nullish(),
  latency_ms: z.number().int().nullish(),
});
export type TrackRequest = z.infer<typeof TrackRequestSchema>;

export const FeedbackRequestSchema = z.object({
  evaluation_id: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().nullish(),
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const StatsQuerySchema = z.object({
  key_id: z.string().uuid(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type StatsQuery = z.infer<typeof StatsQuerySchema>;

export const CreateKeyRequestSchema = z.object({
  name: z.string().nullish(),
});
export type CreateKeyRequest = z.infer<typeof CreateKeyRequestSchema>;

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
