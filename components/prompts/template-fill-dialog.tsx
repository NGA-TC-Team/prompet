"use client";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { usePromptStore } from "@/stores/prompt-store";
import { buildShareUrl } from "@/lib/prompts/share-codec";
import { parseTemplate, renderTemplate } from "@/lib/prompts/template";
import { toast } from "sonner";
import type { SharedPrompt } from "@/lib/prompts/schema";

interface Props {
  prompt: SharedPrompt & { id?: string };
  mode: "copy" | "share";
  onClose: () => void;
}

export function TemplateFillDialog({ prompt, mode, onClose }: Props) {
  const copy = useClipboard();
  const { vars } = useMemo(() => parseTemplate(prompt.body), [prompt.body]);
  const cached = usePromptStore((s) => (prompt.id ? s.lastUsedValues[prompt.id] : undefined));
  const remember = usePromptStore((s) => s.rememberValues);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const v of vars) {
      seed[v.name] = cached?.[v.name] ?? v.default ?? "";
    }
    return seed;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const v of vars) {
      if (v.required && !values[v.name]?.trim()) next[v.name] = "필수 입력";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    if (prompt.id) remember(prompt.id, values);
    const rendered = renderTemplate(prompt.body, values);
    if (mode === "copy") {
      await copy(rendered, "채워진 프롬프트를 복사했습니다");
    } else {
      const colors: Record<string, import("@/lib/prompts/tag-colors").TagColor> = {};
      const allColors = usePromptStore.getState().tagColors;
      for (const t of prompt.tags) if (allColors[t]) colors[t] = allColors[t];
      const sharedRendered: SharedPrompt = {
        ...prompt,
        body: rendered,
        tagColors: Object.keys(colors).length > 0 ? colors : undefined,
      };
      const { url, tooLong } = buildShareUrl(window.location.origin, sharedRendered);
      if (tooLong) toast.warning("본문이 길어 일부 브라우저에서 링크가 잘릴 수 있습니다");
      await copy(url, "결과 공유 링크를 복사했습니다");
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "copy" ? "변수 채우고 복사" : "변수 채우고 공유"}</DialogTitle>
          <DialogDescription>{prompt.title}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          {vars.map((v) => (
            <div key={v.name} className="space-y-1.5">
              <Label htmlFor={`v-${v.name}`}>
                {v.label}
                {v.required && <span className="ml-1 text-destructive">*</span>}
                <span className="ml-2 font-mono text-xs text-muted-foreground">{`{{${v.name}}}`}</span>
              </Label>
              <Input
                id={`v-${v.name}`}
                value={values[v.name] ?? ""}
                placeholder={v.default ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [v.name]: e.target.value }))
                }
              />
              {errors[v.name] && <p className="text-xs text-destructive">{errors[v.name]}</p>}
            </div>
          ))}
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs text-muted-foreground">미리보기</Label>
            <Textarea
              readOnly
              className="font-mono text-xs"
              value={renderTemplate(prompt.body, values)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{mode === "copy" ? "복사" : "공유 링크 만들기"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
