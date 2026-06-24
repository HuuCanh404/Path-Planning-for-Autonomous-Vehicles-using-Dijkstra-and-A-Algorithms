import { useState, useMemo, useEffect } from 'react'
import Header from './components/Header'
import LeftSidebar from './components/LeftSidebar'
import MapView from './components/MapView'
import RightSidebar from './components/RightSidebar'
import BottomBar from './components/BottomBar'
import { runAStar, runDijkstra, DEFAULT_GRID, gridToLatLng, latLngToGrid, generateGraph, getClosestNode, runGraphAStar, runGraphDijkstra } from './utils/algorithms'

function App() {
  const [algorithm, setAlgorithm] = useState('astar')
  const [result, setResult] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [running, setRunning] = useState(false)
  const [carRunning, setCarRunning] = useState(false)
  const [view, setView] = useState('3d')
  const [dynamicObstacles, setDynamicObstacles] = useState(new Set())

  // Clear pathfinding results when view or selected algorithm changes
  useEffect(() => {
    setResult(null)
    setCompareMode(false)
  }, [view, algorithm])

  const [layers, setLayers] = useState({
    buildings: true,
    parks: true,
    traffic: false,
    grid: true
  })
  const [movement, setMovement] = useState(4)
  const [variant, setVariant] = useState('Standard A*')

  // Trạng thái chọn điểm - Khởi tạo bằng các điểm mặc định trên Graph tại Hà Nội
  const [selectMode, setSelectMode] = useState(null)
  const [startPos, setStartPos] = useState({ lat: 21.0385, lng: 105.8367, name: 'Default Start' })
  const [goalPos, setGoalPos] = useState({ lat: 21.0185, lng: 105.8717, name: 'Default Goal' })
  const [hoverPos, setHoverPos] = useState(null)
  const [routeError, setRouteError] = useState(null)

  // Bounding box của Grid/Graph mô phỏng: 
  // Tự động căn giữa theo điểm Start nếu có, nếu không thì mặc định theo Hà Nội
  const bounds = useMemo(() => {
    const centerLat = startPos ? startPos.lat : 21.0285
    const centerLng = startPos ? startPos.lng : 105.8542
    
    const LAT_SPAN = 0.02
    const LNG_SPAN = 0.035
    return {
      latMin: centerLat - LAT_SPAN / 2,
      latMax: centerLat + LAT_SPAN / 2,
      lngMin: centerLng - LNG_SPAN / 2,
      lngMax: centerLng + LNG_SPAN / 2
    }
  }, [startPos ? `${startPos.lat},${startPos.lng}` : null])

  // Generate and memoize graph structure based on dynamic bounds
  const graph = useMemo(() => generateGraph(6, 8, bounds), [bounds])

  // Initialize dynamic obstacles from graph defaults whenever graph structure changes
  useEffect(() => {
    if (graph) {
      setDynamicObstacles(new Set(graph.obstacles))
    }
  }, [graph])

  // Kiểm tra đã chọn đủ Start + Goal chưa
  const readyToRun = startPos && goalPos

  const handleRun = (isCompare = false) => {
    if (!readyToRun) return
    setRunning(true)
    setCarRunning(false)
    setResult(null)
    setCompareMode(isCompare)
    setRouteError(null)
    setTimeout(() => {
      if (view === 'grid') {
        // Graph View pathfinding
        const startNode = getClosestNode(startPos.lat, startPos.lng, graph.nodes)
        const goalNode = getClosestNode(goalPos.lat, goalPos.lng, graph.nodes)
        const fn = algorithm === 'astar' ? runGraphAStar : runGraphDijkstra
        const r = fn(startNode.id, goalNode.id, graph, dynamicObstacles)
        setResult(r)
      } else {
        // 3D View (Real Road Routing) - we still keep the old comparison run on DEFAULT_GRID
        const grid = DEFAULT_GRID
        const startGrid = latLngToGrid(startPos.lat, startPos.lng, bounds)
        const goalGrid = latLngToGrid(goalPos.lat, goalPos.lng, bounds)
        const fn = algorithm === 'astar' ? runAStar : runDijkstra
        const r = fn(startGrid, goalGrid, grid.obstacles, grid, movement)
        setResult(r)
      }
      setRunning(false)
      setTimeout(() => setCarRunning(true), 100)
    }, 200)
  }

  // Click trên bản đồ
  const handleMapClick = (lat, lng) => {
    if (selectMode === 'obstacle') {
      const closestNode = getClosestNode(lat, lng, graph.nodes)
      if (!closestNode) return
      setDynamicObstacles(prev => {
        const next = new Set(prev)
        if (next.has(closestNode.id)) {
          next.delete(closestNode.id)
        } else {
          // Tránh chặn điểm Start hoặc Goal
          const startNode = startPos ? getClosestNode(startPos.lat, startPos.lng, graph.nodes) : null
          const goalNode = goalPos ? getClosestNode(goalPos.lat, goalPos.lng, graph.nodes) : null
          if (startNode && closestNode.id === startNode.id) return prev
          if (goalNode && closestNode.id === goalNode.id) return prev
          next.add(closestNode.id)
        }
        return next
      })
      setResult(null)
      setCompareMode(false)
    } else if (selectMode === 'start') {
      // Đặt điểm bắt đầu: ghi nhận tọa độ click thực tế để làm mốc căn giữa Sandbox
      setStartPos({ lat, lng, name: 'Custom Start' })
      setSelectMode('goal')
      setResult(null)
      setCompareMode(false)
    } else if (selectMode === 'goal') {
      // Cột đích: Hút vào node gần nhất của đồ thị vừa được cập nhật theo Start
      const closestNode = getClosestNode(lat, lng, graph.nodes)
      setGoalPos({ lat: closestNode.lat, lng: closestNode.lng, name: `Node ${closestNode.id}` })
      
      // Hút luôn cả điểm Start đã chọn trước đó vào node đồ thị mới để đồng bộ
      const closestStart = getClosestNode(startPos.lat, startPos.lng, graph.nodes)
      setStartPos({ lat: closestStart.lat, lng: closestStart.lng, name: `Node ${closestStart.id}` })

      setSelectMode(null)
      setResult(null)
      setCompareMode(false)
    }
  }

  const resetSelection = () => {
    setStartPos(null)
    setGoalPos(null)
    setResult(null)
    setCompareMode(false)
    setDynamicObstacles(new Set(graph.obstacles))
    setSelectMode('start')
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-paneldark text-white overflow-hidden">
      <Header algorithm={algorithm} setAlgorithm={setAlgorithm} />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar
          layers={layers} setLayers={setLayers}
          movement={movement} setMovement={setMovement}
          variant={variant} setVariant={setVariant}
          onRun={() => handleRun(false)}
          onCompare={() => handleRun(true)}
          compareMode={compareMode}
          running={running}
          selectMode={selectMode} setSelectMode={setSelectMode}
          start={startPos} goal={goalPos}
          readyToRun={readyToRun}
          onReset={resetSelection}
          dynamicObstacles={dynamicObstacles}
        />
        <MapView
          result={result} algorithm={algorithm} layers={layers} view={view}
          start={startPos} goal={goalPos}
          selectMode={selectMode} setSelectMode={setSelectMode}
          hoverPos={hoverPos} setHoverPos={setHoverPos}
          onMapClick={handleMapClick}
          carRunning={carRunning}
          routeError={routeError}
          graph={graph}
          bounds={bounds}
          dynamicObstacles={dynamicObstacles}
        />
        <RightSidebar result={result} algorithm={algorithm} compareMode={compareMode} />
      </div>
      <BottomBar view={view} setView={setView} />
    </div>
  )
}

export default App
