"use client";
import { useEffect, useState } from "react";
// Note: lazy-init from localStorage avoids the "set-state-in-effect" lint and a
// post-mount flicker. Server renders the dialog closed; if the client decides to
// open it on hydration, Radix Dialog mounts its portal afresh — no DOM diff to
// reconcile, so no hydration warning.
import { motion } from "motion/react";
import { SearchBar } from "./search-bar";
import { TagFilter } from "./tag-filter";
import { PromptList } from "./prompt-list";
import { HelpModal } from "./help-modal";
import { PromptGuideSheet } from "./prompt-guide-sheet";
import { UtilityPromptDialog } from "./utility-prompt-dialog";
import { CatButterfly } from "./cat-butterfly";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Wand2 } from "lucide-react";

const HELP_SEEN_KEY = "prompet:help-seen";

export function Workspace() {
  const [helpOpen, setHelpOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(HELP_SEEN_KEY);
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [utilOpen, setUtilOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !inField) {
        e.preventDefault();
        document.getElementById("prompet-search")?.focus();
      }
      if (e.key === "?" && !inField) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeHelp = () => {
    setHelpOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(HELP_SEEN_KEY, "1");
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-10 sm:px-6 xl:max-w-7xl 2xl:max-w-[88rem]">
      <motion.header
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="border-b border-border"
      >
        <div className="flex flex-wrap items-center justify-between gap-y-3 pb-2">
        <h1 className="flex flex-wrap items-baseline gap-2">
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
            className="font-display text-3xl font-black leading-none tracking-tight"
          >
            Prompet
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="hidden font-display text-xs italic text-muted-foreground sm:inline-block"
          >
            — Powered By NGA
          </motion.span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-7 w-7 text-muted-foreground"
            aria-label="사용 가이드 열기"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-1 h-7 w-7 px-0 text-xs sm:w-auto sm:px-2"
            aria-label="프롬프트 작성 가이드"
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen /> <span className="hidden sm:inline">프롬프트 작성 가이드</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-1 h-7 w-7 px-0 text-xs sm:w-auto sm:px-2"
            aria-label="유틸리티 프롬프트"
            onClick={() => setUtilOpen(true)}
          >
            <Wand2 /> <span className="hidden sm:inline">유틸리티 프롬프트</span>
          </Button>
        </h1>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.05 }}
          className="flex items-center gap-3"
        >
          <a
            href="https://github.com/knqyf263/pet"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden font-display text-xs italic text-muted-foreground hover:text-foreground hover:underline md:inline"
          >
            inspired by knqyf263/pet ↗
          </a>
          <ThemeToggle />
        </motion.div>
        </div>
        <CatButterfly />
      </motion.header>
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
      >
        <SearchBar />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.13 }}
      >
        <TagFilter />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.16 }}
      >
        <PromptList />
      </motion.div>
      <HelpModal open={helpOpen} onClose={closeHelp} />
      <PromptGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      <UtilityPromptDialog open={utilOpen} onClose={() => setUtilOpen(false)} />
    </main>
  );
}
