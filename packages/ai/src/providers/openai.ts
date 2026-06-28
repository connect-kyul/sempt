import type { AiProvider, GenerateTextInput, GenerateTextResult } from "../types";

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAIProvider implements AiProvider {
  name = "openai";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    const startedAt = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: input.system ?? "너는 디스코드 서버 운영 분석가다." },
          { role: "user", content: input.prompt }
        ],
        temperature: input.temperature ?? 0.4,
        max_tokens: Math.min(input.maxTokens ?? 500, 500)
      })
    });
    if (!response.ok) throw new Error(`OpenAI API failed: ${response.status}`);
    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI API returned empty text.");
    return { text, provider: this.name, model: this.model, latencyMs: Date.now() - startedAt };
  }
}
