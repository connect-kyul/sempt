import { getPrisma } from "@sempt/database";
import {
  calculateActivityScore,
  calculateGuildHealthScore,
  calculateReputationScore,
  calculateTrustScore,
  detectAtRiskMembers,
  detectInactiveChannels,
  type ChannelActivity,
  type GrowthReportInput,
  type MemberRiskInput
} from "@sempt/shared";

export async function ensureGuild(guildId: string, name: string, memberCount = 0) {
  const prisma = getPrisma();
  return prisma.guild.upsert({
    where: { guildId },
    update: { name, memberCount },
    create: {
      guildId,
      name,
      memberCount,
      settings: { create: {} }
    }
  });
}

export async function ensureMember(guildId: string, userId: string) {
  const prisma = getPrisma();
  return prisma.memberProfile.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId }
  });
}

export async function recomputeMemberScores(guildId: string, userId: string) {
  const prisma = getPrisma();
  const member = await ensureMember(guildId, userId);
  const activityScore = calculateActivityScore({
    messageCount: member.messageCount,
    voiceMinutes: member.voiceMinutes,
    eventParticipations: member.eventParticipations,
    answerContributions: member.answerContributions,
    attendanceDays: member.attendanceDays,
    recentActiveDays: member.recentActiveDays
  });
  const reputationScore = calculateReputationScore({
    recommendations: await prisma.reputationEvent.count({ where: { guildId, userId } }),
    adminPositiveNotes: 0,
    warnings: member.warningCount,
    reports: member.reportCount,
    contributionScore: member.answerContributions,
    spamSuspicions: 0
  });
  const trustScore = calculateTrustScore({
    activityScore,
    reputationScore,
    violationCount: member.warningCount + member.reportCount,
    accountAgeDays: member.joinedAt ? Math.max(0, (Date.now() - member.joinedAt.getTime()) / 86400000) : 30
  });

  return prisma.memberProfile.update({
    where: { guildId_userId: { guildId, userId } },
    data: { activityScore, reputationScore, trustScore }
  });
}

export async function buildGrowthReportInput(guildId: string): Promise<GrowthReportInput> {
  const prisma = getPrisma();
  const guild = await prisma.guild.findUnique({ where: { guildId } });
  const members = await prisma.memberProfile.findMany({ where: { guildId, deletedAt: null } });
  const channels = await prisma.channelMetric.findMany({
    where: { guildId },
    orderBy: [{ metricDate: "desc" }, { messageCount: "desc" }],
    take: 20
  });
  const warningCount = await prisma.warningEvent.count({ where: { guildId } });

  const channelActivities: ChannelActivity[] = channels.map((channel) => ({
    channelId: channel.channelId,
    name: channel.channelName ?? undefined,
    messageCount7d: channel.messageCount,
    activeUsers7d: channel.activeUsers
  }));
  const atRiskInput: MemberRiskInput[] = members.map((member) => ({
    userId: member.userId,
    trustScore: member.trustScore,
    recentActiveDays: member.recentActiveDays,
    warnings: member.warningCount,
    reports: member.reportCount
  }));
  const atRiskMembers = detectAtRiskMembers(atRiskInput);
  const activeMembers = members.filter((member) => member.recentActiveDays > 0).length;
  const totalMembers = Math.max(guild?.memberCount ?? members.length, 1);
  const retainedNewMemberRate = members.length > 0 ? members.filter((member) => member.messageCount > 0).length / members.length : 0;
  const healthScore = calculateGuildHealthScore({
    activeUserRate7d: activeMembers / totalMembers,
    newUserFirstMessageRate: retainedNewMemberRate,
    channelActivitySpread: Math.min(channelActivities.filter((channel) => channel.messageCount7d > 0).length / Math.max(channelActivities.length, 1), 1),
    eventParticipationRate: 0.2,
    adminResponseScore: 0.65,
    warningRate: warningCount / Math.max(totalMembers, 1),
    atRiskMemberRate: atRiskMembers.length / Math.max(totalMembers, 1)
  });

  return {
    healthScore,
    newMembers: members.filter((member) => member.joinedAt && Date.now() - member.joinedAt.getTime() < 7 * 86400000).length,
    activeMembers,
    retainedNewMemberRate,
    inactiveChannels: detectInactiveChannels(channelActivities),
    topChannels: channelActivities.sort((a, b) => b.messageCount7d - a.messageCount7d).slice(0, 3),
    warnings: warningCount,
    reports: members.reduce((sum, member) => sum + member.reportCount, 0),
    averageResponseHours: 8,
    eventParticipationRate: 0.2
  };
}
