"use client";

import Link from "next/link";
import { Tank } from "@/types";
import { PERSONAS } from "@/lib/personas";

interface TankCardProps {
  tank: Tank;
  onDelete: (id: string) => void;
}

export default function TankCard({ tank, onDelete }: TankCardProps) {
  const statusColors = {
    idle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    discussing:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    concluded:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };

  const statusLabels = {
    idle: "대기 중",
    discussing: "토론 중",
    concluded: "완료",
  };

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={() => onDelete(tank.id)}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <Link href={`/tank/${tank.id}`}>
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tank.status]}`}
          >
            {statusLabels[tank.status]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tank.engine === "chatgpt"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          }`}>
            {tank.engine === "chatgpt" ? "GPT" : "Claude"}
          </span>
          <span className="text-xs text-zinc-400">
            {new Date(tank.createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {tank.topic}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {tank.description}
        </p>
        <div className="flex items-center gap-1">
          {tank.members.map((role) => (
            <span
              key={role}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-zinc-800"
              title={PERSONAS[role].name}
            >
              {PERSONAS[role].emoji}
            </span>
          ))}
          <span className="ml-2 text-xs text-zinc-400">
            {tank.messages.length}개 메시지
          </span>
        </div>
      </Link>
    </div>
  );
}
