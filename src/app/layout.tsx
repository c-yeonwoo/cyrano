import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "시라노 — 자산 설계 코치",
  description:
    "돈을 어디에 나눌지 정하고, 몇 년 뒤 자산을 미리 봅니다. 모든 수치는 예시·가정.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
