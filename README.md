# figma-mcp-rules

可复用的 **Cursor Rules + Skills + Figma 资源脚本 + Agent 工作流**，供任意 Nuxt/Vue 项目引入后使用 Figma MCP 设计还原与 Agent 协作流程。

## 包含内容

| 目录 | 说明 |
|------|------|
| `.cursor/rules/` | 10 条规则（Figma 专项 + 项目惯例 + lint DoD + **页面还原 DoD**） |
| `.cursor/skills/` | Figma 4 个 + OpenSpec 5 个 Skill |
| `.cursor/commands/` | OpenSpec slash 命令（`opsx-*.md`） |
| `agent-toolkit/` | Superpowers / gstack 安装脚本与 hooks |
| `openspec/templates/` | `config.yaml` 模板 |
| `scripts/` | 资源下载、SVG trim/verify、位图 verify |
| `docs/` | 接入说明、Agent 技能包、Figma 命名规范 |

### Rules

- `figma-icon-export.mdc` — 父帧 `icon-*` 整帧 SVG 导出/合成（**alwaysApply**）
- `figma-page-restore-dod.mdc` — 页面还原 DoD（`pnpm dev` + screenshot 验收）
- `figma-design-system.mdc` — 总入口、MCP 流程、检查清单
- `figma-pixel-perfect.mdc` — 1:1 像素还原
- `figma-raster-assets.mdc` — 位图 2×、`get_screenshot`
- `figma-svg-icons.mdc` — SVG、viewBox trim、Flat Icon
- `figma-auth-form.mdc` — 登入/注册表单 Modal
- `megaphps2-molecules.mdc` — MOLECULES 交互规格
- `project-conventions.mdc` — i18n、组件复用、Icon 规范
- `lint-rule.mdc` — 完成前须 `pnpm lint`

### Skills

**Figma**

- `figma-implement-design` — Figma → Vue 完整流程（**日常必用**）
- `figma-create-design-system-rules` — 刷新 `figma-design-system.mdc`
- `init-brand-branch` — 新品牌分支初始化（sweepstakes 专用，可选）
- `ui-refactor` — 页面 UI 重构工作流（含 `bindings.md`）

**OpenSpec**（内置，随 `install.mjs` 安装）

- `openspec-propose` / `openspec-apply-change` / `openspec-explore` / `openspec-sync-specs` / `openspec-archive-change`

**Superpowers / gstack**（经 `agent-toolkit/install.mjs`，需 clone upstream）

- Superpowers：`brainstorming`、`systematic-debugging`、`test-driven-development` 等
- gstack：`gstack-review`、`gstack-ship`、`gstack-qa` 等（需 `bun` 生成）

## 快速接入

```bash
git submodule add https://github.com/123yang-gao/figma-mcp-rules.git vendor/figma-mcp-rules
node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit
```

安装脚本会：

1. 链接 **rules / skills / commands** 到目标 `.cursor/`
2. 安装 **`openspec/config.yaml`** 模板（若不存在）
3. 链接 **figma 脚本** 到 `scripts/`
4. 合并 **`package.json`** 脚本（含 `agent:install`）
5. 确保 **Figma MCP** 配置
6. （`--with-agent-toolkit`）安装 Superpowers / gstack skills

安装完成后 **Reload Cursor Window**。

### 选项

```bash
node vendor/figma-mcp-rules/install.mjs --copy
node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit --copy
node vendor/figma-mcp-rules/agent-toolkit/install.mjs --fetch
```

## package.json 脚本（合并后）

| 命令 | 作用 |
|------|------|
| `pnpm assets:download` | Figma 资源下载 + trim |
| `pnpm icons:verify` | SVG 自检 |
| `pnpm agent:install` | `install.mjs --with-agent-toolkit` |
| `pnpm agent:gstack:gen` | 重新生成 gstack Cursor skills |
| `pnpm openspec:init` | OpenSpec CLI 初始化 |

## 文档

- [docs/figma-cursor-setup.md](docs/figma-cursor-setup.md) — Figma 文件清单
- [docs/agent-skills-setup.md](docs/agent-skills-setup.md) — Superpowers / gstack / OpenSpec
- [agent-toolkit/UPSTREAM-SYNC.md](agent-toolkit/UPSTREAM-SYNC.md) — upstream 更新

## License

MIT
