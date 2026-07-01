// Simulation utilities for Parking Lot Simulation (Dijkstra vs A*)
// All units are in METERS (not lat/lng coordinates)

export const CAR_SPEC = { length: 4.5, width: 1.8, safetyMargin: 0.3 }

// Generates a mock layout of parking slots
// Lane runs along y = 15m from x = 4m to x = 50m
export function generateParkingLot() {
  const slots = []
  const entryPoint = { x: 4, y: 15 }
  const laneY = 15

  // 1. Perpendicular slots (Top row, angle = 90 deg, facing down towards laneY)
  // cx spaced from 10 to 30, cy = 8
  for (let i = 0; i < 6; i++) {
    slots.push({
      id: `perp-${i}`,
      cx: 10 + i * 4,
      cy: 8,
      angle: -90, // facing upwards, backing in from lane
      width: 2.6,
      length: 5.0,
      occupied: i === 1 || i === 4, // occupied demo
      type: 'perpendicular'
    })
  }

  // 2. Parallel slots (Right side, top-ish row, angle = 0 deg)
  // cx spaced from 36 to 48, cy = 12.2
  for (let i = 0; i < 3; i++) {
    slots.push({
      id: `para-${i}`,
      cx: 34 + i * 7.5,
      cy: 12.0,
      angle: 0,
      width: 2.4,
      length: 6.2,
      occupied: i === 0,
      type: 'parallel'
    })
  }

  // 3. Angled slots (Bottom row, angle = 45 deg, cy = 22)
  for (let i = 0; i < 5; i++) {
    slots.push({
      id: `angle-${i}`,
      cx: 12 + i * 6,
      cy: 22,
      angle: 45, // 45 degrees
      width: 2.8,
      length: 5.5,
      occupied: i === 2 || i === 3,
      type: 'angled'
    })
  }

  return { slots, entryPoint, laneY }
}

// Check if coordinate point (x, y) is inside the bounding box of a slot
export function isPointInSlot(x, y, slot) {
  const dx = x - slot.cx
  const dy = y - slot.cy
  const rad = (slot.angle * Math.PI) / 180

  // Rotate point back to slot-aligned coordinate system
  const rx = dx * Math.cos(-rad) - dy * Math.sin(-rad)
  const ry = dx * Math.sin(-rad) + dy * Math.cos(-rad)

  return Math.abs(rx) <= slot.length / 2 && Math.abs(ry) <= slot.width / 2
}

// Scores slot based on distance from entry point and safety clearance margins
export function scoreSlot(slot, entryPoint, weights = { w1: 1, w2: 1 }) {
  const clearanceWidth = slot.width - CAR_SPEC.width
  const clearanceLength = slot.length - CAR_SPEC.length

  // Reject slot if occupied or too narrow
  if (slot.occupied || clearanceWidth < CAR_SPEC.safetyMargin || clearanceLength < CAR_SPEC.safetyMargin) {
    return { ...slot, cost: Infinity, valid: false }
  }

  const fitScore = clearanceWidth + clearanceLength
  const distance = Math.sqrt((slot.cx - entryPoint.x) ** 2 + (slot.cy - entryPoint.y) ** 2)

  return { ...slot, distance, fitScore, valid: true }
}

// Finds the optimal slot based on w1 (nearness) and w2 (ease of parking)
export function chooseBestSlot(slots, entryPoint, weights) {
  const scoredSlots = slots.map(s => scoreSlot(s, entryPoint, weights))
  const validSlots = scoredSlots.filter(s => s.valid)

  if (validSlots.length === 0) return null

  const maxDist = Math.max(...validSlots.map(s => s.distance)) || 0.1
  const maxFit = Math.max(...validSlots.map(s => s.fitScore)) || 0.1

  validSlots.forEach(s => {
    const normDist = s.distance / maxDist
    const normFit = s.fitScore / maxFit
    s.cost = weights.w1 * normDist - weights.w2 * normFit
  })

  validSlots.sort((a, b) => a.cost - b.cost)
  return validSlots[0]
}

