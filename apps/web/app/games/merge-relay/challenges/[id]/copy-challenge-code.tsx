"use client";

import { useState } from "react";

export function CopyChallengeCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      window.prompt("Copy this Merge Relay challenge code", code);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-[#d8cbb8] bg-white px-4 py-2 text-sm font-semibold text-[#3d2c24] shadow-sm transition hover:border-[#a95f38] hover:text-[#8d452a]"
    >
      {copied ? "Copied" : "Copy challenge code"}
    </button>
  );
}
