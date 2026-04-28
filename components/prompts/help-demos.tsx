"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  MoreHorizontal,
  Search,
  Share2,
  Sparkles,
  Variable,
  Bookmark,
  ExternalLink,
  Check,
  Palette,
} from "lucide-react";
import { renderTemplate } from "@/lib/prompts/template";
import {
  TAG_COLORS,
  TAG_COLOR_CLASS,
  TAG_COLOR_SWATCH,
  type TagColor,
} from "@/lib/prompts/tag-colors";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- *
 * Helpers                                                                    *
 * -------------------------------------------------------------------------- */

function useTyping(text: string, { speed = 30, startDelay = 200, key = 0 } = {}) {
  const [out, setOut] = useState("");
  useEffect(() => {
    // animation-cycle reset; setting state at the top of the effect is intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOut("");
    let cancelled = false;
    const start = setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i++;
        setOut(text.slice(0, i));
        if (i < text.length) setTimeout(tick, speed);
      };
      tick();
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, speed, startDelay, key]);
  return out;
}

function useStep(count: number, ms = 1100, key: unknown = 0) {
  const [i, setI] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setI(0);
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms, key]);
  return i;
}

/* -------------------------------------------------------------------------- *
 * Demo 1 — welcome: a card materializing into the workspace                  *
 * -------------------------------------------------------------------------- */

