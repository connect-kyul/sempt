"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@sempt/database";
import { canManageGuild } from "@/auth";

export async function deleteMemberData(formData: FormData) {
  const guildId = String(formData.get("guildId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!guildId || !userId || !(await canManageGuild(guildId))) {
    throw new Error("접근 권한이 없습니다.");
  }

  const prisma = getPrisma();
  await prisma.dataDeletionRequest.create({
    data: {
      guildId,
      userId,
      requestedById: "dashboard",
      reason: "dashboard deletion request",
      completedAt: new Date()
    }
  });
  await prisma.memberProfile.deleteMany({ where: { guildId, userId } });
  await prisma.auditLog.create({
    data: {
      guildId,
      actorUserId: "dashboard",
      action: "MEMBER_DELETED",
      metadata: { userId }
    }
  });
  revalidatePath(`/dashboard/${guildId}/members`);
}
