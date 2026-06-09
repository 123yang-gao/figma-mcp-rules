#!/usr/bin/env node
/**
 * Link Superpowers, gstack, and OpenSpec artifacts into a target project.
 *
 * Usage:
 *   node vendor/figma-mcp-rules/agent-toolkit/install.mjs [--target=.] [--copy] [--fetch] [--skip-gstack-gen] [--skip-openspec]
 *
 * Prerequisites:
 *   vendor/superpowers  — git clone https://github.com/obra/superpowers.git
 *   vendor/gstack       — git clone https://github.com/garrytan/gstack.git
 *   bun                 — required to generate gstack Cursor skills (npm i -g bun)
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VENDORS = {
  superpowers: {
    url: 'https://github.com/obra/superpowers.git',
    dir: 'vendor/superpowers',
    skillsSubdir: 'skills',
  },
  gstack: {
    url: 'https://github.com/garrytan/gstack.git',
    dir: 'vendor/gstack',
    skillsSubdir: path.join('.cursor', 'skills'),
  },
}

/** Project skills that must never be overwritten by this installer. */
const PROTECTED_SKILL_DIRS = new Set([
  'figma-implement-design',
  'figma-create-design-system-rules',
  'ui-refactor',
  'init-brand-branch',
  'openspec-propose',
  'openspec-archive-change',
  'openspec-sync-specs',
  'openspec-explore',
  'openspec-apply-change',
])

