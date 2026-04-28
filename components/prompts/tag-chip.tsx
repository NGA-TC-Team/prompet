"use client";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TAG_COLOR,
  TAG_COLORS,
  TAG_COLOR_CLASS,
  TAG_COLOR_LABELS,
  TAG_COLOR_SWATCH,
  type TagColor,
} from "@/lib/prompts/tag-colors";
import { selectTagColor, usePromptStore } from "@/stores/prompt-store";
import { Check, Palette } from "lucide-react";

interface Props {
  tag: string;
  /** Visual variant — "filled" matches the workspace card chips, "outline" matches the tag-filter row when inactive. */
  active?: boolean;
  /** When true, clicking the body invokes onClickBody (e.g., to filter). */
  onClickBody?: () => void;
  /** When true, exposes a color-picker swatch on the chip. */
  editable?: boolean;
}

export function TagChip({ tag, active, onClickBody, editable }: Props) {
  const color = usePromptStore((s) => selectTagColor(s, tag));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border text-xs transition-shadow",
        TAG_COLOR_CLASS[color],
        active && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
      )}
    >
      {editable && <ColorSwatchPicker tag={tag} current={color} />}
      <button
        type="button"
        onClick={onClickBody}
        disabled={!onClickBody}
        className={cn(
          "px-2 py-0.5 font-medium",
          editable ? "pl-1" : "",
          onClickBody ? "cursor-pointer hover:opacity-80" : "cursor-default",
        )}
      >
        #{tag}
      </button>
    </span>
  );
}

function ColorSwatchPicker({ tag, current }: { tag: string; current: TagColor }) {
  const setTagColor = usePromptStore((s) => s.setTagColor);
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${tag} 색상 변경 (현재: ${TAG_COLOR_LABELS[current]})`}
          className="ml-1 grid place-items-center rounded-full p-0.5 hover:bg-foreground/10"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full ring-1 ring-foreground/20", TAG_COLOR_SWATCH[current])} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="grid grid-cols-5 gap-1 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={TAG_COLOR_LABELS[c]}
            title={TAG_COLOR_LABELS[c]}
            className={cn(
              "relative h-6 w-6 rounded-md ring-1 ring-foreground/15 transition-transform hover:scale-110",
              TAG_COLOR_SWATCH[c],
            )}
            onClick={async () => {
              await setTagColor(tag, c);
              setOpen(false);
            }}
          >
            {c === current && (
              <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
            )}
          </button>
        ))}
        <div className="col-span-5 mt-1 flex items-center gap-1 border-t pt-1.5 text-[10px] text-muted-foreground">
          <Palette className="h-3 w-3" /> 태그 색은 모든 화면에 즉시 반영됩니다
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_TAG_COLOR };
