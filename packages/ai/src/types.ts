export interface AiProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}

export interface GenerateTextInput {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  provider: string;
  model?: string;
  latencyMs: number;
  fallbackUsed?: boolean;
}

export interface LocalProviderOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}
