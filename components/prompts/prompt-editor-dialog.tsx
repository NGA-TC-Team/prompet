"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PromptForm } from "./prompt-form";
import { usePromptStore } from "@/stores/prompt-store";
import { toast } from "sonner";
import type { Prompt } from "@/lib/prompts/schema";

interface Props {
  open: boolean;
  prompt: Prompt | null;
  onClose: () => void;
}

export function PromptEditorDialog({ open, prompt, onClose }: Props) {
  const create = usePromptStore((s) => s.create);
  const update = usePromptStore((s) => s.update);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="overflow-y-auto sm:max-w-xl"
        // Don't close when interacting with toasts/popovers rendered outside the sheet.
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest("[data-sonner-toaster]")) e.preventDefault();
        }}
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>{prompt ? "프롬프트 편집" : "새 프롬프트"}</SheetTitle>
          <SheetDescription>
            본문에 <code className="font-mono">{"{{name=default}}"}</code> 형식으로 변수를
            정의하면 사용 시 입력을 받아 채울 수 있습니다.
          </SheetDescription>
        </SheetHeader>
        <PromptForm
          initial={prompt}
          onCancel={onClose}
          onSubmit={async (values) => {
            if (prompt) {
              await update(prompt.id, values);
              toast.success("저장되었습니다");
            } else {
              await create(values);
              toast.success("프롬프트를 추가했습니다");
            }
            onClose();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
