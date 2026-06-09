# Agent 技能包 — Superpowers / gstack / OpenSpec

完整说明见 **[agent-toolkit/README.md](../agent-toolkit/README.md)**。

## 一键安装

```bash
node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit
# 或
pnpm agent:install
```

## 常用 slash 命令

| 命令 | 来源 | 说明 |
|------|------|------|
| `/opsx:propose` | OpenSpec | 提出变更并生成 proposal/design/tasks |
| `/opsx:apply` | OpenSpec | 按 OpenSpec 任务实施 |
| `/opsx:explore` | OpenSpec | 探索性讨论，不写代码 |
| gstack skills | gstack | 对话中引用，如「用 gstack review 审查当前分支」 |

Superpowers skills 会在 Agent 任务中**自动触发**。

## 规范冲突

须同时遵守 **Figma 规则**（`figma-*`）与 **agent-toolkit** 工作流；i18n、lint、icon 导出以 `project-conventions.mdc` 为准。
