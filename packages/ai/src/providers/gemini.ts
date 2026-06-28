import type { AiProvider, GenerateTextInput, GenerateTextResult } from "../types";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export class GeminiProvider implements AiProvider {
  name = "gemini";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string
  ) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    const startedAt = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${this.apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system ?? "너는 디스코드 서버 운영 분석가다." }] },
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: {
          temperature: input.temperature ?? 0.4,
          maxOutputTokens: Math.min(input.maxTokens ?? 500, 500)
        }
      })
    });
    if (!response.ok) throw new Error(`Gemini API failed: ${response.status}`);
    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini API returned empty text.");
    return { text, provider: this.name, model: this.model, latencyMs: Date.now() - startedAt };
  }
}
