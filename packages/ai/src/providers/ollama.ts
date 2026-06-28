import type { AiProvider, GenerateTextInput, GenerateTextResult, LocalProviderOptions } from "../types";

interface OllamaResponse {
  response?: string;
}

export class OllamaProvider implements AiProvider {
  name = "ollama";

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
      const prompt = [input.system, input.prompt].filter(Boolean).join("\n\n");
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.options.model,
          prompt,
          stream: false,
          options: {
            temperature: input.temperature ?? 0.4,
            num_predict: Math.min(input.maxTokens ?? 500, 500)
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama endpoint failed: ${response.status}`);
      }

      const data = (await response.json()) as OllamaResponse;
      const text = data.response?.trim();
      if (!text) throw new Error("Ollama endpoint returned empty text.");

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
