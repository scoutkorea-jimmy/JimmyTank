"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPw === "admin") {
      setError("기본 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
      return;
    }
    const err = changePassword(newPw);
    if (err) setError(err);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🔒</div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            비밀번호 변경 필요
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            보안을 위해 기본 비밀번호를 변경해주세요
          </p>
        </div>
        <div className="space-y-4">
          <Input
            label="새 비밀번호"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="새 비밀번호 (4자 이상)"
            autoFocus
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="비밀번호 다시 입력"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg">
            비밀번호 변경
          </Button>
        </div>
      </form>
    </div>
  );
}
