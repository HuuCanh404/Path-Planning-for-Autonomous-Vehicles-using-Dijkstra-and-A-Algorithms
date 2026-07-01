import { useState, useMemo, useEffect } from 'react'
import { X, Play, Sliders, Info, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { Toggle, Section } from './LeftSidebar'
import {
  generateParkingLot,
  chooseBestSlot,
  getApproachPoint,
  findApproachPath,
  buildParkingPath,
  CAR_SPEC
} from '../utils/parkingLot'

const SCALE = 15 // pixels per meter
const entryPoint = { x: 4, y: 15 }

export default function ParkingLotView({ onClose }) {
  // Simulator States
  const [slots, setSlots] = useState([])
  const [w1, setW1] = useState(1.0) // Nearness weight
  const [w2, setW2] = useState(1.0) // Fit weight
  const [strategyOverride, setStrategyOverride] = useState('automatic')
  
  // Animation states
  const [phase, setPhase] = useState('CHOOSING_SLOT') // CHOOSING_SLOT | DRIVING_TO_APPROACH | PARKING | PARKED
  const [carPos, setCarPos] = useState({ x: entryPoint.x, y: entryPoint.y, angle: 0 })
  const [animProgress, setAnimProgress] = useState(0) // 0 to 100
  const [animVisitedCount, setAnimVisitedCount] = useState(0)

  // Initialize slots
  useEffect(() => {
    const { slots: initialSlots } = generateParkingLot()
    setSlots(initialSlots)
  }, [])

  // Toggle slot occupancy when clicked on map
  const toggleOccupied = (slotId) => {
    if (phase !== 'CHOOSING_SLOT') return // Disable edits during animation
    setSlots(prev =>
      prev.map(s => (s.id === slotId ? { ...s, occupied: !s.occupied } : s))
    )
  }

  // Calculate best slot based on weights
  const bestSlot = useMemo(() => {
    return chooseBestSlot(slots, entryPoint, { w1, w2 })
  }, [slots, w1, w2])

  // Get approach point
  const approachPoint = useMemo(() => {
    if (!bestSlot) return null
    return getApproachPoint(bestSlot)
  }, [bestSlot])

  // Run A* to approach point
  const { path: approachPath, visited: visitedNodes } = useMemo(() => {
    if (!approachPoint) return { path: [], visited: [] }
    return findApproachPath(entryPoint, approachPoint, slots)
  }, [approachPoint, slots])

  // Run Bezier parking trajectory
  const parkingPath = useMemo(() => {
    if (!bestSlot || !approachPoint) return []
    const strat = strategyOverride === 'automatic' ? bestSlot.type : strategyOverride
    return buildParkingPath(strat, approachPoint, bestSlot)
  }, [bestSlot, approachPoint, strategyOverride])

  // Reset simulation
  const handleReset = () => {
    setPhase('CHOOSING_SLOT')
    setCarPos({ x: entryPoint.x, y: entryPoint.y, angle: 0 })
    setAnimProgress(0)
    setAnimVisitedCount(0)
  }

  // Trigger parking animation
  const handleStartParking = () => {
    if (!bestSlot || phase !== 'CHOOSING_SLOT') return
    setPhase('DRIVING_TO_APPROACH')
    setAnimProgress(0)
    setAnimVisitedCount(0)
  }

  // Animation controller loop
  useEffect(() => {
    if (phase === 'CHOOSING_SLOT' || phase === 'PARKED') return

    let timer
    if (phase === 'DRIVING_TO_APPROACH') {
      // First show visited search node expansions
      if (animVisitedCount < visitedNodes.length) {
        timer = setTimeout(() => {
          setAnimVisitedCount(prev => Math.min(prev + 10, visitedNodes.length))
        }, 30)
      } else {
        // Then animate driving along A* path
        const totalSteps = approachPath.length
        if (totalSteps > 0) {
          const stepIndex = Math.min(Math.floor((animProgress / 100) * totalSteps), totalSteps - 1)
          const p = approachPath[stepIndex]
          setCarPos({ x: p.x, y: p.y, angle: 0 })

          if (animProgress < 100) {
            timer = setTimeout(() => {
              setAnimProgress(prev => prev + 2)
            }, 30)
          } else {
            // Arrived at approach point, switch to parking maneuver
            setPhase('PARKING')
            setAnimProgress(0)
          }
        } else {
          setPhase('PARKING')
          setAnimProgress(0)
        }
      }
    } else if (phase === 'PARKING') {
      // Animate Bezier path
      const totalSteps = parkingPath.length
      if (totalSteps > 0) {
        const stepIndex = Math.min(Math.floor((animProgress / 100) * totalSteps), totalSteps - 1)
        setCarPos(parkingPath[stepIndex])

        if (animProgress < 100) {
          timer = setTimeout(() => {
            setAnimProgress(prev => prev + 2)
          }, 40)
        } else {
          setPhase('PARKED')
        }
      } else {
        setPhase('PARKED')
      }
    }

    return () => clearTimeout(timer)
  }, [phase, animProgress, animVisitedCount, approachPath, parkingPath, visitedNodes])

  // Scored breakdown details for UI analysis table
  const tableData = useMemo(() => {
    const scored = slots.map(s => {
      const clearanceWidth = s.width - CAR_SPEC.width
      const clearanceLength = s.length - CAR_SPEC.length
      const valid = !s.occupied && clearanceWidth >= CAR_SPEC.safetyMargin && clearanceLength >= CAR_SPEC.safetyMargin
      
      const fitScore = valid ? clearanceWidth + clearanceLength : 0
      const distance = Math.sqrt((s.cx - entryPoint.x) ** 2 + (s.cy - entryPoint.y) ** 2)
      
      return {
        id: s.id,
        type: s.type,
        occupied: s.occupied,
        distance,
        fitScore,
        valid
      }
    })

    const maxDist = Math.max(...scored.filter(s => s.valid).map(s => s.distance)) || 1
    const maxFit = Math.max(...scored.filter(s => s.valid).map(s => s.fitScore)) || 1

    return scored.map(s => {
      if (!s.valid) return { ...s, normDist: 0, normFit: 0, cost: Infinity }
      const normDist = s.distance / maxDist
      const normFit = s.fitScore / maxFit
      const cost = w1 * normDist - w2 * normFit
      return { ...s, normDist, normFit, cost }
    })
  }, [slots, w1, w2])

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[2000] flex flex-col font-sans text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            🚗 Mô Phỏng Đỗ Xe Tự Hành (Autonomous Parking Simulator)
          </h1>
          <p className="text-xs text-slate-400">
            Minh họa chấm điểm tối ưu bãi đỗ, lập lộ trình A* cục bộ & điều khiển xe theo đường quỹ đạo Bezier
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-slate-850 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Status Panel */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trạng thái</h3>
            <div className="flex items-center gap-2">
              {phase === 'CHOOSING_SLOT' && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-sm font-medium text-yellow-300">Đang chọn vị trí tối ưu...</span>
                </>
              )}
              {phase === 'DRIVING_TO_APPROACH' && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-sm font-medium text-cyan-300">Đang di chuyển tới điểm tiếp cận...</span>
                </>
              )}
              {phase === 'PARKING' && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-sm font-medium text-purple-300">Đang thực hiện đỗ xe (Bezier)...</span>
                </>
              )}
              {phase === 'PARKED' && (
                <>
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Đỗ xe thành công!</span>
                </>
              )}
            </div>
            {bestSlot && (
              <p className="text-[11px] text-slate-400 mt-2">
                Bãi tối ưu: <span className="text-emerald-400 font-bold">{bestSlot.id.toUpperCase()}</span> ({bestSlot.type})
              </p>
            )}
          </div>

          {/* Configuration Weights */}
          <Section title="HÀM MỤC TIÊU & TRỌNG SỐ">
            <div className="space-y-3 bg-slate-950/50 p-3 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
                Cost = (w1 × d / d_max) - (w2 × fit / fit_max)
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">w1 (Gần điểm vào)</span>
                  <span className="text-emerald-400 font-mono font-bold">{w1.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={w1}
                  disabled={phase !== 'CHOOSING_SLOT'}
                  onChange={e => setW1(Number(e.target.value))}
                  className="w-full accent-emerald-500 disabled:opacity-40"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">w2 (Rộng rãi/Dễ đỗ)</span>
                  <span className="text-emerald-400 font-mono font-bold">{w2.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={w2}
                  disabled={phase !== 'CHOOSING_SLOT'}
                  onChange={e => setW2(Number(e.target.value))}
                  className="w-full accent-emerald-500 disabled:opacity-40"
                />
              </div>
            </div>
          </Section>

          {/* Strategy Overrides */}
          <Section title="CHIẾN THUẬT ĐỖ XE">
            <div className="relative">
              <select
                value={strategyOverride}
                disabled={phase !== 'CHOOSING_SLOT'}
                onChange={e => setStrategyOverride(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-white pr-8 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
              >
                <option value="automatic">Tự động (Theo loại bãi)</option>
                <option value="perpendicular">Perpendicular (Vuông góc)</option>
                <option value="parallel">Parallel (Song song)</option>
                <option value="angled">Angled (Chéo 45 độ)</option>
                <option value="reverseS">Reverse-S (Lùi chữ S)</option>
                <option value="forwardOffset">Forward Offset (Tiến nghiêng)</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</span>
            </div>
          </Section>

          {/* Control Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800 mt-auto">
            {phase === 'CHOOSING_SLOT' ? (
              <button
                onClick={handleStartParking}
                disabled={!bestSlot}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition ${
                  bestSlot
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play size={16} fill="currentColor" />
                Bắt đầu đỗ xe
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700"
              >
                <RotateCcw size={16} />
                Mô phỏng lại
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
            >
              Quay lại Dashboard chính
            </button>
          </div>
        </div>

        {/* Center / Right Map Area & Scores */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Simulation Area */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center p-2">
            {/* SVG Visualizer */}
            <svg
              viewBox="0 0 800 480"
              className="w-full h-full max-h-[480px] bg-slate-950/80 border border-slate-850 rounded"
            >
              {/* Grid Background */}
              <defs>
                <pattern id="grid-pattern" width="15" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* Lane / Roadway */}
              {/* Lane is at y = 15m (15 * 15px = 225px) with thickness of 6m (90px) */}
              <rect x="0" y="180" width="800" height="90" fill="#1e293b" opacity="0.6" />
              <line x1="0" y1="225" x2="800" y2="225" stroke="#64748b" strokeWidth="2" strokeDasharray="10 10" opacity="0.4" />
              
              {/* Entry Gate line */}
              <line x1="60" y1="180" x2="60" y2="270" stroke="#f59e0b" strokeWidth="3" opacity="0.7" />
              <text x="65" y="175" className="text-[10px] fill-amber-400 font-mono">GATE ENTRY</text>

              {/* Visited Expansion Cells from A* approach search */}
              {phase !== 'CHOOSING_SLOT' && visitedNodes.slice(0, animVisitedCount).map((v, idx) => (
                <circle
                  key={`visited-${idx}`}
                  cx={v.x * SCALE}
                  cy={v.y * SCALE}
                  r="2.5"
                  fill="#06b6d4"
                  opacity="0.45"
                  className="animate-pulse"
                />
              ))}

              {/* A* Approach Path (dashed blue) */}
              {approachPath.length > 0 && (phase === 'DRIVING_TO_APPROACH' || phase === 'PARKING' || phase === 'PARKED') && (
                <polyline
                  points={approachPath.map(p => `${p.x * SCALE},${p.y * SCALE}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                  opacity="0.75"
                />
              )}

              {/* Bezier Parking Path (dashed red) */}
              {parkingPath.length > 0 && (phase === 'PARKING' || phase === 'PARKED') && (
                <polyline
                  points={parkingPath.map(p => `${p.x * SCALE},${p.y * SCALE}`).join(' ')}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
              )}

              {/* Render Parking Slots */}
              {slots.map(slot => {
                const px = slot.cx * SCALE
                const py = slot.cy * SCALE
                const w = slot.length * SCALE
                const h = slot.width * SCALE
                const isBest = bestSlot?.id === slot.id

                let fill = 'fill-slate-700/10 stroke-slate-600'
                if (slot.occupied) {
                  fill = 'fill-red-500/20 stroke-red-500/70'
                } else if (isBest) {
                  fill = 'fill-emerald-400/25 stroke-emerald-400 stroke-[2.5px]'
                }

                return (
                  <g
                    key={slot.id}
                    className="cursor-pointer group"
                    onClick={() => toggleOccupied(slot.id)}
                  >
                    {/* Slot outline */}
                    <rect
                      x={-w / 2}
                      y={-h / 2}
                      width={w}
                      height={h}
                      rx="2"
                      className={`${fill} transition-all duration-300 hover:fill-slate-600/30`}
                      transform={`translate(${px}, ${py}) rotate(${slot.angle})`}
                    />
                    
                    {/* Hover tooltip hint inside SVG */}
                    <text
                      x={px}
                      y={slot.cy < 15 ? py - h/2 - 5 : py + h/2 + 12}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono pointer-events-none opacity-80 group-hover:opacity-100 group-hover:fill-emerald-400 transition"
                    >
                      {slot.id.toUpperCase()}
                    </text>

                    {/* Occupied label indicator */}
                    {slot.occupied ? (
                      <text
                        x={px}
                        y={py}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${slot.angle}, ${px}, ${py})`}
                        className="text-[9px] fill-red-400 font-semibold pointer-events-none"
                      >
                        OCCUPIED
                      </text>
                    ) : isBest ? (
                      <text
                        x={px}
                        y={py}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${slot.angle}, ${px}, ${py})`}
                        className="text-[9px] fill-emerald-400 font-bold pointer-events-none animate-pulse"
                      >
                        BEST FIT
                      </text>
                    ) : null}
                  </g>
                )
              })}

              {/* Render Animated Vehicle */}
              <g
                transform={`translate(${carPos.x * SCALE}, ${carPos.y * SCALE}) rotate(${carPos.angle})`}
                className="transition-transform duration-75 ease-linear"
              >
                {/* Main Body */}
                <rect
                  x={(-CAR_SPEC.length * SCALE) / 2}
                  y={(-CAR_SPEC.width * SCALE) / 2}
                  width={CAR_SPEC.length * SCALE}
                  height={CAR_SPEC.width * SCALE}
                  rx="4"
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth="2"
                  className="shadow-lg"
                />
                
                {/* Headlights (yellow circles at front end) */}
                <circle cx={(CAR_SPEC.length * SCALE) / 2 - 2} cy={(-CAR_SPEC.width * SCALE) / 3} r="3" fill="#fef08a" />
                <circle cx={(CAR_SPEC.length * SCALE) / 2 - 2} cy={(CAR_SPEC.width * SCALE) / 3} r="3" fill="#fef08a" />
                
                {/* Tail lights (red rects at back end) */}
                <rect x={(-CAR_SPEC.length * SCALE) / 2} y={(-CAR_SPEC.width * SCALE) / 2.5} width="2.5" height="4" fill="#ef4444" />
                <rect x={(-CAR_SPEC.length * SCALE) / 2} y={(CAR_SPEC.width * SCALE) / 3.5} width="2.5" height="4" fill="#ef4444" />
                
                {/* Windshield (dark glass look) */}
                <rect x={(CAR_SPEC.length * SCALE) / 10} y={(-CAR_SPEC.width * SCALE) / 2.3} width={(CAR_SPEC.length * SCALE) / 4} height={(CAR_SPEC.width * SCALE) / 1.15} fill="#0f172a" opacity="0.85" rx="1.5" />
                
                {/* Roof cap */}
                <rect x={(-CAR_SPEC.length * SCALE) / 4} y={(-CAR_SPEC.width * SCALE) / 2.5} width={(CAR_SPEC.length * SCALE) / 2.5} height={(CAR_SPEC.width * SCALE) / 1.25} fill="#0284c7" opacity="0.6" rx="1" />
              </g>
            </svg>

            {/* Click explanation banner */}
            {phase === 'CHOOSING_SLOT' && (
              <div className="absolute bottom-4 left-4 bg-paneldark/90 border border-slate-700 backdrop-blur px-3 py-1.5 rounded-md text-[10px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
                <Info size={12} className="text-emerald-400" />
                <span>Bạn có thể click vào các bãi đỗ trên SVG để bật/tắt chướng ngại vật (Occupied)</span>
              </div>
            )}
          </div>

          {/* Scores Table & Performance Analysis */}
          <div className="h-44 bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-hidden flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              📊 Bảng Đánh Giá & So Sánh Tối Ưu Bãi Đỗ Xe (Optimization Table)
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-1 px-2">BÃI ĐỖ</th>
                    <th className="py-1 px-2">LOẠI</th>
                    <th className="py-1 px-2">TRẠNG THÁI</th>
                    <th className="py-1 px-2 text-right">K.CÁCH (m)</th>
                    <th className="py-1 px-2 text-right">DUNG SAI (m)</th>
                    <th className="py-1 px-2 text-right">COST TỐI ƯU</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map(row => {
                    const isBest = bestSlot?.id === row.id
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-850 hover:bg-slate-800/40 ${
                          isBest ? 'bg-emerald-500/10 text-emerald-300 font-bold' : ''
                        }`}
                      >
                        <td className="py-1 px-2">{row.id.toUpperCase()}</td>
                        <td className="py-1 px-2 text-[10px] text-slate-400">{row.type}</td>
                        <td className="py-1 px-2">
                          {row.occupied ? (
                            <span className="text-red-400 text-[10px]">Occupied</span>
                          ) : !row.valid ? (
                            <span className="text-amber-500 text-[10px]">Too Tight</span>
                          ) : (
                            <span className="text-emerald-400 text-[10px]">Available</span>
                          )}
                        </td>
                        <td className="py-1 px-2 text-right">{row.distance.toFixed(1)}m</td>
                        <td className="py-1 px-2 text-right">{row.fitScore > 0 ? `${row.fitScore.toFixed(1)}m` : '-'}</td>
                        <td className="py-1 px-2 text-right">
                          {row.cost === Infinity ? (
                            <span className="text-slate-600 font-normal">∞</span>
                          ) : (
                            <span className={isBest ? 'text-emerald-400' : 'text-slate-300'}>
                              {row.cost.toFixed(3)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
