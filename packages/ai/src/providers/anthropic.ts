import type { AiProvider, GenerateTextInput, GenerateTextResult } from "../types";

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

export class AnthropicProvider implements AiProvider {
  name = "anthropic";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
    const startedAt = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        system: input.system ?? "너는 디스코드 서버 운영 분석가다.",
        messages: [{ role: "user", content: input.prompt }],
        temperature: input.temperature ?? 0.4,
        max_tokens: Math.min(input.maxTokens ?? 500, 500)
      })
    });
    if (!response.ok) throw new Error(`Anthropic API failed: ${response.status}`);
    const data = (await response.json()) as AnthropicResponse;
    const text = data.content?.find((part) => part.type === "text")?.text?.trim();
    if (!text) throw new Error("Anthropic API returned empty text.");
    return { text, provider: this.name, model: this.model, latencyMs: Date.now() - startedAt };
  }
}
