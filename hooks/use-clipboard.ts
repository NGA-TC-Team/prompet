"use client";
import { useCallback } from "react";
import { toast } from "sonner";

export function useClipboard() {
  return useCallback(async (text: string, label = "복사 완료") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch (e) {
      console.error(e);
      toast.error("클립보드 복사에 실패했습니다");
    }
  }, []);
}
