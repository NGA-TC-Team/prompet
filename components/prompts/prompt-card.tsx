"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  Variable,
  ExternalLink,
  Check,
} from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";
import { usePromptStore } from "@/stores/prompt-store";
import { hasVariables, variableCount } from "@/lib/prompts/template";
import type { Prompt } from "@/lib/prompts/schema";
import { TemplateFillDialog } from "./template-fill-dialog";
import { ShareButton } from "./share-button";
import { TagChip } from "./tag-chip";
import { cn } from "@/lib/utils";
import { tagColorsHalo, type TagColor } from "@/lib/prompts/tag-colors";

interface Props {
  prompt: Prompt;
  onEdit: (p: Prompt) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function PromptCard({ prompt, onEdit, selectable, selected, onToggleSelect }: Props) {
  const copy = useClipboard();
  const remove = usePromptStore((s) => s.remove);
  const tagColors = usePromptStore((s) => s.tagColors);
  const [fillMode, setFillMode] = useState<null | "copy" | "share">(null);

  const hasVars = hasVariables(prompt.body);
  const varCount = variableCount(prompt.body);

  // Every tag with an explicitly assigned (non-default) color contributes to
  // the halo; colors blend across the four card sides.
  const haloColors: TagColor[] = (() => {
    const seen = new Set<TagColor>();
    const out: TagColor[] = [];
    for (const t of prompt.tags) {
      const c = tagColors[t];
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return out;
  })();

  const handleCopy = () => {
    if (selectable) {
      onToggleSelect?.();
      return;
    }
    if (hasVars) setFillMode("copy");
    else void copy(prompt.body, "프롬프트를 복사했습니다");
  };

  return (
    <>
      <Card
        className={cn(
          "flex flex-col",
          selectable && "cursor-pointer",
          selectable && selected && "border-foreground ring-2 ring-foreground ring-offset-1 ring-offset-background",
        )}
        style={
          haloColors.length > 0 && !(selectable && selected)
            ? { boxShadow: tagColorsHalo(haloColors) }
            : undefined
        }
        onClick={selectable ? onToggleSelect : undefined}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              {selectable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.();
                  }}
                  aria-label={selected ? "선택 해제" : "선택"}
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/40 bg-background hover:border-foreground",
                  )}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
              )}
              <CardTitle className="line-clamp-1 text-base">{prompt.title}</CardTitle>
            </div>
            {!selectable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(prompt)}>
                    <Pencil /> 편집
                  </DropdownMenuItem>
                  {prompt.sourceUrl && (
                    <DropdownMenuItem asChild>
                      <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink /> 원본 열기
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => {
                      if (confirm(`"${prompt.title}" 을 삭제할까요?`)) void remove(prompt.id);
                    }}
                  >
                    <Trash2 /> 삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription className="line-clamp-3 whitespace-pre-wrap font-mono text-xs">
            {prompt.body}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-3 pt-0">
          <div className="flex flex-wrap gap-1">
            {hasVars && (
              <Badge variant="secondary" className="gap-1">
                <Variable className="h-3 w-3" />
                템플릿 · {varCount}개 변수
              </Badge>
            )}
            {prompt.tags.map((t) => (
              <TagChip key={t} tag={t} />
            ))}
          </div>
          <div
            className="flex gap-2"
            onClick={(e) => selectable && e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              className="icon-redraw flex-1"
              onClick={handleCopy}
              disabled={selectable}
            >
              <Copy /> 복사
            </Button>
            <ShareButton prompt={prompt} onNeedFill={() => setFillMode("share")}>
              <Button size="sm" variant="outline" className="icon-redraw" disabled={selectable}>
                <Share2 /> 공유
              </Button>
            </ShareButton>
          </div>
        </CardContent>
      </Card>

      {fillMode && (
        <TemplateFillDialog
          prompt={prompt}
          mode={fillMode}
          onClose={() => setFillMode(null)}
        />
      )}
    </>
  );
}
