"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Tank, Message, AIEngine, DiscussionRequest, DiscussionResponse, Member } from "@/types";
import { useTank } from "@/context/TankContext";
import { usePersona } from "@/context/PersonaContext";
import { useAuth } from "@/context/AuthContext";
import { APP_VERSION } from "@/lib/version";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Input, TextArea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ChatMessage from "@/components/ChatMessage";
import MemberSelector from "@/components/MemberSelector";
import FileUpload from "@/components/FileUpload";
import PersonaManager from "@/components/PersonaManager";
import VersionHistoryModal from "@/components/VersionHistoryModal";

interface UploadedFile {
  fileName: string;
  content: string;
  truncated: boolean;
}

function useHeaderInfo(tanks: Tank[], allPersonas: Member[]) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const contextSize = (() => {
    let bytes = 0;
    for (const t of tanks) { bytes += JSON.stringify(t.messages).length; bytes += (t.description || "").length; }
    for (const p of allPersonas) { bytes += (p.systemPrompt || "").length; bytes += (p.rules || "").length; for (const m of p.memories || []) bytes += m.content.length; }
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  })();

  return {
    timeStr: time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateStr: time.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }),
    contextSize,
  };
}

function buildConversationSummary(messages: Message[]): string {
  return messages.slice(-10).map((m) => {
    const name = m.sender === "user" ? "[사용자]" : `[${m.senderName}]`;
    return `${name}: ${m.content}`;
  }).join("\n\n");
}

