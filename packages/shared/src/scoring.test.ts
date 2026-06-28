import { describe, expect, it } from "vitest";
import {
  calculateActivityScore,
  calculateGuildHealthScore,
  calculateReputationScore,
  calculateTrustScore,
  detectAtRiskMembers,
  generateWeeklyReport
} from "./scoring";

describe("scoring", () => {
  it("keeps scores in the 0-100 range", () => {
    expect(calculateActivityScore({ messageCount: 9999, voiceMinutes: 9999, eventParticipations: 99, answerContributions: 99, attendanceDays: 99, recentActiveDays: 99 })).toBe(100);
    expect(calculateReputationScore({ recommendations: 0, adminPositiveNotes: 0, warnings: 99, reports: 99, contributionScore: 0, spamSuspicions: 99 })).toBe(0);
  });

  it("calculates trust without using LLM input", () => {
    const trust = calculateTrustScore({ activityScore: 80, reputationScore: 70, violationCount: 1, accountAgeDays: 90 });
    expect(trust).toBeGreaterThan(60);
    expect(trust).toBeLessThanOrEqual(100);
  });

  it("detects at-risk members deterministically", () => {
    const members = detectAtRiskMembers([
      { userId: "safe", trustScore: 80, recentActiveDays: 4, warnings: 0, reports: 0 },
      { userId: "risk", trustScore: 30, recentActiveDays: 0, warnings: 2, reports: 1 }
    ]);
    expect(members.map((member) => member.userId)).toEqual(["risk"]);
  });

  it("builds fallback weekly reports", () => {
    const healthScore = calculateGuildHealthScore({
      activeUserRate7d: 0.5,
      newUserFirstMessageRate: 0.3,
      channelActivitySpread: 0.4,
      eventParticipationRate: 0.2,
      adminResponseScore: 0.6,
      warningRate: 0.1,
      atRiskMemberRate: 0.2
    });
    const report = generateWeeklyReport({
      healthScore,
      newMembers: 10,
      activeMembers: 40,
      retainedNewMemberRate: 0.3,
      inactiveChannels: [{ channelId: "1", name: "#old", messageCount7d: 0, activeUsers7d: 0 }],
      topChannels: [{ channelId: "2", name: "#질문", messageCount7d: 100, activeUsers7d: 20 }],
      warnings: 2,
      reports: 1,
      averageResponseHours: 14,
      eventParticipationRate: 0.2
    });
    expect(report.fallbackUsed).toBe(true);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});
