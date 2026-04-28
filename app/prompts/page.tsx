import Link from "next/link";
import { Suspense } from "react";
import { SharedPromptResolver } from "@/components/prompts/shared-prompt-resolver";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-static";
export const revalidate = false;

export default function PromptsSharedPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:underline">
          ← Prompet
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            SHARED · READ-ONLY
          </span>
          <ThemeToggle />
        </div>
      </header>
      <Suspense
        fallback={
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            불러오는 중…
          </div>
        }
      >
        <SharedPromptResolver />
      </Suspense>
    </main>
  );
}
