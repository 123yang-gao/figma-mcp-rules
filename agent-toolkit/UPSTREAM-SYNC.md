# agent-toolkit — Upstream 同步

## Superpowers

```bash
cd vendor/superpowers
git pull --ff-only origin main
cd ../..
pnpm agent:install --skip-openspec
```

Marketplace 方式（用户级）：Cursor Agent 输入 `/add-plugin superpowers`。项目级以 `vendor/superpowers` + `install.mjs` 为准，便于团队版本一致。

## gstack

```bash
cd vendor/gstack
git pull --ff-only origin main
cd ../..
pnpm agent:gstack:gen
pnpm agent:install --skip-openspec
```

gstack 的 `./setup --host cursor` 在部分版本尚未写入 setup 脚本；本项目用 `bun run gen:skill-docs --host cursor` 生成 `.cursor/skills/gstack-*` 后由 install 链接。

## OpenSpec

```bash
pnpm openspec:init
# 或
npx @fission-ai/openspec update
```

变更规格目录：`openspec/changes/`（init 后按需创建）。
