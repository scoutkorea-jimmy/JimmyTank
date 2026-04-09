"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";

interface UploadedFile {
  fileName: string;
  content: string;
  truncated: boolean;
}

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
}

export default function FileUpload({
  onFileUploaded,
  uploadedFiles,
  onRemoveFile,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError("파일 크기는 100MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      onFileUploaded({
        fileName: data.fileName,
        content: data.content,
        truncated: data.truncated,
      });
    } catch {
      setError("업로드 실패");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleUpload}
          accept=".txt,.md,.csv,.json,.xml,.html,.js,.ts,.py,.pdf,.doc,.docx"
          className="hidden"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "업로드 중..." : "📎 문서 첨부"}
        </Button>
        <span className="text-xs text-zinc-400">100MB 이하</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
            >
              <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                📄 {f.fileName}
                {f.truncated && (
                  <span className="ml-1 text-orange-500">(일부만 포함)</span>
                )}
              </span>
              <button
                onClick={() => onRemoveFile(i)}
                className="text-zinc-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
