"use client";
import { useEffect } from "react";
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
import { X } from "lucide-react";

interface Props {
  initial?: Prompt | null;
  onSubmit: (values: PromptInput) => Promise<void> | void;
  onCancel: () => void;
}

const DEFAULT: PromptInput = { title: "", body: "", tags: [], sourceUrl: undefined };

export function PromptForm({ initial, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
    reset,
  } = useForm<PromptInput>({
    resolver: zodResolver(promptInputSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          body: initial.body,
          tags: initial.tags,
          sourceUrl: initial.sourceUrl,
        }
      : DEFAULT,
  });

  useEffect(() => {
    reset(
      initial
        ? { title: initial.title, body: initial.body, tags: initial.tags, sourceUrl: initial.sourceUrl }
        : DEFAULT,
    );
  }, [initial, reset]);

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
      <BookmarkImport
        onPick={({ title, description, sourceUrl }) => {
          if (title) setValue("title", title, { shouldDirty: true });
          if (description) setValue("body", description, { shouldDirty: true });
          if (sourceUrl) setValue("sourceUrl", sourceUrl, { shouldDirty: true });
        }}
      />

      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" {...register("title")} placeholder="예: 코드 리뷰 요청" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">본문</Label>
          {varCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              템플릿 변수 {varCount}개
            </Badge>
          )}
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

      <div className="space-y-1.5">
        <Label htmlFor="sourceUrl">출처 URL (선택)</Label>
        <Input
          id="sourceUrl"
          type="url"
          placeholder="https://…"
          {...register("sourceUrl")}
        />
        {errors.sourceUrl && <p className="text-xs text-destructive">{errors.sourceUrl.message}</p>}
      </div>

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
