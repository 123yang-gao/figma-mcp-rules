#!/usr/bin/env node
/**
 * Link or copy figma-mcp-rules into a target Nuxt/Vue project.
 *
 * Usage:
 *   node install.mjs [--target=/path/to/project] [--copy] [--merge-package] [--merge-mcp]
 *                    [--with-agent-toolkit] [--skip-agent-toolkit]
 *
 * Recommended:
 *   git submodule add https://github.com/123yang-gao/figma-mcp-rules.git vendor/figma-mcp-rules
 *   node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FIGMA_SCRIPT_FILES = [
  'download-figma-assets.mjs',
  'trim-svg-icons.mjs',
  'verify-svg-icons.mjs',
  'verify-raster-assets.mjs',
  'download-sidebar-fishing.mjs',
  'figma-screenshot-exports.json',
]

const FIGMA_LIB_FILES = ['trim-svg-icon.mjs', 'compose-figma-flat-icon.mjs']

function parseArgs(argv) {
  const opts = {
    target: process.cwd(),
    copy: false,
    mergePackage: true,
    mergeMcp: true,
    withAgentToolkit: false,
    skipAgentToolkit: false,
  }
  for (const arg of argv) {
    if (arg === '--copy') {
      opts.copy = true
    } else if (arg === '--no-merge-package') {
      opts.mergePackage = false
    } else if (arg === '--no-merge-mcp') {
      opts.mergeMcp = false
    } else if (arg === '--with-agent-toolkit') {
      opts.withAgentToolkit = true
    } else if (arg === '--skip-agent-toolkit') {
      opts.skipAgentToolkit = true
    } else if (arg.startsWith('--target=')) {
      opts.target = path.resolve(arg.slice('--target='.length))
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node install.mjs [options]

Options:
  --target=<dir>          Target project root (default: cwd)
  --copy                  Copy files instead of symlinks
  --no-merge-package      Skip merging package.json scripts
  --no-merge-mcp          Skip merging .cursor/mcp.json
  --with-agent-toolkit    Also run agent-toolkit/install.mjs (Superpowers/gstack)
  --skip-agent-toolkit    Skip agent-toolkit even if bundled
  -h, --help              Show this help
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
  if (fs.existsSync(p)) {
    const stat = fs.lstatSync(p)
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      fs.rmSync(p, { recursive: true, force: true })
    } else {
      fs.unlinkSync(p)
    }
  }
}

function linkOrCopy(source, dest, copy) {
  ensureDir(path.dirname(dest))
  removeIfExists(dest)
  const isDir = fs.statSync(source).isDirectory()
  if (copy) {
    if (isDir) {
      fs.cpSync(source, dest, { recursive: true })
    } else {
      fs.copyFileSync(source, dest)
    }
    return 'copy'
  }
  try {
    if (isDir) {
      fs.symlinkSync(source, dest, process.platform === 'win32' ? 'junction' : 'dir')
    } else {
      fs.symlinkSync(source, dest, process.platform === 'win32' ? 'file' : undefined)
    }
    return 'link'
  } catch {
    if (isDir) {
      fs.cpSync(source, dest, { recursive: true })
    } else {
      fs.copyFileSync(source, dest)
    }
    return 'copy (symlink failed)'
  }
}

function linkOrCopyDirEntries(sourceDir, destDir, copy) {
  ensureDir(destDir)
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    const src = path.join(sourceDir, entry.name)
    const dst = path.join(destDir, entry.name)
    const mode = linkOrCopy(src, dst, copy)
    results.push({ file: entry.name, mode })
  }
  return results
}

function linkOrCopySkillDir(sourceDir, destDir, copy) {
  ensureDir(destDir)
  const results = []
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const src = path.join(sourceDir, entry.name)
    const dst = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      const mode = linkOrCopy(src, dst, copy)
      results.push({ file: entry.name, mode, kind: 'dir' })
    } else if (entry.isFile()) {
      const mode = linkOrCopy(src, dst, copy)
      results.push({ file: entry.name, mode, kind: 'file' })
    }
  }
  return results
}

function mergePackageScripts(targetRoot, sourceRoot) {
  const pkgPath = path.join(targetRoot, 'package.json')
  const scriptsPatchPath = path.join(sourceRoot, 'templates', 'package.scripts.json')
  if (!fs.existsSync(pkgPath)) {
    console.warn('  skip package.json: not found in target')
    return
  }
  const patch = JSON.parse(fs.readFileSync(scriptsPatchPath, 'utf8'))
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.scripts = pkg.scripts ?? {}
  let added = 0
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in pkg.scripts)) {
      pkg.scripts[key] = value
      added += 1
    }
  }
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  console.log(`  package.json: merged ${added} script(s)`)
}

function mergeMcpConfig(targetRoot, sourceRoot) {
  const targetMcp = path.join(targetRoot, '.cursor', 'mcp.json')
  const sourceMcp = path.join(sourceRoot, '.cursor', 'mcp.json')
  if (!fs.existsSync(sourceMcp)) {
    return
  }
  const figmaPatch = JSON.parse(fs.readFileSync(sourceMcp, 'utf8'))
  let base = { mcpServers: {} }
  if (fs.existsSync(targetMcp)) {
    base = JSON.parse(fs.readFileSync(targetMcp, 'utf8'))
  }
  base.mcpServers = base.mcpServers ?? {}
  if (!base.mcpServers.figma) {
    base.mcpServers.figma = figmaPatch.mcpServers.figma
  }
  ensureDir(path.dirname(targetMcp))
  fs.writeFileSync(targetMcp, `${JSON.stringify(base, null, 2)}\n`, 'utf8')
  console.log('  .cursor/mcp.json: ensured figma server')
}

function installScripts(sourceRoot, targetRoot, copy) {
  const scriptDest = path.join(targetRoot, 'scripts')
  const libDest = path.join(scriptDest, 'lib')
  ensureDir(libDest)

  for (const file of FIGMA_SCRIPT_FILES) {
    const src = path.join(sourceRoot, 'scripts', file)
    const dst = path.join(scriptDest, file)
    if (!fs.existsSync(src)) {
      console.warn(`  skip missing script: ${file}`)
      continue
    }
    if (fs.existsSync(dst)) {
      console.log(`  scripts/${file}: kept existing (not overwritten)`)
      continue
    }
    const mode = linkOrCopy(src, dst, copy)
    console.log(`  scripts/${file}: ${mode}`)
  }

  for (const file of FIGMA_LIB_FILES) {
    const src = path.join(sourceRoot, 'scripts', 'lib', file)
    const dst = path.join(libDest, file)
    if (!fs.existsSync(src)) {
      continue
    }
    if (fs.existsSync(dst)) {
      console.log(`  scripts/lib/${file}: kept existing (not overwritten)`)
      continue
    }
    const mode = linkOrCopy(src, dst, copy)
    console.log(`  scripts/lib/${file}: ${mode}`)
  }
}

function installCommands(sourceRoot, targetRoot, copy) {
  const commandsSrc = path.join(sourceRoot, '.cursor', 'commands')
  if (!fs.existsSync(commandsSrc)) {
    return []
  }
  const commandsDest = path.join(targetRoot, '.cursor', 'commands')
  ensureDir(commandsDest)
  const results = []
  for (const entry of fs.readdirSync(commandsSrc, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const src = path.join(commandsSrc, entry.name)
    const dst = path.join(commandsDest, entry.name)
    const mode = linkOrCopy(src, dst, copy)
    results.push({ file: entry.name, mode })
  }
  return results
}

function installOpenspecConfig(sourceRoot, targetRoot, copy) {
  const template = path.join(sourceRoot, 'openspec', 'templates', 'config.yaml')
  const destDir = path.join(targetRoot, 'openspec')
  const dest = path.join(destDir, 'config.yaml')
  if (!fs.existsSync(template)) {
    return null
  }
  if (fs.existsSync(dest)) {
    console.log('  openspec/config.yaml: kept existing (not overwritten)')
    return 'skipped'
  }
  ensureDir(destDir)
  const mode = linkOrCopy(template, dest, copy)
  return mode
}

function runAgentToolkit(sourceRoot, targetRoot, copy) {
  const toolkitInstall = path.join(sourceRoot, 'agent-toolkit', 'install.mjs')
  if (!fs.existsSync(toolkitInstall)) {
    console.warn('  agent-toolkit: install.mjs not found')
    return
  }
  console.log('')
  console.log('Agent toolkit:')
  const args = [toolkitInstall, `--target=${targetRoot}`, '--skip-openspec']
  if (copy) args.push('--copy')
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    console.warn('  agent-toolkit install exited with non-zero status')
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const sourceRoot = __dirname
  const targetRoot = path.resolve(opts.target)

  console.log(`figma-mcp-rules install`)
  console.log(`  source: ${sourceRoot}`)
  console.log(`  target: ${targetRoot}`)
  console.log(`  mode:   ${opts.copy ? 'copy' : 'symlink (copy fallback)'}`)
  console.log('')

  ensureDir(path.join(targetRoot, '.cursor', 'rules'))
  ensureDir(path.join(targetRoot, '.cursor', 'skills'))

  const rules = linkOrCopyDirEntries(
    path.join(sourceRoot, '.cursor', 'rules'),
    path.join(targetRoot, '.cursor', 'rules'),
    opts.copy,
  )
  console.log(`Rules (${rules.length}):`)
  for (const r of rules) {
    console.log(`  .cursor/rules/${r.file}: ${r.mode}`)
  }

  const skillDirs = fs
    .readdirSync(path.join(sourceRoot, '.cursor', 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())

  console.log(`Skills (${skillDirs.length}):`)
  for (const dir of skillDirs) {
    const srcSkillDir = path.join(sourceRoot, '.cursor', 'skills', dir.name)
    const dstSkillDir = path.join(targetRoot, '.cursor', 'skills', dir.name)
    const skillFiles = linkOrCopySkillDir(srcSkillDir, dstSkillDir, opts.copy)
    for (const r of skillFiles) {
      console.log(`  .cursor/skills/${dir.name}/${r.file}: ${r.mode}`)
    }
  }

  const commands = installCommands(sourceRoot, targetRoot, opts.copy)
  if (commands.length > 0) {
    console.log(`Commands (${commands.length}):`)
    for (const r of commands) {
      console.log(`  .cursor/commands/${r.file}: ${r.mode}`)
    }
  }

  const openspecMode = installOpenspecConfig(sourceRoot, targetRoot, opts.copy)
  if (openspecMode) {
    console.log(`  openspec/config.yaml: ${openspecMode}`)
  }

  console.log('Scripts:')
  installScripts(sourceRoot, targetRoot, opts.copy)

  const docsToInstall = [
    'figma-cursor-setup.md',
    'figma-naming-guide.md',
    'project-features.md',
    'agent-skills-setup.md',
  ]
  for (const docFile of docsToInstall) {
    const docsSrc = path.join(sourceRoot, 'docs', docFile)
    const docsDst = path.join(targetRoot, 'docs', docFile)
    if (fs.existsSync(docsSrc) && !fs.existsSync(docsDst)) {
      ensureDir(path.dirname(docsDst))
      const mode = linkOrCopy(docsSrc, docsDst, opts.copy)
      console.log(`  docs/${docFile}: ${mode}`)
    }
  }

  if (opts.mergeMcp) {
    mergeMcpConfig(targetRoot, sourceRoot)
  }
  if (opts.mergePackage) {
    mergePackageScripts(targetRoot, sourceRoot)
  }

  if (opts.withAgentToolkit && !opts.skipAgentToolkit) {
    runAgentToolkit(sourceRoot, targetRoot, opts.copy)
  }

  console.log('')
  console.log('Done. Reload Cursor window so rules/skills take effect.')
  console.log('Optional: append templates/CLAUDE.md.snippet to your CLAUDE.md')
  if (!opts.withAgentToolkit) {
    console.log('Optional: node vendor/figma-mcp-rules/install.mjs --with-agent-toolkit')
  }
}

main()
