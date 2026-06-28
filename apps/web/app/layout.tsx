import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sempt",
  description: "디스코드 서버 활동, 평판, 신뢰도, 성장 분석 플랫폼"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
