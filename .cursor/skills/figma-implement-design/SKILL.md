---
name: figma-implement-design
description: >-
  Translates Figma designs into production-ready Nuxt/Vue code with 1:1 visual
  fidelity. Use when the user provides a Figma URL or node ID, asks to implement
  a screen/component from Figma, or syncs UI to an updated design. Requires the
  Figma MCP server (get_design_context, get_screenshot). Read-only Figma MCP only;
  this project does not use use_figma / in-file Figma editing.
---

# Implement Design (Figma → Nuxt)

Structured workflow for turning Figma nodes into code in this repository. Follow every step in order; do not skip.

## Prerequisites

- Figma MCP server connected (`user-Figma` / `https://mcp.figma.com/mcp`)
- User provides a frame or layer URL, e.g. `https://figma.com/design/:fileKey/:fileName?node-id=42-15`
- Read `CLAUDE.md`, `.cursor/rules/figma-design-system.mdc`, `.cursor/rules/figma-pixel-perfect.mdc`, **`.cursor/rules/figma-page-restore-dod.mdc`** (RWD + `pnpm dev` DoD), and (for login/register/forms) **`.cursor/rules/figma-auth-form.mdc`** before writing code

## When to use

- Implementing a component or page from a Figma link
- Updating existing Vue UI to match a revised Figma frame
- Pulling layout, typography, or colors from Figma into this codebase

## When NOT to use

- Creating or editing nodes inside Figma (`use_figma`) — out of scope for this repo

## Required workflow

### Step 1: Parse the Figma URL

From `https://figma.com/design/:fileKey/:fileName?node-id=42-15`:

| Field | Value |
|-------|--------|
| `fileKey` | segment after `/design/` |
| `nodeId` | query `node-id`, with **hyphens changed to colons** (`42-15` → `42:15`) |

Branch URLs: `.../design/:fileKey/branch/:branchKey/...` → use `branchKey` as `fileKey`.

### Step 2: Fetch design context

Call `get_design_context` on server `user-Figma`:

```
get_design_context(
  fileKey="...",
  nodeId="42:15",
  clientLanguages="typescript",
  clientFrameworks="vue,nuxt"
)
```

If truncated or too large:

1. `get_metadata(fileKey, nodeId)` for the node tree
2. Re-fetch children with `get_design_context` per child `nodeId`

### Step 3: Visual reference

Call `get_screenshot` with the same `fileKey` and `nodeId` (unless the design context response already includes an adequate screenshot and the user did not ask to skip).

Keep the screenshot for final validation.

### Step 4: Assets

- **SVG 图标（全部）** → `app/assets/icons/`（根目录扁平）。**位图（全部）** → `app/assets/imgs/<子目录>/`（见 **`figma-design-system.mdc`** § 资源路径）。
- **Flat Icon / 侧栏 24×24**：按 **`figma-svg-icons.mdc`** § **Flat Icon — Dev Mode 等价导出** — `get_design_context` 设计稿实例 → MCP 各层 URL → `scripts/lib/compose-figma-flat-icon.mjs` 合并为 `viewBox="0 0 24 24"`；范例 `scripts/download-sidebar-fishing.mjs`。页面 **24×24** 槽位，**禁止** glyphSize 二次缩放。**禁止**对合并件跑 trim。
- 单层整帧 icon：`pnpm assets:download`（**仅登记本任务清单**）；任务完成后**清空** `assets`。
- Use **nuxt-svgo** (`<svgo-*>`) for SVG UI icons, not `<img>`. **Never** commit Figma MCP URLs in production code.
- 其他 icon trim：见 **`figma-svg-icons.mdc`**（**非** Flat Icon 合并件）→ `pnpm icons:verify`。**禁止** Figma 单屏任务结尾跑全库 `pnpm icons:trim`。
- Do not add icon libraries for assets already in the Figma payload.
- MCP URLs are download sources only—not final `src` values in Vue templates.
- **Raster images:** Follow **`.cursor/rules/figma-raster-assets.mdc`**. Save under `app/assets/imgs/<feature>/` at **2× pixel density**; register paths in `figma-screenshot-exports.json` as `invite/foo.png` (with subfolder). CSS stays **1× design px**.

### Step 5: Translate to this project

MCP output is usually React + Tailwind — treat it as **design spec**, not final code.

| Figma / MCP | This repo |
|-------------|-----------|
| React components | Vue 3 SFCs, `<script setup lang="ts">` |
| Tailwind classes | Scoped CSS in the same `.vue` file |
| Props | `defineProps<{ ... }>()` with TypeScript; `withDefaults` when needed |
| Text | 见 **`project-conventions.mdc`** § i18n：有规范 Key 用 `$t`；无 Key 硬编码；禁止临时新增 Key |
| Routes | `app/pages/` (Nuxt file-based routing) |
| Feature UI | `app/components/<feature>/` (e.g. `launch/`, `todo/`) |
| Shared logic | `app/composables/` |
| Types | `app/types/` |

