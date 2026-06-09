# Figma 接入 — 文件说明

本说明适用于 **[figma-mcp-rules](https://github.com/123yang-gao/figma-mcp-rules)** 独立仓库；通过 `install.mjs` 安装到目标项目后，路径与下文一致。

## 接入方式

```bash
git submodule add https://github.com/123yang-gao/figma-mcp-rules.git vendor/figma-mcp-rules
node vendor/figma-mcp-rules/install.mjs
```

详见仓库根目录 `README.md`。

---

## `.cursor/mcp.json`

| 文件 | 作用 |
|------|------|
| `mcp.json` | Figma MCP（`https://mcp.figma.com/mcp`）。`codegraph` 等为各项目自行配置，不在本包内。 |

---

## `.cursor/rules/`（Figma 专项 + 项目惯例）

Agent 编辑 `app/**`、`app/assets/**` 时，Cursor 按 `globs` 自动加载对应规则。`project-conventions.mdc`、`lint-rule.mdc` 为 alwaysApply。

| 文件 | 作用 |
|------|------|
| `project-conventions.mdc` | 全项目：i18n 文案、禁止改公共组件凑设计、Icon 须从 Figma 导出。 |
| `figma-icon-export.mdc` | **alwaysApply**：父帧 `icon-*` 整帧 SVG 导出/合成；禁止子图层碎片。 |
| `figma-design-system.mdc` | 总说明：Figma MCP 怎么用、资源放哪、实现检查项、规则优先级。 |
| `figma-pixel-perfect.mdc` | 还原约束：固定 px、旋转/翻转、背景与描边、渐变边框、Swiper、资源本地化。 |
| `figma-raster-assets.mdc` | 位图：`imgs/<子目录>/`、2× 导出、`get_screenshot`、校验命令。 |
| `figma-svg-icons.mdc` | SVG、`viewBox` trim、Flat Icon 合并、任务范围限制。 |
| `figma-auth-form.mdc` | 登入/注册表单 Modal：设计稿清单制、Input/Checkbox/Close。 |
| `megaphps2-molecules.mdc` | MOLECULES 交互规格（按钮四态、Filter/Tab）。 |
| `lint-rule.mdc` | Agent DoD：完成前须 `pnpm lint`，禁止 TS `any`。 |

---

## `.cursor/skills/`

| 目录 | 作用 |
|------|------|
| `figma-implement-design/` | Figma → Vue 完整流程（**日常必用**）。 |
| `figma-create-design-system-rules/` | 扫描仓库后更新 `figma-design-system.mdc`。 |
| `ui-refactor/` | sweepstakes-shell 页面 UI 重构（含 `bindings.md`、Shell 尺寸、父帧 icon 流程）。 |
| `init-brand-branch/` | 新品牌分支初始化（sweepstakes 专用，可选）。 |

---

## `scripts/`

| 文件 | 作用 |
|------|------|
| `download-figma-assets.mjs` | 按 `assets` 配置从 MCP URL 下载到 `icons/` 或 `imgs/<组名>/`。 |
| `trim-svg-icons.mjs` | SVG viewBox trim；支持 `--manifest` 仅处理本次下载。 |
| `lib/trim-svg-icon.mjs` | 单文件 trim 逻辑。 |
| `lib/compose-figma-flat-icon.mjs` | Flat Icon 24×24 多层 MCP SVG 合并。 |
| `verify-svg-icons.mjs` | SVG 自检（filter、clipPath 等）。 |
| `verify-raster-assets.mjs` | 位图 2× 体积/尺寸校验。 |
| `figma-screenshot-exports.json` | `get_screenshot` 登记配置（按项目填写）。 |
| `download-sidebar-fishing.mjs` | Flat Icon 合并范例脚本。 |

运行后可能生成（可不提交 git）：

| 文件 | 作用 |
|------|------|
| `scripts/.download-manifest.json` | `pnpm assets:download` 记录。 |

---

## `package.json` 脚本（install 合并）

| 命令 | 调用的脚本 |
|------|------------|
| `pnpm assets:download` | `download-figma-assets.mjs` + `trim-svg-icons.mjs --manifest` |
| `pnpm icons:trim` | 全库 trim（**Figma 单屏任务禁止**） |
| `pnpm icons:trim:manifest` | 仅 manifest 内 SVG |
| `pnpm icons:verify` | `verify-svg-icons.mjs` |
| `pnpm assets:verify:raster` | `verify-raster-assets.mjs` |
| `pnpm assets:verify` | 位图 + SVG |

---

## 资源落盘约定

- **图标（SVG）** → `app/assets/icons/`
- **位图** → `app/assets/imgs/<子目录>/`

---

## 项目内引用

将 `templates/CLAUDE.md.snippet` 追加到目标项目 `CLAUDE.md`，便于 Agent 发现 rules 入口。
