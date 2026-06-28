import { redirect } from "next/navigation";
import { canManageGuild } from "@/auth";
import { getPrisma } from "@sempt/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateReportAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  if (!(await canManageGuild(guildId))) redirect("/dashboard");
  const prisma = getPrisma();
  const reports = await prisma.report.findMany({ where: { guildId }, orderBy: { periodStart: "desc" }, take: 10 });
  const jobs = await prisma.reportJob.findMany({ where: { guildId }, orderBy: { createdAt: "desc" }, take: 5 });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">성장 리포트</h1>
          <p className="mt-2 text-sm text-muted-foreground">기간별 리포트는 cacheKey로 재사용됩니다.</p>
        </div>
        <form action={generateReportAction} className="flex gap-2">
          <input type="hidden" name="guildId" value={guildId} />
          <select name="period" defaultValue="WEEKLY" className="rounded-md border bg-background p-2 text-sm">
            <option value="DAILY">일간</option>
            <option value="WEEKLY">주간</option>
            <option value="MONTHLY">월간</option>
          </select>
          <select name="mode" defaultValue="now" className="rounded-md border bg-background p-2 text-sm">
            <option value="now">즉시</option>
            <option value="queue">큐</option>
          </select>
          <Button type="submit">생성</Button>
        </form>
      </div>
      <section className="mt-6 grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle className="text-sm">작업 {job.cacheKey}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 text-sm text-muted-foreground">
              <Badge>{job.status}</Badge>
              {job.errorMessage ? <span>{job.errorMessage}</span> : null}
            </CardContent>
          </Card>
        ))}
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>{report.period} 리포트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{report.aiSummary ?? report.summary}</p>
              <div className="flex gap-2">
                <Badge>{report.aiProvider ?? "rule-based"}</Badge>
                <Badge>{report.fallbackUsed ? "fallback" : "AI 요약"}</Badge>
                <Badge>{report.cacheKey}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">아직 리포트가 없습니다.</CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