**Styling (mandatory for new/changed styles):**

- Class names: **underscore** hierarchy (`card`, `card_title`, `card_title_active`)
- No tag selectors in CSS; style via `class` only
- No `any`; use `unknown` + narrowing when needed

**Brand / social multi-color icons (`social_*.svg`, 30×30 circles):**

After `pnpm assets:download`, open each SVG: MCP exports may ship **`clipPath` `<rect>` without `width`/`height`** → icon invisible in browser (siblings without clip may still show). Fix by flattening to `<path>` or valid clip rect; use hex fills; unify `viewBox`. Run **`pnpm icons:verify`**. See **`.cursor/rules/figma-svg-icons.mdc`** § 品牌色 / 社媒圆标.

**Gradient fill lines (1px dividers / decorative rules — not stroke borders):**

When the node is a thin frame/line with **fill = linear gradient** (e.g. sidebar social divider: light edges, saturated center):

1. Read **angle + stops** from `get_design_context`; verify on `get_screenshot`.
2. Use `background: linear-gradient(…)` on the element; typical symmetric pattern: `transparent 0%, <accent> 50%, transparent 100%`.
3. Do **not** default to `linear-gradient(90deg, accent 0%, transparent 100%)` (one-sided fade).
4. Do **not** apply `opacity` on the whole element to fake edge fade.
5. Prefer a CSS variable in brand token file when reused.

Full rules: **`.cursor/rules/figma-pixel-perfect.mdc`** §5.

**Gradient borders (Figma stroke → CSS):**

Figma often models a gradient outline as a **Stroke** with a gradient fill. CSS `border` / `border-color` cannot be a gradient — do **not** fake it with a solid color or drop the gradient.

When design context or the screenshot shows a **gradient stroke / gradient border**:

1. Do **not** use `border: …` with a gradient value.
2. Implement the stroke with a **`::before` pseudo-element** on the same element that carries the border radius and inner background.
3. Read **stroke weight** from Figma (e.g. 1px, 2px) as `padding` on the pseudo-element (see pattern below).
4. Read **corner radius** from Figma on the host; set `border-radius: inherit` on `::before`.
5. Set the host’s **fill** as the inner background (`background` / `background-color` on the host, not on `::before`).
6. Map gradient stops and angle from Figma’s stroke gradient to `linear-gradient(…)` (or `conic-gradient` if the design uses one).

```css
/* host: inner fill + positioning context */
.card {
  position: relative;
  border-radius: 12px; /* from Figma */
  background: #1a1a2e; /* inner fill from Figma */
}

/* ::before: gradient “border” ring via mask */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px; /* Figma stroke weight */
  background: linear-gradient(135deg, #6ee7b7, #3b82f6); /* Figma stroke gradient */
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```

- If content must sit above the ring, keep default stacking or add `z-index` only when needed; do not block clicks (`pointer-events: none` on `::before`).
- Modifier classes follow project naming, e.g. `card_gradient_border` when the gradient border is optional.
- If the frame is **stroke only** (no fill), use `background: transparent` on the host and the same `::before` pattern for the gradient ring.

Reuse existing components in the same feature folder before creating duplicates.

**Transforms / flip / rotation (`figma-pixel-perfect.mdc` §1 — mandatory audit):**

`get_metadata` does **not** list layer rotation. You **must** scan every `get_design_context` response (parent + children) for transform hints before marking a section done:

- Tailwind from MCP: `rotate-180`, `rotate-[Ndeg]`, `-scale-y-100`, `-scale-x-100`, `scale-y-[-1]`, nested `flex … rotate-*` wrappers
- Map to scoped CSS on the **same element** that holds the image/shape (not the page root)

| MCP pattern | CSS (typical) |
|-------------|----------------|
| `rotate-180` alone, or `-scale-y-100` + `rotate-180` (180° flip) | `transform: rotate(180deg);` |
| `rotate-[Ndeg]` | `transform: rotate(Ndeg);` |
| `-scale-x-100` (mirror horizontal) | `transform: scaleX(-1);` |
| `-scale-y-100` without 180° rotation | `transform: scaleY(-1);` |

- **Layered implementation:** every wrapper with rotation/scale in context → matching `transform` in Vue; do not assume the raster export baked it in.
- **Composite `get_screenshot` only:** transforms should appear in the bitmap; if UI still mismatches, re-fetch context on that subtree and switch to layered assets + CSS transforms.
- After implementation, grep your new `.vue` files for `transform:` and confirm count ≥ number of rotate/scale wrappers found in context.

**Form / Auth modal audit (mandatory when implementing login, register, forgot, or any `Input Field` / `Check Box` screen):**

Follow **`.cursor/rules/figma-auth-form.mdc`** in full — especially **§0 設計稿清單制** (whitelist from Figma only; no legacy UI in template).

Minimum before coding:

