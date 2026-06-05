/**
 * 校验 app/assets/icons 是否已 trim（无 filter、viewBox 不过大）。
 * Run: pnpm icons:verify
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const iconsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'app/assets/icons',
)

const files = fs.readdirSync(iconsDir).filter((name) => name.endsWith('.svg'))

let failed = false

for (const name of files) {
  const content = fs.readFileSync(path.join(iconsDir, name), 'utf8')

  if (/<filter\b/i.test(content)) {
    console.error(`FAIL ${name}: 仍含 <filter>，请执行 pnpm icons:trim`)
    failed = true
  }

  if (/preserveAspectRatio="none"/i.test(content)) {
    console.error(
      `FAIL ${name}: 仍为 Figma 默认 preserveAspectRatio="none"，请执行 pnpm icons:trim`,
    )
    failed = true
  }

  if (/\swidth="100%"/i.test(content) || /\sheight="100%"/i.test(content)) {
    console.error(
      `FAIL ${name}: 仍含 width/height="100%"，请执行 pnpm icons:trim`,
    )
    failed = true
  }

  const clipPathBlocks = content.match(/<clipPath[\s\S]*?<\/clipPath>/gi) ?? []
  for (const block of clipPathBlocks) {
    const rects = block.match(/<rect[^>]*\/?>/gi) ?? []
    for (const rect of rects) {
      const hasWidth = /\bwidth\s*=/i.test(rect)
      const hasHeight = /\bheight\s*=/i.test(rect)
      if (!hasWidth || !hasHeight) {
        console.error(
          `FAIL ${name}: clipPath 内 <rect> 缺少 width/height（常见 MCP 导出缺陷，浏览器裁切区域为 0，图标不显示）`,
        )
        failed = true
      }
    }
  }

  if (/<clip-path\s*=/i.test(content) && !/<path\b/i.test(content)) {
    console.error(
      `FAIL ${name}: 仅有 clip-path 裁剪且无 <path>，请扁平化 SVG 或移除无效 clipPath`,
    )
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`OK ${files.length} icons passed verify.`)
