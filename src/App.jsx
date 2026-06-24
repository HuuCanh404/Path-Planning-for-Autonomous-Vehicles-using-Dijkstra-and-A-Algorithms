import { useState } from 'react'
import Header from './components/Header'
import LeftSidebar from './components/LeftSidebar'
import MapView from './components/MapView'
import RightSidebar from './components/RightSidebar'
import BottomBar from './components/BottomBar'
import { runAStar, runDijkstra, DEFAULT_GRID } from './utils/algorithms'
import { latLngToGrid, gridToLatLng } from './utils/gridHelper'

function App() {
 const [algorithm, setAlgorithm] = useState('astar')
 const [result, setResult] = useState(null)
 const [running, setRunning] = useState(false)
 const [carRunning, setCarRunning] = useState(false)
 const [view, setView] = useState('3d')
 const [layers, setLayers] = useState({
 buildings: true,
 parks: true,
 traffic: false,
 grid: true
 })
 const [movement, setMovement] = useState(4)
 const [variant, setVariant] = useState('Standard A*')

 // Trạng thái chọn điểm - BẮT ĐẦU VỚI null, user phải chọn
 const [selectMode, setSelectMode] = useState('start') // mặc định vào chế độ chọn start
 const [startPos, setStartPos] = useState(null)
 const [goalPos, setGoalPos] = useState(null)
 const [hoverPos, setHoverPos] = useState(null)
 const [routeError, setRouteError] = useState(null)

 // Kiểm tra đã chọn đủ Start + Goal chưa
 const readyToRun = startPos && goalPos

  const handleRun = () => {
    if (!readyToRun) return
    setRunning(true)
    setCarRunning(false)
    setResult(null)
    setRouteError(null)
    setTimeout(() => {
      const grid = DEFAULT_GRID
      const startCell = latLngToGrid(startPos.lat, startPos.lng)
      const goalCell = latLngToGrid(goalPos.lat, goalPos.lng)
      const fn = algorithm === 'astar' ? runAStar : runDijkstra
      const r = fn(startCell, goalCell, grid.obstacles, grid, movement)
      setResult(r)
      setRunning(false)
      setTimeout(() => setCarRunning(true), 100)
    }, 200)
  }

  // Click trên bản đồ
  const handleMapClick = (lat, lng) => {
    let finalLat = lat
    let finalLng = lng
    if (view === 'grid') {
      const [r, c] = latLngToGrid(lat, lng)
      const [snapLat, snapLng] = gridToLatLng(r, c)
      finalLat = snapLat
      finalLng = snapLng
    }

    if (selectMode === 'start') {
      setStartPos({ lat: finalLat, lng: finalLng, name: 'Custom Start' })
      setSelectMode('goal') // tự động chuyển sang chọn Goal
      setResult(null)
    } else if (selectMode === 'goal') {
      setGoalPos({ lat: finalLat, lng: finalLng, name: 'Custom Goal' })
      setSelectMode(null) // đã chọn xong
      setResult(null)
    }
  }

 const resetSelection = () => {
 setStartPos(null)
 setGoalPos(null)
 setResult(null)
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
 onRun={handleRun}
 running={running}
 selectMode={selectMode} setSelectMode={setSelectMode}
 start={startPos} goal={goalPos}
 readyToRun={readyToRun}
 onReset={resetSelection}
 />
 <MapView
 result={result} algorithm={algorithm} layers={layers} view={view}
 start={startPos} goal={goalPos}
 selectMode={selectMode} setSelectMode={setSelectMode}
 hoverPos={hoverPos} setHoverPos={setHoverPos}
 onMapClick={handleMapClick}
 carRunning={carRunning}
 routeError={routeError}
 />
 <RightSidebar result={result} algorithm={algorithm} />
 </div>
 <BottomBar view={view} setView={setView} />
 </div>
 )
}

export default App
