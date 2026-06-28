import type {
  ActivitySignals,
  ChannelActivity,
  GrowthReport,
  GrowthReportInput,
  GuildHealthSignals,
  MemberRiskInput,
  ReputationSignals,
  ScoreWeights,
  TrustSignals
} from "./types";

export const defaultTrustWeights: ScoreWeights = {
  activity: 0.4,
  reputation: 0.35,
  violations: 0.15,
  accountStability: 0.1
};

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateActivityScore(input: ActivitySignals): number {
  const messageScore = Math.min(input.messageCount / 200, 1) * 30;
  const voiceScore = Math.min(input.voiceMinutes / 600, 1) * 20;
  const eventScore = Math.min(input.eventParticipations / 4, 1) * 15;
  const answerScore = Math.min(input.answerContributions / 20, 1) * 15;
  const attendanceScore = Math.min(input.attendanceDays / 20, 1) * 10;
  const recentScore = Math.min(input.recentActiveDays / 7, 1) * 10;
  return clampScore(messageScore + voiceScore + eventScore + answerScore + attendanceScore + recentScore);
}

export function calculateReputationScore(input: ReputationSignals): number {
  const positive = input.recommendations * 8 + input.adminPositiveNotes * 12 + input.contributionScore;
  const negative = input.warnings * 12 + input.reports * 8 + input.spamSuspicions * 15;
  return clampScore(50 + positive - negative);
}

export function calculateTrustScore(input: TrustSignals, weights: ScoreWeights = defaultTrustWeights): number {
  const violationScore = clampScore(100 - input.violationCount * 15 - (input.isTimedOut ? 20 : 0));
  const accountStability = clampScore(Math.min(input.accountAgeDays / 90, 1) * 100);
  return clampScore(
    input.activityScore * weights.activity +
      input.reputationScore * weights.reputation +
      violationScore * weights.violations +
      accountStability * weights.accountStability
  );
}

export function calculateGuildHealthScore(input: GuildHealthSignals): number {
  const warningPenalty = Math.min(input.warningRate, 1) * 12;
  const riskPenalty = Math.min(input.atRiskMemberRate, 1) * 18;
  return clampScore(
    input.activeUserRate7d * 25 +
      input.newUserFirstMessageRate * 18 +
      input.channelActivitySpread * 12 +
      input.eventParticipationRate * 15 +
      input.adminResponseScore * 18 +
      12 -
      warningPenalty -
      riskPenalty
  );
}

export function detectInactiveChannels(channels: ChannelActivity[], minMessages = 5): ChannelActivity[] {
  return channels.filter((channel) => channel.messageCount7d < minMessages).sort((a, b) => a.messageCount7d - b.messageCount7d);
}

export function detectAtRiskMembers(members: MemberRiskInput[]): MemberRiskInput[] {
  return members
    .filter((member) => member.trustScore < 45 || member.recentActiveDays === 0 || member.warnings + member.reports >= 3)
    .sort((a, b) => a.trustScore - b.trustScore);
}

export function generateGrowthSuggestions(input: GrowthReportInput): string[] {
  const suggestions: string[] = [];
  if (input.retainedNewMemberRate < 0.45) {
    suggestions.push("신규 유저가 첫 메시지를 쓰도록 온보딩 채널과 환영 질문을 개선하세요.");
  }
  if (input.inactiveChannels.length > 0) {
    suggestions.push("비활성 채널은 주제를 합치거나 주간 토론 주제를 고정해 활동을 모으세요.");
  }
  if ((input.averageResponseHours ?? 0) > 12) {
    suggestions.push("질문 채널 응답 역할과 평판 보상을 연결해 평균 응답 시간을 줄이세요.");
  }
  if (input.warnings + input.reports > 0) {
    suggestions.push("경고와 신고 증가 채널을 관리자 전용 리포트에서 먼저 확인하세요.");
  }
  if (input.eventParticipationRate < 0.25) {
    suggestions.push("짧은 투표형 이벤트나 음성 채널 미션처럼 참여 비용이 낮은 이벤트를 운영하세요.");
  }
  return suggestions.slice(0, 3);
}

export function generateWeeklyReport(input: GrowthReportInput): GrowthReport {
  const risks = [
    input.retainedNewMemberRate < 0.45 ? `신규 유저 정착률이 ${Math.round(input.retainedNewMemberRate * 100)}%로 낮습니다.` : "",
    input.inactiveChannels.length > 0 ? `최근 7일간 비활성 채널이 ${input.inactiveChannels.length}개입니다.` : "",
    input.warnings + input.reports > 0 ? `경고 ${input.warnings}건, 신고 ${input.reports}건이 기록되었습니다.` : ""
  ].filter(Boolean);

  const topChannel = input.topChannels[0]?.name ?? (input.topChannels[0] ? `채널 ${input.topChannels[0].channelId}` : "활동 채널");
  return {
    summary: `이번 주 서버 건강 점수는 ${input.healthScore}점입니다. 신규 유저 ${input.newMembers}명 중 ${Math.round(
      input.retainedNewMemberRate * 100
    )}%가 정착했고, 가장 활발한 채널은 ${topChannel}입니다.`,
    risks: risks.length > 0 ? risks : ["큰 위험 신호는 아직 감지되지 않았습니다."],
    suggestions: generateGrowthSuggestions(input),
    fallbackUsed: true
  };
}
