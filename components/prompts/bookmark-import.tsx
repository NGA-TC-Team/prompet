"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookmarkResult {
  title?: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
}

interface Props {
  onPick: (b: BookmarkResult) => void;
}

export function BookmarkImport({ onPick }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBookmark = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; retryAfter?: number };
        const msg = body.error ?? "불러오기 실패";
        if (res.status === 429) {
          const wait = body.retryAfter ?? Number(res.headers.get("retry-after") ?? 0);
          toast.error(wait ? `${msg} (${wait}초 후)` : String(msg));
        } else {
          toast.error(String(msg));
        }
        return;
      }
      const data: BookmarkResult = await res.json();
      onPick(data);
      toast.success("폼에 채웠습니다");
      setUrl("");
    } catch (e) {
      console.error(e);
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed bg-muted/40 p-3">
      <Label htmlFor="bookmark" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" />
        북마크 형식 임포트 — URL을 붙여넣어 제목/설명 자동 채우기
      </Label>
      <div className="mt-2 flex gap-2">
        <Input
          id="bookmark"
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void fetchBookmark();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={fetchBookmark} disabled={!url || loading}>
          {loading ? <Loader2 className="animate-spin" /> : "가져오기"}
        </Button>
      </div>
    </div>
  );
}
