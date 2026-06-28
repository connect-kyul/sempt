import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@sempt/database";
import { requireGuildManager } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ guildId: string }> };

function parseBoolean(value: unknown): boolean | undefined {
  if (value === true || value === "true" || value === "on") return true;
  if (value === false || value === "false" || value === "off") return false;
  return undefined;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await requireGuildManager(guildId);
  if (!access.ok) return access.response;

  const settings = await getPrisma().guildSettings.upsert({
    where: { guildId },
    update: {},
    create: { guildId }
  });
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await requireGuildManager(guildId);
  if (!access.ok) return access.response;

  const limit = await rateLimit(`settings:${guildId}:${access.session.user?.name ?? "user"}`, 20, 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: "요청이 너무 많습니다.", resetAt: limit.resetAt }, { status: 429 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const prisma = getPrisma();
  const settings = await prisma.guildSettings.upsert({
    where: { guildId },
    update: {
      featureEnabled: parseBoolean(body.featureEnabled),
      economyEnabled: parseBoolean(body.economyEnabled),
      reputationEnabled: parseBoolean(body.reputationEnabled),
      trustScoreEnabled: parseBoolean(body.trustScoreEnabled),
      autoModerationEnabled: parseBoolean(body.autoModerationEnabled),
      aiEnabled: parseBoolean(body.aiEnabled),
      allowRawMessageToLlm: parseBoolean(body.allowRawMessageToLlm),
      aiProvider: typeof body.aiProvider === "string" ? body.aiProvider : undefined,
      localLlmProvider: typeof body.localLlmProvider === "string" ? body.localLlmProvider : undefined,
      localLlmBaseUrl: typeof body.localLlmBaseUrl === "string" ? body.localLlmBaseUrl : undefined,
      localLlmModel: typeof body.localLlmModel === "string" ? body.localLlmModel : undefined,
      activityWeight: typeof body.activityWeight === "number" ? body.activityWeight : undefined,
      reputationWeight: typeof body.reputationWeight === "number" ? body.reputationWeight : undefined,
      violationWeight: typeof body.violationWeight === "number" ? body.violationWeight : undefined,
      accountStabilityWeight: typeof body.accountStabilityWeight === "number" ? body.accountStabilityWeight : undefined,
      reportSchedule: typeof body.reportSchedule === "string" ? body.reportSchedule : undefined,
      adminNotificationChannelId: typeof body.adminNotificationChannelId === "string" ? body.adminNotificationChannelId : undefined
    },
    create: {
      guildId,
      aiProvider: typeof body.aiProvider === "string" ? body.aiProvider : "local"
    }
  });

  await prisma.auditLog.create({
    data: {
      guildId,
      actorUserId: access.session.user?.name,
      action: "SETTINGS_UPDATED",
      metadata: { fields: Object.keys(body) }
    }
  });

  return NextResponse.json({ settings });
}
