export type Snowflake = string;

export interface ScoreWeights {
  activity: number;
  reputation: number;
  violations: number;
  accountStability: number;
}

export interface ActivitySignals {
  messageCount: number;
  voiceMinutes: number;
  eventParticipations: number;
  answerContributions: number;
  attendanceDays: number;
  recentActiveDays: number;
}

export interface ReputationSignals {
  recommendations: number;
  adminPositiveNotes: number;
  warnings: number;
  reports: number;
  contributionScore: number;
  spamSuspicions: number;
}

export interface TrustSignals {
  activityScore: number;
  reputationScore: number;
  violationCount: number;
  accountAgeDays: number;
  isTimedOut?: boolean;
}

export interface GuildHealthSignals {
  activeUserRate7d: number;
  newUserFirstMessageRate: number;
  channelActivitySpread: number;
  eventParticipationRate: number;
  adminResponseScore: number;
  warningRate: number;
  atRiskMemberRate: number;
}

export interface ChannelActivity {
  channelId: Snowflake;
  name?: string;
  messageCount7d: number;
  activeUsers7d: number;
}

export interface MemberRiskInput {
  userId: Snowflake;
  displayName?: string;
  trustScore: number;
  recentActiveDays: number;
  warnings: number;
  reports: number;
}

export interface GrowthReportInput {
  healthScore: number;
  newMembers: number;
  activeMembers: number;
  retainedNewMemberRate: number;
  inactiveChannels: ChannelActivity[];
  topChannels: ChannelActivity[];
  warnings: number;
  reports: number;
  averageResponseHours?: number;
  eventParticipationRate: number;
}

export interface GrowthReport {
  summary: string;
  risks: string[];
  suggestions: string[];
  fallbackUsed: boolean;
}