// Gets the approach waypoint coordinates in the lane for a slot
export function getApproachPoint(slot, strategy = 'automatic', laneY = 15) {
  const activeStrategy = strategy === 'automatic' ? slot.type : strategy

  if (activeStrategy === 'perpendicular' || activeStrategy === 'angled' || activeStrategy === 'forwardOffset') {
    return { x: slot.cx - 4.5, y: laneY, angle: 0 }
  } else {
    // parallel or reverseS
    return { x: slot.cx + 5.0, y: laneY, angle: 0 }
  }
}

// A* Grid Pathfinding to the approach point bypassing occupied obstacles
// Grid cell size is 0.5 meters
export function findApproachPath(entryPoint, approachPoint, slots) {
  const GRID_SCALE = 0.5
  const MAX_X = 55
  const MAX_Y = 30
  const cols = Math.round(MAX_X / GRID_SCALE)
  const rows = Math.round(MAX_Y / GRID_SCALE)

  const startGx = Math.round(entryPoint.x / GRID_SCALE)
  const startGy = Math.round(entryPoint.y / GRID_SCALE)
  const goalGx = Math.round(approachPoint.x / GRID_SCALE)
  const goalGy = Math.round(approachPoint.y / GRID_SCALE)

  const occupiedSlots = slots.filter(s => s.occupied)

  // Obstacle checker function
  const isObstacle = (gx, gy) => {
    if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return true
    const x = gx * GRID_SCALE
    const y = gy * GRID_SCALE
    // Check if point falls inside any occupied slot boundary
    for (const slot of occupiedSlots) {
      if (isPointInSlot(x, y, slot)) return true
    }
    return false
  }

  const heuristic = (ax, ay, bx, by) => {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
  }

  const openSet = [{ gx: startGx, gy: startGy, f: heuristic(startGx, startGy, goalGx, goalGy), g: 0 }]
  const cameFrom = new Map()
  const gScore = new Map()
  const closed = new Set()
  const visited = []

  const toKey = (gx, gy) => `${gx},${gy}`
  gScore.set(toKey(startGx, startGy), 0)

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()
    const currentKey = toKey(current.gx, current.gy)

    if (closed.has(currentKey)) continue
    closed.add(currentKey)
    visited.push({ x: current.gx * GRID_SCALE, y: current.gy * GRID_SCALE })

    if (current.gx === goalGx && current.gy === goalGy) {
      // Reconstruct path
      const path = []
      let currKey = currentKey
      while (currKey) {
        const [cgx, cgy] = currKey.split(',').map(Number)
        path.unshift({ x: cgx * GRID_SCALE, y: cgy * GRID_SCALE })
        currKey = cameFrom.get(currKey)
      }
      return { path, visited }
    }

    const dirs = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]

    for (const [dgx, dgy] of dirs) {
      const ngx = current.gx + dgx
      const ngy = current.gy + dgy
      const neighborKey = toKey(ngx, ngy)

      if (isObstacle(ngx, ngy) || closed.has(neighborKey)) continue

      const cost = (dgx !== 0 && dgy !== 0) ? 1.414 : 1.0
      const tentativeG = gScore.get(currentKey) + cost

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey)
        gScore.set(neighborKey, tentativeG)
        const f = tentativeG + heuristic(ngx, ngy, goalGx, goalGy)
        openSet.push({ gx: ngx, gy: ngy, f, g: tentativeG })
      }
    }
  }

  // Fallback straight path if search fails (e.g. starting inside obstacle)
  const fallbackPath = []
  let steps = 50
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    fallbackPath.push({
      x: entryPoint.x + t * (approachPoint.x - entryPoint.x),
      y: entryPoint.y + t * (approachPoint.y - entryPoint.y)
    })
  }
  return { path: fallbackPath, visited: [] }
}

