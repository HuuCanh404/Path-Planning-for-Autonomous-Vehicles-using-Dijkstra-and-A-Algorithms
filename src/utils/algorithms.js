// Grid 20x30, mỗi ô ~ 0.1 km

export const LAT_MAX = 21.0385
export const LAT_MIN = 21.0185
export const LNG_MIN = 105.8367
export const LNG_MAX = 105.8717

export function gridToLatLng(r, c, bounds, rows = 20, cols = 30) {
  const { latMin, latMax, lngMin, lngMax } = bounds || {
    latMin: 21.0185,
    latMax: 21.0385,
    lngMin: 105.8367,
    lngMax: 105.8717
  }
  const lat = latMax - (r / (rows - 1)) * (latMax - latMin)
  const lng = lngMin + (c / (cols - 1)) * (lngMax - lngMin)
  return [lat, lng]
}

export function latLngToGrid(lat, lng, bounds, rows = 20, cols = 30) {
  const { latMin, latMax, lngMin, lngMax } = bounds || {
    latMin: 21.0185,
    latMax: 21.0385,
    lngMin: 105.8367,
    lngMax: 105.8717
  }
  let r = Math.round(((latMax - lat) / (latMax - latMin)) * (rows - 1))
  let c = Math.round(((lng - lngMin) / (lngMax - lngMin)) * (cols - 1))
  r = Math.max(0, Math.min(rows - 1, r))
  c = Math.max(0, Math.min(cols - 1, c))
  return [r, c]
}


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
 compare: makeCompareData(start, goal, grid, movement)
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
 compare: makeCompareData(start, goal, grid, movement)
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
 compare: makeCompareData(start, goal, grid, movement)
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
    compare: makeCompareData(start, goal, grid, movement)
  }
}

