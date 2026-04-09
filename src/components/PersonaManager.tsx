"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Member, AIEngine, EnhancePersonaResponse } from "@/types";
import { usePersona } from "@/context/PersonaContext";
import { BUILT_IN_PERSONAS, ALL_BUILT_IN_IDS } from "@/lib/personas";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PersonaManager({ open, onClose }: Props) {
  const { customPersonas, addPersona, updatePersona, deletePersona } =
    usePersona();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧑‍💼");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [enhanceEngine, setEnhanceEngine] = useState<AIEngine>("claude");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setTitle("");
    setEmoji("🧑‍💼");
    setDescription("");
    setSystemPrompt("");
    setExtraContext("");
    setEditingId(null);
    setShowForm(false);
    setEnhanceError(null);
  };

  const startEdit = (p: Member) => {
    setName(p.name);
    setTitle(p.title);
    setEmoji(p.emoji);
    setDescription(p.description);
    setSystemPrompt(p.systemPrompt);
    setExtraContext("");
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleEnhance = async () => {
    if (!name.trim() || !title.trim()) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const res = await fetch("/api/enhance-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          description: description.trim(),
          engine: enhanceEngine,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnhanceError(data.error);
        return;
      }
      const result = data as EnhancePersonaResponse;
      setSystemPrompt(result.systemPrompt);
      setDescription(result.enhancedDescription);
      setEmoji(result.suggestedEmoji);
    } catch {
      setEnhanceError("네트워크 오류");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !title.trim()) return;
    const finalPrompt =
      (systemPrompt.trim() ||
        `당신은 "${name.trim()}"이라는 이름의 ${title.trim()}입니다. 한국어로 답변합니다. 답변은 간결하고 핵심적으로 2-4문장으로 합니다.`) +
      (extraContext.trim() ? `\n\n추가 컨텍스트:\n${extraContext.trim()}` : "");

    if (editingId) {
      updatePersona(editingId, {
        name: name.trim(),
        title: title.trim(),
        emoji,
        description: description.trim(),
        systemPrompt: finalPrompt,
      });
    } else {
      addPersona({
        id: nanoid(),
        name: name.trim(),
        title: title.trim(),
        emoji,
        description: description.trim(),
        systemPrompt: finalPrompt,
        rules: "",
        memories: [],
        isCustom: true,
      });
    }
    resetForm();
  };

  const builtInList = ALL_BUILT_IN_IDS.map(
    (id) => BUILT_IN_PERSONAS[id as keyof typeof BUILT_IN_PERSONAS]
  );

  return (
    <Modal open={open} onClose={onClose} title="멤버 관리" maxWidth="max-w-3xl">
      {!showForm ? (
        <div className="space-y-4">
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            + 새 멤버 만들기
          </Button>

          {/* Built-in */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-zinc-400">기본 멤버</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {builtInList.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{p.title}</div>
                  </div>
                  <Badge>기본</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Custom */}
          {customPersonas.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-zinc-400">
                내가 만든 멤버 ({customPersonas.length})
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {customPersonas.map((p) => (
                  <div key={p.id} className="group flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{p.title}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800" title="수정">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => { if (confirm(`"${p.name}" 삭제?`)) deletePersona(p.id); }} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="삭제">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="이름 *" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 수진" />
            <Input label="역할 *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 데이터 분석가" />
            <Input label="이모지" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
          <Input label="설명" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="캐릭터 한 줄 설명" />

          {/* AI Enhance */}
          <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3 dark:border-blue-700 dark:bg-blue-950/30">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">AI 고도화</span>
              <div className="flex gap-1">
                <button onClick={() => setEnhanceEngine("claude")} className={`rounded px-2 py-0.5 text-xs ${enhanceEngine === "claude" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "text-zinc-500"}`}>Claude</button>
                <button onClick={() => setEnhanceEngine("chatgpt")} className={`rounded px-2 py-0.5 text-xs ${enhanceEngine === "chatgpt" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "text-zinc-500"}`}>ChatGPT</button>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleEnhance} disabled={isEnhancing || !name.trim() || !title.trim()}>
              {isEnhancing ? "생성 중..." : "AI로 고도화"}
            </Button>
            {enhanceError && <p className="mt-1 text-xs text-red-500">{enhanceError}</p>}
          </div>

          <TextArea label="시스템 프롬프트" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} helperText="비워두면 기본 프롬프트가 생성됩니다" />
          <TextArea label="추가 컨텍스트 (제한 없음)" value={extraContext} onChange={(e) => setExtraContext(e.target.value)} rows={4} placeholder="이 멤버에게 제공할 추가 배경지식, 업계 정보, 회사 정보 등을 자유롭게 입력하세요. 분량 제한 없음." />

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name.trim() || !title.trim()}>
              {editingId ? "수정 완료" : "멤버 추가"}
            </Button>
            <Button variant="secondary" onClick={resetForm}>취소</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
