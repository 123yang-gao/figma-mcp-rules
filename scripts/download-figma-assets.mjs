/**
 * Downloads Figma MCP assets:
 *   - SVG  → app/assets/icons/（扁平，全部图标）
 *   - 位图 → app/assets/imgs/<组名>/（组名 = 既有 imgs 子目录）
 *
 * Run: node scripts/download-figma-assets.mjs
 *
 * assets 示例：
 *   icons: { sideDownload: 'https://...' }           → icons/side_download.svg
 *   invite: { annShareIcon: 'https://...' }          → imgs/invite/ann_share_icon.png
 *   games/PrizeWheel: { wheel: 'https://...' }       → imgs/games/PrizeWheel/wheel.png
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { trimSvgIcon } from './lib/trim-svg-icon.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = path.join(root, 'app/assets/icons')
const imgsRoot = path.join(root, 'app/assets/imgs')
const screenshotConfigPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'figma-screenshot-exports.json',
)
const screenshotConfig = JSON.parse(
  fs.readFileSync(screenshotConfigPath, 'utf8'),
)
const RASTER_EXPORT_SCALE = screenshotConfig.exportScale ?? 2

const rasterMinBytesByKey = {
  headerBg: screenshotConfig.minBytes.headerBg,
  pageBg: screenshotConfig.minBytes.pageBg,
  banner: screenshotConfig.minBytes.banner,
}

function isNavButtonBgKey(key) {
  return /^nav\w+Bg$/.test(key) || key === 'helpBg'
}

function minBytesForRasterKey(key) {
  if (isNavButtonBgKey(key)) {
    return screenshotConfig.minBytes.navButtonBg
  }
  if (key in rasterMinBytesByKey) {
    return rasterMinBytesByKey[key]
  }
  return screenshotConfig.minBytes.default ?? null
}

function screenshotHintForKey(key) {
  const entry = Object.entries(screenshotConfig.screenshotExports).find(
    ([, meta]) => meta.assetKey === key,
  )
  if (!entry) {
    return '见 scripts/figma-screenshot-exports.json（key 为 imgs 相对路径）'
  }
  const [, meta] = entry
  const px = Math.max(meta.width, meta.height) * RASTER_EXPORT_SCALE
  return `get_screenshot 节点 ${meta.nodeId}（${meta.width}×${meta.height} @ ${RASTER_EXPORT_SCALE}×，maxDimension≥${px}）→ ${entry[0]}`
}

/**
 * icons — 全部 SVG → app/assets/icons/
 * 其他组名 — 位图 → app/assets/imgs/<组名>/（须为既有子目录，如 invite、signIn、games/PrizeWheel）
 */
/**
 * 仅登记**当前 Figma 任务**设计清单内的 MCP URL；任务完成后清空，禁止长期保留无关屏资源。
 * 见 `.cursor/rules/figma-svg-icons.mdc` §任务范围限制。
 */
const assets = {
  // icons: {
  //   modalTitleClose: 'https://www.figma.com/api/mcp/asset/...',
  // },
  // home: {
  //   promoCard1: 'https://www.figma.com/api/mcp/asset/...',
  // },
}

const ICONS_GROUP = 'icons'

function toSnakeCase(key) {
  return key
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
}

function extFromContentType(contentType) {
  if (contentType.includes('svg')) return '.svg'
  if (contentType.includes('png')) return '.png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg'
  if (contentType.includes('webp')) return '.webp'
  return '.bin'
}

function resolveOutputPath(group, key, ext) {
  const baseName = `${toSnakeCase(key)}${ext}`

  if (group === ICONS_GROUP) {
    if (ext !== '.svg') {
      console.warn(
        `WARN ${group}/${key}: icons 组仅接受 SVG，收到 ${ext}；仍写入 icons/`,
      )
    }
    return {
      dir: iconsDir,
      relative: baseName,
      kind: 'icons',
    }
  }

  const subDir = path.join(imgsRoot, group)
  return {
    dir: subDir,
    relative: path.join(group, baseName).replace(/\\/g, '/'),
    kind: 'imgs',
  }
}

