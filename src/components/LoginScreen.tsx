"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(username, password);
    if (err) setError(err);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🐟</div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            JimmyTank
          </h1>
          <p className="mt-1 text-sm text-zinc-500">로그인이 필요합니다</p>
        </div>
        <div className="space-y-4">
          <Input
            label="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디 입력"
            autoFocus
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg">
            로그인
          </Button>
        </div>
      </form>
    </div>
  );
}
