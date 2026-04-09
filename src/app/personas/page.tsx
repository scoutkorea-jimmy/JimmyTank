"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Member, AIEngine, EnhancePersonaResponse } from "@/types";
import { usePersona } from "@/context/PersonaContext";
import { BUILT_IN_PERSONAS, ALL_BUILT_IN_IDS } from "@/lib/personas";

export default function PersonasPage() {
  const { customPersonas, addPersona, updatePersona, deletePersona } =
    usePersona();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧑‍💼");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [enhanceEngine, setEnhanceEngine] = useState<AIEngine>("claude");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setTitle("");
    setEmoji("🧑‍💼");
    setDescription("");
    setSystemPrompt("");
    setEditingId(null);
    setShowCreate(false);
    setEnhanceError(null);
  };

  const startEdit = (persona: Member) => {
    setName(persona.name);
    setTitle(persona.title);
    setEmoji(persona.emoji);
    setDescription(persona.description);
    setSystemPrompt(persona.systemPrompt);
    setEditingId(persona.id);
    setShowCreate(true);
    setEnhanceError(null);
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
      setEnhanceError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !title.trim()) return;

    if (editingId) {
      updatePersona(editingId, {
        name: name.trim(),
        title: title.trim(),
        emoji,
        description: description.trim(),
        systemPrompt:
          systemPrompt.trim() ||
          `당신은 "${name.trim()}"이라는 이름의 ${title.trim()}입니다. 한국어로 답변합니다. 답변은 간결하고 핵심적으로 2-4문장으로 합니다.`,
      });
    } else {
      addPersona({
        id: nanoid(),
        name: name.trim(),
        title: title.trim(),
        emoji,
        description: description.trim(),
        systemPrompt:
          systemPrompt.trim() ||
          `당신은 "${name.trim()}"이라는 이름의 ${title.trim()}입니다. 한국어로 답변합니다. 답변은 간결하고 핵심적으로 2-4문장으로 합니다.`,
        isCustom: true,
      });
    }
    resetForm();
  };

  const builtInList = ALL_BUILT_IN_IDS.map(
    (id) => BUILT_IN_PERSONAS[id as keyof typeof BUILT_IN_PERSONAS]
  );

  return (
    <div className="mx-auto max-w-4xl flex-1 px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            멤버 관리
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            AI 전문가 페르소나를 추가하고 AI로 고도화하세요
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + 새 멤버 만들기
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? "멤버 수정" : "새 멤버 만들기"}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 수진"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  역할/직함 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 데이터 분석가"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  이모지
                </label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                간단한 설명
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 캐릭터가 어떤 전문성을 가지고 있는지 간단히 설명"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            {/* AI Enhance Section */}
            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  AI로 캐릭터 고도화
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEnhanceEngine("claude")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      enhanceEngine === "claude"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Claude
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnhanceEngine("chatgpt")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      enhanceEngine === "chatgpt"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    ChatGPT
                  </button>
                </div>
              </div>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                이름과 역할만 입력하면 AI가 성격, 전문분야, 토론 스타일을 자동
                생성합니다.
              </p>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !name.trim() || !title.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isEnhancing ? "고도화 중..." : "AI로 고도화하기"}
              </button>
              {enhanceError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {enhanceError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                시스템 프롬프트{" "}
                <span className="text-xs text-zinc-400">
                  (비워두면 기본 프롬프트가 생성됩니다)
                </span>
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="AI가 이 캐릭터로서 토론할 때 사용할 시스템 프롬프트"
                rows={5}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!name.trim() || !title.trim()}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {editingId ? "수정 완료" : "멤버 추가"}
              </button>
              <button
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Personas */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          기본 멤버
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {builtInList.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-3xl">{p.emoji}</span>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </div>
                  <div className="text-xs text-zinc-500">{p.title}</div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {p.description}
              </p>
              <span className="mt-2 inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                기본 제공
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Personas */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          내가 만든 멤버 ({customPersonas.length})
        </h3>
        {customPersonas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">
              아직 만든 멤버가 없습니다. 위의 &ldquo;새 멤버 만들기&rdquo;
              버튼을 눌러 추가하세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customPersonas.map((p) => (
              <div
                key={p.id}
                className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.emoji}</span>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </div>
                      <div className="text-xs text-zinc-500">{p.title}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      title="수정"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${p.name}" 멤버를 삭제하시겠습니까?`))
                          deletePersona(p.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      title="삭제"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.description}
                </p>
                <span className="mt-2 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  커스텀
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
