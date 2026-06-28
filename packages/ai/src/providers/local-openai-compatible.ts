import type { AiProvider, GenerateTextInput, GenerateTextResult, LocalProviderOptions } from "../types";

interface OpenAiCompatibleResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class LocalOpenAICompatibleProvider implements AiProvider {
  name = "local-openai-compatible";

  constructor(private readonly options: LocalProviderOptions) {}

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.generateText({ prompt: "상태 확인", maxTokens: 8 });
      return result.text.length > 0;
    } catch {
      return false;
    }
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            {
              role: "system",
              content: input.system ?? "너는 디스코드 서버 운영 분석가다. 짧고 명확한 한국어로 답한다."
            },
            { role: "user", content: input.prompt }
          ],
          temperature: input.temperature ?? 0.4,
          max_tokens: Math.min(input.maxTokens ?? 500, 500)
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Local OpenAI-compatible endpoint failed: ${response.status}`);
      }

      const data = (await response.json()) as OpenAiCompatibleResponse;
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Local OpenAI-compatible endpoint returned empty text.");

      return {
        text,
        provider: this.name,
        model: this.options.model,
        latencyMs: Date.now() - startedAt
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
