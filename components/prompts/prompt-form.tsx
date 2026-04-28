"use client";
import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { promptInputSchema, type PromptInput, type Prompt } from "@/lib/prompts/schema";
import { variableCount } from "@/lib/prompts/template";
import { BookmarkImport } from "./bookmark-import";
import { X, Pencil, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "manual" | "bookmark";

interface Props {
  initial?: Prompt | null;
  onSubmit: (values: PromptInput) => Promise<void> | void;
  onCancel: () => void;
}

const DEFAULT: PromptInput = {
  title: "",
  body: "",
  tags: [],
  sourceUrl: undefined,
  imageUrl: undefined,
};

export function PromptForm({ initial, onSubmit, onCancel }: Props) {
  // A prompt is treated as "bookmark" mode whenever it carries an imageUrl or
  // a sourceUrl that came from the URL importer. New prompts default to manual.
  const [mode, setMode] = useState<Mode>(() =>
    initial && (initial.imageUrl || initial.sourceUrl) ? "bookmark" : "manual",
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
    getValues,
  } = useForm<PromptInput>({
    resolver: zodResolver(promptInputSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          body: initial.body,
          tags: initial.tags,
          sourceUrl: initial.sourceUrl,
          imageUrl: initial.imageUrl,
        }
      : DEFAULT,
  });

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "manual") {
      // Drop link-only fields when leaving bookmark mode so the saved prompt
      // doesn't keep stale URL/image data the user can no longer edit.
      const sourceUrl = getValues("sourceUrl");
      const imageUrl = getValues("imageUrl");
      if (sourceUrl || imageUrl) {
        setValue("sourceUrl", undefined, { shouldDirty: true });
        setValue("imageUrl", undefined, { shouldDirty: true });
      }
    }
    setMode(next);
  };

  const body = useWatch({ control, name: "body" }) ?? "";
  const varCount = variableCount(body);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        await onSubmit(v);
      })}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLFormElement).requestSubmit();
        }
      }}
    >
      <ModeTabs mode={mode} onChange={switchMode} />

      {mode === "bookmark" && (
        <BookmarkImport
          onPick={({ title, description, sourceUrl, imageUrl }) => {
            if (title) setValue("title", title, { shouldDirty: true });
            if (description) setValue("body", description, { shouldDirty: true });
            if (sourceUrl) setValue("sourceUrl", sourceUrl, { shouldDirty: true });
            setValue("imageUrl", imageUrl, { shouldDirty: true });
          }}
        />
      )}
      <input type="hidden" {...register("imageUrl")} />

      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" {...register("title")} placeholder="예: 코드 리뷰 요청" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="body">본문</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
              {(body ?? "").length.toLocaleString()}자
            </span>
            {varCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                템플릿 변수 {varCount}개
              </Badge>
            )}
          </div>
        </div>
        <Textarea
          id="body"
          rows={10}
          className="font-mono text-xs"
          placeholder={"본문에 {{변수}} 또는 {{변수=기본값}} 형식으로 템플릿 변수를 둘 수 있습니다."}
          {...register("body")}
        />
        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      </div>

      <Controller
        control={control}
        name="tags"
        render={({ field }) => <TagsField value={field.value ?? []} onChange={field.onChange} />}
      />

      {mode === "bookmark" && (
        <div className="space-y-1.5">
          <Label htmlFor="sourceUrl">출처 URL</Label>
          <Input
            id="sourceUrl"
            type="url"
            placeholder="https://…"
            {...register("sourceUrl")}
          />
          {errors.sourceUrl && <p className="text-xs text-destructive">{errors.sourceUrl.message}</p>}
        </div>
      )}
      {mode === "manual" && <input type="hidden" {...register("sourceUrl")} />}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {initial ? "저장" : "추가"}
        </Button>
      </div>
    </form>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: Array<{ id: Mode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "manual", label: "직접 작성", icon: Pencil },
    { id: "bookmark", label: "북마크 (링크)", icon: Bookmark },
  ];
  return (
    <div
      role="tablist"
      aria-label="프롬프트 유형"
      className="inline-flex gap-1 rounded-md border bg-muted/40 p-1"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TagsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const add = (raw: string) => {
    const cleaned = raw
      .split(/[,\n]/)
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (cleaned.length === 0) return;
    const next = [...new Set([...value, ...cleaned])];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor="tags">태그</Label>
      <Input
        id="tags"
        placeholder="태그 입력 후 Enter 또는 쉼표로 구분"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const target = e.currentTarget;
            add(target.value);
            target.value = "";
          }
        }}
        onBlur={(e) => {
          if (e.target.value.trim()) {
            add(e.target.value);
            e.target.value = "";
          }
        }}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((t) => (
            <Badge key={t} variant="outline" className="gap-1">
              #{t}
              <button
                type="button"
                aria-label={`${t} 제거`}
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="-mr-1 rounded-sm p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
