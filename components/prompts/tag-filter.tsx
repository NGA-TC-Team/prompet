"use client";
import { Button } from "@/components/ui/button";
import { selectAllTags, usePromptStore } from "@/stores/prompt-store";
import { useShallow } from "zustand/react/shallow";
import { X } from "lucide-react";
import { TagChip } from "./tag-chip";

export function TagFilter() {
  const tags = usePromptStore(useShallow(selectAllTags));
  const tagFilter = usePromptStore((s) => s.tagFilter);
  const setTagFilter = usePromptStore((s) => s.setTagFilter);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tagFilter && (
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTagFilter(null)}>
          <X /> 필터 해제
        </Button>
      )}
      {tags.map((t) => (
        <TagChip
          key={t}
          tag={t}
          editable
          active={tagFilter === t}
          onClickBody={() => setTagFilter(tagFilter === t ? null : t)}
        />
      ))}
    </div>
  );
}
