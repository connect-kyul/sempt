"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@sempt/database";
import { canManageGuild } from "@/auth";

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const value = Number.parseFloat(String(formData.get(key) ?? ""));
  return Number.isFinite(value) ? value : fallback;
}

export async function saveGuildSettings(formData: FormData) {
  const guildId = String(formData.get("guildId") ?? "");
  if (!guildId || !(await canManageGuild(guildId))) {
    throw new Error("접근 권한이 없습니다.");
  }

  const prisma = getPrisma();
  await prisma.guildSettings.upsert({
    where: { guildId },
    update: {
      featureEnabled: checked(formData, "featureEnabled"),
      economyEnabled: checked(formData, "economyEnabled"),
      reputationEnabled: checked(formData, "reputationEnabled"),
      trustScoreEnabled: checked(formData, "trustScoreEnabled"),
      autoModerationEnabled: checked(formData, "autoModerationEnabled"),
      aiEnabled: checked(formData, "aiEnabled"),
      allowRawMessageToLlm: checked(formData, "allowRawMessageToLlm"),
      aiProvider: String(formData.get("aiProvider") ?? "local"),
      localLlmProvider: String(formData.get("localLlmProvider") ?? "openai-compatible"),
      localLlmBaseUrl: String(formData.get("localLlmBaseUrl") ?? ""),
      localLlmModel: String(formData.get("localLlmModel") ?? ""),
      activityWeight: numberValue(formData, "activityWeight", 0.4),
      reputationWeight: numberValue(formData, "reputationWeight", 0.35),
      violationWeight: numberValue(formData, "violationWeight", 0.15),
      accountStabilityWeight: numberValue(formData, "accountStabilityWeight", 0.1),
      reportSchedule: String(formData.get("reportSchedule") ?? "weekly"),
      adminNotificationChannelId: String(formData.get("adminNotificationChannelId") ?? "")
    },
    create: {
      guildId,
      featureEnabled: checked(formData, "featureEnabled"),
      economyEnabled: checked(formData, "economyEnabled"),
      reputationEnabled: checked(formData, "reputationEnabled"),
      trustScoreEnabled: checked(formData, "trustScoreEnabled"),
      aiEnabled: checked(formData, "aiEnabled"),
      aiProvider: String(formData.get("aiProvider") ?? "local")
    }
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      action: "SETTINGS_UPDATED",
      actorUserId: "dashboard",
      metadata: { source: "settings-page" }
    }
  });

  revalidatePath(`/dashboard/${guildId}/settings`);
}
