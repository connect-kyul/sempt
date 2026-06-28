import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, BarChart3, Users, type LucideIcon } from "lucide-react";
import { canManageGuild } from "@/auth";
import { getPrisma } from "@sempt/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoChannels } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function GuildDashboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  if (!(await canManageGuild(guildId))) redirect("/dashboard");

  const prisma = getPrisma();
  const guild = await prisma.guild.findUnique({ where: { guildId } });
  const latestMetric = await prisma.guildMetric.findFirst({ where: { guildId }, orderBy: { metricDate: "desc" } });
  const latestReport = await prisma.report.findFirst({ where: { guildId }, orderBy: { createdAt: "desc" } });
  const atRiskMembers = await prisma.memberProfile.count({ where: { guildId, trustScore: { lt: 45 }, deletedAt: null } });
  const stats: Array<[string, string, LucideIcon]> = [
    ["서버 건강 점수", String(latestMetric?.healthScore ?? latestReport?.healthScore ?? "-"), BarChart3],
    ["총 멤버 수", String(latestMetric?.totalMembers ?? guild?.memberCount ?? "-"), Users],
    ["활성 유저 수", String(latestMetric?.activeMembers ?? "-"), Users],
    ["이탈 위험 유저", String(latestMetric?.atRiskMembers ?? atRiskMembers), AlertTriangle]
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">서버 대시보드</h1>
          <p className="mt-2 text-sm text-muted-foreground">{guildId}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/${guildId}/members`} className="text-sm text-primary">멤버</Link>
          <Link href={`/dashboard/${guildId}/settings`} className="text-sm text-primary">설정</Link>
          <Link href={`/dashboard/${guildId}/reports`} className="text-sm text-primary">리포트</Link>
        </div>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>채널별 활동량</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoChannels.map((channel) => (
              <div key={channel.channelId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{channel.name}</span>
                  <span className="text-muted-foreground">{channel.messageCount7d} messages</span>
                </div>
                <div className="h-2 rounded bg-secondary">
                  <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(channel.messageCount7d / 4, 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>성장 리포트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{latestReport?.aiSummary ?? "아직 생성된 리포트가 없습니다. 리포트 페이지에서 새 리포트를 생성하세요."}</p>
            <div className="flex gap-2">
              <Badge>{latestReport?.aiProvider ?? "AI 대기"}</Badge>
              <Badge>{latestReport?.fallbackUsed ? "fallback" : "cache 가능"}</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