// Tạo data so sánh giữa A* và Dijkstra
function makeCompareData(start, goal, grid, movement) {
  const a = runAStarRaw(start, goal, grid, movement)
  const d = runDijkstraRaw(start, goal, grid, movement)
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

// === BFS (Breadth-First Search) ===
// Tìm đường ngắn nhất theo số bước (không tối ưu trọng số)
// Mở rộng theo từng lớp (level-order)
export function runBFS(start, goal, obstacles, grid, movement = 4) {
 const t0 = performance.now()
 const queue = [start]
 const cameFrom = new Map()
 const visited = []
 const closed = new Set()
 closed.add(`${start[0]},${start[1]}`)
 visited.push(start)

 while (queue.length > 0) {
 const current = queue.shift()
 const key = `${current[0]},${current[1]}`

 if (current[0] === goal[0] && current[1] === goal[1]) {
 const path = reconstructPath(cameFrom, current)
 const t1 = performance.now()
 return {
 path,
 visited,
 distance: path.length * 0.1,
 cost: path.length,
 selected: closed.size,
 time: t1 - t0,
 compare: makeCompareData(start, goal, grid, movement)
 }
 }

 for (const { node: neighbor, cost } of getNeighbors(current, grid, movement)) {
 const nKey = `${neighbor[0]},${neighbor[1]}`
 if (closed.has(nKey)) continue
 closed.add(nKey)
 visited.push(neighbor)
 cameFrom.set(nKey, current)
 queue.push(neighbor)
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
 compare: makeCompareData(start, goal, grid, movement)
 }
}

// === D* Lite (Dynamic A*) ===
// Tác giả: Sven Koenig & Maxim Likhachev (2002)
// "Fast Replanning for Navigation in Unknown Terrain"
// Thuật toán A* cải tiến cho môi trường THAY ĐỔI ĐỘNG:
// - Khi phát hiện chướng ngại vật mới → tính lại đường đi từ điểm hiện tại
// - Không cần tính lại từ đầu (như A* thường)
// - Chi phí cập nhật: O(1) amortized mỗi lần thay đổi
// - Tìm kiếm NGƯỢC từ Goal về Start (khác A*)
class DStarLitePriorityQueue {
 constructor() { this.heap = [] }
 push(item) {
 this.heap.push(item)
 this._bubbleUp(this.heap.length - 1)
 }
 pop() {
 if (this.heap.length === 0) return null
 const top = this.heap[0]
 const last = this.heap.pop()
 if (this.heap.length > 0) {
 this.heap[0] = last
 this._sinkDown(0)
 }
 return top
 }
 top() { return this.heap[0] }
 size() { return this.heap.length }
 remove(predicate) {
 this.heap = this.heap.filter(item => !predicate(item))
 // Rebuild heap (đơn giản: heapify)
 for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
 this._sinkDown(i)
 }
 }
 _bubbleUp(n) {
 while (n > 0) {
 const parent = Math.floor((n - 1) / 2)
 if (this.heap[n].k[0] < this.heap[parent].k[0] ||
 (this.heap[n].k[0] === this.heap[parent].k[0] && this.heap[n].k[1] < this.heap[parent].k[1])) {
 [this.heap[n], this.heap[parent]] = [this.heap[parent], this.heap[n]]
 n = parent
 } else break
 }
 }
 _sinkDown(n) {
 const length = this.heap.length
 while (true) {
 const left = 2 * n + 1, right = 2 * n + 2
 let smallest = n
 if (left < length && (this.heap[left].k[0] < this.heap[smallest].k[0] ||
 (this.heap[left].k[0] === this.heap[smallest].k[0] && this.heap[left].k[1] < this.heap[smallest].k[1]))) {
 smallest = left
 }
 if (right < length && (this.heap[right].k[0] < this.heap[smallest].k[0] ||
 (this.heap[right].k[0] === this.heap[smallest].k[0] && this.heap[right].k[1] < this.heap[smallest].k[1]))) {
 smallest = right
 }
 if (smallest !== n) {
 [this.heap[n], this.heap[smallest]] = [this.heap[smallest], this.heap[n]]
 n = smallest
 } else break
 }
 }
}

function heuristicD(a, b) {
 return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}

export function runDStarLite(start, goal, obstacles, grid, movement = 4) {
 const t0 = performance.now()
 const obSet = new Set(obstacles.map(([r, c]) => `${r},${c}`))
 const startK = `${start[0]},${start[1]}`
 const goalK = `${goal[0]},${goal[1]}`

 // D* Lite dùng goal làm điểm bắt đầu, tìm ngược về start
 const km = 0 // hệ số heuristic
 const g = new Map() // cost từ u đến goal
 const rhs = new Map() // one-step lookahead
 const U = new DStarLitePriorityQueue()

 rhs.set(goalK, 0)
 U.push({ id: goalK, k: [heuristicD(start, goal), 0] })

 function calculateKey(u) {
 const gval = g.get(u) ?? Infinity
 const rhsval = rhs.get(u) ?? Infinity
 const k1 = Math.min(gval, rhsval) + heuristicD(
 u.split(',').map(Number), start) + km
 const k2 = Math.min(gval, rhsval)
 return [k1, k2]
 }

 function updateVertex(u) {
 const gval = g.get(u) ?? Infinity
 const rhsval = rhs.get(u) ?? Infinity
 if (gval !== rhsval) {
 U.push({ id: u, k: calculateKey(u) })
 } else if (U.heap.some(item => item.id === u)) {
 U.remove(item => item.id === u)
 }
 }

 function getNeighborsD(node) {
 const [r, c] = node
 const dirs4 = [[-1, 0], [1, 0], [0, -1], [0, 1]]
 const dirs8 = [...dirs4, [-1, -1], [-1, 1], [1, -1], [1, 1]]
 const dirs = movement === 8 ? dirs8 : dirs4
 const result = []
 for (const [dr, dc] of dirs) {
 const nr = r + dr, nc = c + dc
 if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue
 if (obSet.has(`${nr},${nc}`)) continue
 const cost = (dr !== 0 && dc !== 0) ? 1.414 : 1
 result.push({ id: `${nr},${nc}`, cost })
 }
 return result
 }

 // Main loop - D* Lite (simplified cho grid pathfinding)
 // Ý tưởng: mở rộng từ Goal về Start, dùng priority queue với key = [g+h, g]
 // Khi tìm được start → dừng
 let iterations = 0
 const maxIter = 10000
 let pathFound = false

 while (U.size() > 0 && iterations < maxIter) {
 iterations++
 const u = U.pop()
 if (!u) break
 const [ur, uc] = u.id.split(',').map(Number)

 // Nếu u là start và consistent → done
 if (u.id === startK) {
 const gval = g.get(u.id) ?? Infinity
 const rhsval = rhs.get(u.id) ?? Infinity
 if (gval === rhsval) {
 pathFound = true
 break
 }
 }

 const gval = g.get(u.id) ?? Infinity
 const rhsval = rhs.get(u.id) ?? Infinity

 if (gval > rhsval) {
 g.set(u.id, rhsval)
 for (const succ of getNeighborsD([ur, uc])) {
 if (succ.id === goalK) continue
 const newRhs = (g.get(u.id) ?? Infinity) + succ.cost
 if (newRhs < (rhs.get(succ.id) ?? Infinity)) {
 rhs.set(succ.id, newRhs)
 updateVertex(succ.id)
 }
 }
 } else {
 g.set(u.id, Infinity)
 for (const succ of getNeighborsD([ur, uc])) {
 if (rhs.get(succ.id) === (gval === Infinity ? Infinity : gval + succ.cost)) {
 if (succ.id !== goalK) {
 rhs.set(succ.id, Infinity)
 updateVertex(succ.id)
 }
 }
 }
 updateVertex(u.id)
 }
 }

 // Reconstruct path từ start đến goal (theo gradient g giảm dần)
 const path = []
 const visited = []
 let cur = start
 const visitedSet = new Set()
 visitedSet.add(startK)
 visited.push([...cur])
 let safeIter = 0

 while ((cur[0] !== goal[0] || cur[1] !== goal[1]) && safeIter++ < 500) {
 const [r, c] = cur
 let bestSucc = null
 let bestG = Infinity
 for (const succ of getNeighborsD([r, c])) {
 if (visitedSet.has(succ.id)) continue
 const sg = g.get(succ.id) ?? Infinity
 if (sg < bestG) {
 bestG = sg
 bestSucc = succ
 }
 }
 if (!bestSucc || bestG === Infinity) break
 const [nr, nc] = bestSucc.id.split(',').map(Number)
 cur = [nr, nc]
 visitedSet.add(bestSucc.id)
 path.push([...cur])
 visited.push([...cur])
 }

 const t1 = performance.now()
 return {
 path,
 visited,
 distance: path.length * 0.1,
 cost: path.length,
 selected: g.size,
 time: t1 - t0,
 compare: makeCompareData(start, goal, grid, movement)
 }
}

// === GRAPH SEARCH ALGORITHMS ===

export function generateGraph(rows = 6, cols = 8, bounds) {
  const nodes = []
  const edges = []
  const nodeMap = new Map()

  const { latMin, latMax, lngMin, lngMax } = bounds || {
    latMin: 21.0185,
    latMax: 21.0385,
    lngMin: 105.8367,
    lngMax: 105.8717
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const latBase = latMax - (r / (rows - 1)) * (latMax - latMin)
      const lngBase = lngMin + (c / (cols - 1)) * (lngMax - lngMin)

      const latOffset = ((Math.random() - 0.5) * 0.25 * (latMax - latMin)) / (rows - 1)
      const lngOffset = ((Math.random() - 0.5) * 0.25 * (lngMax - lngMin)) / (cols - 1)

      const lat = latBase + latOffset
      const lng = lngBase + lngOffset
      const index = nodes.length

      nodes.push({
        id: index,
        r,
        c,
        lat,
        lng,
        neighbors: []
      })
      nodeMap.set(`${r},${c}`, index)
    }
  }

  const obstacleNodes = new Set([
    nodeMap.get('2,3'), nodeMap.get('2,4'),
    nodeMap.get('3,3'), nodeMap.get('3,4'),
    nodeMap.get('1,4'), nodeMap.get('4,3')
  ].filter(id => id !== undefined))

  for (const node of nodes) {
    if (obstacleNodes.has(node.id)) continue

    const { r, c } = node
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]

    for (const [dr, dc] of directions) {
      const nr = r + dr
      const nc = c + dc
      const neighborId = nodeMap.get(`${nr},${nc}`)

      if (neighborId !== undefined && !obstacleNodes.has(neighborId)) {
        node.neighbors.push(neighborId)
        
        const edgeKey = node.id < neighborId ? `${node.id}-${neighborId}` : `${neighborId}-${node.id}`
        if (!edges.some(e => e.key === edgeKey)) {
          edges.push({
            key: edgeKey,
            from: node.id,
            to: neighborId
          })
        }
      }
    }
  }

  return { nodes, edges, obstacles: obstacleNodes }
}

