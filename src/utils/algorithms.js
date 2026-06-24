// Thuật toán Path Planning: A* và Dijkstra
// Grid 20x30, mỗi ô ~ 0.1 km

export const DEFAULT_GRID = {
 rows: 20,
 cols: 30,
 start: [2, 4],
 goal: [17, 25],
 obstacles: [
 // Vùng chướng ngại vật ở giữa
 [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [6, 15], [6, 16], [6, 17],
 [7, 10], [7, 14], [7, 15], [7, 16], [7, 17], [7, 18],
 [8, 10], [8, 11], [8, 12], [8, 14], [8, 15], [8, 18], [8, 19],
 [9, 12], [9, 13], [9, 14], [9, 18], [9, 19], [9, 20],
 [10, 14], [10, 15], [10, 20], [10, 21],
 // Vùng nhỏ phía dưới
 [13, 8], [13, 9], [14, 8], [14, 9],
 [15, 20], [15, 21], [15, 22]
 ]
}

// Heuristic Manhattan distance
function heuristic(a, b) {
 return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}

// Lấy neighbors (4 hoặc 8 directions)
function getNeighbors(node, grid, movement) {
 const [r, c] = node
 const neighbors = []
 const dirs4 = [[-1, 0], [1, 0], [0, -1], [0, 1]]
 const dirs8 = [...dirs4, [-1, -1], [-1, 1], [1, -1], [1, 1]]
 const dirs = movement === 8 ? dirs8 : dirs4

 for (const [dr, dc] of dirs) {
 const nr = r + dr
 const nc = c + dc
 if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue
 if (grid.obstacles.some(([or, oc]) => or === nr && oc === nc)) continue
 // Tránh cắt chéo góc chướng ngại vật
 if (movement === 8 && dr !== 0 && dc !== 0) {
 const blocked1 = grid.obstacles.some(([or, oc]) => or === r + dr && oc === c)
 const blocked2 = grid.obstacles.some(([or, oc]) => or === r && oc === c + dc)
 if (blocked1 && blocked2) continue
 }
 const cost = (dr !== 0 && dc !== 0) ? 1.414 : 1
 neighbors.push({ node: [nr, nc], cost })
 }
 return neighbors
}

// Reconstruct path
function reconstructPath(cameFrom, current) {
 const path = [current]
 while (cameFrom.has(`${current[0]},${current[1]}`)) {
 current = cameFrom.get(`${current[0]},${current[1]}`)
 path.unshift(current)
 }
 return path
}

// A* Search
export function runAStar(start, goal, obstacles, grid, movement = 4) {
 const t0 = performance.now()
 const openSet = [{ node: start, f: heuristic(start, goal), g: 0 }]
 const cameFrom = new Map()
 const gScore = new Map()
 gScore.set(`${start[0]},${start[1]}`, 0)
 const visited = []
 const closed = new Set()

 while (openSet.length > 0) {
 // Sort để lấy f nhỏ nhất (min-heap đơn giản)
 openSet.sort((a, b) => a.f - b.f)
 const current = openSet.shift().node
 const key = `${current[0]},${current[1]}`

 if (closed.has(key)) continue
 closed.add(key)
 visited.push(current)

 if (current[0] === goal[0] && current[1] === goal[1]) {
 const path = reconstructPath(cameFrom, current)
 const t1 = performance.now()
 const pathCost = gScore.get(key)
 return {
 path,
 visited,
 distance: pathCost * 0.1,
 cost: Math.round(pathCost),
 selected: closed.size,
 time: t1 - t0,
 compare: makeCompareData(grid, movement)
 }
 }

 for (const { node: neighbor, cost } of getNeighbors(current, grid, movement)) {
 const nKey = `${neighbor[0]},${neighbor[1]}`
 if (closed.has(nKey)) continue
 const tentativeG = (gScore.get(key) ?? Infinity) + cost
 if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
 cameFrom.set(nKey, current)
 gScore.set(nKey, tentativeG)
 const f = tentativeG + heuristic(neighbor, goal)
 openSet.push({ node: neighbor, f, g: tentativeG })
 }
 }
 }

 const t1 = performance.now()
 return {
 path: [],
 visited,
 distance: 0,
 cost: 0,
 selected: closed.size,
 time: t1 - t0,
 compare: makeCompareData(grid, movement)
 }
}