export default function MainApp() {
  const { state, createTank, deleteTank, addMessage, addMessages, setStatus, setSummary } = useTank();
  const { allPersonas, getPersona, globalRules, setGlobalRules, addMemory } = usePersona();
  const { auth, logout } = useAuth();
  const { timeStr, dateStr, contextSize } = useHeaderInfo(state.tanks, allPersonas);

  // UI State
  const [activeTankId, setActiveTankId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPersonaManager, setShowPersonaManager] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showGlobalRules, setShowGlobalRules] = useState(false);
  const [globalRulesEdit, setGlobalRulesEdit] = useState("");

  // Create Tank Form
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["socrates", "aristotle", "sunzi"]);
  const [engine, setEngine] = useState<AIEngine>("claude");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Discussion State
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRunRef = useRef(false);
  const roundCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTank = state.tanks.find((t) => t.id === activeTankId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTank?.messages]);

  // --- Discussion API ---
  const getMemberData = useCallback((): Member[] =>
    (activeTank?.members || []).map((id) => getPersona(id)).filter(Boolean) as Member[],
    [activeTank?.members, getPersona]
  );

  const callDiscussion = useCallback(async (tank: Tank, msgs: Message[], userMsg?: string) => {
    const memberData = tank.members.map((id) => getPersona(id)).filter(Boolean) as Member[];
    const req: DiscussionRequest = {
      tankId: tank.id, topic: tank.topic, description: tank.description,
      memberData, globalRules: globalRules.content,
      messages: msgs, engine: tank.engine, userMessage: userMsg,
    };
    const res = await fetch("/api/discussion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "오류 발생"); return null; }
    setError(null);
    return data as DiscussionResponse;
  }, [getPersona, globalRules.content]);

  // --- Self-evolve: Extract insights and add to memories ---
  const extractInsights = useCallback(async (tank: Tank, newMessages: Message[]) => {
    const recentText = buildConversationSummary(newMessages);
    const memberData = tank.members.map((id) => getPersona(id)).filter(Boolean) as Member[];

    for (const member of memberData) {
      try {
        const res = await fetch("/api/extract-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: member.id, memberName: member.name, memberTitle: member.title,
            recentMessages: recentText, engine: tank.engine,
          }),
        });
        const data = await res.json();
        if (data.insights && data.insights.length > 0) {
          for (const insight of data.insights) {
            addMemory(member.id, `[자동학습] ${insight}`);
          }
        }
      } catch {
        // Silently ignore insight extraction failures
      }
    }
  }, [getPersona, addMemory]);

  // --- Auto-discussion loop ---
  const runAutoDiscussion = useCallback(async (tank: Tank) => {
    if (!autoRunRef.current) return;

    setIsLoading(true);
    setLoadingMsg("토론 진행 중...");

    try {
      // Get latest tank state
      const currentTank = state.tanks.find((t) => t.id === tank.id);
      if (!currentTank || !autoRunRef.current) return;

      const data = await callDiscussion(currentTank, currentTank.messages);
      if (!autoRunRef.current) return;

      if (data?.messages) {
        addMessages(tank.id, data.messages);
        roundCountRef.current += 1;

        // Extract insights every 2 rounds for self-evolution
        if (roundCountRef.current % 2 === 0) {
          extractInsights(currentTank, data.messages).catch(() => {});
        }
      }
      if (data?.summary) setSummary(tank.id, data.summary);

      // Continue if still running (with a small delay)
      if (autoRunRef.current) {
        setTimeout(() => runAutoDiscussion(tank), 1500);
      }
    } catch {
      setError("네트워크 오류");
      autoRunRef.current = false;
      setIsAutoRunning(false);
    } finally {
      if (!autoRunRef.current) {
        setIsLoading(false);
        setLoadingMsg(null);
      }
    }
  }, [state.tanks, callDiscussion, addMessages, setSummary, extractInsights]);

  const startAutoDiscussion = useCallback((tank: Tank) => {
    autoRunRef.current = true;
    roundCountRef.current = 0;
    setIsAutoRunning(true);
    setStatus(tank.id, "discussing");
    runAutoDiscussion(tank);
  }, [setStatus, runAutoDiscussion]);

  const stopAutoDiscussion = useCallback(() => {
    autoRunRef.current = false;
    setIsAutoRunning(false);
    setIsLoading(false);
    setLoadingMsg(null);
  }, []);

  // --- Tank CRUD ---
  const handleCreate = () => {
    if (!topic.trim() || selectedMembers.length < 2) return;
    const fileContext = uploadedFiles.map((f) => `[첨부파일: ${f.fileName}]\n${f.content}`).join("\n\n");
    const fullDesc = description.trim() + (fileContext ? `\n\n--- 첨부 문서 ---\n${fileContext}` : "");
    const tank = createTank(topic.trim(), fullDesc, selectedMembers, engine);
    setTopic("");
    setDescription("");
    setUploadedFiles([]);
    setShowCreate(false);
    setActiveTankId(tank.id);
    // Auto-start discussion
    setTimeout(() => startAutoDiscussion(tank), 100);
  };

  const handleDelete = (id: string) => {
    if (!confirm("이 Tank를 삭제하시겠습니까?")) return;
    if (isAutoRunning && activeTankId === id) stopAutoDiscussion();
    deleteTank(id);
    if (activeTankId === id) setActiveTankId(null);
  };

  // User message: pause auto, send, then resume
  const sendUserMessage = async () => {
    if (!input.trim() || !activeTank) return;
    const wasRunning = autoRunRef.current;
    if (wasRunning) stopAutoDiscussion();

    const userMsg: Message = {
      id: nanoid(), tankId: activeTank.id, sender: "user",
      senderName: "사용자", content: input.trim(), timestamp: Date.now(),
    };
    addMessage(activeTank.id, userMsg);
    setInput("");
    setIsLoading(true);
    setError(null);
    setLoadingMsg("AI 멤버들이 응답 중...");

    try {
      const data = await callDiscussion(activeTank, [...activeTank.messages, userMsg], userMsg.content);
      if (data?.messages) addMessages(activeTank.id, data.messages);
      if (data?.summary) setSummary(activeTank.id, data.summary);
    } catch { setError("네트워크 오류"); }
    finally { setIsLoading(false); setLoadingMsg(null); }

    // Resume auto discussion if it was running
    if (wasRunning && activeTank) {
      setTimeout(() => startAutoDiscussion(activeTank), 500);
    }
  };

  // Cleanup on unmount or tank change
  useEffect(() => {
    return () => { autoRunRef.current = false; };
  }, [activeTankId]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐟</span>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">JimmyTank</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">📅</span>
            <span>{dateStr}</span>
            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">📦</span>
            <span>컨텍스트: <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{contextSize}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{auth.username}</Badge>
          <Button variant="ghost" size="sm" onClick={() => { setGlobalRulesEdit(globalRules.content); setShowGlobalRules(true); }}>공통규칙</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowPersonaManager(true)}>멤버 관리</Button>
          <Button variant="ghost" size="sm" onClick={logout}>로그아웃</Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tank 목록</span>
            <Button size="sm" onClick={() => setShowCreate(true)}>+ 새 Tank</Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {state.tanks.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-400">아직 Tank가 없습니다</p>
            ) : (
              <div className="space-y-1">
                {state.tanks.sort((a, b) => b.updatedAt - a.updatedAt).map((tank) => (
                  <div key={tank.id} onClick={() => { if (isAutoRunning) stopAutoDiscussion(); setActiveTankId(tank.id); }}
                    className={`group cursor-pointer rounded-lg p-3 transition-colors ${activeTankId === tank.id ? "bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <Badge variant={tank.engine === "chatgpt" ? "green" : "orange"}>{tank.engine === "chatgpt" ? "GPT" : "Claude"}</Badge>
                      <span className="text-[10px] text-zinc-400">{new Date(tank.createdAt).toLocaleDateString("ko-KR")}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(tank.id); }} className="ml-auto rounded p-0.5 text-zinc-300 opacity-0 hover:text-red-500 group-hover:opacity-100">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{tank.topic}</div>
                    <div className="mt-1 flex items-center gap-0.5">
                      {tank.members.slice(0, 4).map((mid) => {
                        const p = getPersona(mid);
                        return <span key={mid} className="text-xs">{p?.emoji || "?"}</span>;
                      })}
                      {tank.members.length > 4 && <span className="text-[10px] text-zinc-400">+{tank.members.length - 4}</span>}
                      <span className="ml-auto text-[10px] text-zinc-400">{tank.messages.length}개</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {!activeTank ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 text-6xl">🐟</div>
              <h2 className="mb-2 text-xl font-semibold text-zinc-700 dark:text-zinc-300">JimmyTank</h2>
              <p className="mb-6 max-w-md text-sm text-zinc-500">
                AI 전문가들이 당신의 아이디어를 다각도로 검토합니다.<br />
                Tank를 만들면 자동으로 토론이 시작됩니다.
              </p>
              <Button onClick={() => setShowCreate(true)}>+ 새 Tank 만들기</Button>
            </div>
          ) : (
            <>
              {/* Discussion Header */}
              <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{activeTank.topic}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={activeTank.engine === "chatgpt" ? "green" : "orange"}>
                      {activeTank.engine === "chatgpt" ? "ChatGPT" : "Claude"}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {activeTank.members.map((id) => { const p = getPersona(id); return p ? `${p.emoji}${p.name}` : "?"; }).join("  ")}
                    </span>
                  </div>
                </div>
                {/* Play/Pause Button */}
                {isAutoRunning ? (
                  <Button variant="danger" size="sm" onClick={stopAutoDiscussion} className="animate-pulse">
                    ⏸ 일시정지
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => activeTank && startAutoDiscussion(activeTank)}>
                    ▶ 토론 재개
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTank.messages.length === 0 && !isLoading ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <p className="text-sm text-zinc-500">토론이 곧 자동으로 시작됩니다...</p>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-4">
                    {activeTank.messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                    {isLoading && loadingMsg && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                        </div>
                        {loadingMsg}
                        {isAutoRunning && <Badge variant="success">자동 토론 중</Badge>}
                      </div>
                    )}
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{error}</div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input - always visible */}
              <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mx-auto flex max-w-3xl items-center gap-2">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendUserMessage()}
                    placeholder="의견을 입력하면 AI가 즉시 반응합니다..."
                    className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900" />
                  <Button onClick={sendUserMessage} disabled={!input.trim()} className="rounded-full">전송</Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="flex h-10 items-center justify-between border-t border-zinc-200 bg-white px-4 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
        <span>🐟 JimmyTank v{APP_VERSION}</span>
        <button onClick={() => setShowVersionHistory(true)} className="hover:text-blue-500 transition-colors">Version History</button>
      </footer>

      {/* Create Tank Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="새 Tank 만들기" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <Input label="토론 주제 *" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: AI 기반 건강관리 앱 사업 아이디어" />
          <TextArea label="상세 설명" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="주제에 대한 배경 정보" rows={3} />
          <FileUpload onFileUploaded={(f) => setUploadedFiles((prev) => [...prev, f])} uploadedFiles={uploadedFiles} onRemoveFile={(i) => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))} />
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">AI 엔진</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEngine("claude")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${engine === "claude" ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950" : "border-zinc-200 text-zinc-600 dark:border-zinc-700"}`}>🟠 Claude</button>
              <button type="button" onClick={() => setEngine("chatgpt")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${engine === "chatgpt" ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950" : "border-zinc-200 text-zinc-600 dark:border-zinc-700"}`}>🟢 ChatGPT</button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">참여 멤버 (최소 2명) *</label>
            <MemberSelector selected={selectedMembers} onChange={setSelectedMembers} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!topic.trim() || selectedMembers.length < 2}>Tank 생성</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
          </div>
        </div>
      </Modal>

      {/* Global Rules Modal */}
      <Modal open={showGlobalRules} onClose={() => setShowGlobalRules(false)} title="공통 규칙">
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">모든 AI 멤버에게 공통으로 적용되는 규칙입니다.</p>
          <TextArea value={globalRulesEdit} onChange={(e) => setGlobalRulesEdit(e.target.value)} rows={8}
            placeholder={"예:\n- 모든 답변은 한국어로 합니다.\n- 근거 없는 주장은 하지 않습니다.\n- 서로의 의견을 존중하되 논리적으로 반박합니다."} />
          <Button onClick={() => { setGlobalRules({ content: globalRulesEdit }); setShowGlobalRules(false); }}>저장</Button>
        </div>
      </Modal>

      {/* Modals */}
      <PersonaManager open={showPersonaManager} onClose={() => setShowPersonaManager(false)} />
      <VersionHistoryModal open={showVersionHistory} onClose={() => setShowVersionHistory(false)} />
    </div>
  );
}
