import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, ZoomControl, useMapEvents, useMap, Rectangle, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Layers, Hand, AlertCircle, Loader2, MapPin } from 'lucide-react'
import RealRoute from './RealRoute'
import { getClosestNode } from '../utils/algorithms'

// Trung tâm Hà Nội
const HANOI_CENTER = [21.0285, 105.8542]

// Custom marker icons
const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin"><span>S</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

const goalIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin goal"><span>G</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

const carIcon = L.divIcon({
  className: 'custom-car-marker-div',
  html: `<div class="animate-bounce" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: #06b6d4; border: 2px solid white; border-radius: 50%; box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.5); font-size: 16px;">🚗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
})

// Component fly to khi start/goal thay đổi
function MapController({ start, goal }) {
  const map = useMap()
  useEffect(() => {
    if (!start || !goal) return
    const bounds = L.latLngBounds(
      [start.lat, start.lng],
      [goal.lat, goal.lng]
    )
    map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 })
  }, [map, start, goal])
  return null
}

// Component lắng nghe click
function ClickHandler({ selectMode, onMapClick, setHoverPos, view, graph }) {
  useMapEvents({
    click(e) {
      if (selectMode) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
    mousemove(e) {
      if (selectMode) {
        if (view === 'grid' && graph) {
          const closestNode = getClosestNode(e.latlng.lat, e.latlng.lng, graph.nodes)
          setHoverPos([closestNode.lat, closestNode.lng])
        } else {
          setHoverPos([e.latlng.lat, e.latlng.lng])
        }
      }
    },
    mouseout() {
      setHoverPos(null)
    }
  })
  return null
}

function MapView({
  result, algorithm, view,
  start, goal,
  selectMode, setSelectMode,
  hoverPos, setHoverPos, onMapClick,
  carRunning, routeError, graph, bounds,
  dynamicObstacles
}) {
  const [animationIndex, setAnimationIndex] = useState(0)

  // Quản lý animation của các node đã duyệt
  useEffect(() => {
    if (!result || !result.visited || view !== 'grid') {
      setAnimationIndex(0)
      return
    }

    setAnimationIndex(1)
    const totalNodes = result.visited.length
    const duration = 1200 // 1.2 giây tổng thời gian chạy animation
    const steps = Math.ceil(duration / 30)
    const stepSize = Math.max(1, Math.ceil(totalNodes / steps))

    const interval = setInterval(() => {
      setAnimationIndex(prev => {
        if (prev >= totalNodes) {
          clearInterval(interval)
          return totalNodes
        }
        return prev + stepSize
      })
    }, 30)

    return () => clearInterval(interval)
  }, [result, view])

  const isAnimationDone = !result || !result.visited || animationIndex >= result.visited.length
  const visibleVisited = result?.visited ? result.visited.slice(0, animationIndex) : []

  // Check if a node ID is visited
  const visitedSet = new Set(visibleVisited)

  const [carPathIndex, setCarPathIndex] = useState(0)
  const [isCarAnimating, setIsCarAnimating] = useState(false)

  // Reset car animation when result changes
  useEffect(() => {
    setCarPathIndex(0)
    setIsCarAnimating(false)
  }, [result])

  // Run car animation in Graph View when search is done
  useEffect(() => {
    if (!result || !result.path || !result.path.length || !isAnimationDone || !carRunning || view !== 'grid') {
      setCarPathIndex(0)
      setIsCarAnimating(false)
      return
    }

    setIsCarAnimating(true)
    setCarPathIndex(0)
    const totalPoints = result.path.length
    
    const interval = setInterval(() => {
      setCarPathIndex(prev => {
        if (prev >= totalPoints - 1) {
          clearInterval(interval)
          return totalPoints - 1
        }
        return prev + 1
      })
    }, 200)

    return () => clearInterval(interval)
  }, [result, isAnimationDone, carRunning, view])

  const pathPoints = (view === 'grid' && graph && result?.path)
    ? result.path.map(id => {
        const node = graph.nodes[id]
        return node ? [node.lat, node.lng] : [HANOI_CENTER[0], HANOI_CENTER[1]]
      })
    : []

  const visiblePathPoints = isCarAnimating 
    ? pathPoints.slice(0, carPathIndex + 1)
    : pathPoints

  // Phím ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selectMode) setSelectMode(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectMode, setSelectMode])

  // Tile URL
  const tileUrl = view === '3d'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const cursorStyle = selectMode ? 'crosshair' : 'grab'
  const startPoint = start ? [start.lat, start.lng] : null
  const goalPoint = goal ? [goal.lat, goal.lng] : null
  const hasPoints = startPoint && goalPoint

  return (
    <main className="flex-1 relative bg-slate-700 overflow-hidden">
      <MapContainer
        center={HANOI_CENTER}
        zoom={14}
        style={{ height: '100%', width: '100%', cursor: cursorStyle }}
        zoomControl={false}
        attributionControl={true}
        minZoom={3}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          subdomains='abcd'
          maxZoom={20}
        />

        <MapController start={start} goal={goal} />
        <ZoomControl position="bottomright" />

        <ClickHandler
          selectMode={selectMode}
          onMapClick={onMapClick}
          setHoverPos={setHoverPos}
          view={view}
          graph={graph}
        />

        {/* Real route theo đường phố - gọi OSRM (chỉ khi có đủ 2 điểm, ở chế độ 3d và sau khi bấm Run) */}
        {hasPoints && view === '3d' && result && (
          <RealRoute
            start={startPoint}
            goal={goalPoint}
            isAnimating={carRunning}
            onError={(err) => console.error('Route error:', err)}
          />
        )}

        {/* Graph View overlays */}
        {view === 'grid' && graph && (
          <>
            {/* Sandbox boundary border */}
            <Rectangle
              bounds={[[bounds.latMin, bounds.lngMin], [bounds.latMax, bounds.lngMax]]}
              pathOptions={{ color: '#10b981', weight: 1.5, fill: false, opacity: 0.6, dashArray: '5 5' }}
            />

            {/* Render Graph Edges (Liên kết các điểm) */}
            {graph.edges.map((edge) => {
              const fromNode = graph.nodes[edge.from]
              const toNode = graph.nodes[edge.to]
              return (
                <Polyline
                  key={edge.key}
                  positions={[[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]}
                  pathOptions={{ color: '#475569', weight: 1.5, opacity: 0.3 }}
                />
              )
            })}

            {/* Render Graph Nodes (Các nút mạng lưới) */}
            {graph.nodes.map((node) => {
              const isObstacle = dynamicObstacles ? dynamicObstacles.has(node.id) : graph.obstacles.has(node.id)
              const isVisited = visitedSet.has(node.id)
              
              let pathOptions = {
                color: '#475569',
                fillColor: '#1e293b',
                fillOpacity: 1,
                weight: 1.5,
                radius: 4.5
              }

              if (isObstacle) {
                pathOptions = {
                  color: '#ef4444',
                  fillColor: '#dc2626',
                  fillOpacity: 0.8,
                  weight: 1.5,
                  radius: 5.5
                }
              } else if (isVisited) {
                pathOptions = {
                  color: '#22d3ee',
                  fillColor: '#0891b2',
                  fillOpacity: 0.8,
                  weight: 1.5,
                  radius: 5.5
                }
              }

              return (
                <CircleMarker
                  key={`node-${node.id}`}
                  center={[node.lat, node.lng]}
                  pathOptions={pathOptions}
                />
              )
            })}

            {/* Shortest path line */}
            {isAnimationDone && pathPoints.length > 0 && (
              <Polyline
                positions={visiblePathPoints}
                pathOptions={{
                  color: '#22d3ee',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}

            {/* Car marker in Graph View */}
            {isCarAnimating && pathPoints[carPathIndex] && (
              <Marker position={pathPoints[carPathIndex]} icon={carIcon} />
            )}
          </>
        )}

        {/* Hover preview */}
        {hoverPos && selectMode && hasPoints && (
          <Polyline
            positions={[
              selectMode === 'start' ? hoverPos : startPoint,
              selectMode === 'goal' ? hoverPos : goalPoint
            ]}
            pathOptions={{
              color: selectMode === 'start' ? '#10b981' : '#ef4444',
              weight: 3,
              opacity: 0.5,
              dashArray: '6 6'
            }}
          />
        )}

        {/* Hover preview khi chỉ mới có 1 điểm */}
        {hoverPos && selectMode && !hasPoints && (
          <Polyline
            positions={[
              selectMode === 'goal' && startPoint ? startPoint : hoverPos,
              hoverPos
            ]}
            pathOptions={{
              color: selectMode === 'start' ? '#10b981' : '#ef4444',
              weight: 3,
              opacity: 0.5,
              dashArray: '6 6'
            }}
          />
        )}

        {/* Start marker */}
        {startPoint && (
          <Marker position={startPoint} icon={startIcon}>
            <Tooltip permanent direction="top" offset={[0, -32]}>
              <div className="text-center font-sans">
                <div className="font-bold text-emerald-600">START</div>
                <div className="text-[10px] text-slate-700">{start.name}</div>
                <div className="text-[9px] text-slate-500 font-mono">{start.lat.toFixed(4)}, {start.lng.toFixed(4)}</div>
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Goal marker */}
        {goalPoint && (
          <Marker position={goalPoint} icon={goalIcon}>
            <Tooltip permanent direction="top" offset={[0, -32]}>
              <div className="text-center font-sans">
                <div className="font-bold text-red-600">GOAL</div>
                <div className="text-[10px] text-slate-700">{goal.name}</div>
                <div className="text-[9px] text-slate-500 font-mono">{goal.lat.toFixed(4)}, {goal.lng.toFixed(4)}</div>
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* Select mode banner */}
      {selectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500/95 backdrop-blur px-4 py-2 rounded-md text-sm font-semibold z-[1000] flex items-center gap-2 shadow-lg shadow-emerald-500/30">
          <Hand size={16} className="animate-pulse" />
          {selectMode === 'start' && '👆 Click bản đồ để đặt điểm bắt đầu'}
          {selectMode === 'goal' && '🏁 Click bản đồ để đặt điểm đích'}
          {selectMode === 'obstacle' && (view === 'grid' ? '🚧 Click các nút trên đồ thị để bật/tắt vật cản' : '🚧 Mode này không khả dụng với routing thật')}
          <kbd className="ml-2 px-1.5 py-0.5 bg-black/30 rounded text-[10px]">ESC</kbd>
        </div>
      )}

      {/* View indicator */}
      <div className="absolute top-4 left-4 bg-paneldark/85 border border-slate-700 backdrop-blur px-3 py-1.5 rounded-md text-xs text-slate-200 flex items-center gap-2 z-[1000]">
        <Layers size={14} className="text-emerald-400" />
        <span className="font-semibold">{view === '3d' ? '3D View' : 'Graph View'}</span>
        <span className="text-slate-500">•</span>
        <span>{algorithm === 'astar' ? 'A* Search' : 'Dijkstra'}</span>
        <span className="text-slate-500">•</span>
        <span className="text-cyan-400">{view === '3d' ? '🛣️ Real Road Routing' : '🕸️ Node-Link Graph'}</span>
      </div>

      {/* Stats badge */}
      {result && (
        <div className="absolute top-4 right-4 bg-paneldark/90 border border-emerald-500/40 backdrop-blur px-3 py-2 rounded-md text-xs z-[1000] space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${carRunning ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-emerald-300 font-semibold">
              {carRunning ? '✏️ Drawing Route...' : '✓ Route Found'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>Visited: <span className="text-white font-mono">{result.selected}</span></span>
            <span>Cost: <span className="text-emerald-400 font-mono">{result.cost}</span></span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>Time: <span className="text-white font-mono">{result.time.toFixed(2)}ms</span></span>
            <span>Dist: <span className="text-emerald-400 font-mono">{result.distance.toFixed(2)}km</span></span>
          </div>
        </div>
      )}

      {/* Route error */}
      {routeError && (
        <div className="absolute bottom-4 right-4 bg-red-500/90 border border-red-400 backdrop-blur px-3 py-2 rounded-md text-xs z-[1000] flex items-center gap-2 max-w-xs">
          <AlertCircle size={14} />
          <span>Không tìm được đường đi. Thử vị trí khác.</span>
        </div>
      )}

      {/* Coordinate display */}
      <div className="absolute bottom-4 left-4 bg-paneldark/85 border border-slate-700 backdrop-blur px-3 py-1.5 rounded text-[11px] text-slate-300 font-mono z-[1000]">
        OSM Road Network • Powered by OSRM
      </div>

      {/* Welcome overlay khi chưa chọn điểm nào */}
      {!start && !goal && !selectMode && (
        <div className="absolute inset-0 bg-paneldark/70 backdrop-blur-sm z-[1100] flex items-center justify-center pointer-events-none">
          <div className="bg-panel border-2 border-emerald-500/40 rounded-lg p-6 max-w-md text-center shadow-2xl pointer-events-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <MapPin size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chọn điểm bắt đầu</h2>
            <p className="text-sm text-slate-300 mb-4">
              Click vào bản đồ bên dưới để chọn vị trí xuất phát và đích đến. Sau đó hệ thống sẽ tìm đường đi tối ưu theo đường phố thật.
            </p>
            <button
              onClick={() => {
                // Trigger selectMode qua callback
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md text-sm font-semibold"
            >
              👆 Click vào bản đồ để bắt đầu
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default MapView
