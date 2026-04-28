"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Variable, ExternalLink } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";
import { hasVariables, variableCount } from "@/lib/prompts/template";
import { TemplateFillDialog } from "./template-fill-dialog";
import type { SharedPrompt } from "@/lib/prompts/schema";
import { DEFAULT_TAG_COLOR, TAG_COLOR_CLASS, tagColorsHalo, type TagColor } from "@/lib/prompts/tag-colors";
import { cn } from "@/lib/utils";

export function SharedPromptView({ prompt }: { prompt: SharedPrompt }) {
  const copy = useClipboard();
  const [filling, setFilling] = useState(false);
  const isTemplate = hasVariables(prompt.body);
  const haloColors: TagColor[] = (() => {
    if (!prompt.tagColors) return [];
    const seen = new Set<TagColor>();
    const out: TagColor[] = [];
    for (const t of prompt.tags) {
      const c = prompt.tagColors[t];
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return out;
  })();

  const onCopy = () => {
    if (isTemplate) setFilling(true);
    else void copy(prompt.body, "프롬프트를 복사했습니다");
  };

  return (
    <>
      <Card style={haloColors.length > 0 ? { boxShadow: tagColorsHalo(haloColors) } : undefined}>
        <CardHeader>
          <CardTitle>{prompt.title}</CardTitle>
          {prompt.sourceUrl && (
            <CardDescription>
              <a
                href={prompt.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {prompt.sourceUrl}
              </a>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs">
            {prompt.body}
          </pre>
          <div className="flex flex-wrap gap-1.5">
            {isTemplate && (
              <Badge variant="secondary" className="gap-1">
                <Variable className="h-3 w-3" /> 템플릿 · {variableCount(prompt.body)}개 변수
              </Badge>
            )}
            {prompt.tags.map((t) => {
              const color = prompt.tagColors?.[t] ?? DEFAULT_TAG_COLOR;
              return (
                <span
                  key={t}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs font-medium",
                    TAG_COLOR_CLASS[color],
                  )}
                >
                  #{t}
                </span>
              );
            })}
          </div>
          <Button onClick={onCopy} className="w-full">
            <Copy /> {isTemplate ? "변수 채우고 복사" : "복사"}
          </Button>
        </CardContent>
      </Card>
      {filling && (
        <TemplateFillDialog prompt={prompt} mode="copy" onClose={() => setFilling(false)} />
      )}
    </>
  );
}
