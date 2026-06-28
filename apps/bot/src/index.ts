import "dotenv/config";
import { createHash } from "node:crypto";
import {
  ChannelType,
  Client,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
  PermissionFlagsBits
} from "discord.js";
import { createAiProvider, generateGrowthReportText } from "@sempt/ai";
import { getConfig } from "@sempt/config";
import { getPrisma } from "@sempt/database";
import { generateWeeklyReport } from "@sempt/shared";
import { buildGrowthReportInput, ensureGuild, ensureMember, recomputeMemberScores } from "./analysis";

const config = getConfig();
const prisma = getPrisma();

if (!config.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is required.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

function hasManageGuild(interaction: ChatInputCommandInteraction): boolean {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

function hashDisplayName(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

client.once("ready", () => {
  console.log(`Sempt bot logged in as ${client.user?.tag ?? "unknown"}.`);
});

client.on("guildCreate", async (guild) => {
  await ensureGuild(guild.id, guild.name, guild.memberCount);
});

client.on("guildMemberAdd", async (member) => {
  await ensureGuild(member.guild.id, member.guild.name, member.guild.memberCount);
  await prisma.memberProfile.upsert({
    where: { guildId_userId: { guildId: member.guild.id, userId: member.id } },
    update: { joinedAt: member.joinedAt ?? new Date(), displayNameHash: hashDisplayName(member.displayName) },
    create: {
      guildId: member.guild.id,
      userId: member.id,
      joinedAt: member.joinedAt ?? new Date(),
      displayNameHash: hashDisplayName(member.displayName)
    }
  });
});

client.on("guildMemberRemove", async (member) => {
  await prisma.memberProfile.updateMany({
    where: { guildId: member.guild.id, userId: member.id },
    data: { deletedAt: new Date() }
  });
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  await ensureGuild(message.guild.id, message.guild.name, message.guild.memberCount);
  await ensureMember(message.guild.id, message.author.id);
  await prisma.memberProfile.update({
    where: { guildId_userId: { guildId: message.guild.id, userId: message.author.id } },
    data: { messageCount: { increment: 1 }, recentActiveDays: 1, lastActiveAt: new Date() }
  });
  await prisma.memberActivity.create({
    data: { guildId: message.guild.id, userId: message.author.id, type: "MESSAGE", value: 1 }
  });
  if (message.channel.type === ChannelType.GuildText) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.channelMetric.upsert({
      where: {
        guildId_channelId_metricDate: {
          guildId: message.guild.id,
          channelId: message.channel.id,
          metricDate: today
        }
      },
      update: { messageCount: { increment: 1 }, channelName: message.channel.name },
      create: {
        guildId: message.guild.id,
        channelId: message.channel.id,
        channelName: message.channel.name,
        metricDate: today,
        messageCount: 1,
        activeUsers: 1
      }
    });
  }
  await recomputeMemberScores(message.guild.id, message.author.id);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const userId = newState.member?.id ?? oldState.member?.id;
  const guildId = newState.guild.id;
  if (!userId) return;
  await ensureMember(guildId, userId);
  if (!oldState.channelId && newState.channelId) {
    await prisma.voiceSession.create({
      data: { guildId, userId, channelId: newState.channelId, joinedAt: new Date() }
    });
  }
  if (oldState.channelId && !newState.channelId) {
    const session = await prisma.voiceSession.findFirst({
      where: { guildId, userId, channelId: oldState.channelId, leftAt: null },
      orderBy: { joinedAt: "desc" }
    });
    if (!session) return;
    const leftAt = new Date();
    const durationSec = Math.max(0, Math.floor((leftAt.getTime() - session.joinedAt.getTime()) / 1000));
    await prisma.voiceSession.update({ where: { id: session.id }, data: { leftAt, durationSec } });
    await prisma.memberProfile.update({
      where: { guildId_userId: { guildId, userId } },
      data: { voiceMinutes: { increment: Math.floor(durationSec / 60) }, lastActiveAt: leftAt }
    });
    await recomputeMemberScores(guildId, userId);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "sempt" || !interaction.guild) return;
  const subcommand = interaction.options.getSubcommand();
  await ensureGuild(interaction.guild.id, interaction.guild.name, interaction.guild.memberCount);

  if (["scan", "report", "recommend", "warn", "settings"].includes(subcommand) && !hasManageGuild(interaction)) {
    await interaction.reply({ content: "이 명령어는 서버 관리 권한이 필요합니다.", ephemeral: true });
    return;
  }

  if (subcommand === "scan") {
    const input = await buildGrowthReportInput(interaction.guild.id);
    await interaction.reply(`서버 건강 점수는 ${input.healthScore}점입니다. 활성 유저 ${input.activeMembers}명, 비활성 채널 ${input.inactiveChannels.length}개가 감지되었습니다.`);
    return;
  }

  if (subcommand === "report") {
    await interaction.deferReply();
    const input = await buildGrowthReportInput(interaction.guild.id);
    const baseReport = generateWeeklyReport(input);
    const aiResult = await generateGrowthReportText(input);
    await prisma.report.create({
      data: {
        guildId: interaction.guild.id,
        period: "WEEKLY",
        periodStart: new Date(Date.now() - 7 * 86400000),
        periodEnd: new Date(),
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
    await interaction.editReply(`**Sempt 주간 리포트**\n${aiResult.text}\n\nAI Provider: ${aiResult.provider}${aiResult.fallbackUsed ? " (fallback)" : ""}`);
    return;
  }

  if (subcommand === "member") {
    const target = interaction.options.getUser("user") ?? interaction.user;
    if (target.id !== interaction.user.id && !hasManageGuild(interaction)) {
      await interaction.reply({ content: "일반 유저는 자신의 정보만 확인할 수 있습니다.", ephemeral: true });
      return;
    }
    const member = await recomputeMemberScores(interaction.guild.id, target.id);
    await interaction.reply({
      content: `활동 점수 ${member.activityScore}점, 평판 점수 ${member.reputationScore}점, 신뢰도 ${member.trustScore}점입니다. 신뢰도는 관리자 참고용이며 자동 처벌에 사용되지 않습니다.`,
      ephemeral: true
    });
    return;
  }

  if (subcommand === "recommend") {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    await ensureMember(interaction.guild.id, target.id);
    await prisma.reputationEvent.create({
      data: { guildId: interaction.guild.id, userId: target.id, actorUserId: interaction.user.id, reason }
    });
    await recomputeMemberScores(interaction.guild.id, target.id);
    await interaction.reply(`${target} 유저에게 긍정 평판을 기록했습니다.`);
    return;
  }

  if (subcommand === "warn") {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    await ensureMember(interaction.guild.id, target.id);
    await prisma.warningEvent.create({
      data: { guildId: interaction.guild.id, userId: target.id, actorUserId: interaction.user.id, reason }
    });
    await prisma.memberProfile.update({
      where: { guildId_userId: { guildId: interaction.guild.id, userId: target.id } },
      data: { warningCount: { increment: 1 } }
    });
    await recomputeMemberScores(interaction.guild.id, target.id);
    await interaction.reply({ content: `${target} 유저에게 관리자 경고를 기록했습니다. 자동 제재는 실행되지 않습니다.`, ephemeral: true });
    return;
  }

  if (subcommand === "dashboard") {
    await interaction.reply(`${config.NEXT_PUBLIC_APP_URL}/dashboard/${interaction.guild.id}`);
    return;
  }

  if (subcommand === "settings") {
    const settings = await prisma.guildSettings.findUnique({ where: { guildId: interaction.guild.id } });
    await interaction.reply({
      content: `기능: ${settings?.featureEnabled ? "켜짐" : "꺼짐"} / AI: ${settings?.aiEnabled ? "켜짐" : "꺼짐"} / 원본 메시지 LLM 전달: ${
        settings?.allowRawMessageToLlm ? "허용" : "차단"
      } / 자동 제재: ${settings?.autoModerationEnabled ? "켜짐" : "꺼짐"}`,
      ephemeral: true
    });
    return;
  }

  if (subcommand === "ai-status") {
    const provider = createAiProvider(config);
    const available = await provider.isAvailable();
    await interaction.reply({
      content: `AI Provider: ${provider.name}\n모델: ${config.LOCAL_LLM_MODEL}\n연결 가능: ${available ? "예" : "아니오"}\n기본 우선순위: 로컬 LLM -> 규칙 기반 fallback`,
      ephemeral: true
    });
  }
});

await client.login(config.DISCORD_TOKEN);