// Dijkstra
export function runDijkstra(start, goal, obstacles, grid, movement = 4) {
 const t0 = performance.now()
 const openSet = [{ node: start, g: 0 }]
 const cameFrom = new Map()
 const gScore = new Map()
 gScore.set(`${start[0]},${start[1]}`, 0)
 const visited = []
 const closed = new Set()

 while (openSet.length > 0) {
 openSet.sort((a, b) => a.g - b.g)
 const current = openSet.shift().node
 const key = `${current[0]},${current[1]}`

 if (closed.has(key)) continue
 closed.add(key)
 visited.push(current)

 if (current[0] === goal[0] && current[1] === goal[1]) {
 const path = reconstructPath(cameFrom, current)
 const t1 = performance.now()
 const pathCost = gScore.get(key)
 return {
 path,
 visited,
 distance: pathCost * 0.1,
 cost: Math.round(pathCost),
 selected: closed.size,
 time: t1 - t0,
 compare: makeCompareData(grid, movement)
 }
 }

 for (const { node: neighbor, cost } of getNeighbors(current, grid, movement)) {
 const nKey = `${neighbor[0]},${neighbor[1]}`
 if (closed.has(nKey)) continue
 const tentativeG = (gScore.get(key) ?? Infinity) + cost
 if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
 cameFrom.set(nKey, current)
 gScore.set(nKey, tentativeG)
 openSet.push({ node: neighbor, g: tentativeG })
 }
 }
 }

 const t1 = performance.now()
 return {
 path: [],
 visited,
 distance: 0,
 cost: 0,
 selected: closed.size,
 time: t1 - t0,
 compare: makeCompareData(grid, movement)
 }
}

// Tạo data so sánh giữa A* và Dijkstra
function makeCompareData(grid, movement) {
 const a = runAStarRaw(grid.start, grid.goal, grid, movement)
 const d = runDijkstraRaw(grid.start, grid.goal, grid, movement)
 return { astar: a, dijkstra: d }
}

function runAStarRaw(start, goal, grid, movement) {
 const t0 = performance.now()
 const openSet = [{ node: start, f: heuristic(start, goal), g: 0 }]
 const gScore = new Map()
 gScore.set(`${start[0]},${start[1]}`, 0)
 const closed = new Set()

 while (openSet.length > 0) {
 openSet.sort((a, b) => a.f - b.f)
 const current = openSet.shift().node
 const key = `${current[0]},${current[1]}`
 if (closed.has(key)) continue
 closed.add(key)
 if (current[0] === goal[0] && current[1] === goal[1]) {
 return { time: performance.now() - t0, visited: closed.size, cost: gScore.get(key) }
 }
 for (const { node: neighbor, cost } of getNeighbors(current, grid, movement)) {
 const nKey = `${neighbor[0]},${neighbor[1]}`
 if (closed.has(nKey)) continue
 const tentativeG = (gScore.get(key) ?? Infinity) + cost
 if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
 gScore.set(nKey, tentativeG)
 openSet.push({ node: neighbor, f: tentativeG + heuristic(neighbor, goal), g: tentativeG })
 }
 }
 }
 return { time: 0, visited: 0, cost: 0 }
}

function runDijkstraRaw(start, goal, grid, movement) {
 const t0 = performance.now()
 const openSet = [{ node: start, g: 0 }]
 const gScore = new Map()
 gScore.set(`${start[0]},${start[1]}`, 0)
 const closed = new Set()

 while (openSet.length > 0) {
 openSet.sort((a, b) => a.g - b.g)
 const current = openSet.shift().node
 const key = `${current[0]},${current[1]}`
 if (closed.has(key)) continue
 closed.add(key)
 if (current[0] === goal[0] && current[1] === goal[1]) {
 return { time: performance.now() - t0, visited: closed.size, cost: gScore.get(key) }
 }
 for (const { node: neighbor, cost } of getNeighbors(current, grid, movement)) {
 const nKey = `${neighbor[0]},${neighbor[1]}`
 if (closed.has(nKey)) continue
 const tentativeG = (gScore.get(key) ?? Infinity) + cost
 if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
 gScore.set(nKey, tentativeG)
 openSet.push({ node: neighbor, g: tentativeG })
 }
 }
 }
 return { time: 0, visited: 0, cost: 0 }
}