export function getClosestNode(lat, lng, nodes) {
  let closest = null
  let minDist = Infinity
  for (const node of nodes) {
    const dist = Math.sqrt((node.lat - lat) ** 2 + (node.lng - lng) ** 2)
    if (dist < minDist) {
      minDist = dist
      closest = node
    }
  }
  return closest
}

function getGraphDist(n1, n2) {
  return Math.sqrt((n1.lat - n2.lat) ** 2 + (n1.lng - n2.lng) ** 2) * 100
}

export function runGraphAStar(startNodeId, goalNodeId, graph, dynamicObstacles) {
  const t0 = performance.now()
  const startNode = graph.nodes[startNodeId]
  const goalNode = graph.nodes[goalNodeId]
  const openSet = [{ id: startNodeId, f: getGraphDist(startNode, goalNode), g: 0 }]
  const cameFrom = new Map()
  const gScore = new Map()
  gScore.set(startNodeId, 0)
  const visited = []
  const closed = new Set()

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f)
    const currentId = openSet.shift().id

    if (closed.has(currentId)) continue
    closed.add(currentId)
    visited.push(currentId)

    if (currentId === goalNodeId) {
      const path = [currentId]
      let curr = currentId
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr)
        path.unshift(curr)
      }

      const t1 = performance.now()
      const pathCost = gScore.get(currentId)
      return {
        path,
        visited,
        distance: pathCost,
        cost: Math.round(pathCost * 10),
        selected: closed.size,
        time: t1 - t0,
        compare: makeGraphCompareData(startNodeId, goalNodeId, graph, dynamicObstacles)
      }
    }

    const currentNode = graph.nodes[currentId]
    for (const neighborId of currentNode.neighbors) {
      if (closed.has(neighborId) || (dynamicObstacles && dynamicObstacles.has(neighborId))) continue
      const neighborNode = graph.nodes[neighborId]
      const tentativeG = gScore.get(currentId) + getGraphDist(currentNode, neighborNode)

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId)
        gScore.set(neighborId, tentativeG)
        const f = tentativeG + getGraphDist(neighborNode, goalNode)
        openSet.push({ id: neighborId, f, g: tentativeG })
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
    compare: makeGraphCompareData(startNodeId, goalNodeId, graph, dynamicObstacles)
  }
}

