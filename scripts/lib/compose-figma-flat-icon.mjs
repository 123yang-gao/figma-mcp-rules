/**
 * Compose a single flat SVG (viewBox 0 0 frame×frame) from Figma MCP layer URLs.
 * Equivalent to Dev Mode Export SVG on a Flat Icon instance in the design frame.
 *
 * @param {object} options
 * @param {number} [options.frameSize=24]
 * @param {{ url: string, transform: string }[]} options.layers
 * @returns {string}
 */
export function extractPathElement(svg) {
  const match = svg.match(/<path[^>]+\/>/i)
  if (!match) {
    throw new Error('No <path/> in Figma MCP SVG')
  }
  return match[0]
    .replace(/\sid="[^"]*"/g, '')
    .replace(/var\(--stroke-0,\s*[^)]+\)/g, 'currentColor')
    .replace(/var\(--fill-0,\s*[^)]+\)/g, 'currentColor')
    .replace(/<path(?=[^>]*\sstroke=)(?![^>]*\sfill=)/i, '<path fill="none"')
}

export async function fetchFigmaMcpSvg(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  return res.text()
}

export function composeFlatIconSvg(layers, frameSize = 24) {
  const groups = layers.map(
    (layer) =>
      `  <g transform="${layer.transform}">\n    ${layer.path}\n  </g>`,
  )
  return `<svg viewBox="0 0 ${frameSize} ${frameSize}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block" preserveAspectRatio="xMidYMid meet">
${groups.join('\n')}
</svg>
`
}

/** Download MCP layer URLs and return composed SVG string. */
export async function composeFlatIconFromMcp(layers, frameSize = 24) {
  const resolved = []
  for (const layer of layers) {
    const raw = await fetchFigmaMcpSvg(layer.url)
    resolved.push({
      transform: layer.transform,
      path: extractPathElement(raw),
    })
  }
  return composeFlatIconSvg(resolved, frameSize)
}
