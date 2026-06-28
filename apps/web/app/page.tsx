import Link from "next/link";
import { Activity, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
      <nav className="flex items-center justify-between">
        <div className="text-xl font-semibold">{copy.product}</div>
        <Link href="/dashboard">
          <Button variant="secondary">{copy.dashboard}</Button>
        </Link>
      </nav>
      <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 text-sm font-medium text-primary">Local-first Discord operations</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">Sempt</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>{copy.dashboard}</Button>
            </Link>
            <Button variant="outline">{copy.invite}</Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{copy.safetyNote}</p>
        </div>
        <div className="grid gap-4">
          {[
            { icon: Activity, title: "성장 분석", text: "활성 유저, 신규 유저 정착률, 채널 활동 분산도를 추적합니다." },
            { icon: ShieldCheck, title: "신뢰도 인프라", text: "활동, 평판, 위반 이력을 결정적 함수로 계산합니다." },
            { icon: Bot, title: "로컬 LLM 우선", text: "Galaxy Tab S10 Ultra의 3B급 모델을 우선 사용하고 실패 시 fallback합니다." }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <item.icon className="h-5 w-5 text-primary" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
