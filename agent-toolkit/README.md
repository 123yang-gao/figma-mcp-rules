# agent-toolkit — Superpowers / gstack / OpenSpec

将 [Superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[OpenSpec](https://github.com/Fission-AI/OpenSpec) 接入 Cursor Agent 工作流。

本目录随 [figma-mcp-rules](https://github.com/123yang-gao/figma-mcp-rules) 分发。

## 快速安装

```bash
# 方式 A：figma install 一并安装
node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit

# 方式 B：仅 agent-toolkit
node vendor/figma-mcp-rules/agent-toolkit/install.mjs --fetch
```

前置（gstack / Superpowers skills 来源）：

```bash
git clone --single-branch --depth 1 https://github.com/obra/superpowers.git vendor/superpowers
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git vendor/gstack
npm i -g bun   # gstack 生成 Cursor skills 需要
```

安装完成后 **Reload Cursor Window**。

## 安装结果

| 包 | 落盘位置 | 来源 |
|---|---|---|
| **OpenSpec** | `.cursor/skills/openspec-*`、`.cursor/commands/opsx-*.md`、`openspec/config.yaml` | 本包内置（`install.mjs` 链接） |
| **Superpowers** | `.cursor/skills/{brainstorming,...}` + `.cursor/hooks.json` | `vendor/superpowers` + 内置 hooks |
| **gstack** | `.cursor/skills/gstack-*` | `vendor/gstack` + `bun run gen:skill-docs --host cursor` |

Figma 专项 skills（`figma-*`、`ui-refactor`）**不会被覆盖**。

## 与项目规范的优先级

目标项目应以 **`project-conventions.mdc` / `CLAUDE.md` 为准**，与 Superpowers 默认行为冲突时：

- **i18n**：有正式 Key 用 `$t()`；无 Key 可硬编码（禁止 Agent 自创词条）
- **验证**：改代码后 `pnpm lint`；改 TS 后 `pnpm type-check`；Figma 还原另须 `pnpm dev` 无 error
- **TDD**：Superpowers 推荐先写测试；若无测试基建，以 lint/type-check/dev 为 DoD

## 更新 upstream

见 [UPSTREAM-SYNC.md](./UPSTREAM-SYNC.md)。

## 命令（合并进目标项目 package.json 后）

```bash
pnpm agent:install          # install.mjs --with-agent-toolkit
pnpm agent:gstack:gen       # 仅重新生成 gstack Cursor skills
pnpm openspec:init          # 重新初始化 OpenSpec（慎用）
```
