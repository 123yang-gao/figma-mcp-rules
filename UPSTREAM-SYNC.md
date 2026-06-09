# figma-mcp-rules — Upstream 同步

## 本仓库（figma-mcp-rules）

从 sweepstakes-shell 或各消费项目回传变更后，在此仓库 commit / push。

## Agent toolkit（Superpowers / gstack / OpenSpec）

OpenSpec skills/commands 已**内置**于本仓库，随 `install.mjs` 安装。

Superpowers / gstack 仍从各自 upstream clone：

```bash
cd vendor/superpowers && git pull --ff-only origin main
cd ../gstack && git pull --ff-only origin main
cd ../..
pnpm agent:gstack:gen
pnpm agent:install
```

详见 [agent-toolkit/UPSTREAM-SYNC.md](../agent-toolkit/UPSTREAM-SYNC.md)。

## 消费项目更新 submodule

```bash
git submodule update --remote vendor/figma-mcp-rules
node vendor/figma-mcp-rules/install.mjs --copy --with-agent-toolkit
```
