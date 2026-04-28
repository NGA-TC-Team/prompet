# Prompet

Local-first prompt manager that runs entirely in your browser. Save your LLM prompts, organise them with colored tags, turn them into reusable templates with variables, and share self-contained links — without ever sending data to a server.

> Inspired by [knqyf263/pet](https://github.com/knqyf263/pet) — a CLI snippet manager. We borrow its template-with-variables idea and adapt it to LLM prompts in the browser, then build a polished editorial-monochrome workspace around it.

## How it relates to pet

|              | pet (CLI, Go)            | Prompet (web)                                       |
| ------------ | ------------------------ | --------------------------------------------------- |
| Storage      | TOML file on disk        | IndexedDB in your browser (no backend)              |
| Interface    | shell command            | Next.js app (App Router)                            |
| Variables    | `<param=default>`        | `{{name}}` · `{{name=default}}` · `{{name\|label}}` |
| Sharing      | Gist / file              | URL with payload encoded (`/prompts?d=…`)           |
| Audience     | terminal users           | anyone with a browser                               |

## Features

### Storage & data
- **Local-first** — prompts and tag colors live in your browser's IndexedDB; no account, no server store.
- **Export to ZIP** — a one-click bundle with one Markdown file per prompt (frontmatter: id, dates, tags, source, color), an index `README.md`, and a `tag-colors.json` snapshot. Powered by [`jszip`](https://stuk.github.io/jszip/).
- **Seed examples** — empty state offers a single-shot button that inserts 3 production-grade example prompts (코드 리뷰 / 회의록 → 액션 / 블로그 톤 다듬기). The button hides itself permanently after first use.

### Templates (the pet-style core)
- Write `{{topic}}`, `{{tone=friendly}}`, `{{name|라벨}}` anywhere in the body.
- When you copy or share, Prompet pops a fill dialog with one input per unique variable (defaults pre-filled, label customised per `|label` syntax), validates with zod, then either copies the rendered text or builds a self-contained share link.

### Organisation
- **Tags & search** — filter by tag chip, full-text search across title/body/tag, keyboard `/` to focus search.
- **Per-tag colors** — 9-color palette (gray/red/orange/amber/green/teal/blue/violet/pink). Click the small swatch on any tag chip to pick a color. Multiple colored tags blend into a soft halo around the card.
- **Selection mode** — toggle "선택" to enable card checkboxes. "전체 선택" toggles all-on/all-off. With ≥1 card selected, an inverted ink action bar slides in offering "{n} 삭제" and "태그 편집하기" (bulk add/remove). All ops go through IndexedDB.
- **Pagination** — list paginates at 15 per page with a windowed numeric pager once the library grows.

### Sharing
- **Two share modes** — share the template as-is (recipient fills variables) or share the rendered result. Tag colors travel with the link.
- **Read-only public view** at `/prompts?d=…` — query string parsed client-side via `useSearchParams` so the route stays statically cached and the prompt payload never reaches a server.
- **Bookmark-style import** — paste any URL into the editor and Prompet's `/api/bookmark` route fetches `<title>` / `og:title` / meta description with SSRF guards and a 5-second timeout, then prefills the form.

### Onboarding & guidance
- **? help modal** — a 5-step interactive walkthrough with motion-driven micro-demos that mirror the real UI: cards spring in, the template fill dialog actually fills its inputs, the search bar types and the result list reflows, the share dropdown toggles between two modes, the tag color picker pulses through colors. Auto-opens on first visit (gated by `localStorage`).
- **프롬프트 작성 가이드** — a separate right-side sheet with 12 production-grade technique cards (Role, Output Schema, Decomposition, Chain-of-Thought, Self-Consistency, Few-shot, Constraints, Variable Slots, Self-Critique, two anti-patterns, deterministic-vs-creative ops). Each card explains *why* and includes a substantial copy-ready example.

### Visual & UX
- **Modern monochrome** — pure neutral OKLCH token palette, Playfair Display headlines, Geist body, JetBrains Mono small caps for meta labels. The only chromatic accents are user-chosen tag colors.
- **Light / dark / system theme** with a circular View Transitions reveal animated from the toggle button (480 ms ease-out clip-path).
- **Edit sheet** — the editor slides in from the right side instead of opening as a centered modal, giving the form room to breathe.
- **Hover redraw on Copy/Share** — the icon's SVG paths re-draw with a 1.1 s `cubic-bezier` `stroke-dasharray` sweep on hover.
- **Entrance animation** — header, search, tag filter, and list each spring in from a different direction; cards launch from one of 8 angles based on a stable hash of their id.
- **Tag halo** — every tag with a non-default color contributes a low-alpha (α ≤ 0.10) directional shadow to one of the four card sides; multiple colors blend additively.

## Stack

- **Next.js 16** (App Router) on **Bun** — read `node_modules/next/dist/docs/01-app/` before changing routing/data-fetching code.
- React 19, Tailwind CSS v4 (PostCSS plugin model, CSS-first `@theme`)
- Zustand (state) + IndexedDB via [`idb`](https://github.com/jakearchibald/idb) (persistence boundary inside the store)
- [nuqs](https://nuqs.47ng.com/) — URL-as-state for shared prompts
- react-hook-form + zod (`zodResolver`) for forms (single schema reused for form validation and DB writes)
- [`motion`](https://motion.dev/) for entrance/transition animations
- [`next-themes`](https://github.com/pacocoursey/next-themes) + View Transitions for theme switching
- [`jszip`](https://stuk.github.io/jszip/) for export
- shadcn/ui-style primitives built directly on Radix UI; Sonner for toasts; Lucide icons

## Develop

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
bun run build
```

Bun is the runtime and package manager — use `bun` / `bunx` instead of `npm` / `npx`.

## Project layout

```
app/
  layout.tsx              # font loading, theme provider, toaster
  page.tsx                # workspace (your prompts)
  globals.css             # OKLCH monochrome tokens + view-transition + icon-redraw
  prompts/page.tsx        # read-only shared view shell (Suspense wrapper)
  api/bookmark/route.ts   # SSRF-guarded URL meta fetcher

components/prompts/
  workspace.tsx           # header + search + tag filter + list
  prompt-list.tsx         # list, pagination, selection mode, bulk actions, export
  prompt-card.tsx         # card with tag halo, redraw icons, select checkbox
  prompt-form.tsx         # rhf + zodResolver, bookmark-import slot, tags input
  prompt-editor-dialog.tsx# right-side Sheet wrapping the form (create/edit)
  template-fill-dialog.tsx# variable input dialog for copy/share-rendered
  share-button.tsx        # template-as-is vs rendered share modes
  shared-prompt-resolver.tsx + shared-prompt-view.tsx  # read-only /prompts
  search-bar.tsx + tag-filter.tsx + tag-chip.tsx
  bulk-tag-edit.tsx       # bulk add/remove tags across selected prompts
  help-modal.tsx + help-demos.tsx     # onboarding modal with motion demos
  prompt-guide-sheet.tsx  # 12-card prompt-engineering technique guide
  bookmark-import.tsx     # URL paste-to-prefill control

components/ui/            # Button/Card/Input/Label/Textarea/Badge/Dialog/Sheet/DropdownMenu primitives
components/theme-toggle.tsx + theme-provider.tsx
components/ui/sheet.tsx   # Radix-based right-side sheet primitive

lib/prompts/
  schema.ts               # single zod schema (PromptInput / Prompt / SharedPrompt)
  db.ts                   # IndexedDB v2 — prompts + tag_colors stores
  template.ts             # {{var}} parser + renderer (pure, testable)
  share-codec.ts          # base64url JSON codec for share URLs (tag colors included)
  tag-colors.ts           # palette + Tailwind classes + halo builder
  seed.ts                 # 3 example prompts for the seed button
  export.ts               # JSZip bundling + downloader
  id.ts                   # crypto.randomUUID wrapper

stores/prompt-store.ts    # Zustand — only file that talks to IndexedDB
hooks/                    # use-clipboard, use-hydrate-prompts
```

## Data flow

1. Workspace mounts → `usePromptStore.hydrate()` reads IndexedDB (prompts + tag colors).
2. All mutations (`create`, `update`, `remove`, `removeMany`, `bulkEditTags`, `seedExamples`, `setTagColor`) go through the store → write to IndexedDB → update memory.
3. Copy/share on a prompt with variables opens the fill dialog (rhf + per-variable dynamic validation). For the *rendered* share path, the dialog snapshots the store's `tagColors` and embeds them in the share payload.
4. `/prompts` is a static client-rendered page. `SharedPromptResolver` reads `?d=` via `useSearchParams`, decodes through `share-codec.ts`, and renders `SharedPromptView` — without ever importing the store or `db.ts`. This keeps the route cacheable and ensures shared content stays out of server logs.

## License

MIT (or your choice — update before publishing).
