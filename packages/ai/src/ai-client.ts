import { getConfig, type AppConfig } from "@sempt/config";
import type { GrowthReportInput } from "@sempt/shared";
import { LocalOpenAICompatibleProvider } from "./providers/local-openai-compatible";
import { OllamaProvider } from "./providers/ollama";
import { RuleBasedProvider } from "./providers/rule-based";
import { DisabledAiProvider } from "./providers/disabled";
import type { AiProvider, GenerateTextResult } from "./types";

export function createAiProvider(config: AppConfig = getConfig()): AiProvider {
  if (config.AI_PROVIDER === "disabled" || !config.LOCAL_LLM_ENABLED) {
    return new DisabledAiProvider();
  }

  if (config.AI_PROVIDER === "rule-based") {
    return new RuleBasedProvider();
  }

  if (config.AI_PROVIDER === "local") {
    const options = {
      baseUrl: config.LOCAL_LLM_BASE_URL,
      model: config.LOCAL_LLM_MODEL,
      timeoutMs: config.LOCAL_LLM_TIMEOUT_MS
    };
    return config.LOCAL_LLM_PROVIDER === "ollama" ? new OllamaProvider(options) : new LocalOpenAICompatibleProvider(options);
  }

  return new DisabledAiProvider();
}

export function buildGrowthReportPrompt(input: GrowthReportInput): string {
  return [
    "다음 지표를 바탕으로 한국어 서버 운영 리포트를 작성해라.",
    `- 건강 점수: ${input.healthScore}`,
    `- 신규 유저 수: ${input.newMembers}`,
    `- 활성 유저 수: ${input.activeMembers}`,
    `- 신규 유저 정착률: ${Math.round(input.retainedNewMemberRate * 100)}%`,
    `- 비활성 채널 수: ${input.inactiveChannels.length}`,
    `- 경고 수: ${input.warnings}`,
    `- 신고 수: ${input.reports}`,
    `- 평균 응답 시간: ${input.averageResponseHours ?? 0}시간`,
    `- 이벤트 참여율: ${Math.round(input.eventParticipationRate * 100)}%`,
    "",
    "출력 형식:",
    "1. 요약 2문장",
    "2. 문제점 3개",
    "3. 개선안 3개",
    "각 문장은 짧게 작성한다. 원본 메시지나 개인정보를 추측하지 않는다."
  ].join("\n");
}

export async function generateGrowthReportText(input: GrowthReportInput, provider = createAiProvider()): Promise<GenerateTextResult> {
  const fallback = new RuleBasedProvider();
  try {
    if (!(await provider.isAvailable())) {
      return fallback.generateGrowthReport(input);
    }
    return await provider.generateText({
      system: "너는 디스코드 서버 운영 분석가다. 짧고 명확한 한국어로 답한다.",
      prompt: buildGrowthReportPrompt(input),
      temperature: 0.4,
      maxTokens: 500
    });
  } catch {
    return fallback.generateGrowthReport(input);
  }
}
