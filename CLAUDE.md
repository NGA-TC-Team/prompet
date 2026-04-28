# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Runtime is **Bun** (per global rules). Use `bun` / `bunx` instead of `npm` / `npx`.

- `bun run dev` — start Next.js dev server (http://localhost:3000)
- `bun run build` — production build
- `bun run start` — serve production build
- `bun run lint` — ESLint (flat config, `eslint.config.mjs`)

There is no test runner configured yet.

## Stack & Versions

- **Next.js 16.2.4** with App Router (`app/` directory). Per `AGENTS.md`, this version has breaking changes vs. older Next.js — **read `node_modules/next/dist/docs/` (especially `01-app/`) before writing routing, data-fetching, or server-component code**. Do not assume APIs from training data are still valid.
- **React 19.2** + React DOM 19.2.
- **Tailwind CSS v4** via `@tailwindcss/postcss` (PostCSS plugin model, not v3 config). Global styles in `app/globals.css`; no `tailwind.config.*` — theming via CSS `@theme`.
- **TypeScript** strict, path alias `@/*` → repo root.
- ESLint flat config extending `eslint-config-next` core-web-vitals + typescript presets.

## Architecture (intended)

The product is a local-first prompt manager (per the initial spec):

- **Storage**: IndexedDB on the client (no backend). Treat the browser as the source of truth.
- **State**: Zustand store(s) — split by concern (e.g. prompt CRUD vs. UI filter state). Keep persistence (IndexedDB sync) at the store boundary, not in components.
- **UI**: shadcn/ui components (install via `bunx shadcn@latest add <component>` once initialized — generates into `components/ui/`).
- **Routing**:
  - `/` — owner workspace: list, search, tag-filter, create/edit prompts, copy-to-clipboard, share.
  - `/prompts` — read-only public view. Prompt payload is carried in the URL via **nuqs** (URL-as-state), so shared links self-contain the prompt; this view must not read from IndexedDB.
- **Sharing**: serialize a prompt into nuqs query params on share; `/prompts` deserializes and renders read-only.
- **Bookmark-style import**: when editing, support fetching/parsing a referenced URL to prefill the prompt form (in addition to manual entry).
- **Forms**: all prompt create/edit forms use **react-hook-form** with **zod** schemas, wired via `@hookform/resolvers/zod` (`zodResolver`). Define the zod schema once and reuse it for both form validation and any IndexedDB write-time sanity checks; infer TS types with `z.infer`.

When implementing, keep the read-only `/prompts` route free of IndexedDB / Zustand-persistence dependencies — it must work for a visitor who has never opened the app.

## Conventions (from global rules)

- React business logic lives in custom hooks; components stay declarative.
- State scope: system / app / local — use Zustand for cross-component (app) state.
- Functional style first; reach for classes only when justified.
- Shell: prefer `rg` over `grep`, `fd` over `find`, `jq` for JSON.
