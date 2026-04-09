import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JimmyTank - AI 전문가 토론 플랫폼",
  description:
    "AI 전문가 페르소나들이 당신의 아이디어를 다각도로 검토하고 토론합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
