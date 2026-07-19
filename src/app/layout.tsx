import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import "./globals.css";

const display = Nanum_Myeongjo({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "시라노 — 자산 설계 코치",
  description:
    "내 재테크 엔진을 직접 조립하고, n년 뒤 자산을 미리 본다. 모든 수치는 예시·가정.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={display.variable}>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