1. Build the **design inventory** for this screen **and each Switch Menu tab** (list what exists + explicit «不存在»).
2. Per `Input Field` node: confirm whether **`Right` is empty** — if empty, do not add password-eye or clear icons.
3. Per `Check Box` row: copy **`items-center` vs `items-start`** from context; do not default to `flex-start`.
4. Checked state: if Figma provides a checked asset/layer, **export SVG** — no CSS `::after` tick.
5. Close control: map to **`Flat Icon / System / Close`** (or design-named instance), not `app-close`.
6. In `app/pages/@auth/*.vue`, use correct **Nuxt auto-import names** (`AuthMegaAuthModal`, `FormMegaLoginItem`, …) or explicit imports.
7. **Do not mount** `CountryCode`, `WithLoginItem`, `FormBanner`, `FormInput`, etc. unless that exact control appears in the Figma subtree for the active tab.

Before marking done: grep new/changed `.vue` for forbidden legacy mounts (see **`figma-auth-form.mdc`** §0.3).

### Step 6: 1:1 visual parity

Match spacing, typography, and colors from design context. Prefer project tokens when they exist; otherwise use Figma values and note deviations in a short comment only when necessary.

Include **transform parity** from the Step 5 audit (flipped characters, mirrored edge fades, rotated decorations).

### Step 7: Validate

Run verification **before** marking done:

```bash
pnpm lint
pnpm type-check   # when TS changed
pnpm dev          # must start without compile/startup errors
```

Compare the running UI (or built markup) to the Step 3 screenshot:

- Layout, typography, colors, states (hover/disabled if in design)
- Assets render
- **RWD (mandatory for pages/shell):** follow **Figma frame widths for this page** per **`.cursor/rules/figma-page-restore-dod.mdc`** — `useDevice().isMobile` for shell, `.is-web` + `@media` only where design differs between widths
- i18n keys present for both locales when text is user-facing
- **Forms/Auth (if applicable):** password fields have no extra right icons; checkbox row alignment; checked glyph; close icon shape — per **`figma-auth-form.mdc`** §5 checklist

Full page-restore DoD: **`.cursor/rules/figma-page-restore-dod.mdc`**

## MCP tool reference

| Tool | Purpose |
|------|---------|
| `get_design_context` | Primary structured output + asset URLs |
| `get_metadata` | Node map when context is truncated |
| `get_screenshot` | Visual ground truth |
| `get_variable_defs` | Design tokens / variables when needed |

## Examples

**Button from URL:** Parse URL → `get_design_context` + `get_screenshot` → extend or add component under `app/components/` → scoped CSS with underscore classes → validate against screenshot.

**Full page:** `get_metadata` on frame → implement sections as child components → compose in `app/pages/...` → validate full-page screenshot.

## Common issues

| Issue | Action |
|-------|--------|
| Truncated context | `get_metadata`, then per-child `get_design_context` |
| Visual mismatch | Re-check spacing/colors in context vs screenshot |
| Icon looks small / padded in fixed slot | Trim **该 icon 文件** only（见 `figma-svg-icons.mdc` §任务范围限制）；do not CSS-scale svgo icons |
| Background image blank in UI | Check file size; `get_screenshot` per `figma-screenshot-exports.json` (`figma-raster-assets.mdc`) |
| Gradient border in Figma (gradient stroke) | Do not use `border` for gradient; use host background + `::before` + mask (see **Gradient borders** under Step 5) |
| Element facing wrong / mirrored vs Figma | Re-read child `get_design_context`; apply `transform` per **Transforms / flip / rotation** (`figma-pixel-perfect.mdc` §1); do not only swap assets |
| Assets 404 | Use MCP URLs unchanged; confirm Figma MCP session is active |
| Rate limits | Batch node fetches; avoid redundant tool calls |
| Password field shows eye but Figma `Right` is empty | Remove `show-eye`; read **`figma-auth-form.mdc`** §1.2 |
| Checkbox label not vertically centered with circle | Use Figma `items-center`; remove `flex-start` / extra `margin-top` — §1.5 |
| Checkmark off-center in circle | Export checked SVG from Figma; drop `::after` hack — §1.3 |
| Wrong close icon (X only vs circle+X) | Export `Modal Title Header` close; use dedicated svgo — §1.4 |
| Modal route blank / `Failed to resolve component` | Fix Nuxt names: `AuthMegaAuthModal`, `FormMegaLoginItem` — §3 |
| Copied `show-eye` from old `FormInput` | New `Mega*` components must not inherit old Form props without Figma proof — §1.1 |
| Extra UI (e.g. `country-code-wrapper`) | §0 design inventory: if not in Figma tree for this tab, remove from template; API-only in script |

## Related skills

- **figma-create-design-system-rules** — generate or update `.cursor/rules/figma-design-system.mdc`
- Project rules: `CLAUDE.md`, `figma-pixel-perfect.mdc`, `figma-design-system.mdc`, `figma-raster-assets.mdc`, `figma-svg-icons.mdc`, **`figma-auth-form.mdc`**
