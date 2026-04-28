"use client";
import { create } from "zustand";
import * as db from "@/lib/prompts/db";
import { newId } from "@/lib/prompts/id";
import type { Prompt, PromptInput } from "@/lib/prompts/schema";
import { DEFAULT_TAG_COLOR, type TagColor } from "@/lib/prompts/tag-colors";
import { SEED_PROMPTS } from "@/lib/prompts/seed";

type Status = "idle" | "loading" | "ready" | "error";

interface PromptState {
  prompts: Prompt[];
  status: Status;
  query: string;
  tagFilter: string | null;
  tagColors: Record<string, TagColor>;
  /** Whether the user has clicked "예시 추가" at least once (persisted in localStorage). */
  seeded: boolean;
  /** Memory-only prefill cache for template variables; not persisted. */
  lastUsedValues: Record<string, Record<string, string>>;

  hydrate: () => Promise<void>;
  create: (input: PromptInput) => Promise<Prompt>;
  update: (id: string, patch: Partial<PromptInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setQuery: (q: string) => void;
  setTagFilter: (t: string | null) => void;
  rememberValues: (id: string, values: Record<string, string>) => void;
  setTagColor: (tag: string, color: TagColor) => Promise<void>;
  seedExamples: () => Promise<Prompt[]>;
  removeMany: (ids: string[]) => Promise<void>;
  bulkEditTags: (ids: string[], add: string[], removeTags: string[]) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  status: "idle",
  query: "",
  tagFilter: null,
  tagColors: {},
  seeded: typeof window !== "undefined" && window.localStorage.getItem("prompet:seeded") === "1",
  lastUsedValues: {},

  hydrate: async () => {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading" });
    try {
      const [prompts, tagColors] = await Promise.all([db.listPrompts(), db.listTagColors()]);
      set({ prompts, tagColors, status: "ready" });
    } catch (e) {
      console.error(e);
      set({ status: "error" });
    }
  },

  create: async (input) => {
    const now = Date.now();
    const prompt: Prompt = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      ...input,
      tags: input.tags ?? [],
    };
    await db.putPrompt(prompt);
    set({ prompts: [prompt, ...get().prompts] });
    return prompt;
  },

  update: async (id, patch) => {
    const existing = get().prompts.find((p) => p.id === id);
    if (!existing) return;
    const next: Prompt = { ...existing, ...patch, updatedAt: Date.now() };
    await db.putPrompt(next);
    set({ prompts: get().prompts.map((p) => (p.id === id ? next : p)) });
  },

  remove: async (id) => {
    await db.deletePrompt(id);
    set({ prompts: get().prompts.filter((p) => p.id !== id) });
  },

  setQuery: (query) => set({ query }),
  setTagFilter: (tagFilter) => set({ tagFilter }),
  rememberValues: (id, values) =>
    set({ lastUsedValues: { ...get().lastUsedValues, [id]: values } }),

  seedExamples: async () => {
    const created: Prompt[] = [];
    const now = Date.now();
    for (let i = 0; i < SEED_PROMPTS.length; i++) {
      const input = SEED_PROMPTS[i];
      const p: Prompt = {
        id: newId(),
        createdAt: now - i,
        updatedAt: now - i,
        title: input.title,
        body: input.body,
        tags: input.tags,
        sourceUrl: input.sourceUrl,
      };
      await db.putPrompt(p);
      created.push(p);
    }
    set({ prompts: [...created.slice().reverse(), ...get().prompts], seeded: true });
    if (typeof window !== "undefined") window.localStorage.setItem("prompet:seeded", "1");
    return created;
  },

  removeMany: async (ids) => {
    const set_ = new Set(ids);
    for (const id of ids) await db.deletePrompt(id);
    set({ prompts: get().prompts.filter((p) => !set_.has(p.id)) });
  },

  bulkEditTags: async (ids, add, removeTags) => {
    const idSet = new Set(ids);
    const removeSet = new Set(removeTags);
    const next: Prompt[] = [];
    for (const p of get().prompts) {
      if (!idSet.has(p.id)) {
        next.push(p);
        continue;
      }
      const merged = [...new Set([...p.tags.filter((t) => !removeSet.has(t)), ...add])];
      const updated: Prompt = { ...p, tags: merged, updatedAt: Date.now() };
      await db.putPrompt(updated);
      next.push(updated);
    }
    set({ prompts: next });
  },

  setTagColor: async (tag, color) => {
    if (color === DEFAULT_TAG_COLOR) {
      await db.deleteTagColor(tag);
      const next = { ...get().tagColors };
      delete next[tag];
      set({ tagColors: next });
    } else {
      await db.putTagColor(tag, color);
      set({ tagColors: { ...get().tagColors, [tag]: color } });
    }
  },
}));

export function selectTagColor(state: PromptState, tag: string): TagColor {
  return state.tagColors[tag] ?? DEFAULT_TAG_COLOR;
}

export function selectFiltered(state: PromptState): Prompt[] {
  const q = state.query.trim().toLowerCase();
  return state.prompts.filter((p) => {
    if (state.tagFilter && !p.tags.includes(state.tagFilter)) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export function selectAllTags(state: PromptState): string[] {
  const set = new Set<string>();
  for (const p of state.prompts) for (const t of p.tags) set.add(t);
  return [...set].sort();
}
