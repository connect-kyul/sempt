import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  AI_PROVIDER: z.enum(["local", "rule-based", "disabled", "external"]).default("local"),
  LOCAL_LLM_ENABLED: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  LOCAL_LLM_PROVIDER: z.enum(["openai-compatible", "ollama"]).default("openai-compatible"),
  LOCAL_LLM_BASE_URL: z.string().default("http://localhost:11434"),
  LOCAL_LLM_MODEL: z.string().default("qwen2.5:3b"),
  LOCAL_LLM_TIMEOUT_MS: z
    .string()
    .default("30000")
    .transform((value) => Number.parseInt(value, 10)),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}
