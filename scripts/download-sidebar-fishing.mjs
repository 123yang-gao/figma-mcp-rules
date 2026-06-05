/**
 * Flat Icon / Fishing — sidebar 24×24 instance (Figma 28021:94632).
 * Run: node scripts/download-sidebar-fishing.mjs
 *
 * Layer URLs expire ~7 days; refresh via get_design_context on the menu item node.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeFlatIconFromMcp } from './lib/compose-figma-flat-icon.mjs'

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'app/assets/icons/sidebar_fishing.svg',
)

/** Placement = Figma overflow-expanded slot origin on 24×24 frame (see figma-svg-icons.mdc). */
const LAYERS = [
  {
    url: 'https://www.figma.com/api/mcp/asset/baab3875-453d-4104-91cd-a8c795129713',
    transform: 'translate(4.5 7.5)',
  },
  {
    url: 'https://www.figma.com/api/mcp/asset/b156fc37-c3db-44da-bae8-5327bd93bc3f',
    transform: 'translate(12.5 3.5)',
  },
  {
    url: 'https://www.figma.com/api/mcp/asset/6114585f-72e1-4be3-8c46-bf0fda29575e',
    transform: 'translate(14.5 1.5)',
  },
]

const svg = await composeFlatIconFromMcp(LAYERS)
fs.writeFileSync(outPath, svg)
console.log(`wrote ${outPath}`)
