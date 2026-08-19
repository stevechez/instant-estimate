"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Generic "copy this text" button with brief inline feedback. Used for the shareable estimate link and the embed snippet. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the text
      // is still visible and selectable, so this isn't a hard failure.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      {copied ? "Copied!" : label}
    </Button>
  );
}
