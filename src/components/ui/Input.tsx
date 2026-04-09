"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
}

const baseClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export function Input({ label, helperText, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input className={`${baseClass} ${className}`} {...props} />
      {helperText && (
        <p className="mt-1 text-xs text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}

export function TextArea({ label, helperText, className = "", ...props }: TextAreaProps) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <textarea className={`${baseClass} ${className}`} {...props} />
      {helperText && (
        <p className="mt-1 text-xs text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}
