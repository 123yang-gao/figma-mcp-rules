# figma-mcp-rules

可复用的 **Cursor Rules + Skills + Figma 资源脚本**，从 [sweepstakes-shell](https://github.com/) 抽离，供任意 Nuxt/Vue 项目引入后直接使用 Figma MCP 设计还原流程。

来源仓库：`sweepstakes-shell` 的 `.cursor/rules`、`.cursor/skills` 及关联 `scripts/`。

## 包含内容

| 目录 | 说明 |
|------|------|
| `.cursor/rules/` | 8 条规则（Figma 专项 + 项目惯例 + lint DoD） |
| `.cursor/skills/` | 4 个 Skill（implement-design、create-design-system-rules、init-brand-branch、ui-refactor） |
| `.cursor/mcp.json` | Figma MCP 配置模板 |
| `scripts/` | 资源下载、SVG trim/verify、位图 verify、Flat Icon 合并库 |
| `docs/figma-cursor-setup.md` | 文件清单与 `pnpm` 命令说明 |
| `docs/figma-naming-guide.md` | Figma 图层命名规范（设计师 ↔ 代码映射） |
| `docs/project-features.md` | sweepstakes-shell 功能全景（UI 重构参考） |
| `templates/` | `package.json` 脚本片段、`CLAUDE.md` 引用片段 |

### Rules

- `figma-design-system.mdc` — 总入口、MCP 流程、检查清单
- `figma-pixel-perfect.mdc` — 1:1 像素还原
- `figma-raster-assets.mdc` — 位图 2×、`get_screenshot`
- `figma-svg-icons.mdc` — SVG、viewBox trim、Flat Icon
- `figma-auth-form.mdc` — 登入/注册表单 Modal
- `megaphps2-molecules.mdc` — MOLECULES 交互规格
- `project-conventions.mdc` — i18n、组件复用、Icon 规范
- `lint-rule.mdc` — 完成前须 `pnpm lint`

### Skills

- `figma-implement-design` — Figma → Vue 完整流程（**日常必用**）
- `figma-create-design-system-rules` — 刷新 `figma-design-system.mdc`
- `init-brand-branch` — 新品牌分支初始化（sweepstakes 专用，可选）
- `ui-refactor` — sweepstakes-shell 页面 UI 重构工作流（含 `bindings.md` 绑定清单）

## 前置条件

目标项目建议具备：

- **Nuxt 3/4 + Vue 3**（规则中的路径约定）
- 资源目录：`app/assets/icons/`（SVG）、`app/assets/imgs/<子目录>/`（位图）
- Node.js 18+（脚本使用原生 `fetch`）
- Cursor + [Figma MCP](https://mcp.figma.com/mcp) 已登录

## 快速接入（推荐：Git Submodule）

在目标项目根目录执行：

```bash
git submodule add https://github.com/123yang-gao/figma-mcp-rules.git vendor/figma-mcp-rules
node vendor/figma-mcp-rules/install.mjs
```

安装脚本会：

1. 将 **rules / skills** 链接（或复制）到目标项目 `.cursor/`
2. 将 **figma 脚本** 链接到目标项目 `scripts/`（已存在文件不覆盖）
3. 合并 **`package.json`** 中的 `assets:*` / `icons:*` 命令
4. 在 **`.cursor/mcp.json`** 中确保存在 `figma` MCP 配置
5. 若不存在则安装 **`docs/figma-cursor-setup.md`**

安装完成后 **Reload Cursor Window**，Agent 即可加载全部 rule 与 skill。

### 选项

```bash
# 指定目标目录
node vendor/figma-mcp-rules/install.mjs --target=/path/to/your-project

# Windows 无开发者模式时改用复制
node vendor/figma-mcp-rules/install.mjs --copy

# 仅链接 rules/skills/scripts，不改动 package.json / mcp.json
node vendor/figma-mcp-rules/install.mjs --no-merge-package --no-merge-mcp
```

### 更新 submodule

```bash
git submodule update --remote vendor/figma-mcp-rules
node vendor/figma-mcp-rules/install.mjs --copy
```

## 替代方式：直接克隆

```bash
git clone https://github.com/123yang-gao/figma-mcp-rules.git /tmp/figma-mcp-rules
node /tmp/figma-mcp-rules/install.mjs --target=. --copy
```

## package.json 脚本（合并后可用）

| 命令 | 作用 |
|------|------|
| `pnpm assets:download` | 按 `download-figma-assets.mjs` 清单下载 + manifest trim |
| `pnpm icons:trim:manifest` | 仅 trim 本次下载的 SVG |
| `pnpm icons:trim` | 全库 trim（**Figma 单屏任务禁止**） |
| `pnpm icons:verify` | SVG 自检 |
| `pnpm assets:verify:raster` | 位图 2× 自检 |
| `pnpm assets:verify` | 位图 + SVG 一并校验 |

## CLAUDE.md / AGENTS.md

将 `templates/CLAUDE.md.snippet` 追加到项目的 `CLAUDE.md`，便于 Agent 发现 rules 入口。

## 项目定制

引入后可在目标项目**本地**覆盖或增补（install 默认不覆盖已有 `scripts/` 文件）：

- `scripts/figma-screenshot-exports.json` — 登记 `get_screenshot` 位图
- `scripts/download-figma-assets.mjs` 内 `assets` — 当前任务 MCP URL 清单

`init-brand-branch` skill 依赖 `shell/startup.sh`、`ecosystem.config.cjs` 等 sweepstakes 结构；其他项目可忽略或自行改写。

## 目录结构

```
figma-mcp-rules/
├── .cursor/
│   ├── mcp.json
│   ├── rules/*.mdc
│   └── skills/*/SKILL.md
├── scripts/
│   ├── lib/
│   ├── download-figma-assets.mjs
│   ├── trim-svg-icons.mjs
│   ├── verify-svg-icons.mjs
│   ├── verify-raster-assets.mjs
│   ├── download-sidebar-fishing.mjs   # Flat Icon 范例
│   └── figma-screenshot-exports.json
├── docs/figma-cursor-setup.md
├── templates/
├── install.mjs
└── README.md
```

## License

MIT
