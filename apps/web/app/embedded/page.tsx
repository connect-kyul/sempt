import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmbeddedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-5 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sempt Embedded App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Discord 안에서 서버 건강 점수, 멤버 신뢰도, 성장 리포트를 확인할 수 있도록 확장하기 위한 기본 페이지입니다.</p>
          <p>추후 Discord Embedded App SDK 초기화와 OAuth 검증을 이 경로에 연결합니다.</p>
        </CardContent>
      </Card>
    </main>
  );
}
