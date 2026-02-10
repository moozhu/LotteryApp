export interface WinnerLayoutItem {
  id: string
  x: number
  y: number
  size: number
  row: number
  col: number
}

export interface WinnerLayoutResult {
  items: WinnerLayoutItem[]
  columns: number
  rows: number
  size: number
  gap: number
  width: number
  height: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function computeWinnerLayout(ids: string[], width: number): WinnerLayoutResult {
  const unique: string[] = []
  const seen = new Set<string>()
  ids.forEach(id => {
    if (seen.has(id)) return
    seen.add(id)
    unique.push(id)
  })

  const count = unique.length
  if (count === 0 || width <= 0) {
    return { items: [], columns: 0, rows: 0, size: 0, gap: 0, width: Math.max(0, width), height: 0 }
  }

  const maxColumns = clamp(Math.floor(width / 160), 2, 8)
  let columns = clamp(Math.ceil(Math.sqrt(count)), 1, maxColumns)
  let rows = Math.ceil(count / columns)
  while (rows > columns && columns < maxColumns) {
    columns += 1
    rows = Math.ceil(count / columns)
  }

  const gap = clamp(Math.floor(width / 60), 8, 16)
  const size = clamp(Math.floor((width - gap * (columns - 1)) / columns), 110, 180)
  const totalWidth = columns * size + gap * (columns - 1)
  const offsetX = (width - totalWidth) / 2
  const height = rows * size + gap * (rows - 1)

  const items = unique.map((id, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    const x = offsetX + col * (size + gap) + size / 2
    const y = row * (size + gap) + size / 2
    return { id, x, y, size, row, col }
  })

  return { items, columns, rows, size, gap, width, height }
}
