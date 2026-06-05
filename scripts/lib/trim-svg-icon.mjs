const PAD = 1

function mergeBounds(bounds, left, top, right, bottom) {
  bounds.minX = Math.min(bounds.minX, left)
  bounds.minY = Math.min(bounds.minY, top)
  bounds.maxX = Math.max(bounds.maxX, right)
  bounds.maxY = Math.max(bounds.maxY, bottom)
}

/** 解析 path d，计算路径包围盒（覆盖 M/L/H/V/C/S/Q/T/Z 及小写相对坐标） */
function pathBbox(d) {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }

  const tokens =
    d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? []
  if (tokens.length === 0) {
    return null
  }

  let i = 0
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0

  const addPoint = (px, py) => {
    mergeBounds(bounds, px, py, px, py)
    x = px
    y = py
  }

  const readNum = () => Number.parseFloat(tokens[i++])

  const isCmd = (t) => /^[MLHVCSQTAZmlhvcsqtaz]$/.test(t)

  while (i < tokens.length) {
    let cmd = tokens[i]
    if (!isCmd(cmd)) {
      i++
      continue
    }
    i++

    const rel = cmd === cmd.toLowerCase()
    const type = cmd.toUpperCase()

    const readPair = () => {
      const px = readNum()
      const py = readNum()
      if (rel) {
        addPoint(x + px, y + py)
      } else {
        addPoint(px, py)
      }
    }

    switch (type) {
      case 'M': {
        readPair()
        startX = x
        startY = y
        while (i < tokens.length && !isCmd(tokens[i])) {
          readPair()
        }
        break
      }
      case 'L':
        while (i < tokens.length && !isCmd(tokens[i])) {
          readPair()
        }
        break
      case 'H':
        while (i < tokens.length && !isCmd(tokens[i])) {
          const nx = readNum()
          addPoint(rel ? x + nx : nx, y)
        }
        break
      case 'V':
        while (i < tokens.length && !isCmd(tokens[i])) {
          const ny = readNum()
          addPoint(x, rel ? y + ny : ny)
        }
        break
      case 'C':
        while (i < tokens.length && !isCmd(tokens[i])) {
          const x1 = readNum()
          const y1 = readNum()
          const x2 = readNum()
          const y2 = readNum()
          const x3 = readNum()
          const y3 = readNum()
          if (rel) {
            mergeBounds(bounds, x + x1, y + y1, x + x1, y + y1)
            mergeBounds(bounds, x + x2, y + y2, x + x2, y + y2)
            addPoint(x + x3, y + y3)
          } else {
            mergeBounds(bounds, x1, y1, x1, y1)
            mergeBounds(bounds, x2, y2, x2, y2)
            addPoint(x3, y3)
          }
        }
        break
      case 'S':
      case 'Q':
        while (i < tokens.length && !isCmd(tokens[i])) {
          const pairs = type === 'Q' ? 2 : 3
          const coords = []
          for (let p = 0; p < pairs; p++) {
            coords.push(readNum(), readNum())
          }
          if (rel) {
            for (let p = 0; p < coords.length; p += 2) {
              mergeBounds(
                bounds,
                x + coords[p],
                y + coords[p + 1],
                x + coords[p],
                y + coords[p + 1],
              )
            }
            x += coords[coords.length - 2]
            y += coords[coords.length - 1]
            mergeBounds(bounds, x, y, x, y)
          } else {
            for (let p = 0; p < coords.length; p += 2) {
              mergeBounds(
                bounds,
                coords[p],
                coords[p + 1],
                coords[p],
                coords[p + 1],
              )
            }
            x = coords[coords.length - 2]
            y = coords[coords.length - 1]
          }
        }
        break
      case 'T':
        while (i < tokens.length && !isCmd(tokens[i])) {
          readPair()
        }
        break
      case 'A':
        while (i < tokens.length && !isCmd(tokens[i])) {
          readNum()
          readNum()
          readNum()
          readNum()
          readNum()
          readPair()
        }
        break
      case 'Z':
        addPoint(startX, startY)
        break
      default:
        break
    }
  }

  return Number.isFinite(bounds.minX) ? bounds : null
}

