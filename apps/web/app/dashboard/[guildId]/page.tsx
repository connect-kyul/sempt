import Link from "next/link";
import { AlertTriangle, BarChart3, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoChannels } from "@/lib/demo-data";

export default async function GuildDashboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const stats: Array<[string, string, LucideIcon]> = [
    ["서버 건강 점수", "76", BarChart3],
    ["총 멤버 수", "1,240", Users],
    ["활성 유저 수", "312", Users],
    ["이탈 위험 유저", "28", AlertTriangle]
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
            <p>이번 주 서버 건강 점수는 76점입니다. 신규 유저 정착률과 질문 채널 응답 속도를 우선 개선하세요.</p>
            <div className="flex gap-2">
              <Badge>AI 요약 대기</Badge>
              <Badge>fallback 가능</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
