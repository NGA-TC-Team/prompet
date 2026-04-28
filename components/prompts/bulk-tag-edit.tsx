"use client";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { usePromptStore } from "@/stores/prompt-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  ids: string[];
}

export function BulkTagEdit({ open, onClose, ids }: Props) {
  const prompts = usePromptStore((s) => s.prompts);
  const bulkEditTags = usePromptStore((s) => s.bulkEditTags);
  const [add, setAdd] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);

  const presentTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of prompts) if (ids.includes(p.id)) for (const t of p.tags) set.add(t);
    return [...set].sort();
  }, [prompts, ids]);

  const addTag = (raw: string) => {
    const cleaned = raw
      .split(/[,\n]/)
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (cleaned.length === 0) return;
    setAdd((cur) => [...new Set([...cur, ...cleaned])]);
  };

  const onSubmit = async () => {
    if (add.length === 0 && remove.length === 0) {
      toast.error("추가하거나 제거할 태그를 선택하세요");
      return;
    }
    await bulkEditTags(ids, add, remove);
    toast.success(`${ids.length}개 프롬프트의 태그를 갱신했습니다`);
    setAdd([]);
    setRemove([]);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>태그 일괄 편집</SheetTitle>
          <SheetDescription>
            선택한 {ids.length}개 프롬프트의 태그를 한 번에 추가하거나 제거합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>추가할 태그</Label>
            <Input
              placeholder="태그 입력 후 Enter 또는 쉼표"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  addTag(e.target.value);
                  e.target.value = "";
                }
              }}
            />
            {add.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {add.map((t) => (
                  <Badge key={t} variant="outline" className="gap-1">
                    +#{t}
                    <button
                      type="button"
                      onClick={() => setAdd((cur) => cur.filter((x) => x !== t))}
                      className="-mr-1 rounded-sm p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {presentTags.length > 0 && (
            <div className="space-y-2">
              <Label>제거할 태그 (현재 사용 중)</Label>
              <div className="flex flex-wrap gap-1.5">
                {presentTags.map((t) => {
                  const on = remove.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setRemove((cur) => (on ? cur.filter((x) => x !== t) : [...cur, t]))
                      }
                      className="focus:outline-hidden"
                    >
                      <Badge
                        variant={on ? "destructive" : "outline"}
                        className={
                          on
                            ? "gap-1 line-through"
                            : "gap-1 cursor-pointer hover:border-foreground"
                        }
                      >
                        {on ? "−" : ""}#{t}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                클릭으로 토글합니다. 일치하는 프롬프트에서만 제거됩니다.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => void onSubmit()}>적용</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