export function runGraphDijkstra(startNodeId, goalNodeId, graph, dynamicObstacles) {
  const t0 = performance.now()
  const openSet = [{ id: startNodeId, g: 0 }]
  const cameFrom = new Map()
  const gScore = new Map()
  gScore.set(startNodeId, 0)
  const visited = []
  const closed = new Set()

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.g - b.g)
    const currentId = openSet.shift().id

    if (closed.has(currentId)) continue
    closed.add(currentId)
    visited.push(currentId)

    if (currentId === goalNodeId) {
      const path = [currentId]
      let curr = currentId
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr)
        path.unshift(curr)
      }

      const t1 = performance.now()
      const pathCost = gScore.get(currentId)
      return {
        path,
        visited,
        distance: pathCost,
        cost: Math.round(pathCost * 10),
        selected: closed.size,
        time: t1 - t0,
        compare: makeGraphCompareData(startNodeId, goalNodeId, graph, dynamicObstacles)
      }
    }

    const currentNode = graph.nodes[currentId]
    for (const neighborId of currentNode.neighbors) {
      if (closed.has(neighborId) || (dynamicObstacles && dynamicObstacles.has(neighborId))) continue
      const neighborNode = graph.nodes[neighborId]
      const tentativeG = gScore.get(currentId) + getGraphDist(currentNode, neighborNode)

      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId)
        gScore.set(neighborId, tentativeG)
        openSet.push({ id: neighborId, g: tentativeG })
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
    compare: makeGraphCompareData(startNodeId, goalNodeId, graph, dynamicObstacles)
  }
}

