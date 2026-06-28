import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoMembers } from "@/lib/demo-data";

export default function MembersPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-semibold">멤버 분석</h1>
      <p className="mt-2 text-sm text-muted-foreground">신뢰도 점수는 참고용이며 자동 처벌에 사용되지 않습니다.</p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>유저 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유저 ID</TableHead>
                <TableHead>활동</TableHead>
                <TableHead>평판</TableHead>
                <TableHead>신뢰도</TableHead>
                <TableHead>최근 활동</TableHead>
                <TableHead>위험도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>{member.userId}</TableCell>
                  <TableCell>{member.activityScore}</TableCell>
                  <TableCell>{member.reputationScore}</TableCell>
                  <TableCell>{member.trustScore}</TableCell>
                  <TableCell>{member.recent}</TableCell>
                  <TableCell>
                    <Badge>{member.trustScore < 45 ? "주의" : "정상"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
