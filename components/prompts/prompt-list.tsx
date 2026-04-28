"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { selectFiltered, partitionByFavorite, usePromptStore } from "@/stores/prompt-store";
import { useHydratePrompts } from "@/hooks/use-hydrate-prompts";
import { PromptCard } from "./prompt-card";
import { PromptEditorDialog } from "./prompt-editor-dialog";
import { BulkTagEdit } from "./bulk-tag-edit";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Download,
  CheckSquare,
  Square,
  Trash2,
  Tag as TagIcon,
} from "lucide-react";
import type { Prompt } from "@/lib/prompts/schema";
import { toast } from "sonner";
import { exportAsZip, triggerDownload } from "@/lib/prompts/export";

const PAGE_SIZE = 15;

const DIRECTIONS: Array<{ x: number; y: number }> = [
  { x: -120, y: -60 },
  { x: 120, y: -60 },
  { x: -140, y: 0 },
  { x: 140, y: 0 },
  { x: -100, y: 80 },
  { x: 100, y: 80 },
  { x: 0, y: -120 },
  { x: 0, y: 120 },
];

function pickDirection(seed: string, index: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return DIRECTIONS[Math.abs(h + index) % DIRECTIONS.length];
}

export function PromptList() {
  const status = useHydratePrompts();
  const filtered = usePromptStore(useShallow(selectFiltered));
  const total = usePromptStore((s) => s.prompts.length);
  const allPrompts = usePromptStore((s) => s.prompts);
  const tagColors = usePromptStore((s) => s.tagColors);
  const seedExamples = usePromptStore((s) => s.seedExamples);
  const removeMany = usePromptStore((s) => s.removeMany);
  const seeded = usePromptStore((s) => s.seeded);

  const [editing, setEditing] = useState<{ open: boolean; prompt: Prompt | null }>({
    open: false,
    prompt: null,
  });
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Selection mode
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagEditOpen, setTagEditOpen] = useState(false);

  const openCreate = () => setEditing({ open: true, prompt: null });
  const openEdit = (p: Prompt) => setEditing({ open: true, prompt: p });
  const close = () => setEditing({ open: false, prompt: null });

  const { favorites, rest } = useMemo(() => partitionByFavorite(filtered), [filtered]);
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => [...favorites, ...rest.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)],
    [favorites, rest, safePage],
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllFiltered = () => setSelected(new Set(filtered.map((p) => p.id)));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelected(new Set());
    else selectAllFiltered();
  };
  const clearSelection = () => setSelected(new Set());
  const exitSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const handleSeed = async () => {
    await seedExamples();
    toast.success("예시 프롬프트 3개를 추가했습니다");
  };

  const handleExport = async () => {
    if (allPrompts.length === 0) {
      toast.error("내보낼 프롬프트가 없습니다");
      return;
    }
    setExporting(true);
    try {
      const { blob, filename } = await exportAsZip(allPrompts, tagColors);
      triggerDownload(blob, filename);
      toast.success(`${allPrompts.length}개 프롬프트를 내보냈습니다`);
    } catch (e) {
      console.error(e);
      toast.error("내보내기에 실패했습니다");
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}개 프롬프트를 삭제할까요?`)) return;
    await removeMany(ids);
    toast.success(`${ids.length}개 삭제됨`);
    exitSelection();
  };

  if (status === "loading" || status === "idle") {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground"
      >
        불러오는 중…
      </motion.p>
    );
  }
  if (status === "error") {
    return <p className="text-sm text-destructive">저장소를 열 수 없습니다. 브라우저 권한을 확인하세요.</p>;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          {!selecting ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelecting(true)}
              disabled={total === 0}
            >
              <Square /> 선택
            </Button>
          ) : (
            <Button
              size="sm"
              variant={allFilteredSelected ? "outline" : "default"}
              onClick={toggleSelectAll}
            >
              {allFilteredSelected ? <Square /> : <CheckSquare />}
              {allFilteredSelected ? "전체 해제" : "전체 선택"}
            </Button>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {total === 0
              ? "EMPTY · NO PROMPTS"
              : `${filtered.length} / ${total} PROMPTS` +
                (pageCount > 1 ? ` · PAGE ${safePage + 1} / ${pageCount}` : "")}
          </p>
          {selecting && selected.size > 0 && !allFilteredSelected && (
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              선택 해제
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!seeded && total > 0 && (
            <Button size="sm" variant="ghost" onClick={() => void handleSeed()}>
              <Wand2 /> 예시 추가
            </Button>
          )}
          {selecting ? (
            <Button size="sm" variant="ghost" onClick={exitSelection}>
              선택 종료
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={openCreate}>
                <Plus /> 새 프롬프트
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleExport()}
                disabled={exporting || total === 0}
              >
                <Download /> {exporting ? "내보내는 중…" : "내보내기"}
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Bulk-action toolbar */}
      <AnimatePresence initial={false}>
        {selecting && selected.size > 0 && (
          <motion.div
            key="bulkbar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-foreground bg-foreground px-3 py-2 text-background"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {selected.size} SELECTED
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="border-background bg-transparent text-background hover:bg-background hover:text-foreground"
                onClick={() => setTagEditOpen(true)}
              >
                <TagIcon /> 태그 편집하기
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-background bg-transparent text-background hover:bg-background hover:text-foreground"
                onClick={() => void handleBulkDelete()}
              >
                <Trash2 /> {selected.size} 삭제
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {total === 0 ? (
        <EmptyState onCreate={openCreate} onSeed={handleSeed} canSeed={!seeded} />
      ) : filtered.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          조건에 맞는 프롬프트가 없습니다.
        </motion.p>
      ) : (
        <>
          <div className="columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4 [&>*]:break-inside-avoid">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((p, i) => {
                const dir = pickDirection(p.id, i);
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: dir.x, y: dir.y, scale: 0.92, rotate: dir.x > 0 ? 1.5 : -1.5 }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 360,
                      damping: 26,
                      delay: 0.04 * (i % 6),
                    }}
                  >
                    <PromptCard
                      prompt={p}
                      onEdit={openEdit}
                      selectable={selecting}
                      selected={selected.has(p.id)}
                      onToggleSelect={() => toggleOne(p.id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {pageCount > 1 && (
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onChange={(p) => {
                setPage(p);
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </>
      )}

      <PromptEditorDialog open={editing.open} prompt={editing.prompt} onClose={close} />
      <BulkTagEdit
        open={tagEditOpen}
        ids={[...selected]}
        onClose={() => setTagEditOpen(false)}
      />
    </>
  );
}

function EmptyState({
  onCreate,
  onSeed,
  canSeed,
}: {
  onCreate: () => void;
  onSeed: () => Promise<void>;
  canSeed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-14 text-center"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">— No. 00 —</div>
      <div className="space-y-1">
        <p className="font-display text-2xl font-bold tracking-tight">아직 프롬프트가 없습니다</p>
        <p className="text-xs text-muted-foreground">
          빈 상태로 시작하거나, 종류별 예시 3개로 빠르게 둘러보세요.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onCreate}>
          <Plus /> 새 프롬프트
        </Button>
        {canSeed && (
          <Button variant="secondary" onClick={() => void onSeed()}>
            <Wand2 /> 예시 프롬프트 3개 추가
          </Button>
        )}
      </div>
      <p className="max-w-sm text-[11px] text-muted-foreground">
        예시: 코드 리뷰 요청 (dev/review) · 회의록 → 액션 아이템 (work/summary) · 블로그 톤 다듬기 (writing)
      </p>
    </motion.div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const windowSize = 5;
  const start = Math.max(0, Math.min(page - Math.floor(windowSize / 2), pageCount - windowSize));
  const end = Math.min(pageCount, start + windowSize);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);
  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        aria-label="이전 페이지"
      >
        <ChevronLeft />
      </Button>
      {start > 0 && (
        <>
          <PageDot active={false} onClick={() => onChange(0)} label="1" />
          {start > 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageDot key={p} active={p === page} onClick={() => onChange(p)} label={String(p + 1)} />
      ))}
      {end < pageCount && (
        <>
          {end < pageCount - 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
          <PageDot active={false} onClick={() => onChange(pageCount - 1)} label={String(pageCount)} />
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
        disabled={page >= pageCount - 1}
        aria-label="다음 페이지"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function PageDot({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      className="h-8 min-w-8 px-2 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
