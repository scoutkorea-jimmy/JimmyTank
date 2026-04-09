export type MemberRole =
  | "marketer"
  | "finance"
  | "tech"
  | "legal"
  | "strategy"
  | "creative";

export interface Member {
  id: string;
  role: MemberRole;
  name: string;
  title: string;
  emoji: string;
  description: string;
  systemPrompt: string;
}

export interface Message {
  id: string;
  tankId: string;
  sender: "user" | MemberRole;
  senderName: string;
  content: string;
  timestamp: number;
  isRebuttal?: boolean;
}

export type TankStatus = "idle" | "discussing" | "concluded";

export interface Tank {
  id: string;
  topic: string;
  description: string;
  members: MemberRole[];
  messages: Message[];
  status: TankStatus;
  summary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DiscussionRequest {
  tankId: string;
  topic: string;
  description: string;
  members: MemberRole[];
  messages: Message[];
  userMessage?: string;
}

export interface DiscussionResponse {
  messages: Message[];
  summary?: string;
}
