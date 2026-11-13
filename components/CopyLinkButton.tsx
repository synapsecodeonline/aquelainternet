"use client";

import { useState } from "react";

export function CopyLinkButton({ url, label = "Copiar link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-11 items-center rounded-xl border border-neutral-200 bg-white/80 px-4 text-sm font-semibold text-neutral-600 backdrop-blur transition-all hover:border-pink-300 hover:text-pink-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-pink-700 dark:hover:text-pink-400"
    >
      {copied ? "✅ Link copiado!" : `🔗 ${label}`}
    </button>
  );
}
