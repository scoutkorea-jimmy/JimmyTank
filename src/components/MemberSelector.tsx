"use client";

import { MemberRole } from "@/types";
import { PERSONAS, ALL_ROLES } from "@/lib/personas";

interface MemberSelectorProps {
  selected: MemberRole[];
  onChange: (roles: MemberRole[]) => void;
}

export default function MemberSelector({
  selected,
  onChange,
}: MemberSelectorProps) {
  const toggle = (role: MemberRole) => {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ALL_ROLES.map((role) => {
        const persona = PERSONAS[role];
        const isSelected = selected.includes(role);
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
            }`}
          >
            <span className="text-3xl">{persona.emoji}</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {persona.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {persona.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
