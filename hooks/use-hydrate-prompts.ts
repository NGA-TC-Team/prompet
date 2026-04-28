"use client";
import { useEffect } from "react";
import { usePromptStore } from "@/stores/prompt-store";

export function useHydratePrompts() {
  const hydrate = usePromptStore((s) => s.hydrate);
  const status = usePromptStore((s) => s.status);
  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [hydrate, status]);
  return status;
}
