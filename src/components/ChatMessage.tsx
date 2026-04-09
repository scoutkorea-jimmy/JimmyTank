"use client";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-lg ${
          isUser
            ? "bg-blue-100 dark:bg-blue-900"
            : "bg-zinc-100 dark:bg-zinc-800"
        }`}
      >
        {isUser ? "👤" : (message.senderName || "?").split(" ")[0]}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {!isUser && (
          <div className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {message.senderName || "알 수 없음"}
            {message.isRebuttal && (
              <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                반박
              </span>
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
        <div
          className={`mt-1 text-right text-xs ${
            isUser ? "text-blue-200" : "text-zinc-400"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
