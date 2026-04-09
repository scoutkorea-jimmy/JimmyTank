export type BuiltInRole =
  | "socrates"
  | "aristotle"
  | "machiavelli"
  | "kant"
  | "sunzi"
  | "hypatia";

export type MemberId = string;

export interface MemoryEntry {
  id: string;
  content: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  title: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  rules: string;
  memories: MemoryEntry[];
  isCustom?: boolean;
}

export interface GlobalRules {
  content: string;
}

export interface Message {
  id: string;
  tankId: string;
  sender: "user" | string;
  senderName: string;
  content: string;
  timestamp: number;
  isRebuttal?: boolean;
}

export type TankStatus = "idle" | "discussing" | "concluded";

export type AIEngine = "claude" | "chatgpt";

export interface Tank {
  id: string;
  topic: string;
  description: string;
  members: MemberId[];
  messages: Message[];
  status: TankStatus;
  engine: AIEngine;
  summary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DiscussionRequest {
  tankId: string;
  topic: string;
  description: string;
  memberData: Member[];
  globalRules: string;
  messages: Message[];
  engine: AIEngine;
  userMessage?: string;
}

export interface DiscussionResponse {
  messages: Message[];
  summary?: string;
}

export interface EnhancePersonaRequest {
  name: string;
  title: string;
  description: string;
  engine: AIEngine;
}

export interface EnhancePersonaResponse {
  systemPrompt: string;
  enhancedDescription: string;
  suggestedEmoji: string;
}
