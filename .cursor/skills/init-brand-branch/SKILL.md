---
name: init-brand-branch
description: Initialize brand settings when creating a new branch. Replaces MERCHANT in shell scripts and app names in ecosystem.config.cjs with the user-provided brand code. Use when the user says they created a new branch and need to set up a new brand, or when they provide a new brand code to initialize.
---

# Initialize Brand for New Branch

When the user provides a **brand code** (e.g. `xxx`) for a new branch, perform these steps in order. Do **not** assume the current values are any specific brand — replace whatever is there now so the skill works after switching branches.

## Step 1: Update shell scripts

In the **shell** folder, set `MERCHANT` to the provided brand code (lowercase).

**Files to edit:**

- `shell/startup.sh` — replace the **existing** `MERCHANT="..."` line (whatever the current value is) with `MERCHANT="<brand>"`.
- `shell/reload.sh` — same: replace the existing `MERCHANT="..."` line with `MERCHANT="<brand>"`.

Use a pattern that matches any current value (e.g. the full line containing `MERCHANT=`), not a fixed string like `spinscus1`.

## Step 2: Update ecosystem.config.cjs

In the project root file `ecosystem.config.cjs`, set the PM2 app `name` fields to the provided brand:

- **First** app in the `apps` array: set `name: "<brand>-preview"`.
- **Second** app: set `name: "<brand>-production"`.

Replace the **current** `name` value of each app (whatever it is on this branch), not a specific previous brand. Only the suffixes `-preview` and `-production` are fixed.

## Summary

| Location | Change |
|----------|--------|
| `shell/startup.sh` | Replace existing `MERCHANT="..."` → `MERCHANT="<brand>"` |
| `shell/reload.sh` | Replace existing `MERCHANT="..."` → `MERCHANT="<brand>"` |
| `ecosystem.config.cjs` | First app `name` → `"<brand>-preview"`, second app `name` → `"<brand>-production"` |

Use the exact brand string the user provides; normalize to lowercase unless they specify otherwise. The skill must work regardless of the current branch's existing brand value.
