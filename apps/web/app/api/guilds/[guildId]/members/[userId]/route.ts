import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@sempt/database";
import { requireGuildManager } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ guildId: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { guildId, userId } = await params;
  const access = await requireGuildManager(guildId);
  if (!access.ok) return access.response;

  const limit = await rateLimit(`delete-member:${guildId}:${access.session.user?.name ?? "user"}`, 5, 300);
  if (!limit.allowed) {
    return NextResponse.json({ error: "삭제 요청이 너무 많습니다.", resetAt: limit.resetAt }, { status: 429 });
  }

  const body = request.headers.get("content-type")?.includes("application/json")
    ? ((await request.json()) as { reason?: string })
    : {};

  const prisma = getPrisma();
  await prisma.dataDeletionRequest.create({
    data: {
      guildId,
      userId,
      requestedById: access.session.user?.name ?? "unknown",
      reason: body.reason,
      completedAt: new Date()
    }
  });
  await prisma.memberProfile.deleteMany({ where: { guildId, userId } });
  await prisma.auditLog.create({
    data: {
      guildId,
      actorUserId: access.session.user?.name,
      action: "MEMBER_DELETED",
      metadata: { userId }
    }
  });

  return NextResponse.json({ deleted: true });
}
