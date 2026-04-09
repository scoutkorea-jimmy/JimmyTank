"use client";

import { useState } from "react";
import { Member } from "@/types";
import { usePersona } from "@/context/PersonaContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

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

  const [activeSection, setActiveSection] = useState<"info" | "rules" | "memories">("info");
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editRules, setEditRules] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryContent, setEditingMemoryContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const persona = personaId ? getPersona(personaId) : undefined;
  if (!persona) return null;

  const startEdit = () => {
    setEditName(persona.name);
    setEditTitle(persona.title);
    setEditEmoji(persona.emoji);
    setEditDesc(persona.description);
    setEditPrompt(persona.systemPrompt);
    setEditRules(persona.rules || "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    updatePersona(persona.id, {
      name: editName,
      title: editTitle,
      emoji: editEmoji,
      description: editDesc,
      systemPrompt: editPrompt,
    });
    setIsEditing(false);
  };

  const handleSaveRules = () => {
    updateRules(persona.id, editRules);
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    addMemory(persona.id, newMemory.trim());
    setNewMemory("");
  };

  const startEditMemory = (id: string, content: string) => {
    setEditingMemoryId(id);
    setEditingMemoryContent(content);
  };

  const saveEditMemory = () => {
    if (editingMemoryId) {
      updateMemory(persona.id, editingMemoryId, editingMemoryContent);
      setEditingMemoryId(null);
    }
  };

  const tabs = [
    { key: "info" as const, label: "정보" },
    { key: "rules" as const, label: "규칙" },
    { key: "memories" as const, label: `메모리 (${persona.memories?.length || 0})` },
  ];

  return (
    <Modal open={!!personaId} onClose={onClose} title={`${persona.emoji} ${persona.name}`} maxWidth="max-w-2xl">
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveSection(tab.key); setIsEditing(false); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSection === tab.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeSection === "info" && (
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
                <Button size="sm" onClick={saveEdit}>저장</Button>
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>취소</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeSection === "rules" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">이 캐릭터만의 개별 규칙을 정의하세요. 공통규칙과 함께 적용됩니다.</p>
          <TextArea
            label="캐릭터별 규칙"
            value={editRules || persona.rules || ""}
            onChange={(e) => setEditRules(e.target.value)}
            rows={6}
            placeholder="예: 항상 데이터를 근거로 제시한다. 감정적 표현은 자제한다."
          />
          <Button size="sm" onClick={handleSaveRules}>규칙 저장</Button>
        </div>
      )}

      {/* Memories Tab */}
      {activeSection === "memories" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            채팅이 삭제되어도 유지되는 영구 메모리입니다. 토론 시 이 메모리가 캐릭터에게 제공됩니다.
          </p>

          {/* Add new memory */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
              placeholder="새 메모리 입력..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <Button size="sm" onClick={handleAddMemory} disabled={!newMemory.trim()}>추가</Button>
          </div>

          {/* Memory list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(!persona.memories || persona.memories.length === 0) ? (
              <p className="py-4 text-center text-xs text-zinc-400">저장된 메모리가 없습니다</p>
            ) : (
              persona.memories.map((mem) => (
                <div key={mem.id} className="group flex items-start gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  {editingMemoryId === mem.id ? (
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={editingMemoryContent}
                        onChange={(e) => setEditingMemoryContent(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={saveEditMemory}>저장</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingMemoryId(null)}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">{mem.content}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditMemory(mem.id, mem.content)}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
                          title="수정"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => deleteMemory(persona.id, mem.id)}
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                          title="삭제"
                        >
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
