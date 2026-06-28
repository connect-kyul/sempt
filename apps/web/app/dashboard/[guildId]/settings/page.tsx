import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  ["서버 분석", "활성화"],
  ["평판 시스템", "활성화"],
  ["신뢰도 점수", "활성화"],
  ["자동 제재", "비활성화"],
  ["AI 리포트", "활성화"],
  ["원본 메시지 LLM 전달", "비허용"]
];

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-semibold">서버 설정</h1>
      <p className="mt-2 text-sm text-muted-foreground">서버별 기능 토글과 점수 가중치를 관리하는 화면입니다.</p>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기능 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{label}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>점수 가중치</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>활동 점수 40%</div>
            <div>평판 점수 35%</div>
            <div>규정 위반 이력 15%</div>
            <div>계정 안정성 10%</div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
