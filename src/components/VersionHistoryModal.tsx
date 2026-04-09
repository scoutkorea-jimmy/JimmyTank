"use client";

import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { VERSION_HISTORY } from "@/lib/version";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function VersionHistoryModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Version History" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {VERSION_HISTORY.map((entry) => (
          <div key={entry.version} className="border-l-2 border-blue-300 pl-4 dark:border-blue-700">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                v{entry.version}
              </span>
              <Badge
                variant={
                  entry.type === "feature"
                    ? "info"
                    : entry.type === "hotfix"
                    ? "warning"
                    : "default"
                }
              >
                {entry.type === "feature"
                  ? "기능추가"
                  : entry.type === "hotfix"
                  ? "핫픽스"
                  : "최초출시"}
              </Badge>
              <span className="text-xs text-zinc-400">{entry.date}</span>
            </div>
            <ul className="space-y-0.5">
              {entry.changes.map((change, i) => (
                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                  - {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
