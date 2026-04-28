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
  Pencil,
  Share2,
  Trash2,
  Variable,
  ExternalLink,
  Check,
  ImageOff,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { FAVORITE_LIMIT } from "@/stores/prompt-store";
import { WaveDots } from "./wave-dots";
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
  const toggleFavorite = usePromptStore((s) => s.toggleFavorite);
  const tagColors = usePromptStore((s) => s.tagColors);
  const isFavorite = Boolean(prompt.favoritedAt);

  const onFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = await toggleFavorite(prompt.id);
    if (!r.ok) toast.error(`즐겨찾기는 최대 ${FAVORITE_LIMIT}개까지 가능합니다`);
    else if (!isFavorite) toast.success("즐겨찾기에 추가했습니다");
  };
  const [fillMode, setFillMode] = useState<null | "copy" | "share">(null);
  const [moreHover, setMoreHover] = useState(false);

  const hasVars = hasVariables(prompt.body);
  const varCount = variableCount(prompt.body);
  // Notion-style bookmark mode: only when an image was harvested via the URL
  // import flow. Manually adding a sourceUrl alone doesn't change card behaviour.
  const isBookmark = Boolean(prompt.imageUrl);

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
    if (isBookmark && prompt.sourceUrl) {
      window.open(prompt.sourceUrl, "_blank", "noopener,noreferrer");
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
            <div className="-mr-1 -mt-1 flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                aria-pressed={isFavorite}
                className="icon-redraw h-7 w-7"
                onClick={(e) => void onFavoriteClick(e)}
              >
                <span className="relative inline-flex h-4 w-4">
                  <Star
                    className={cn(
                      "absolute inset-0 h-4 w-4 transition-colors",
                      isFavorite ? "text-amber-500" : "text-muted-foreground",
                    )}
                  />
                  <Star
                    key={isFavorite ? "on" : "off"}
                    aria-hidden
                    className={cn(
                      "absolute inset-0 h-4 w-4 text-amber-500",
                      isFavorite ? "star-fill-rise" : "opacity-0",
                    )}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="더 보기"
                    className="h-7 w-7"
                    onMouseEnter={() => setMoreHover(true)}
                    onMouseLeave={() => setMoreHover(false)}
                    onFocus={() => setMoreHover(true)}
                    onBlur={() => setMoreHover(false)}
                  >
                    <WaveDots active={moreHover} />
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
            </div>
            )}
          </div>
          {!isBookmark && (
            <>
              <p className="inline-flex w-fit items-center rounded-md border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                {prompt.body.length.toLocaleString()}자
              </p>
              <CardDescription className="line-clamp-3 whitespace-pre-wrap font-mono text-xs tracking-[-0.015em]">
                {prompt.body}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-3 pt-0">
          {isBookmark && prompt.imageUrl && (
            <div className="group relative -mx-6 overflow-hidden border-y border-border bg-muted/40">
              <div className="aspect-[4/3] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prompt.imageUrl}
                  alt={prompt.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  onError={(e) => {
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    e.currentTarget.style.display = "none";
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  style={{ display: "none" }}
                  className="h-full w-full items-center justify-center bg-muted text-muted-foreground"
                >
                  <ImageOff className="h-6 w-6" />
                </div>
              </div>
              {prompt.sourceUrl && (
                <div className="absolute bottom-2 right-2 max-w-[80%] truncate rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] text-foreground backdrop-blur">
                  {hostFromUrl(prompt.sourceUrl)}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1">
            {!isBookmark && hasVars && (
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
              {isBookmark ? (
                <>
                  <ExternalLink /> 원문 보기
                </>
              ) : (
                <>
                  <Copy /> 복사
                </>
              )}
            </Button>
            <ShareButton prompt={prompt} onNeedFill={() => setFillMode("share")}>
              <Button size="sm" variant="outline" className="icon-redraw" disabled={selectable}>
                <Share2 /> 공유
              </Button>
            </ShareButton>
          </div>
        </CardContent>
      </Card>

      {fillMode && !isBookmark && (
        <TemplateFillDialog
          prompt={prompt}
          mode={fillMode}
          onClose={() => setFillMode(null)}
        />
      )}
    </>
  );
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
