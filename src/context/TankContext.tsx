"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { nanoid } from "nanoid";
import { Tank, Message, MemberId, TankStatus, AIEngine } from "@/types";

interface TankState {
  tanks: Tank[];
  activeTankId: string | null;
}

type TankAction =
  | { type: "LOAD_TANKS"; tanks: Tank[] }
  | { type: "CREATE_TANK"; tank: Tank }
  | { type: "DELETE_TANK"; tankId: string }
  | { type: "SET_ACTIVE_TANK"; tankId: string | null }
  | { type: "ADD_MESSAGE"; tankId: string; message: Message }
  | { type: "ADD_MESSAGES"; tankId: string; messages: Message[] }
  | { type: "SET_STATUS"; tankId: string; status: TankStatus }
  | { type: "SET_SUMMARY"; tankId: string; summary: string };

function tankReducer(state: TankState, action: TankAction): TankState {
  switch (action.type) {
    case "LOAD_TANKS":
      return { ...state, tanks: action.tanks };
    case "CREATE_TANK":
      return { ...state, tanks: [...state.tanks, action.tank] };
    case "DELETE_TANK":
      return {
        ...state,
        tanks: state.tanks.filter((t) => t.id !== action.tankId),
        activeTankId:
          state.activeTankId === action.tankId ? null : state.activeTankId,
      };
    case "SET_ACTIVE_TANK":
      return { ...state, activeTankId: action.tankId };
    case "ADD_MESSAGE":
      return {
        ...state,
        tanks: state.tanks.map((t) =>
          t.id === action.tankId
            ? {
                ...t,
                messages: [...t.messages, action.message],
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    case "ADD_MESSAGES":
      return {
        ...state,
        tanks: state.tanks.map((t) =>
          t.id === action.tankId
            ? {
                ...t,
                messages: [...t.messages, ...action.messages],
                updatedAt: Date.now(),
              }
            : t
        ),
      };
    case "SET_STATUS":
      return {
        ...state,
        tanks: state.tanks.map((t) =>
          t.id === action.tankId
            ? { ...t, status: action.status, updatedAt: Date.now() }
            : t
        ),
      };
    case "SET_SUMMARY":
      return {
        ...state,
        tanks: state.tanks.map((t) =>
          t.id === action.tankId
            ? { ...t, summary: action.summary, updatedAt: Date.now() }
            : t
        ),
      };
    default:
      return state;
  }
}

interface TankContextType {
  state: TankState;
  createTank: (
    topic: string,
    description: string,
    members: MemberId[],
    engine: AIEngine
  ) => Tank;
  deleteTank: (tankId: string) => void;
  setActiveTank: (tankId: string | null) => void;
  addMessage: (tankId: string, message: Message) => void;
  addMessages: (tankId: string, messages: Message[]) => void;
  setStatus: (tankId: string, status: TankStatus) => void;
  setSummary: (tankId: string, summary: string) => void;
  getActiveTank: () => Tank | undefined;
}

const TankContext = createContext<TankContextType | null>(null);

const STORAGE_KEY = "jimmytank-tanks";

export function TankProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tankReducer, {
    tanks: [],
    activeTankId: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch({ type: "LOAD_TANKS", tanks: JSON.parse(stored) });
      }
    } catch {
      console.warn("JimmyTank: Failed to load tanks from localStorage");
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.tanks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tanks));
    }
  }, [state.tanks]);

  const createTank = useCallback(
    (topic: string, description: string, members: MemberId[], engine: AIEngine) => {
      const tank: Tank = {
        id: nanoid(),
        topic,
        description,
        members,
        engine,
        messages: [],
        status: "idle",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: "CREATE_TANK", tank });
      return tank;
    },
    []
  );

  const deleteTank = useCallback((tankId: string) => {
    dispatch({ type: "DELETE_TANK", tankId });
  }, []);

  const setActiveTank = useCallback((tankId: string | null) => {
    dispatch({ type: "SET_ACTIVE_TANK", tankId });
  }, []);

  const addMessage = useCallback((tankId: string, message: Message) => {
    dispatch({ type: "ADD_MESSAGE", tankId, message });
  }, []);

  const addMessages = useCallback((tankId: string, messages: Message[]) => {
    dispatch({ type: "ADD_MESSAGES", tankId, messages });
  }, []);

  const setStatus = useCallback((tankId: string, status: TankStatus) => {
    dispatch({ type: "SET_STATUS", tankId, status });
  }, []);

  const setSummary = useCallback((tankId: string, summary: string) => {
    dispatch({ type: "SET_SUMMARY", tankId, summary });
  }, []);

  const getActiveTank = useCallback(() => {
    return state.tanks.find((t) => t.id === state.activeTankId);
  }, [state.tanks, state.activeTankId]);

  return (
    <TankContext.Provider
      value={{
        state,
        createTank,
        deleteTank,
        setActiveTank,
        addMessage,
        addMessages,
        setStatus,
        setSummary,
        getActiveTank,
      }}
    >
      {children}
    </TankContext.Provider>
  );
}

export function useTank() {
  const ctx = useContext(TankContext);
  if (!ctx) throw new Error("useTank must be used within TankProvider");
  return ctx;
}
