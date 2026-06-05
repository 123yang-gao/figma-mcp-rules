/**
 * 校验 app/assets/imgs 位图体积，识别 MCP 空白占位图。
 * screenshotExports 的 key 为 imgs 下相对路径，如 invite/ann-share-icon.png
 * Run: pnpm assets:verify:raster
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = path.join(root, 'app/assets/imgs')
const configPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'figma-screenshot-exports.json',
)

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const { minBytes, screenshotExports } = config
const exportScale = config.exportScale ?? 2

let failed = false

function fail(message) {
  console.error(`FAIL ${message}`)
  failed = true
}

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
    return null
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function checkFile(relativeName, min) {
  if (relativeName.includes('..')) {
    fail(`${relativeName}: 非法路径`)
    return
  }
  if (!relativeName.includes('/')) {
    fail(
      `${relativeName}: 位图必须位于 imgs 子目录下（如 invite/foo.png），禁止 imgs 根目录`,
    )
    return
  }
  const filePath = path.join(imagesDir, relativeName)
  if (!fs.existsSync(filePath)) {
    fail(`${relativeName}: 文件不存在（期望 app/assets/imgs/${relativeName}）`)
    return
  }
  const size = fs.statSync(filePath).size
  if (size < min) {
    const hint = screenshotExports[relativeName]
    const nodeHint = hint
      ? ` → 用 get_screenshot 节点 ${hint.nodeId}（${hint.width}×${hint.height} @ ${exportScale}×）覆盖`
      : ' → 见 scripts/figma-screenshot-exports.json'
    fail(
      `${relativeName}: ${size} bytes < ${min}${nodeHint}`,
    )
  }
}

function checkPngExportScale(relativeName, meta) {
  const filePath = path.join(imagesDir, relativeName)
  if (!fs.existsSync(filePath) || !meta.width || !meta.height) {
    return
  }
  const dims = readPngSize(filePath)
  if (!dims) {
    return
  }
  const expectedW = meta.width * exportScale
  const expectedH = meta.height * exportScale
  const minW = Math.round(expectedW * 0.9)
  const minH = Math.round(expectedH * 0.9)
  const maxW = Math.round(expectedW * 2.5)
  const maxH = Math.round(expectedH * 2.5)

  if (dims.width < minW || dims.height < minH) {
    fail(
      `${relativeName}: ${dims.width}×${dims.height} 小于 ${exportScale}× 目标约 ${expectedW}×${expectedH}（疑似 1× 导出）→ get_screenshot 节点 ${meta.nodeId}，maxDimension ≥ ${Math.max(expectedW, expectedH)}`,
    )
  }
  if (dims.width > maxW || dims.height > maxH) {
    fail(
      `${relativeName}: ${dims.width}×${dims.height} 远大于 ${exportScale}× 设计 ${meta.width}×${meta.height}（疑似错节点/全画布）→ get_screenshot 节点 ${meta.nodeId}`,
    )
  }
}

for (const [relativeName, meta] of Object.entries(screenshotExports)) {
  const min = meta.minBytes ?? minBytes.default
  checkFile(relativeName, min)
  if (relativeName.endsWith('.png') && meta.width && meta.height) {
    checkPngExportScale(relativeName, meta)
  }
}

if (failed) {
  console.error(
    `\n修复：对 figma-screenshot-exports.json 中节点调用 get_screenshot(contentsOnly: true)，导出 ${exportScale}× 像素，覆盖 app/assets/imgs/<子目录>/<文件> 后重跑。`,
  )
  process.exit(1)
}

if (Object.keys(screenshotExports).length === 0) {
  console.log('OK raster verify skipped (screenshotExports 为空，登记路径后生效).')
} else {
  console.log('OK raster assets passed verify.')
}
