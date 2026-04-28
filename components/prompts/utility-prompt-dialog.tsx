"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Wand2 } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";
import { hasVariables } from "@/lib/prompts/template";
import { TemplateFillDialog } from "./template-fill-dialog";

const UTILITY_PROMPT = `아래 의도에 맞는 재사용 가능한 LLM 프롬프트 카드 1개를
**제목 · 본문 · 태그** 세 가지로 작성해 주세요. 본문은 그대로 다른 모델에 붙여
바로 쓸 수 있어야 합니다.

## INTENT
{{intend|만들고 싶은 프롬프트의 의도}}

## OUTPUT
세 섹션을 정확히 이 헤더로 출력하세요. 그 외 서론·해설은 금지.

### TITLE
한 줄, 120자 이내. 어떤 산출물을 만드는지 한눈에 보이게.

### BODY
- 사용자가 채울 부분은 \`{{name}}\` / \`{{name=default}}\` / \`{{name|라벨}}\` /
  \`{{name=default|라벨}}\` 문법으로 비워 두기.
- 변수는 의도와 직결되는 것만 2~6개.
- 본문 자체는 그 LLM에게 줄 지시문 그대로.

### TAGS
쉼표로 구분된 3~6개. 영문 소문자 + 하이픈 권장 (예: code-review, ko, marketing).`;

const UTILITY_TITLE = "유틸리티 프롬프트 — Prompet 카드 생성기";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UtilityPromptDialog({ open, onClose }: Props) {
  const copy = useClipboard();
  const [filling, setFilling] = useState(false);
  const isTemplate = hasVariables(UTILITY_PROMPT);

  const onCopy = () => {
    if (isTemplate) setFilling(true);
    else void copy(UTILITY_PROMPT, "유틸리티 프롬프트를 복사했습니다");
  };

  return (
    <>
      <Dialog open={open && !filling} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-foreground bg-foreground text-background">
                <Wand2 className="h-4 w-4" />
              </span>
              <span className="truncate">{UTILITY_TITLE}</span>
            </DialogTitle>
            <DialogDescription>
              다른 LLM에 붙여 넣으면 제목·본문·태그를 만들어 돌려줍니다. 메인 변수는{" "}
              <code className="font-mono">{"{{intend}}"}</code> 입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">변수:</span>
            <Badge variant="outline" className="font-mono">{"{{intend}}"}</Badge>
          </div>

          <div className="group relative flex-1 overflow-hidden">
            <pre className="h-full max-h-[55vh] overflow-auto rounded-md border bg-muted/40 p-3 pr-12 font-mono text-[11px] leading-relaxed tracking-[-0.015em] whitespace-pre-wrap">
              {UTILITY_PROMPT}
            </pre>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2 h-7"
              onClick={onCopy}
            >
              <Copy /> {isTemplate ? "변수 채우고 복사" : "복사"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            복사 → 다른 LLM 채팅에 붙여넣기 → 돌아온 제목·본문·태그를 Prompet에 새 프롬프트로 등록.
          </p>
        </DialogContent>
      </Dialog>
      {filling && (
        <TemplateFillDialog
          prompt={{ title: UTILITY_TITLE, body: UTILITY_PROMPT, tags: [] }}
          mode="copy"
          onClose={() => setFilling(false)}
        />
      )}
    </>
  );
}
