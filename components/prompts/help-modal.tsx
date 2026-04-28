"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  WelcomeDemo,
  TemplateFillDemo,
  SearchTagDemo,
  BookmarkImportDemo,
  ShareDemo,
  TagColorDemo,
} from "./help-demos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Variable,
  Tag,
  Copy,
  Share2,
  Bookmark,
  Database,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Palette,
} from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
}

const EXAMPLE_PROMPT = `당신은 시니어 {{role=백엔드}} 엔지니어입니다.
다음 코드를 리뷰하고, {{focus=성능과 가독성|중점 영역}} 관점에서 개선점 3가지를 제시하세요.
대상 언어: {{lang}}

\`\`\`
<여기에 코드를 붙여넣으세요>
\`\`\``;

function PromptCodeBlock({ value }: { value: string }) {
  const copy = useClipboard();
  return (
    <div className="group relative">
      <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 pr-12 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
        {value}
      </pre>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2 h-7"
        onClick={() => void copy(value, "예시 프롬프트를 복사했습니다")}
      >
        <Copy /> 복사
      </Button>
    </div>
  );
}

export function HelpModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      icon: Sparkles,
      title: "Prompet에 오신 걸 환영합니다",
      body: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Prompet은 <strong>브라우저 안에서만 동작하는</strong> LLM 프롬프트 매니저입니다.
            서버에 전송되는 데이터는 없으며 모든 프롬프트는 IndexedDB에 저장됩니다.
          </p>
          <p className="text-muted-foreground">
            CLI snippet 매니저인{" "}
            <a
              href="https://github.com/knqyf263/pet"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              knqyf263/pet
            </a>
            에서 영감을 받아, 변수 placeholder가 있는 <em>재사용 가능한 템플릿</em>이 1급 기능입니다.
          </p>
          <WelcomeDemo />
          <ul className="grid gap-2 sm:grid-cols-2">
            <Feature icon={Database} label="로컬 저장 (IndexedDB)" />
            <Feature icon={Variable} label="템플릿 변수" />
            <Feature icon={Tag} label="태그 + 검색" />
            <Feature icon={Palette} label="태그별 색상 지정" />
            <Feature icon={Share2} label="URL 공유 링크 (색상 포함)" />
          </ul>
        </div>
      ),
    },
    {
      icon: Variable,
      title: "템플릿 변수 — 이 앱의 핵심",
      body: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>본문에 다음 문법으로 변수를 정의하면, 카드의 <strong>복사</strong>를 눌렀을 때 입력 다이얼로그가 자동으로 떠 값을 채워줍니다.</p>
          <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/40 p-2 text-xs">
            <span className="text-muted-foreground">문법:</span>
            <Badge variant="outline" className="font-mono">{"{{name}}"}</Badge>
            <Badge variant="outline" className="font-mono">{"{{name=default}}"}</Badge>
            <Badge variant="outline" className="font-mono">{"{{name|라벨}}"}</Badge>
          </div>
          <TemplateFillDemo />
          <p className="text-muted-foreground">예시 프롬프트를 복사해 새 프롬프트로 붙여넣어 보세요:</p>
          <PromptCodeBlock value={EXAMPLE_PROMPT} />
        </div>
      ),
    },
    {
      icon: Tag,
      title: "태그 · 검색 · 북마크 임포트",
      body: (
        <div className="space-y-3 text-sm leading-relaxed">
          <Row icon={Sparkles} title="실시간 검색 + 태그 필터">
            상단 검색창은 제목·본문·태그를 즉시 매칭합니다. 칩을 클릭해 태그로 좁히세요. 단축키 <Kbd>/</Kbd>.
          </Row>
          <SearchTagDemo />
          <Row icon={Bookmark} title="URL 북마크 임포트">
            편집 다이얼로그 상단에 URL을 붙여넣으면 페이지의 제목·메타 설명을 자동으로 폼에 채웁니다.
          </Row>
          <BookmarkImportDemo />
        </div>
      ),
    },
    {
      icon: Palette,
      title: "태그별 색상 — 한눈에 분류",
      body: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            워크스페이스 상단 태그 칩의 <strong>색 점</strong>을 클릭하면 9가지 색 팔레트가 열립니다.
            한 번 정한 색은 워크스페이스, 카드, 공유 링크 모두에 즉시 반영됩니다.
          </p>
          <Row icon={Palette} title="9가지 색 + 회색(기본)">
            회색·빨강·주황·노랑·초록·청록·파랑·보라·분홍. 라이트/다크 모드 모두에 맞춰진 톤입니다.
          </Row>
          <Row icon={Share2} title="공유 링크에도 색이 포함됩니다">
            사용자가 지정한 색은 공유 토큰에 함께 인코딩되므로, 받는 사람도 같은 색으로 보게 됩니다.
          </Row>
          <TagColorDemo />
        </div>
      ),
    },
    {
      icon: Share2,
      title: "공유 링크의 두 가지 모드",
      body: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>변수가 있는 프롬프트의 <strong>공유</strong>는 두 가지 방식을 지원합니다.</p>
          <Row icon={Copy} title="템플릿 그대로 공유">
            변수가 살아있는 채로 인코딩 — 받는 사람이 직접 값을 채워 복사합니다.
          </Row>
          <Row icon={CheckCircle2} title="채워서 공유">
            현재 입력한 값으로 렌더된 최종 텍스트만 인코딩됩니다.
          </Row>
          <ShareDemo />
          <p className="text-xs text-muted-foreground">
            공유 링크는 <code className="font-mono">/prompts?d=…</code> 형식. 받는 사람은 IndexedDB
            없이도 즉시 볼 수 있습니다.
          </p>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.span
              key={step}
              initial={{ rotate: -8, scale: 0.85, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground bg-foreground text-background"
            >
              {(() => {
                const Icon = steps[step].icon;
                return <Icon className="h-4 w-4" />;
              })()}
            </motion.span>
            {steps[step].title}
          </DialogTitle>
          <DialogDescription>
            가이드 {step + 1} / {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[260px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {steps[step].body}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번 단계로 이동`}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft /> 이전
            </Button>
            {last ? (
              <Button size="sm" onClick={onClose}>
                시작하기
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                다음 <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feature({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </li>
  );
}

function Row({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}
