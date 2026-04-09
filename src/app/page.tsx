"use client";

import Link from "next/link";
import { PERSONAS, ALL_ROLES } from "@/lib/personas";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mb-6 text-7xl">🐟</div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            JimmyTank
          </h1>
          <p className="mb-2 text-xl text-zinc-600 dark:text-zinc-400">
            AI 전문가 토론 플랫폼
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
            마케팅, 재무, 기술, 법률, 전략, 크리에이티브 — 6명의 AI 전문가가
            당신의 아이디어를 다각도로 검토하고 토론합니다.
            <br />
            언제든 끼어들어 의견을 제시하고, AI의 반박도 받아보세요.
          </p>
          <Link
            href="/tank"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-blue-700"
          >
            🚀 시작하기
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            어떻게 작동하나요?
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "주제 설정",
                desc: "토론하고 싶은 아이디어나 비즈니스 주제를 입력하세요.",
                emoji: "💡",
              },
              {
                step: "2",
                title: "멤버 선택",
                desc: "어떤 전문가들이 토론에 참여할지 선택하세요.",
                emoji: "👥",
              },
              {
                step: "3",
                title: "AI 토론",
                desc: "전문가들이 각자 관점에서 분석하고 의견을 교환합니다.",
                emoji: "💬",
              },
              {
                step: "4",
                title: "개입 & 결론",
                desc: "언제든 의견을 제시하고, AI의 반박도 받아보세요.",
                emoji: "🎯",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl dark:bg-blue-900">
                  {item.emoji}
                </div>
                <div className="mb-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  STEP {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members Preview */}
      <section className="bg-zinc-50 py-20 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            AI 전문가 패널
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ALL_ROLES.map((role) => {
              const p = PERSONAS[role];
              return (
                <div
                  key={role}
                  className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-4xl">{p.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {p.title}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-zinc-500">
          <p>🐟 JimmyTank — AI 전문가 토론 플랫폼</p>
          <p className="mt-1">Powered by Claude API</p>
        </div>
      </footer>
    </div>
  );
}
