export const GRID_BOUNDS = {
  latMin: 21.0000,
  latMax: 21.0500,
  lngMin: 105.8000,
  lngMax: 105.8800,
  rows: 20,
  cols: 30
}

export function latLngToGrid(lat, lng) {
  const { latMin, latMax, lngMin, lngMax, rows, cols } = GRID_BOUNDS
  
  const clampedLat = Math.max(latMin, Math.min(latMax, lat))
  const clampedLng = Math.max(lngMin, Math.min(lngMax, lng))
  
  const r = Math.floor(((latMax - clampedLat) / (latMax - latMin)) * rows)
  const c = Math.floor(((clampedLng - lngMin) / (lngMax - lngMin)) * cols)
  
  return [
    Math.max(0, Math.min(rows - 1, r)),
    Math.max(0, Math.min(cols - 1, c))
  ]
}

export function gridToLatLng(r, c) {
  const { latMin, latMax, lngMin, lngMax, rows, cols } = GRID_BOUNDS
  
  const cellHeight = (latMax - latMin) / rows
  const cellWidth = (lngMax - lngMin) / cols
  
  const lat = latMax - (r + 0.5) * cellHeight
  const lng = lngMin + (c + 0.5) * cellWidth
  
  return [lat, lng]
}

export function getCellBounds(r, c) {
  const { latMin, latMax, lngMin, lngMax, rows, cols } = GRID_BOUNDS
  
  const cellHeight = (latMax - latMin) / rows
  const cellWidth = (lngMax - lngMin) / cols
  
  const cellLatMax = latMax - r * cellHeight
  const cellLatMin = latMax - (r + 1) * cellHeight
  const cellLngMin = lngMin + c * cellWidth
  const cellLngMax = lngMin + (c + 1) * cellWidth
  
  return [
    [cellLatMin, cellLngMin],
    [cellLatMax, cellLngMax]
  ]
}
