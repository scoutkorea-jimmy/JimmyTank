"use client";

import { usePersona } from "@/context/PersonaContext";

interface MemberListProps {
  members: string[];
}

export default function MemberList({ members }: MemberListProps) {
  const { getPersona } = usePersona();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        참여 멤버
      </h3>
      <div className="space-y-2">
        {members.map((id) => {
          const persona = getPersona(id);
          if (!persona) return null;
          return (
            <div
              key={id}
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
