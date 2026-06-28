import { generateGrowthReportText } from "@sempt/ai";
import { getPrisma } from "@sempt/database";
import {
  calculateGuildHealthScore,
  detectAtRiskMembers,
  detectInactiveChannels,
  generateWeeklyReport,
  type ChannelActivity,
  type GrowthReportInput,
  type MemberRiskInput
} from "@sempt/shared";

export type ReportPeriodValue = "DAILY" | "WEEKLY" | "MONTHLY";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getReportWindow(period: ReportPeriodValue, now = new Date()) {
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);

  if (period === "WEEKLY") {
    const day = periodStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    periodStart.setDate(periodStart.getDate() - diff);
  }

  if (period === "MONTHLY") {
    periodStart.setDate(1);
  }

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + (period === "DAILY" ? 1 : period === "WEEKLY" ? 7 : 32));
  if (period === "MONTHLY") {
    periodEnd.setDate(1);
  }

  const cacheKey = `${period}:${localDateKey(periodStart)}`;
  return { periodStart, periodEnd, cacheKey };
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
  const totalMembers = Math.max(guild?.memberCount ?? members.length, 1);
  const activeMembers = members.filter((member) => member.recentActiveDays > 0).length;
  const retainedNewMemberRate = members.length > 0 ? members.filter((member) => member.messageCount > 0).length / members.length : 0;
  const atRiskMembers = detectAtRiskMembers(atRiskInput);
  const healthScore = calculateGuildHealthScore({
    activeUserRate7d: activeMembers / totalMembers,
    newUserFirstMessageRate: retainedNewMemberRate,
    channelActivitySpread: Math.min(channelActivities.filter((channel) => channel.messageCount7d > 0).length / Math.max(channelActivities.length, 1), 1),
    eventParticipationRate: 0.2,
    adminResponseScore: 0.65,
    warningRate: warningCount / totalMembers,
    atRiskMemberRate: atRiskMembers.length / totalMembers
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

export async function getOrCreateReport(guildId: string, period: ReportPeriodValue = "WEEKLY") {
  const prisma = getPrisma();
  const window = getReportWindow(period);
  const cached = await prisma.report.findUnique({
    where: { guildId_cacheKey: { guildId, cacheKey: window.cacheKey } }
  });
  if (cached) return { report: cached, cacheHit: true };

  const input = await buildGrowthReportInput(guildId);
  const baseReport = generateWeeklyReport(input);
  const aiResult = await generateGrowthReportText(input);
  const report = await prisma.report.create({
    data: {
      guildId,
      period,
      periodStart: window.periodStart,
      periodEnd: window.periodEnd,
      cacheKey: window.cacheKey,
      healthScore: input.healthScore,
      summary: baseReport.summary,
      risks: baseReport.risks,
      suggestions: baseReport.suggestions,
      aiSummary: aiResult.text,
      aiProvider: aiResult.provider,
      aiModel: aiResult.model,
      fallbackUsed: Boolean(aiResult.fallbackUsed)
    }
  });

  await prisma.aiGenerationLog.create({
    data: {
      guildId,
      provider: aiResult.provider,
      model: aiResult.model,
      promptKind: "growth-report",
      latencyMs: aiResult.latencyMs,
      success: true,
      fallbackUsed: Boolean(aiResult.fallbackUsed)
    }
  });

  return { report, cacheHit: false };
}
