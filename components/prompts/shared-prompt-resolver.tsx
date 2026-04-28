"use client";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { decodeShared } from "@/lib/prompts/share-codec";
import { SharedPromptView } from "./shared-prompt-view";

export function SharedPromptResolver() {
  const params = useSearchParams();
  const raw = params.get("d");
  const shared = useMemo(() => (raw ? decodeShared(raw) : null), [raw]);

  if (!raw) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        공유 토큰이 없습니다.
      </div>
    );
  }
  if (!shared) {
    return (
      <div className="space-y-2 rounded-md border border-dashed p-8 text-center">
        <p className="text-sm font-medium">유효한 공유 링크가 아닙니다.</p>
        <p className="text-xs text-muted-foreground">토큰 길이: {raw.length}자</p>
      </div>
    );
  }
  return <SharedPromptView prompt={shared} />;
}
