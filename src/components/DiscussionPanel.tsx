"use client";

import { useState, useRef, useEffect } from "react";
import { Tank, Message, DiscussionRequest, DiscussionResponse } from "@/types";
import { useTank } from "@/context/TankContext";
import { usePersona } from "@/context/PersonaContext";
import ChatMessage from "./ChatMessage";
import MemberList from "./MemberList";
import { nanoid } from "nanoid";

interface DiscussionPanelProps {
  tank: Tank;
}

export default function DiscussionPanel({ tank }: DiscussionPanelProps) {
  const { addMessage, addMessages, setStatus, setSummary } = useTank();
  const { getPersona } = usePersona();

  const getMemberData = () =>
    tank.members.map((id) => getPersona(id)).filter(Boolean) as import("@/types").Member[];
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMember, setLoadingMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tank.messages]);

  const handleApiResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "오류가 발생했습니다.");
      return null;
    }
    setError(null);
    return data as DiscussionResponse;
  };

  const startDiscussion = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(tank.id, "discussing");
    setLoadingMember("AI 멤버들이 검토 중...");

    try {
      const req: DiscussionRequest = {
        tankId: tank.id,
        topic: tank.topic,
        description: tank.description,
        memberData: getMemberData(),
        messages: tank.messages,
        engine: tank.engine,
      };

      const res = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      const data = await handleApiResponse(res);
      if (!data) return;
      if (data.messages) {
        addMessages(tank.id, data.messages);
      }
      if (data.summary) {
        setSummary(tank.id, data.summary);
      }
    } catch (err) {
      console.error("Discussion error:", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingMember(null);
    }
  };

  const sendUserMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: nanoid(),
      tankId: tank.id,
      sender: "user",
      senderName: "사용자",
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(tank.id, userMsg);
    setInput("");
    setIsLoading(true);
    setError(null);
    setLoadingMember("AI 멤버들이 응답 중...");

    try {
      const req: DiscussionRequest = {
        tankId: tank.id,
        topic: tank.topic,
        description: tank.description,
        memberData: getMemberData(),
        messages: [...tank.messages, userMsg],
        engine: tank.engine,
        userMessage: userMsg.content,
      };

      const res = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      const data = await handleApiResponse(res);
      if (!data) return;
      if (data.messages) {
        addMessages(tank.id, data.messages);
      }
      if (data.summary) {
        setSummary(tank.id, data.summary);
      }
    } catch (err) {
      console.error("Discussion error:", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingMember(null);
    }
  };

  const continueDiscussion = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMember("AI 멤버들이 추가 토론 중...");

    try {
      const req: DiscussionRequest = {
        tankId: tank.id,
        topic: tank.topic,
        description: tank.description,
        memberData: getMemberData(),
        messages: tank.messages,
        engine: tank.engine,
      };

      const res = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      const data = await handleApiResponse(res);
      if (!data) return;
      if (data.messages) {
        addMessages(tank.id, data.messages);
      }
      if (data.summary) {
        setSummary(tank.id, data.summary);
      }
    } catch (err) {
      console.error("Discussion error:", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingMember(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {tank.topic}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tank.description}
          </p>
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            tank.engine === "chatgpt"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          }`}>
            {tank.engine === "chatgpt" ? "🟢 ChatGPT" : "🟠 Claude"}
          </span>
        </div>
        <MemberList members={tank.members} />
        {tank.summary && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <h4 className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              토론 요약
            </h4>
            <p className="text-xs leading-relaxed text-blue-600 dark:text-blue-400">
              {tank.summary}
            </p>
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <main className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {tank.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 text-6xl">🐟</div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-700 dark:text-zinc-300">
                토론을 시작하세요
              </h3>
              <p className="mb-6 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                &ldquo;토론 시작&rdquo; 버튼을 누르면 AI 전문가들이 각자의 관점에서
                주제를 분석합니다. 언제든지 의견을 보내 토론에 참여할 수
                있습니다.
              </p>
              <button
                onClick={startDiscussion}
                disabled={isLoading}
                className="rounded-full bg-blue-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "토론 시작 중..." : "🚀 토론 시작"}
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {tank.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && loadingMember && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                  </div>
                  {loadingMember}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {tank.messages.length > 0 && (
          <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendUserMessage()}
                placeholder="의견을 입력하세요... (AI 멤버들이 반응합니다)"
                disabled={isLoading}
                className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-800"
              />
              <button
                onClick={sendUserMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m-7 7l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={continueDiscussion}
                disabled={isLoading}
                className="rounded-full border border-zinc-300 p-3 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="추가 토론 라운드"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
