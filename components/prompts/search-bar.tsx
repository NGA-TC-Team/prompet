"use client";
import { Input } from "@/components/ui/input";
import { usePromptStore } from "@/stores/prompt-store";
import { Search } from "lucide-react";

export function SearchBar() {
  const query = usePromptStore((s) => s.query);
  const setQuery = usePromptStore((s) => s.setQuery);
  return (
    <div className="relative h-9 w-full shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="prompet-search"
        placeholder="제목·본문·태그 검색…  (단축키: /)"
        className="pl-9"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
