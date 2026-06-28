import Link from "next/link";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const guilds = [
  { guildId: "demo-guild", name: "Sempt 데모 서버", health: 76, members: 1240, status: "관리 가능" }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">서버 목록</h1>
          <p className="mt-2 text-sm text-muted-foreground">관리 권한이 있는 서버만 표시하는 구조로 확장됩니다.</p>
        </div>
        <Badge>Sempt MVP</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {guilds.map((guild) => (
          <Link key={guild.guildId} href={`/dashboard/${guild.guildId}`}>
            <Card className="transition-colors hover:bg-secondary/40">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle>{guild.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">건강 점수</div>
                  <div className="mt-1 text-2xl font-semibold">{guild.health}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">멤버</div>
                  <div className="mt-1 text-2xl font-semibold">{guild.members}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">상태</div>
                  <div className="mt-2">{guild.status}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
