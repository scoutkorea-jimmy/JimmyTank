"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MemberRole } from "@/types";
import { useTank } from "@/context/TankContext";
import TankCard from "@/components/TankCard";
import MemberSelector from "@/components/MemberSelector";

export default function TankListPage() {
  const router = useRouter();
  const { state, createTank, deleteTank } = useTank();
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<MemberRole[]>([
    "marketer",
    "finance",
    "tech",
  ]);

  const handleCreate = () => {
    if (!topic.trim() || selectedMembers.length < 2) return;
    const tank = createTank(topic.trim(), description.trim(), selectedMembers);
    setTopic("");
    setDescription("");
    setShowCreate(false);
    router.push(`/tank/${tank.id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("이 Tank를 삭제하시겠습니까?")) {
      deleteTank(id);
    }
  };

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            내 Tank 목록
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            토론 세션을 만들고 AI 전문가들과 아이디어를 검토하세요
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + 새 Tank 만들기
        </button>
      </div>

      {/* Create Tank Form */}
      {showCreate && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            새 Tank 만들기
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                토론 주제 *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: AI 기반 건강관리 앱 사업 아이디어"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                상세 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="주제에 대한 배경 정보나 특별히 검토받고 싶은 부분을 적어주세요"
                rows={3}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                참여 멤버 선택 (최소 2명) *
              </label>
              <MemberSelector
                selected={selectedMembers}
                onChange={setSelectedMembers}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!topic.trim() || selectedMembers.length < 2}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Tank 생성
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tank List */}
      {state.tanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">🐟</div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-700 dark:text-zinc-300">
            아직 Tank가 없습니다
          </h3>
          <p className="text-sm text-zinc-500">
            &ldquo;새 Tank 만들기&rdquo; 버튼을 눌러 첫 번째 토론을 시작하세요!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {state.tanks
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((tank) => (
              <TankCard key={tank.id} tank={tank} onDelete={handleDelete} />
            ))}
        </div>
      )}
    </div>
  );
}