function boundsFromCircles(svg, bounds) {
  const circlePattern =
    /<circle\b[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"/gi
  let match = circlePattern.exec(svg)
  while (match) {
    const cx = Number.parseFloat(match[1])
    const cy = Number.parseFloat(match[2])
    const r = Number.parseFloat(match[3])
    mergeBounds(bounds, cx - r, cy - r, cx + r, cy + r)
    match = circlePattern.exec(svg)
  }
}

function boundsFromRects(svg, bounds) {
  const rectPattern =
    /<rect\b[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*\bwidth="([^"]+)"[^>]*\bheight="([^"]+)"/gi
  let match = rectPattern.exec(svg)
  while (match) {
    const rx = Number.parseFloat(match[1])
    const ry = Number.parseFloat(match[2])
    const w = Number.parseFloat(match[3])
    const h = Number.parseFloat(match[4])
    mergeBounds(bounds, rx, ry, rx + w, ry + h)
    match = rectPattern.exec(svg)
  }
}

function parseViewBox(svg) {
  const match = svg.match(/\bviewBox="([^"]+)"/i)
  if (!match) {
    return null
  }
  const parts = match[1].trim().split(/[\s,]+/).map(Number.parseFloat)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return null
  }
  const [vx, vy, vw, vh] = parts
  return {
    minX: vx,
    minY: vy,
    maxX: vx + vw,
    maxY: vy + vh,
  }
}

function stripFilters(svg) {
  return svg
    .replace(/\sfilter="url\(#[^"]+\)"/gi, '')
    .replace(/<filter\b[\s\S]*?<\/filter>/gi, '')
    .replace(/<defs>\s*<\/defs>/gi, '')
}

function applyViewBox(svg, bounds) {
  const vx = bounds.minX - PAD
  const vy = bounds.minY - PAD
  const vw = bounds.maxX - bounds.minX + PAD * 2
  const vh = bounds.maxY - bounds.minY + PAD * 2
  const viewBox = `${vx} ${vy} ${vw} ${vh}`

  let result = svg
    .replace(/\swidth="[^"]*"/gi, '')
    .replace(/\sheight="[^"]*"/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\spreserveAspectRatio="[^"]*"/gi, '')

  if (/viewBox="/i.test(result)) {
    result = result.replace(/viewBox="[^"]*"/i, `viewBox="${viewBox}"`)
  } else {
    result = result.replace(/<svg\b/i, `<svg viewBox="${viewBox}"`)
  }

  if (!/preserveAspectRatio="/i.test(result)) {
    result = result.replace(
      /<svg\b/i,
      '<svg preserveAspectRatio="xMidYMid meet"',
    )
  } else {
    result = result.replace(
      /preserveAspectRatio="[^"]*"/i,
      'preserveAspectRatio="xMidYMid meet"',
    )
  }

  return result.replace(/<svg\b/i, '<svg style="display:block"')
}

/**
 * 按路径几何收紧 viewBox，去掉 Figma 导出里 filter 造成的留白。
 * @param {string} svg
 * @returns {string}
 */
export function trimSvgIcon(svg) {
  const cleaned = stripFilters(svg)
  const rootViewBox = parseViewBox(cleaned)

  // `<g transform>` 内的 path 坐标是局部值；当前 trim 不解析 transform，强行收紧 viewBox 会裁掉偏移后的图形（如 modal 关闭钮的 ×）。
  if (/<g[^>]*\btransform=/i.test(cleaned)) {
    if (rootViewBox) {
      return applyViewBox(cleaned, rootViewBox)
    }
    return cleaned
  }

  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }

  const pathPattern = /\bd="([^"]+)"/gi
  let pathMatch = pathPattern.exec(cleaned)
  while (pathMatch) {
    const box = pathBbox(pathMatch[1])
    if (box) {
      mergeBounds(bounds, box.minX, box.minY, box.maxX, box.maxY)
    }
    pathMatch = pathPattern.exec(cleaned)
  }

  boundsFromCircles(cleaned, bounds)
  boundsFromRects(cleaned, bounds)

  if (!Number.isFinite(bounds.minX)) {
    return cleaned
  }

  return applyViewBox(cleaned, bounds)
}
