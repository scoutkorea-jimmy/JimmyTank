"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { nanoid } from "nanoid";
import { Member, MemoryEntry, GlobalRules } from "@/types";
import { BUILT_IN_PERSONAS, ALL_BUILT_IN_IDS } from "@/lib/personas";

interface PersonaContextType {
  customPersonas: Member[];
  builtInOverrides: Record<string, Partial<Member>>;
  globalRules: GlobalRules;
  allPersonas: Member[];
  addPersona: (persona: Member) => void;
  updatePersona: (id: string, updates: Partial<Member>) => void;
  deletePersona: (id: string) => void;
  getPersona: (id: string) => Member | undefined;
  // Memory
  addMemory: (personaId: string, content: string) => void;
  updateMemory: (personaId: string, memoryId: string, content: string) => void;
  deleteMemory: (personaId: string, memoryId: string) => void;
  // Rules
  updateRules: (personaId: string, rules: string) => void;
  setGlobalRules: (rules: GlobalRules) => void;
  // Built-in overrides
  updateBuiltIn: (id: string, updates: Partial<Member>) => void;
}

const PersonaContext = createContext<PersonaContextType | null>(null);

const CUSTOM_KEY = "jimmytank-custom-personas";
const OVERRIDES_KEY = "jimmytank-builtin-overrides";
const GLOBAL_RULES_KEY = "jimmytank-global-rules";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [customPersonas, setCustomPersonas] = useState<Member[]>([]);
  const [builtInOverrides, setBuiltInOverrides] = useState<Record<string, Partial<Member>>>({});
  const [globalRules, setGlobalRulesState] = useState<GlobalRules>({ content: "" });

  useEffect(() => {
    try {
      const c = localStorage.getItem(CUSTOM_KEY);
      if (c) setCustomPersonas(JSON.parse(c));
      const o = localStorage.getItem(OVERRIDES_KEY);
      if (o) setBuiltInOverrides(JSON.parse(o));
      const g = localStorage.getItem(GLOBAL_RULES_KEY);
      if (g) setGlobalRulesState(JSON.parse(g));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customPersonas));
  }, [customPersonas]);

  useEffect(() => {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(builtInOverrides));
  }, [builtInOverrides]);

  useEffect(() => {
    localStorage.setItem(GLOBAL_RULES_KEY, JSON.stringify(globalRules));
  }, [globalRules]);

  // Merge built-in with overrides
  const builtInList = ALL_BUILT_IN_IDS.map((id) => {
    const base = BUILT_IN_PERSONAS[id as keyof typeof BUILT_IN_PERSONAS];
    const override = builtInOverrides[id] || {};
    return { ...base, ...override, id: base.id };
  });

  const allPersonas = [...builtInList, ...customPersonas];

  const addPersona = useCallback((persona: Member) => {
    setCustomPersonas((prev) => [...prev, { ...persona, isCustom: true }]);
  }, []);

  const updatePersona = useCallback((id: string, updates: Partial<Member>) => {
    // Check if built-in
    if (ALL_BUILT_IN_IDS.includes(id)) {
      setBuiltInOverrides((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), ...updates },
      }));
    } else {
      setCustomPersonas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    }
  }, []);

  const deletePersona = useCallback((id: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPersona = useCallback(
    (id: string) => allPersonas.find((p) => p.id === id),
    [allPersonas]
  );

  // Memory CRUD
  const getPersonaMutable = (personaId: string): { persona: Member; isBuiltIn: boolean } | null => {
    const persona = allPersonas.find((p) => p.id === personaId);
    if (!persona) return null;
    return { persona, isBuiltIn: ALL_BUILT_IN_IDS.includes(personaId) };
  };

  const addMemory = useCallback((personaId: string, content: string) => {
    const entry: MemoryEntry = { id: nanoid(), content, createdAt: Date.now() };
    if (ALL_BUILT_IN_IDS.includes(personaId)) {
      setBuiltInOverrides((prev) => {
        const existing = prev[personaId] || {};
        const memories = [...(existing.memories || BUILT_IN_PERSONAS[personaId as keyof typeof BUILT_IN_PERSONAS]?.memories || []), entry];
        return { ...prev, [personaId]: { ...existing, memories } };
      });
    } else {
      setCustomPersonas((prev) =>
        prev.map((p) => p.id === personaId ? { ...p, memories: [...p.memories, entry] } : p)
      );
    }
  }, []);

  const updateMemory = useCallback((personaId: string, memoryId: string, content: string) => {
    const updateMems = (mems: MemoryEntry[]) =>
      mems.map((m) => (m.id === memoryId ? { ...m, content } : m));

    if (ALL_BUILT_IN_IDS.includes(personaId)) {
      setBuiltInOverrides((prev) => {
        const existing = prev[personaId] || {};
        const base = BUILT_IN_PERSONAS[personaId as keyof typeof BUILT_IN_PERSONAS]?.memories || [];
        const memories = updateMems(existing.memories || base);
        return { ...prev, [personaId]: { ...existing, memories } };
      });
    } else {
      setCustomPersonas((prev) =>
        prev.map((p) => p.id === personaId ? { ...p, memories: updateMems(p.memories) } : p)
      );
    }
  }, []);

  const deleteMemory = useCallback((personaId: string, memoryId: string) => {
    const filterMems = (mems: MemoryEntry[]) => mems.filter((m) => m.id !== memoryId);

    if (ALL_BUILT_IN_IDS.includes(personaId)) {
      setBuiltInOverrides((prev) => {
        const existing = prev[personaId] || {};
        const base = BUILT_IN_PERSONAS[personaId as keyof typeof BUILT_IN_PERSONAS]?.memories || [];
        const memories = filterMems(existing.memories || base);
        return { ...prev, [personaId]: { ...existing, memories } };
      });
    } else {
      setCustomPersonas((prev) =>
        prev.map((p) => p.id === personaId ? { ...p, memories: filterMems(p.memories) } : p)
      );
    }
  }, []);

  const updateRules = useCallback((personaId: string, rules: string) => {
    updatePersona(personaId, { rules });
  }, [updatePersona]);

  const setGlobalRules = useCallback((rules: GlobalRules) => {
    setGlobalRulesState(rules);
  }, []);

  const updateBuiltIn = useCallback((id: string, updates: Partial<Member>) => {
    setBuiltInOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates },
    }));
  }, []);

  return (
    <PersonaContext.Provider
      value={{
        customPersonas,
        builtInOverrides,
        globalRules,
        allPersonas,
        addPersona,
        updatePersona,
        deletePersona,
        getPersona,
        addMemory,
        updateMemory,
        deleteMemory,
        updateRules,
        setGlobalRules,
        updateBuiltIn,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}
