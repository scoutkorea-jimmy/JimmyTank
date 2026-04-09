"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐟</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            JimmyTank
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/tank"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            내 Tank 목록
          </Link>
        </nav>
      </div>
    </header>
  );
}
