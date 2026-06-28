import Link from "next/link";
import { redirect } from "next/navigation";
import { Server } from "lucide-react";
import { auth, getManageableGuilds } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.discordAccessToken) redirect("/api/auth/signin");
  const guilds = await getManageableGuilds();

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
          <Link key={guild.id} href={`/dashboard/${guild.id}`}>
            <Card className="transition-colors hover:bg-secondary/40">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle>{guild.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">건강 점수</div>
                  <div className="mt-1 text-2xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-muted-foreground">멤버</div>
                  <div className="mt-1 text-2xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-muted-foreground">상태</div>
                  <div className="mt-2">관리 가능</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {guilds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>관리 가능한 서버가 없습니다</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Discord에서 서버 관리 권한이 있는 계정으로 로그인했는지 확인하세요.</CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
