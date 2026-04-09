"use client";

import { usePersona } from "@/context/PersonaContext";

interface MemberSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function MemberSelector({
  selected,
  onChange,
}: MemberSelectorProps) {
  const { allPersonas } = usePersona();

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {allPersonas.map((persona) => {
        const isSelected = selected.includes(persona.id);
        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => toggle(persona.id)}
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
            {persona.isCustom && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                커스텀
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
