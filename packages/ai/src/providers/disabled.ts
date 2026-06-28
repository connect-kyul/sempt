import type { AiProvider, GenerateTextInput, GenerateTextResult } from "../types";

export class DisabledAiProvider implements AiProvider {
  name = "disabled";

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generateText(_input: GenerateTextInput): Promise<GenerateTextResult> {
    return {
      text: "AI 요약이 비활성화되어 기본 분석만 표시됩니다.",
      provider: this.name,
      latencyMs: 0,
      fallbackUsed: true
    };
  }
}