export function WelcomeDemo() {
  const cards = [
    { title: "코드 리뷰 요청", body: "당신은 시니어 백엔드 엔지니어입니다…", tags: ["dev", "review"], vars: 3 },
    { title: "회의록 요약", body: "다음 회의 내용을 핵심 결정·액션 아이템으로…", tags: ["work"], vars: 1 },
    { title: "블로그 톤 다듬기", body: "친근하지만 전문성 있는 톤으로 본문을 다듬어…", tags: ["writing"], vars: 0 },
  ];
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 240, damping: 22 }}
          >
            <Card className="h-full">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="line-clamp-1 text-xs">{c.title}</CardTitle>
                <CardDescription className="line-clamp-2 font-mono text-[10px]">{c.body}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1 p-3 pt-0">
                {c.vars > 0 && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Variable className="h-2.5 w-2.5" />
                    {c.vars}
                  </Badge>
                )}
                {c.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    #{t}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Demo 2 — template fill in action                                           *
 * -------------------------------------------------------------------------- */

const TEMPLATE_BODY = `당신은 시니어 {{role=백엔드}} 엔지니어입니다.
다음 코드를 {{focus=성능}} 관점에서 리뷰하세요.
대상 언어: {{lang}}`;

const FILL_VALUES: Record<string, string> = {
  role: "프론트엔드",
  focus: "접근성",
  lang: "TypeScript",
};

export function TemplateFillDemo() {
  const [phase, setPhase] = useState<"card" | "open" | "filling" | "done">("card");
  const [filled, setFilled] = useState<Record<string, string>>({ role: "", focus: "", lang: "" });
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const seq: Array<[number, () => void]> = [
      [600, () => setPhase("open")],
      [600, () => setPhase("filling")],
      [350, () => setFilled((v) => ({ ...v, role: FILL_VALUES.role }))],
      [350, () => setFilled((v) => ({ ...v, focus: FILL_VALUES.focus }))],
      [350, () => setFilled((v) => ({ ...v, lang: FILL_VALUES.lang }))],
      [700, () => setPhase("done")],
      [1700, () => {
        setPhase("card");
        setFilled({ role: "", focus: "", lang: "" });
        setCycle((c) => c + 1);
      }],
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    for (const [delay, fn] of seq) {
      acc += delay;
      timers.push(setTimeout(fn, acc));
    }
    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  const rendered = renderTemplate(TEMPLATE_BODY, filled);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3">
      {/* Left: original card */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xs">코드 리뷰 요청</CardTitle>
            <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
          </div>
          <CardDescription className="line-clamp-3 whitespace-pre-wrap font-mono text-[10px]">
            {TEMPLATE_BODY}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-3 pt-0">
          <Badge variant="secondary" className="w-fit gap-1 text-[10px]">
            <Variable className="h-2.5 w-2.5" /> 템플릿 · 3개 변수
          </Badge>
          <div className="flex gap-1.5">
            <motion.div
              animate={
                phase === "card"
                  ? { scale: [1, 1.06, 1], boxShadow: ["0 0 0 0 rgba(0,0,0,0)", "0 0 0 6px rgba(120,120,120,0.18)", "0 0 0 0 rgba(0,0,0,0)"] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.9 }}
              className="flex-1 rounded-md"
            >
              <Button size="sm" variant="secondary" className="h-7 w-full text-[11px]">
                <Copy className="h-3 w-3" /> 복사
              </Button>
            </motion.div>
            <Button size="sm" variant="outline" className="h-7 text-[11px]">
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: fill dialog */}
      <AnimatePresence mode="wait">
        {phase === "card" ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center rounded-md border border-dashed text-center text-[11px] text-muted-foreground"
          >
            「복사」 클릭 →
            <br /> 변수 입력 다이얼로그
          </motion.div>
        ) : (
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="rounded-md border bg-background p-3 shadow-md"
          >
            <div className="mb-2 text-[11px] font-semibold">변수 채우고 복사</div>
            <div className="space-y-1.5">
              {(["role", "focus", "lang"] as const).map((k) => (
                <FieldRow key={k} name={k} value={filled[k]} active={phase === "filling" && !filled[k]} />
              ))}
            </div>
            <div className="mt-2 space-y-1">
              <Label className="text-[10px] text-muted-foreground">미리보기</Label>
              <pre className="line-clamp-3 rounded border bg-muted/40 p-1.5 font-mono text-[9px] leading-tight whitespace-pre-wrap">
                {rendered}
              </pre>
            </div>
            <div className="mt-2 flex justify-end">
              <motion.div animate={phase === "done" ? { scale: [1, 1.1, 1] } : {}}>
                <Button size="sm" className="h-7 text-[11px]">
                  {phase === "done" ? (
                    <>
                      <Check className="h-3 w-3" /> 복사됨
                    </>
                  ) : (
                    "복사"
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({ name, value, active }: { name: string; value: string; active: boolean }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px]">
        {name} <span className="ml-1 font-mono text-muted-foreground">{`{{${name}}}`}</span>
      </Label>
      <motion.div
        animate={active ? { boxShadow: "0 0 0 2px var(--ring)" } : { boxShadow: "0 0 0 0 transparent" }}
        className="rounded-md"
      >
        <Input value={value} readOnly className="h-7 text-[11px]" />
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Demo 3 — search & tag filter                                               *
 * -------------------------------------------------------------------------- */

const SEARCH_DATASET = [
  { title: "코드 리뷰 요청", tags: ["dev", "review"] },
  { title: "회의록 요약", tags: ["work"] },
  { title: "블로그 톤 다듬기", tags: ["writing"] },
  { title: "버그 리포트 작성", tags: ["dev"] },
  { title: "이메일 정중 답장", tags: ["work", "writing"] },
];

const SEARCH_QUERY = "리뷰";

export function SearchTagDemo() {
  const [cycleKey, setCycleKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCycleKey((c) => c + 1), 4500);
    return () => clearInterval(t);
  }, []);
  const typed = useTyping(SEARCH_QUERY, { speed: 110, startDelay: 400, key: cycleKey });
  const [activeTag, setActiveTag] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTag(null);
    const t1 = setTimeout(() => setActiveTag("dev"), 2200);
    const t2 = setTimeout(() => setActiveTag(null), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [cycleKey]);

  const filtered = useMemo(
    () =>
      SEARCH_DATASET.filter((p) => {
        if (activeTag && !p.tags.includes(activeTag)) return false;
        if (typed && !p.title.includes(typed) && !p.tags.some((t) => t.includes(typed))) return false;
        return true;
      }),
    [typed, activeTag],
  );

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="relative h-8">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={typed} readOnly className="h-8 pl-8 text-xs" placeholder="검색…" />
      </div>
      <div className="flex flex-wrap gap-1">
        {["dev", "review", "work", "writing"].map((t) => (
          <Badge
            key={t}
            variant={activeTag === t ? "default" : "outline"}
            className="cursor-pointer text-[10px] transition-colors"
          >
            #{t}
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.title}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="rounded-md border bg-background px-2 py-1.5 text-[11px]"
            >
              <div className="line-clamp-1 font-medium">{p.title}</div>
              <div className="flex gap-1 pt-0.5">
                {p.tags.map((t) => (
                  <span key={t} className="text-[9px] text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="col-span-2 rounded-md border border-dashed p-2 text-center text-[10px] text-muted-foreground">
            결과 없음
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Demo 4 — bookmark import                                                   *
 * -------------------------------------------------------------------------- */

export function BookmarkImportDemo() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKey((k) => k + 1), 4200);
    return () => clearInterval(t);
  }, []);
  const url = useTyping("https://example.com/blog/prompt-engineering", { speed: 30, startDelay: 200, key });
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilled(false);
    const t = setTimeout(() => setFilled(true), 2000);
    return () => clearTimeout(t);
  }, [key]);

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="rounded-md border border-dashed bg-muted/40 p-2.5">
        <div className="mb-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Bookmark className="h-3 w-3" /> 북마크 임포트
        </div>
        <div className="flex gap-1.5">
          <Input value={url} readOnly className="h-7 text-[11px]" />
          <Button size="sm" variant="secondary" className="h-7 text-[11px]">
            가져오기
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {filled && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-md border bg-background p-2.5"
          >
            <Label className="text-[10px]">제목</Label>
            <Input
              readOnly
              value="프롬프트 엔지니어링 입문"
              className="mt-1 h-7 text-[11px]"
            />
            <Label className="mt-2 block text-[10px]">출처</Label>
            <Input
              readOnly
              value="https://example.com/blog/prompt-engineering"
              className="mt-1 h-7 text-[11px]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Demo 5 — share modes                                                       *
 * -------------------------------------------------------------------------- */

export function ShareDemo() {
  const mode = useStep(2, 2400);
  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex justify-end">
        <div className="rounded-md border bg-background p-1 text-[11px] shadow-sm">
          <div className="px-2 pb-1 pt-1 text-[10px] font-semibold text-muted-foreground">공유 방식</div>
          <ShareMode active={mode === 0} title="템플릿 그대로 공유" hint="변수 유지" />
          <ShareMode active={mode === 1} title="채워서 공유" hint="결과만" />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="rounded-md border bg-background p-2.5"
        >
          <div className="text-[10px] text-muted-foreground">/prompts?d=… (수신자 화면)</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
            <ExternalLink className="h-3 w-3" /> 코드 리뷰 요청
          </div>
          <pre className="mt-1.5 line-clamp-3 rounded border bg-muted/40 p-1.5 font-mono text-[10px] whitespace-pre-wrap">
            {mode === 0
              ? "당신은 시니어 {{role=백엔드}} 엔지니어입니다.\n다음 코드를 {{focus=성능}} 관점에서 리뷰하세요."
              : "당신은 시니어 프론트엔드 엔지니어입니다.\n다음 코드를 접근성 관점에서 리뷰하세요."}
          </pre>
          <Button size="sm" className="mt-2 h-7 w-full text-[11px]">
            <Copy className="h-3 w-3" />
            {mode === 0 ? "변수 채우고 복사" : "복사"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ShareMode({ active, title, hint }: { active: boolean; title: string; hint: string }) {
  return (
    <motion.div
      animate={{ backgroundColor: active ? "var(--accent)" : "transparent" }}
      className="flex items-center gap-2 rounded-sm px-2 py-1 text-[11px]"
    >
      {active && <Sparkles className="h-3 w-3 text-foreground" />}
      <span className={active ? "font-medium" : ""}>{title}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{hint}</span>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- *
 * Demo 6 — tag color picker                                                  *
 * -------------------------------------------------------------------------- */

const COLOR_CYCLE: TagColor[] = ["gray", "red", "amber", "green", "blue", "violet", "pink"];

export function TagColorDemo() {
  const idx = useStep(COLOR_CYCLE.length, 1300);
  const devColor = COLOR_CYCLE[idx];
  const writingColor = COLOR_CYCLE[(idx + 3) % COLOR_CYCLE.length];
  const workColor = COLOR_CYCLE[(idx + 5) % COLOR_CYCLE.length];

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">태그 색은 클릭으로 즉시 변경:</span>
        <DemoTagChip name="dev" color={devColor} />
        <DemoTagChip name="writing" color={writingColor} />
        <DemoTagChip name="work" color={workColor} />
      </div>

      {/* Open palette popover (purely visual) */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="rounded-md border bg-popover p-2 shadow-sm"
      >
        <div className="grid grid-cols-9 gap-1">
          {TAG_COLORS.map((c) => (
            <motion.button
              key={c}
              type="button"
              animate={c === devColor ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={cn(
                "relative h-5 w-5 rounded-md ring-1 ring-foreground/15",
                TAG_COLOR_SWATCH[c],
              )}
            >
              {c === devColor && (
                <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow" />
              )}
            </motion.button>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Palette className="h-3 w-3" /> 9가지 색 — 모든 화면에 즉시 반영됩니다
        </div>
      </motion.div>

      {/* Mini card showing colored tags applied */}
      <div className="rounded-md border bg-background p-2.5">
        <div className="text-[11px] font-medium">코드 리뷰 요청</div>
        <div className="mt-1 flex gap-1">
          <DemoTagChip name="dev" color={devColor} small />
          <DemoTagChip name="review" color={devColor} small />
        </div>
      </div>
    </div>
  );
}

function DemoTagChip({
  name,
  color,
  small,
}: {
  name: string;
  color: TagColor;
  small?: boolean;
}) {
  return (
    <motion.span
      layout
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.04 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium transition-colors",
        small ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        TAG_COLOR_CLASS[color],
      )}
    >
      <span className={cn("h-2 w-2 rounded-full ring-1 ring-foreground/20", TAG_COLOR_SWATCH[color])} />
      #{name}
    </motion.span>
  );
}
