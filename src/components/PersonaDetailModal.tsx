"use client";

import { useState, useRef, useEffect } from "react";
import { Member, AIEngine } from "@/types";
import { usePersona } from "@/context/PersonaContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

type TabKey = "profile" | "knowledge" | "context" | "rules" | "chat" | "memories";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  personaId: string | null;
  onClose: () => void;
}

export default function PersonaDetailModal({ personaId, onClose }: Props) {
  const {
    getPersona, updatePersona,
    addMemory, updateMemory, deleteMemory,
    updateRules,
  } = usePersona();

  const [tab, setTab] = useState<TabKey>("profile");

  // Profile
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Knowledge (배경지식)
  const [newKnowledge, setNewKnowledge] = useState("");

  // Context (업무맥락)
  const [editRules, setEditRules] = useState("");
  const [rulesSaved, setRulesSaved] = useState(false);

  // Memories
  const [newMemory, setNewMemory] = useState("");
  const [editingMemId, setEditingMemId] = useState<string | null>(null);
  const [editingMemContent, setEditingMemContent] = useState("");

  // Chat for personality tuning
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatEngine, setChatEngine] = useState<AIEngine>("claude");
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const persona = personaId ? getPersona(personaId) : undefined;

  // Reset state when persona changes
  useEffect(() => {
    if (persona) {
      setTab("profile");
      setIsEditing(false);
      setChatMsgs([]);
      setEditRules(persona.rules || "");
      setRulesSaved(false);
    }
  }, [personaId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  if (!persona) return null;

  // --- Profile ---
  const startEdit = () => {
    setEditName(persona.name);
    setEditTitle(persona.title);
    setEditEmoji(persona.emoji);
    setEditDesc(persona.description);
    setEditPrompt(persona.systemPrompt);
    setIsEditing(true);
  };

  const saveProfile = () => {
    updatePersona(persona.id, {
      name: editName, title: editTitle, emoji: editEmoji,
      description: editDesc, systemPrompt: editPrompt,
    });
    setIsEditing(false);
  };

  // --- Knowledge (배경지식 → memories) ---
  const handleAddKnowledge = () => {
    if (!newKnowledge.trim()) return;
    addMemory(persona.id, `[배경지식] ${newKnowledge.trim()}`);
    setNewKnowledge("");
  };

  // --- Context (업무맥락 → rules) ---
  const handleSaveContext = () => {
    updateRules(persona.id, editRules);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2000);
  };

  // --- Memory CRUD ---
  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    addMemory(persona.id, newMemory.trim());
    setNewMemory("");
  };

  // --- Chat for personality ---
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMsgs((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch("/api/persona-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaName: persona.name,
          personaTitle: persona.title,
          currentPrompt: persona.systemPrompt,
          currentRules: persona.rules || "",
          chatHistory: chatMsgs,
          userMessage: userMsg,
          engine: chatEngine,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setChatError(data.error); return; }

      setChatMsgs((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // Auto-apply update if AI returned one
      if (data.update) {
        if (data.update.systemPrompt) updatePersona(persona.id, { systemPrompt: data.update.systemPrompt });
        if (data.update.rules) updateRules(persona.id, data.update.rules);
        setChatMsgs((prev) => [...prev, { role: "assistant", content: "✅ 변경사항이 적용되었습니다." }]);
      }
    } catch {
      setChatError("네트워크 오류");
    } finally {
      setChatLoading(false);
    }
  };

  const knowledgeMemories = (persona.memories || []).filter((m) => m.content.startsWith("[배경지식]"));
  const otherMemories = (persona.memories || []).filter((m) => !m.content.startsWith("[배경지식]"));

  const tabs: { key: TabKey; label: string }[] = [
    { key: "profile", label: "프로필" },
    { key: "knowledge", label: "배경지식" },
    { key: "context", label: "업무맥락" },
    { key: "rules", label: "규칙" },
    { key: "chat", label: "대화 튜닝" },
    { key: "memories", label: `메모리(${persona.memories?.length || 0})` },
  ];

  return (
    <Modal open={!!personaId} onClose={onClose} title={`${persona.emoji} ${persona.name} 세부설정`} maxWidth="max-w-2xl">
      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 overflow-x-auto rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== Profile Tab ===== */}
      {tab === "profile" && (
        <div className="space-y-3">
          {!isEditing ? (
            <>
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-4xl">{persona.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{persona.name}</h3>
                    <p className="text-sm text-zinc-500">{persona.title}</p>
                  </div>
                  {persona.isCustom ? <Badge variant="info">커스텀</Badge> : <Badge>기본</Badge>}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{persona.description}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">시스템 프롬프트</label>
                <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 whitespace-pre-wrap dark:bg-zinc-800/50 dark:text-zinc-400 max-h-40 overflow-y-auto">
                  {persona.systemPrompt}
                </div>
              </div>
              <Button size="sm" onClick={startEdit}>수정하기</Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Input label="이름" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input label="역할" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Input label="이모지" value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} />
              </div>
              <Input label="설명" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              <TextArea label="시스템 프롬프트" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={5} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProfile}>저장</Button>
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>취소</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Knowledge Tab (배경지식) ===== */}
      {tab === "knowledge" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            이 멤버에게 제공할 배경 지식입니다. 업계 정보, 회사 정보, 전문 분야 자료 등을 추가하세요.
            토론 시 이 지식이 AI에게 자동으로 제공됩니다.
          </p>
          <div className="flex gap-2">
            <textarea
              value={newKnowledge}
              onChange={(e) => setNewKnowledge(e.target.value)}
              placeholder="배경지식을 입력하세요...&#10;예: 우리 회사는 2020년 설립된 헬스케어 스타트업으로..."
              rows={3}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <Button size="sm" onClick={handleAddKnowledge} disabled={!newKnowledge.trim()}>배경지식 추가</Button>

          {knowledgeMemories.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {knowledgeMemories.map((mem) => (
                <div key={mem.id} className="group flex items-start gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {mem.content.replace("[배경지식] ", "")}
                  </p>
                  <button onClick={() => deleteMemory(persona.id, mem.id)}
                    className="rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" title="삭제">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Context Tab (업무맥락) ===== */}
      {tab === "context" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            이 멤버가 토론에서 따라야 할 업무 맥락을 지시하세요.
            특정 관점, 우선순위, 주의사항 등을 자유롭게 기술할 수 있습니다.
          </p>
          <TextArea
            value={editRules}
            onChange={(e) => { setEditRules(e.target.value); setRulesSaved(false); }}
            rows={8}
            placeholder={"예:\n- 한국 시장 중심으로 분석한다\n- B2B SaaS 관점에서 접근한다\n- 시리즈 A 투자 유치를 앞두고 있다는 맥락을 고려한다\n- 경쟁사 X사와의 차별점을 강조한다"}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveContext}>저장</Button>
            {rulesSaved && <span className="text-xs text-green-600">✓ 저장됨</span>}
          </div>
        </div>
      )}

      {/* ===== Rules Tab (규칙) ===== */}
      {tab === "rules" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            이 캐릭터만의 행동 규칙입니다. 공통규칙과 함께 적용됩니다.
          </p>
          <TextArea
            label="캐릭터별 규칙"
            value={editRules || persona.rules || ""}
            onChange={(e) => setEditRules(e.target.value)}
            rows={6}
            placeholder="예: 항상 데이터를 근거로 제시한다. 감정적 표현은 자제한다."
          />
          <Button size="sm" onClick={handleSaveContext}>규칙 저장</Button>
        </div>
      )}

      {/* ===== Chat Tuning Tab (대화 튜닝) ===== */}
      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "400px" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              대화를 통해 {persona.name}의 성격과 스타일을 조율하세요. &ldquo;적용해줘&rdquo;라고 말하면 변경이 반영됩니다.
            </p>
            <div className="flex gap-1">
              <button onClick={() => setChatEngine("claude")}
                className={`rounded px-2 py-0.5 text-xs ${chatEngine === "claude" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "text-zinc-400"}`}>Claude</button>
              <button onClick={() => setChatEngine("chatgpt")}
                className={`rounded px-2 py-0.5 text-xs ${chatEngine === "chatgpt" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "text-zinc-400"}`}>GPT</button>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
            {chatMsgs.length === 0 && (
              <p className="py-8 text-center text-xs text-zinc-400">
                예: &ldquo;좀 더 공격적으로 반박하는 스타일로 바꿔줘&rdquo;<br />
                &ldquo;말투를 존댓말로 바꿔줘&rdquo;<br />
                &ldquo;적용해줘&rdquo;로 확정
              </p>
            )}
            {chatMsgs.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : ""}`}>
                <span className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                }`}>
                  {msg.content}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
              </div>
            )}
            {chatError && <p className="text-xs text-red-500">{chatError}</p>}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="mt-2 flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="성격, 말투, 스타일 변경 요청..."
              disabled={chatLoading}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800" />
            <Button size="sm" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>전송</Button>
          </div>
        </div>
      )}

      {/* ===== Memories Tab ===== */}
      {tab === "memories" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            채팅이 삭제되어도 유지되는 영구 메모리입니다. 배경지식과 별도로, 일반 기억을 관리합니다.
          </p>
          <div className="flex gap-2">
            <input type="text" value={newMemory} onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
              placeholder="새 메모리 입력..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800" />
            <Button size="sm" onClick={handleAddMemory} disabled={!newMemory.trim()}>추가</Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {otherMemories.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400">저장된 메모리가 없습니다</p>
            ) : (
              otherMemories.map((mem) => (
                <div key={mem.id} className="group flex items-start gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  {editingMemId === mem.id ? (
                    <div className="flex-1 space-y-2">
                      <textarea value={editingMemContent} onChange={(e) => setEditingMemContent(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800" rows={2} />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => { updateMemory(persona.id, mem.id, editingMemContent); setEditingMemId(null); }}>저장</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingMemId(null)}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">{mem.content}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingMemId(mem.id); setEditingMemContent(mem.content); }}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700" title="수정">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteMemory(persona.id, mem.id)}
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950" title="삭제">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