// Builds the final Bezier trajectory for the chosen strategy
export function buildParkingPath(strategy, carPos, slot) {
  const steps = 100
  const path = []

  // Starting position (Approach Point)
  const P0 = { x: carPos.x, y: carPos.y }
  // Target position (Slot Center)
  const P3 = { x: slot.cx, y: slot.cy }

  if (strategy === 'perpendicular') {
    // Quadratic Bezier: turns 90 degrees and backs in
    // P1 is the intersection of lane line and slot center vertical line
    const P1 = { x: slot.cx, y: carPos.y }

    // Start angle: 0 (facing right) or 180 (facing left)
    const startAngle = 0
    // End angle: matching the slot's angle
    const endAngle = (slot.angle * Math.PI) / 180

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P3.x
      const y = (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P3.y
      // Smooth angle interpolation
      const angle = startAngle + t * (endAngle - startAngle)
      path.push({ x, y, angle: (angle * 180) / Math.PI })
    }
  } else if (strategy === 'parallel') {
    // Cubic Bezier: S-shape reverse parking
    // P0 is in front of the slot (further right)
    const P1 = { x: P0.x - 3.5, y: P0.y }
    const P2 = { x: slot.cx + 2.5, y: slot.cy }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (1 - t) ** 3 * P0.x + 3 * (1 - t) ** 2 * t * P1.x + 3 * (1 - t) * t ** 2 * P2.x + t ** 3 * P3.x
      const y = (1 - t) ** 3 * P0.y + 3 * (1 - t) ** 2 * t * P1.y + 3 * (1 - t) * t ** 2 * P2.y + t ** 3 * P3.y
      
      // Interpolate angle from 0 -> maximum twist -> slot.angle
      const startAngle = 0
      const midAngle = Math.PI / 6 // 30 deg twist
      const endAngle = (slot.angle * Math.PI) / 180

      let angle = 0
      if (t < 0.5) {
        angle = startAngle + (t * 2) * (midAngle - startAngle)
      } else {
        angle = midAngle + ((t - 0.5) * 2) * (endAngle - midAngle)
      }

      path.push({ x, y, angle: (angle * 180) / Math.PI })
    }
  } else if (strategy === 'angled') {
    // Quadratic Bezier: smooth turn into 45-degree angle slot
    const P1 = { x: slot.cx - 2.5, y: P0.y }
    const startAngle = 0
    const endAngle = (slot.angle * Math.PI) / 180

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P3.x
      const y = (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P3.y
      const angle = startAngle + t * (endAngle - startAngle)
      path.push({ x, y, angle: (angle * 180) / Math.PI })
    }
  } else if (strategy === 'reverseS') {
    // Cubic Bezier: Reverse S-turn backing into perpendicular slot
    const P1 = { x: P0.x - 2.5, y: P0.y }
    const P2 = { x: slot.cx, y: slot.cy < P0.y ? P0.y + 2.0 : P0.y - 2.0 }
    const startAngle = 0
    const endAngle = (slot.angle * Math.PI) / 180

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (1 - t) ** 3 * P0.x + 3 * (1 - t) ** 2 * t * P1.x + 3 * (1 - t) * t ** 2 * P2.x + t ** 3 * P3.x
      const y = (1 - t) ** 3 * P0.y + 3 * (1 - t) ** 2 * t * P1.y + 3 * (1 - t) * t ** 2 * P2.y + t ** 3 * P3.y
      const angle = startAngle + t * (endAngle - startAngle)
      path.push({ x, y, angle: (angle * 180) / Math.PI })
    }
  } else if (strategy === 'forwardOffset') {
    // Cubic Bezier: Offset shift forward parking
    const P1 = { x: P0.x + 3.0, y: P0.y }
    const P2 = { x: slot.cx - 3.0, y: slot.cy }
    const startAngle = 0
    const endAngle = (slot.angle * Math.PI) / 180

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = (1 - t) ** 3 * P0.x + 3 * (1 - t) ** 2 * t * P1.x + 3 * (1 - t) * t ** 2 * P2.x + t ** 3 * P3.x
      const y = (1 - t) ** 3 * P0.y + 3 * (1 - t) ** 2 * t * P1.y + 3 * (1 - t) * t ** 2 * P2.y + t ** 3 * P3.y
      
      // Simple forward S-curve angle twist
      const midAngle = Math.PI / 12
      let angle = 0
      if (t < 0.5) {
        angle = startAngle + (t * 2) * (midAngle - startAngle)
      } else {
        angle = midAngle + ((t - 0.5) * 2) * (endAngle - midAngle)
      }

      path.push({ x, y, angle: (angle * 180) / Math.PI })
    }
  }

  return path
}
