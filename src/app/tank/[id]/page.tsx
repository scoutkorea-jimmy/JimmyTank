"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTank } from "@/context/TankContext";
import DiscussionPanel from "@/components/DiscussionPanel";

export default function TankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state, setActiveTank } = useTank();

  const tankId = params.id as string;
  const tank = state.tanks.find((t) => t.id === tankId);

  useEffect(() => {
    if (tankId) {
      setActiveTank(tankId);
    }
    return () => setActiveTank(null);
  }, [tankId, setActiveTank]);

  if (!tank) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h2 className="mb-2 text-xl font-semibold text-zinc-700 dark:text-zinc-300">
          Tank를 찾을 수 없습니다
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          해당 Tank가 삭제되었거나 존재하지 않습니다.
        </p>
        <button
          onClick={() => router.push("/tank")}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tank 목록으로
        </button>
      </div>
    );
  }

  return <DiscussionPanel tank={tank} />;
}
