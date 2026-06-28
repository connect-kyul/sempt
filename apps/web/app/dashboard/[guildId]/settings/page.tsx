import { redirect } from "next/navigation";
import { canManageGuild } from "@/auth";
import { getPrisma } from "@sempt/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveGuildSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  if (!(await canManageGuild(guildId))) redirect("/dashboard");
  const settings = await getPrisma().guildSettings.upsert({
    where: { guildId },
    update: {},
    create: { guildId }
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-semibold">서버 설정</h1>
      <p className="mt-2 text-sm text-muted-foreground">서버별 기능 토글, 점수 가중치, AI provider를 저장합니다.</p>
      <form action={saveGuildSettings} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="guildId" value={guildId} />
        <Card>
          <CardHeader>
            <CardTitle>기능 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["featureEnabled", "서버 분석", settings.featureEnabled],
              ["economyEnabled", "경제 시스템", settings.economyEnabled],
              ["reputationEnabled", "평판 시스템", settings.reputationEnabled],
              ["trustScoreEnabled", "신뢰도 점수", settings.trustScoreEnabled],
              ["autoModerationEnabled", "자동 제재", settings.autoModerationEnabled],
              ["aiEnabled", "AI 리포트", settings.aiEnabled],
              ["allowRawMessageToLlm", "원본 메시지 LLM 전달", settings.allowRawMessageToLlm]
            ].map(([name, label, enabled]) => (
              <label key={name as string} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{label as string}</span>
                <input name={name as string} type="checkbox" defaultChecked={Boolean(enabled)} className="h-4 w-4" />
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <label className="grid gap-2">
              <span>Provider</span>
              <select name="aiProvider" defaultValue={settings.aiProvider} className="rounded-md border bg-background p-2">
                <option value="local">local</option>
                <option value="rule-based">rule-based</option>
                <option value="disabled">disabled</option>
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="gemini">gemini</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span>Local LLM Provider</span>
              <select name="localLlmProvider" defaultValue={settings.localLlmProvider} className="rounded-md border bg-background p-2">
                <option value="openai-compatible">openai-compatible</option>
                <option value="ollama">ollama</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span>Local LLM Base URL</span>
              <input name="localLlmBaseUrl" defaultValue={settings.localLlmBaseUrl ?? ""} className="rounded-md border bg-background p-2" />
            </label>
            <label className="grid gap-2">
              <span>Local LLM Model</span>
              <input name="localLlmModel" defaultValue={settings.localLlmModel ?? ""} className="rounded-md border bg-background p-2" />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>점수 가중치</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["activityWeight", "활동 점수", settings.activityWeight],
              ["reputationWeight", "평판 점수", settings.reputationWeight],
              ["violationWeight", "규정 위반 이력", settings.violationWeight],
              ["accountStabilityWeight", "계정 안정성", settings.accountStabilityWeight]
            ].map(([name, label, value]) => (
              <label key={name as string} className="grid gap-2">
                <span>{label as string}</span>
                <input name={name as string} type="number" step="0.01" min="0" max="1" defaultValue={String(value)} className="rounded-md border bg-background p-2" />
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>리포트/알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <label className="grid gap-2">
              <span>자동 리포트 주기</span>
              <select name="reportSchedule" defaultValue={settings.reportSchedule} className="rounded-md border bg-background p-2">
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span>관리자 알림 채널 ID</span>
              <input name="adminNotificationChannelId" defaultValue={settings.adminNotificationChannelId ?? ""} className="rounded-md border bg-background p-2" />
            </label>
            <Button type="submit">설정 저장</Button>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
