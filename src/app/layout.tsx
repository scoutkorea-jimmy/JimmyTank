import type { Metadata } from "next";
import "./globals.css";
import { TankProvider } from "@/context/TankContext";
import { PersonaProvider } from "@/context/PersonaContext";
import Header from "@/components/Header";

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
      <body className="min-h-full flex flex-col font-sans">
        <PersonaProvider>
          <TankProvider>
            <Header />
            {children}
          </TankProvider>
        </PersonaProvider>
      </body>
    </html>
  );
}
