---
name: figma-create-design-system-rules
description: >-
  Generates or updates project-specific Figma design-system rules for AI agents.
  Use when the user asks to create design system rules, set up Figma guidelines,
  customize design-to-code conventions, or integrate figma-create-design-system-rules.
  Requires Figma MCP (user-Figma). Output for Cursor is `.cursor/rules/figma-design-system.mdc`.
disable-model-invocation: false
---

# Create Design System Rules (Figma → this repo)

Generate or refresh **project-specific** rules so every Figma implementation matches this Nuxt codebase. Do not duplicate generic Figma docs—encode **this repo’s** paths, tokens, and workflows.

## Prerequisites

- Figma MCP connected (`.cursor/mcp.json` → `https://mcp.figma.com/mcp`)
- Read access to the codebase
- Existing rules: `CLAUDE.md`, `.cursor/rules/figma-pixel-perfect.mdc`

## Required workflow

### Step 1: Load Figma guidance

1. Fetch MCP resource `file://figma/docs/add-custom-rules.md` (server `user-Figma`) for the canonical rule template and MCP flow.
2. If the client exposes prompt `create_design_system_rules`, run it with `clientLanguages=typescript` and `clientFrameworks=vue,nuxt` and merge its template into your draft.

### Step 2: Analyze this codebase

Document (with real paths):

| Area | This project |
|------|----------------|
| UI components | `app/components/`, feature folders e.g. `app/components/launch/` |
| Shell layout | `app/layouts/shell.vue`, `AppHeader`, `AppSidebar`, `AppFooter` |
| Pages | `app/pages/` (Nuxt file-based routing) |
| Design tokens | `app/assets/scss/_variables.scss` (`$color_*`, `$shell_*`, `$font_*`) |
| Global SCSS | `app/assets/scss/main.scss`, auto-injected variables in `nuxt.config.ts` |
| Static assets | 图标：`app/assets/icons/`（扁平）；位图：`app/assets/imgs/<子目录>/`（见 figma-design-system.mdc 目录表） |
| Asset registry | `app/constants/shell-assets.ts`, `launch-assets.ts`, `app/constants/app-nav.ts` |
| i18n | `i18n/locales/zh.json`, `i18n/locales/en.json`; `useI18n()` / `$t()` |
| Asset download | `pnpm assets:download` → `scripts/download-figma-assets.mjs` |

### Step 3: Draft rules

Include at minimum:

- **Rule priority:** `CLAUDE.md` > `project-conventions.mdc` > `figma-pixel-perfect.mdc` > `figma-auth-form.mdc` (forms/auth) > `figma-design-system.mdc` > generic MCP defaults.
- **Specialty rules (do not duplicate in hub):** `figma-raster-assets.mdc`, `figma-svg-icons.mdc`, **`figma-auth-form.mdc`** (login/register modals).
- **Figma MCP required flow:** `get_design_context` → `get_metadata` (if truncated) → `get_screenshot` → localize assets → implement → validate against screenshot.
- **Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, scoped CSS, underscore class names, no tag selectors.
- **Assets:** All Figma SVG → `app/assets/icons/`; all raster → `app/assets/imgs/<existing-subfolder>/`; no MCP URLs in production; `get_screenshot` paths registered as `subdir/file.png` in `figma-screenshot-exports.json` (see `figma-raster-assets.mdc`).
- **Implementation skill:** Load **figma-implement-design** (`.cursor/skills/figma-implement-design/`) for every Figma UI task.
Align with **`figma-pixel-perfect.mdc`** (gradient borders, Swiper for carousels, etc.)—do not weaken them.

### Step 4: Save for Cursor

Write the merged rules to:

**`.cursor/rules/figma-design-system.mdc`**

Use YAML frontmatter:

```yaml
---
description: Project design system + Figma MCP rules for sweepstakes-shell
globs:
  - app/**/*.vue
  - app/**/*.ts
  - app/assets/**
alwaysApply: false
---
```

Keep **`figma-design-system.mdc`** as the project hub; do not duplicate `figma-pixel-perfect.mdc`, `figma-auth-form.mdc`, or other asset-specific rules in full.

### Step 5: Wire project docs

- Add this skill to `AGENTS.md` under **Figma design-to-code**.
- Register in `skills-lock.json` (local skill path).
- Update **figma-implement-design** “Related skills” if paths changed.

### Step 6: Validate

Implement one small Figma node and confirm the agent:

- Loads `figma-implement-design` + respects `figma-design-system.mdc`
- Uses local assets and underscore CSS
- Does not paste MCP URLs into constants

## When to re-run

- New feature folders or token files
- Asset pipeline changes
- Team changes Figma file / shell dimensions (e.g. sidebar width)

## Related

- `.cursor/rules/figma-design-system.mdc` — generated output (project hub)
- `.cursor/rules/figma-pixel-perfect.mdc` — 1:1 pixel-perfect constraints
- `figma-implement-design` — per-task implementation workflow
