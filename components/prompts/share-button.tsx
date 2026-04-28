"use client";
import { useState, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClipboard } from "@/hooks/use-clipboard";
import { buildShareUrl } from "@/lib/prompts/share-codec";
import { hasVariables } from "@/lib/prompts/template";
import { toast } from "sonner";
import { usePromptStore } from "@/stores/prompt-store";
import type { SharedPrompt } from "@/lib/prompts/schema";
import type { TagColor } from "@/lib/prompts/tag-colors";

interface Props {
  prompt: SharedPrompt;
  /** Asks the parent to open the fill dialog (which will call shareRendered when ready). */
  onNeedFill?: () => void;
  children: ReactNode;
}

export function ShareButton({ prompt, onNeedFill, children }: Props) {
  const copy = useClipboard();
  const tagColors = usePromptStore((s) => s.tagColors);
  const [busy, setBusy] = useState(false);

  const promptWithColors: SharedPrompt = {
    ...prompt,
    tagColors: pickColors(prompt.tags, tagColors),
  };

  const shareTemplate = async () => {
    setBusy(true);
    try {
      const { url, tooLong } = buildShareUrl(window.location.origin, promptWithColors);
      if (tooLong) toast.warning("본문이 길어 일부 브라우저에서 링크가 잘릴 수 있습니다");
      await copy(url, "공유 링크를 복사했습니다");
    } finally {
      setBusy(false);
    }
  };

  if (!hasVariables(prompt.body)) {
    return (
      <Slot
        onClick={(e) => {
          e.preventDefault();
          if (!busy) void shareTemplate();
        }}
      >
        {children}
      </Slot>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>공유 방식</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void shareTemplate()}>
          템플릿 그대로 공유
          <span className="ml-auto text-xs text-muted-foreground">변수 유지</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNeedFill?.()}>
          채워서 공유
          <span className="ml-auto text-xs text-muted-foreground">결과만</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function pickColors(
  tags: string[],
  colors: Record<string, TagColor>,
): Record<string, TagColor> | undefined {
  const out: Record<string, TagColor> = {};
  for (const t of tags) if (colors[t]) out[t] = colors[t];
  return Object.keys(out).length > 0 ? out : undefined;
}