function parseArgs(argv) {
  const opts = {
    target: process.cwd(),
    copy: false,
    fetch: false,
    skipGstackGen: false,
    skipOpenspec: false,
  }
  for (const arg of argv) {
    if (arg === '--copy') opts.copy = true
    else if (arg === '--fetch') opts.fetch = true
    else if (arg === '--skip-gstack-gen') opts.skipGstackGen = true
    else if (arg === '--skip-openspec') opts.skipOpenspec = true
    else if (arg.startsWith('--target=')) opts.target = path.resolve(arg.slice('--target='.length))
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node install.mjs [options]

Options:
  --target=<dir>     Target project root (default: cwd)
  --copy             Copy files instead of symlinks
  --fetch            Shallow-clone missing vendor/* repos
  --skip-gstack-gen  Skip bun gen:skill-docs for gstack
  --skip-openspec    Skip openspec init
  -h, --help         Show this help
`)
      process.exit(0)
    }
  }
  return opts
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function removeIfExists(p) {
  if (!fs.existsSync(p)) return
  const stat = fs.lstatSync(p)
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.rmSync(p, { recursive: true, force: true })
  } else {
    fs.unlinkSync(p)
  }
}

function linkOrCopy(source, dest, copy) {
  ensureDir(path.dirname(dest))
  removeIfExists(dest)
  if (copy) {
    if (fs.statSync(source).isDirectory()) {
      fs.cpSync(source, dest, { recursive: true })
    } else {
      fs.copyFileSync(source, dest)
    }
    return 'copy'
  }
  try {
    const linkType = process.platform === 'win32' ? 'junction' : 'dir'
    if (fs.statSync(source).isDirectory()) {
      fs.symlinkSync(source, dest, linkType)
    } else {
      fs.symlinkSync(source, dest, process.platform === 'win32' ? 'file' : undefined)
    }
    return 'link'
  } catch {
    if (fs.statSync(source).isDirectory()) {
      fs.cpSync(source, dest, { recursive: true })
    } else {
      fs.copyFileSync(source, dest)
    }
    return 'copy (symlink failed)'
  }
}

function linkSkillDir(sourceDir, destDir, copy) {
  ensureDir(destDir)
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    const src = path.join(sourceDir, entry.name)
    const dst = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      const mode = linkOrCopy(src, dst, copy)
      results.push({ name: entry.name, mode, kind: 'dir' })
    } else if (entry.isFile()) {
      const mode = linkOrCopy(src, dst, copy)
      results.push({ name: entry.name, mode, kind: 'file' })
    }
  }
  return results
}

function shallowClone(url, dest) {
  ensureDir(path.dirname(dest))
  console.log(`  cloning ${url} → ${dest}`)
  const result = spawnSync(
    'git',
    ['clone', '--single-branch', '--depth', '1', url, dest],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  )
  if (result.status !== 0) {
    throw new Error(`git clone failed for ${url}`)
  }
}

function ensureVendor(vendorKey, projectRoot, fetch) {
  const spec = VENDORS[vendorKey]
  const vendorPath = path.join(projectRoot, spec.dir)
  if (fs.existsSync(vendorPath)) {
    return vendorPath
  }
  if (!fetch) {
    console.warn(`  skip ${vendorKey}: missing ${spec.dir} (run with --fetch or clone manually)`)
    return null
  }
  shallowClone(spec.url, vendorPath)
  return vendorPath
}

function installSuperpowersSkills(projectRoot, copy, fetch) {
  const vendorPath = ensureVendor('superpowers', projectRoot, fetch)
  if (!vendorPath) return []

  const skillsSrc = path.join(vendorPath, VENDORS.superpowers.skillsSubdir)
  if (!fs.existsSync(skillsSrc)) {
    console.warn('  superpowers: skills/ not found')
    return []
  }

  const skillsDest = path.join(projectRoot, '.cursor', 'skills')
  ensureDir(skillsDest)

  const results = []
  for (const name of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
    if (!name.isDirectory()) continue
    if (PROTECTED_SKILL_DIRS.has(name.name)) continue
    const src = path.join(skillsSrc, name.name)
    const dst = path.join(skillsDest, name.name)
    const mode = linkOrCopy(src, dst, copy)
    results.push({ skill: name.name, mode })
  }

  installSuperpowersHooks(projectRoot, copy)
  return results
}

function installSuperpowersHooks(projectRoot, copy) {
  const bundledHooks = path.join(__dirname, 'hooks', 'superpowers')
  const hooksSrc = fs.existsSync(bundledHooks)
    ? bundledHooks
    : path.join(projectRoot, 'vendor', 'superpowers', 'hooks')
  const hooksDest = path.join(projectRoot, '.cursor', 'hooks')
  if (!fs.existsSync(hooksSrc)) return

  linkSkillDir(hooksSrc, hooksDest, copy)

  const hooksJsonSrc = path.join(hooksSrc, 'hooks-cursor.json')
  const hooksJsonDest = path.join(projectRoot, '.cursor', 'hooks.json')
  if (!fs.existsSync(hooksJsonSrc)) return

  const template = JSON.parse(fs.readFileSync(hooksJsonSrc, 'utf8'))
  const command = './.cursor/hooks/run-hook.cmd session-start'
  template.hooks.sessionStart = [{ command }]

  if (fs.existsSync(hooksJsonDest)) {
    console.log('  .cursor/hooks.json: kept existing (not overwritten)')
    return
  }

  fs.writeFileSync(hooksJsonDest, `${JSON.stringify(template, null, 2)}\n`, 'utf8')
  console.log('  .cursor/hooks.json: created from superpowers hooks-cursor.json')
}

function generateGstackCursorSkills(gstackRoot) {
  const bun = spawnSync(process.platform === 'win32' ? 'bun.cmd' : 'bun', ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (bun.status !== 0) {
    console.warn('  gstack: bun not found — install with `npm i -g bun`, then re-run install')
    return false
  }

  console.log(`  gstack: generating Cursor skills (bun ${bun.stdout.trim()})...`)
  const gen = spawnSync(
    process.platform === 'win32' ? 'bun.cmd' : 'bun',
    ['run', 'gen:skill-docs', '--host', 'cursor'],
    { cwd: gstackRoot, stdio: 'inherit', shell: process.platform === 'win32' },
  )
  return gen.status === 0
}

function installGstackSkills(projectRoot, copy, fetch, skipGen) {
  const vendorPath = ensureVendor('gstack', projectRoot, fetch)
  if (!vendorPath) return []

  const skillsSrc = path.join(vendorPath, ...VENDORS.gstack.skillsSubdir.split('/'))
  if (!skipGen && !fs.existsSync(skillsSrc)) {
    generateGstackCursorSkills(vendorPath)
  } else if (!skipGen) {
    generateGstackCursorSkills(vendorPath)
  }

  if (!fs.existsSync(skillsSrc)) {
    console.warn('  gstack: .cursor/skills not found — run `cd vendor/gstack && bun run gen:skill-docs --host cursor`')
    return []
  }

  const skillsDest = path.join(projectRoot, '.cursor', 'skills')
  ensureDir(skillsDest)

  const results = []
  for (const name of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
    if (!name.isDirectory()) continue
    if (PROTECTED_SKILL_DIRS.has(name.name)) continue
    const src = path.join(skillsSrc, name.name)
    const dst = path.join(skillsDest, name.name)
    const mode = linkOrCopy(src, dst, copy)
    results.push({ skill: name.name, mode })
  }
  return results
}

function initOpenSpec(projectRoot) {
  const openspecDir = path.join(projectRoot, 'openspec')
  if (fs.existsSync(openspecDir)) {
    console.log('  openspec/: already present')
    return
  }

  console.log('  openspec: running init --tools cursor --profile core --force')
  const result = spawnSync(
    'npx',
    ['--yes', '@fission-ai/openspec@latest', 'init', '--tools', 'cursor', '--profile', 'core', '--force'],
    { cwd: projectRoot, stdio: 'inherit', shell: true },
  )
  if (result.status !== 0) {
    console.warn('  openspec init failed — run manually: npx @fission-ai/openspec init --tools cursor')
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const targetRoot = path.resolve(opts.target)

  console.log('agent-toolkit install')
  console.log(`  target: ${targetRoot}`)
  console.log(`  mode:   ${opts.copy ? 'copy' : 'symlink (copy fallback)'}`)
  console.log('')

  ensureDir(path.join(targetRoot, '.cursor', 'skills'))

  console.log('Superpowers:')
  const superpowers = installSuperpowersSkills(targetRoot, opts.copy, opts.fetch)
  for (const r of superpowers) {
    console.log(`  .cursor/skills/${r.skill}: ${r.mode}`)
  }
  if (superpowers.length === 0) console.log('  (none linked)')

  console.log('')
  console.log('gstack:')
  const gstack = installGstackSkills(targetRoot, opts.copy, opts.fetch, opts.skipGstackGen)
  for (const r of gstack) {
    console.log(`  .cursor/skills/${r.skill}: ${r.mode}`)
  }
  if (gstack.length === 0) console.log('  (none linked)')

  console.log('')
  console.log('OpenSpec:')
  if (!opts.skipOpenspec) {
    initOpenSpec(targetRoot)
  } else {
    console.log('  skipped (--skip-openspec)')
  }

  console.log('')
  console.log('Done. Reload Cursor window so rules/skills/commands take effect.')
  console.log('Docs: docs/agent-skills-setup.md')
}

main()