async function downloadOne(group, key, url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${group}/${key}: HTTP ${res.status}`)
  }
  const contentType = res.headers.get('content-type') ?? ''
  let ext = extFromContentType(contentType)

  if (group !== ICONS_GROUP && ext === '.svg') {
    console.warn(
      `WARN ${group}/${key}: 位图组收到 SVG，改存 app/assets/icons/（应用 icons 组登记）`,
    )
    ext = '.svg'
    const iconPath = path.join(iconsDir, `${toSnakeCase(key)}.svg`)
    fs.mkdirSync(iconsDir, { recursive: true })
    let buf = Buffer.from(await res.arrayBuffer())
    buf = Buffer.from(trimSvgIcon(buf.toString('utf8')), 'utf8')
    fs.writeFileSync(iconPath, buf)
    return {
      group,
      key,
      fileName: path.basename(iconPath),
      dir: 'icons',
      ext: '.svg',
      bytes: buf.length,
      relative: path.basename(iconPath),
    }
  }

  const { dir, relative, kind } = resolveOutputPath(group, key, ext)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, path.basename(relative))

  let buf = Buffer.from(await res.arrayBuffer())
  if (kind === 'icons' && ext === '.svg') {
    buf = Buffer.from(trimSvgIcon(buf.toString('utf8')), 'utf8')
  }
  fs.writeFileSync(filePath, buf)

  if (kind === 'imgs' && /\.(png|jpe?g|webp)$/i.test(filePath)) {
    console.log(
      `     ↳ 位图须 ${RASTER_EXPORT_SCALE}× 像素；CSS 仍用 Figma 1×（见 figma-raster-assets.mdc）`,
    )
  }

  const minBytes = minBytesForRasterKey(key)
  if (kind === 'imgs' && minBytes !== null && buf.length < minBytes) {
    console.warn(
      `WARN ${group}/${key}: ${buf.length} bytes < ${minBytes}（可能为 MCP 空白占位图）。` +
        `请用 ${screenshotHintForKey(key)}`,
    )
  }

  return {
    group,
    key,
    fileName: path.basename(filePath),
    dir: kind,
    ext,
    bytes: buf.length,
    relative,
  }
}

fs.mkdirSync(iconsDir, { recursive: true })
fs.mkdirSync(imgsRoot, { recursive: true })

const assetGroups = Object.entries(assets).flatMap(([group, map]) =>
  Object.entries(map).map(([key, url]) => ({ group, key, url })),
)

if (assetGroups.length === 0) {
  fs.writeFileSync(
    path.join(root, 'scripts/.download-manifest.json'),
    '[]',
  )
  console.log(
    'No assets registered in scripts/download-figma-assets.mjs — add URLs for this task only, then re-run.',
  )
  process.exit(0)
}

const results = []
for (const { group, key, url } of assetGroups) {
  const meta = await downloadOne(group, key, url)
  results.push(meta)
  const display =
    meta.dir === 'icons'
      ? `icons/${meta.fileName}`
      : `imgs/${meta.relative}`
  console.log(`OK ${display}`)
}

fs.writeFileSync(
  path.join(root, 'scripts/.download-manifest.json'),
  JSON.stringify(results, null, 2),
)

const rasterWarnings = results.filter((item) => {
  if (item.dir !== 'imgs') return false
  const min = minBytesForRasterKey(item.key)
  return min !== null && item.bytes < min
})

if (rasterWarnings.length > 0) {
  console.warn(
    `\n${rasterWarnings.length} raster asset(s) look empty — fix with get_screenshot (see scripts/figma-screenshot-exports.json), then pnpm assets:verify:raster`,
  )
}

console.log(`\nDownloaded ${results.length} assets.`)
