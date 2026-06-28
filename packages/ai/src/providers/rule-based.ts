import { generateWeeklyReport, type GrowthReportInput } from "@sempt/shared";
import type { AiProvider, GenerateTextInput, GenerateTextResult } from "../types";

export class RuleBasedProvider implements AiProvider {
  name = "rule-based";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const startedAt = Date.now();
    return {
      text: input.prompt,
      provider: this.name,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: true
    };
  }

  generateGrowthReport(input: GrowthReportInput): GenerateTextResult {
    const startedAt = Date.now();
    const report = generateWeeklyReport(input);
    return {
      text: `${report.summary}\n\n문제점\n- ${report.risks.join("\n- ")}\n\n개선안\n- ${report.suggestions.join("\n- ")}`,
      provider: this.name,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: true
    };
  }
}
