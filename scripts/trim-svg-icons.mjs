/**
 * 收紧 app/assets/icons 下 SVG 的 viewBox（去掉 Figma 留白）。
 *
 * Run:
 *   node scripts/trim-svg-icons.mjs --manifest   # 仅 trim 本次 assets:download 写入的 SVG（推荐 / Figma 任务默认）
 *   node scripts/trim-svg-icons.mjs foo.svg      # 仅 trim 指定文件
 *   node scripts/trim-svg-icons.mjs              # 全库 trim（仅存量维护；Figma 单屏任务禁止）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { trimSvgIcon } from './lib/trim-svg-icon.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(scriptDir, '..', 'app/assets/icons')
const manifestPath = path.join(scriptDir, '.download-manifest.json')

const args = process.argv.slice(2)

function resolveTargetFiles() {
  if (args.includes('--manifest')) {
    if (!fs.existsSync(manifestPath)) {
      console.log('No scripts/.download-manifest.json — skip trim.')
      return []
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const names = manifest
      .filter((item) => item.ext === '.svg' && item.fileName)
      .map((item) => item.fileName)
    return [...new Set(names)]
  }

  const explicit = args.filter((arg) => !arg.startsWith('-'))
  if (explicit.length > 0) {
    return explicit.map((name) => (name.endsWith('.svg') ? name : `${name}.svg`))
  }

  console.warn(
    'WARN: trimming ALL icons in app/assets/icons/. Figma 单屏/单组件任务请改用 --manifest 或指定文件名。',
  )
  return fs.readdirSync(iconsDir).filter((name) => name.endsWith('.svg'))
}

const files = resolveTargetFiles()

if (files.length === 0) {
  process.exit(0)
}

for (const name of files) {
  const filePath = path.join(iconsDir, name)
  if (!fs.existsSync(filePath)) {
    console.warn(`WARN skip ${name}: file not found`)
    continue
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  const trimmed = trimSvgIcon(raw)
  fs.writeFileSync(filePath, trimmed)
  console.log(`trim ${name}`)
}

console.log(`\nTrimmed ${files.length} icon(s).`)
