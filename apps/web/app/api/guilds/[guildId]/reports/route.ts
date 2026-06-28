import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@sempt/database";
import { requireGuildManager } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { enqueueReportGeneration } from "@/lib/report-queue";
import { getOrCreateReport, type ReportPeriodValue } from "@/lib/report-service";

type Params = { params: Promise<{ guildId: string }> };

function parsePeriod(value: string | null): ReportPeriodValue {
  if (value === "DAILY" || value === "MONTHLY") return value;
  return "WEEKLY";
}

export async function GET(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await requireGuildManager(guildId);
  if (!access.ok) return access.response;

  const period = parsePeriod(request.nextUrl.searchParams.get("period"));
  const reports = await getPrisma().report.findMany({
    where: { guildId, period },
    orderBy: { periodStart: "desc" },
    take: 20
  });
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const access = await requireGuildManager(guildId);
  if (!access.ok) return access.response;

  const limit = await rateLimit(`report:${guildId}:${access.session.user?.name ?? "user"}`, 10, 300);
  if (!limit.allowed) {
    return NextResponse.json({ error: "리포트 생성 요청이 너무 많습니다.", resetAt: limit.resetAt }, { status: 429 });
  }

  const body = request.headers.get("content-type")?.includes("application/json")
    ? ((await request.json()) as { period?: ReportPeriodValue; mode?: "queue" | "now" })
    : {};
  const period = body.period ?? "WEEKLY";

  if (body.mode === "queue") {
    const queued = await enqueueReportGeneration({ guildId, period, requestedBy: access.session.user?.name ?? undefined });
    if (queued.queued) {
      return NextResponse.json({ queued: true, job: queued.job }, { status: 202 });
    }
    const result = await getOrCreateReport(guildId, period);
    await getPrisma().reportJob.update({ where: { id: queued.job.id }, data: { status: "COMPLETED", reportId: result.report.id } });
    return NextResponse.json({ queued: false, report: result.report, cacheHit: result.cacheHit });
  }

  const result = await getOrCreateReport(guildId, period);
  return NextResponse.json({ report: result.report, cacheHit: result.cacheHit });
}
