import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-semibold">성장 리포트</h1>
      <section className="mt-6 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>주간 리포트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>이번 주 서버 건강 점수는 76점입니다. 신규 유저 정착률은 52%이며 #질문 채널의 활동이 가장 높습니다.</p>
            <p>개선 제안: 온보딩 질문을 짧게 만들고, 답변자 역할 보상을 평판 시스템과 연결하세요.</p>
            <div className="flex gap-2">
              <Badge>AI 요약</Badge>
              <Badge>fallback 표시 가능</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
