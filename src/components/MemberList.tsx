"use client";

import { MemberRole } from "@/types";
import { PERSONAS } from "@/lib/personas";

interface MemberListProps {
  members: MemberRole[];
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        참여 멤버
      </h3>
      <div className="space-y-2">
        {members.map((role) => {
          const persona = PERSONAS[role];
          return (
            <div
              key={role}
              className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
            >
              <span className="text-xl">{persona.emoji}</span>
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {persona.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {persona.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