function makeGraphCompareData(startNodeId, goalNodeId, graph, dynamicObstacles) {
  const a = runGraphAStarRaw(startNodeId, goalNodeId, graph, dynamicObstacles)
  const d = runGraphDijkstraRaw(startNodeId, goalNodeId, graph, dynamicObstacles)
  return { astar: a, dijkstra: d }
}

function runGraphAStarRaw(startNodeId, goalNodeId, graph, dynamicObstacles) {
  const t0 = performance.now()
  const startNode = graph.nodes[startNodeId]
  const goalNode = graph.nodes[goalNodeId]
  const openSet = [{ id: startNodeId, f: getGraphDist(startNode, goalNode), g: 0 }]
  const gScore = new Map()
  gScore.set(startNodeId, 0)
  const closed = new Set()

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f)
    const currentId = openSet.shift().id
    if (closed.has(currentId)) continue
    closed.add(currentId)

    if (currentId === goalNodeId) {
      return {
        time: performance.now() - t0,
        visited: closed.size,
        cost: Math.round(gScore.get(currentId) * 10)
      }
    }

    const currentNode = graph.nodes[currentId]
    for (const neighborId of currentNode.neighbors) {
      if (closed.has(neighborId) || (dynamicObstacles && dynamicObstacles.has(neighborId))) continue
      const neighborNode = graph.nodes[neighborId]
      const tentativeG = gScore.get(currentId) + getGraphDist(currentNode, neighborNode)
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        gScore.set(neighborId, tentativeG)
        const f = tentativeG + getGraphDist(neighborNode, goalNode)
        openSet.push({ id: neighborId, f })
      }
    }
  }
  return { time: 0, visited: 0, cost: 0 }
}

function runGraphDijkstraRaw(startNodeId, goalNodeId, graph, dynamicObstacles) {
  const t0 = performance.now()
  const openSet = [{ id: startNodeId, g: 0 }]
  const gScore = new Map()
  gScore.set(startNodeId, 0)
  const closed = new Set()

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.g - b.g)
    const currentId = openSet.shift().id
    if (closed.has(currentId)) continue
    closed.add(currentId)

    if (currentId === goalNodeId) {
      return {
        time: performance.now() - t0,
        visited: closed.size,
        cost: Math.round(gScore.get(currentId) * 10)
      }
    }

    const currentNode = graph.nodes[currentId]
    for (const neighborId of currentNode.neighbors) {
      if (closed.has(neighborId) || (dynamicObstacles && dynamicObstacles.has(neighborId))) continue
      const neighborNode = graph.nodes[neighborId]
      const tentativeG = gScore.get(currentId) + getGraphDist(currentNode, neighborNode)
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        gScore.set(neighborId, tentativeG)
        openSet.push({ id: neighborId, g: tentativeG })
      }
    }
  }
  return { time: 0, visited: 0, cost: 0 }
}

// =============================================================
// CÁC THUẬT TOÁN NÂNG CAO
// =============================================================

// Helper: lấy neighbors 4 hướng cho grid
function getGridNeighbors(r, c, rows, cols, obstacles) {
 const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
 const out = []
 for (const [dr, dc] of dirs) {
 const nr = r + dr, nc = c + dc
 if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
 if (obstacles.some(([or, oc]) => or === nr && oc === nc)) continue
 out.push([nr, nc])
 }
 return out
}

// Reconstruct grid path
function reconstructGridPath(cameFrom, current) {
 const path = [current]
 while (cameFrom.has(`${current[0]},${current[1]}`)) {
 current = cameFrom.get(`${current[0]},${current[1]}`)
 path.unshift(current)
 }
 return path
}
