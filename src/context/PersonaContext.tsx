"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Member } from "@/types";
import { BUILT_IN_PERSONAS, ALL_BUILT_IN_IDS } from "@/lib/personas";

interface PersonaContextType {
  customPersonas: Member[];
  allPersonas: Member[];
  addPersona: (persona: Member) => void;
  updatePersona: (id: string, updates: Partial<Member>) => void;
  deletePersona: (id: string) => void;
  getPersona: (id: string) => Member | undefined;
}

const PersonaContext = createContext<PersonaContextType | null>(null);

const STORAGE_KEY = "jimmytank-custom-personas";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [customPersonas, setCustomPersonas] = useState<Member[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomPersonas(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPersonas));
  }, [customPersonas]);

  const builtInList = ALL_BUILT_IN_IDS.map(
    (id) => BUILT_IN_PERSONAS[id as keyof typeof BUILT_IN_PERSONAS]
  );

  const allPersonas = [...builtInList, ...customPersonas];

  const addPersona = useCallback((persona: Member) => {
    setCustomPersonas((prev) => [...prev, { ...persona, isCustom: true }]);
  }, []);

  const updatePersona = useCallback((id: string, updates: Partial<Member>) => {
    setCustomPersonas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePersona = useCallback((id: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPersona = useCallback(
    (id: string) => {
      return allPersonas.find((p) => p.id === id);
    },
    [allPersonas]
  );

  return (
    <PersonaContext.Provider
      value={{
        customPersonas,
        allPersonas,
        addPersona,
        updatePersona,
        deletePersona,
        getPersona,
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
