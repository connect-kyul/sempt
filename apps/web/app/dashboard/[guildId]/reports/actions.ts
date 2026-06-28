"use server";

import { revalidatePath } from "next/cache";
import { canManageGuild } from "@/auth";
import { enqueueReportGeneration } from "@/lib/report-queue";
import { getOrCreateReport, type ReportPeriodValue } from "@/lib/report-service";

export async function generateReportAction(formData: FormData) {
  const guildId = String(formData.get("guildId") ?? "");
  const period = String(formData.get("period") ?? "WEEKLY") as ReportPeriodValue;
  const mode = String(formData.get("mode") ?? "now");
  if (!guildId || !(await canManageGuild(guildId))) {
    throw new Error("접근 권한이 없습니다.");
  }

  if (mode === "queue") {
    const queued = await enqueueReportGeneration({ guildId, period, requestedBy: "dashboard" });
    if (!queued.queued) {
      await getOrCreateReport(guildId, period);
    }
  } else {
    await getOrCreateReport(guildId, period);
  }

  revalidatePath(`/dashboard/${guildId}/reports`);
}
