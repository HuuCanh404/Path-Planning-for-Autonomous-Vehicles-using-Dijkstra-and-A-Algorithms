import { MapPin, Flag, XCircle, Eye, Play, GitCompare, ChevronDown, Hand, RotateCcw, Check } from 'lucide-react'

export function Section({ title, children }) {
 return (
 <div>
 <h3 className="text-[11px] font-semibold text-slate-400 tracking-wider mb-3">{title}</h3>
 <div className="space-y-2">{children}</div>
 </div>
 )
}

export function ControlBtn({ icon, label, active, onClick, badge, completed }) {
 return (
 <button
 onClick={onClick}
 className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition border ${
 active
 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
 : completed
 ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200'
 : 'bg-paneldark border-slate-700 text-slate-300 hover:bg-slate-700'
 }`}
 >
 <span className={active ? 'text-emerald-400' : completed ? 'text-emerald-400' : 'text-slate-400'}>
 {completed ? <Check size={16} /> : icon}
 </span>
 <span className="flex-1 text-left">{label}</span>
 {completed && !active && (
 <span className="text-[10px] text-emerald-400/70">✓ Set</span>
 )}
 {badge && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold animate-pulse">
 {badge}
 </span>
 )}
 </button>
 )
}

export function Toggle({ label, value, onChange }) {
 return (
 <label className="flex items-center justify-between px-3 py-1.5 cursor-pointer">
 <span className="text-sm text-slate-300">{label}</span>
 <button
 onClick={() => onChange(!value)}
 className={`relative w-9 h-5 rounded-full transition ${
 value ? 'bg-emerald-500' : 'bg-slate-600'
 }`}
 >
 <span
 className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
 value ? 'left-4' : 'left-0.5'
 }`}
 />
 </button>
 </label>
 )
}

function LeftSidebar({ layers, setLayers, movement, setMovement, variant, setVariant, onRun, onCompare, compareMode, running, selectMode, setSelectMode, start, goal, readyToRun, onReset, dynamicObstacles, goalIsParkingLot, setGoalIsParkingLot }) {
 const hasStart = !!start
 const hasGoal = !!goal

 return (
 <aside className="w-64 bg-panel border-r border-slate-700 p-4 space-y-6 overflow-y-auto shrink-0">
 {/* Progress indicator */}
 <div className="bg-paneldark border border-slate-700 rounded-md p-3 space-y-2">
 <p className="text-[11px] font-semibold text-slate-400 tracking-wider">SETUP PROGRESS</p>
 <div className="flex items-center gap-2 text-xs">
 <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
 hasStart ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 border border-slate-600'
 }`}>
 {hasStart ? '✓' : '1'}
 </div>
 <span className={hasStart ? 'text-emerald-300' : 'text-slate-300'}>Select Start</span>
 </div>
 <div className="flex items-center gap-2 text-xs">
 <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
 hasGoal ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 border border-slate-600'
 }`}>
 {hasGoal ? '✓' : '2'}
 </div>
 <span className={hasGoal ? 'text-emerald-300' : 'text-slate-300'}>Select Goal</span>
 </div>
 <div className="flex items-center gap-2 text-xs">
 <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
 readyToRun ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 border border-slate-600'
 }`}>
 {readyToRun ? '✓' : '3'}
 </div>
 <span className={readyToRun ? 'text-emerald-300' : 'text-slate-400'}>Run Algorithm</span>
 </div>
 </div>

 {/* Banner khi đang select */}
 {selectMode && (
 <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-md p-2.5 text-xs text-emerald-300 flex items-start gap-2 animate-pulse">
 <Hand size={14} className="mt-0.5 shrink-0" />
 <div>
 <p className="font-semibold mb-0.5">
 {selectMode === 'start' && 'Bước 1: Chọn điểm bắt đầu'}
 {selectMode === 'goal' && 'Bước 2: Chọn điểm kết thúc'}
 {selectMode === 'obstacle' && 'Vẽ chướng ngại vật'}
 </p>
 <p className="text-emerald-400/80">
 {selectMode === 'obstacle' ? 'Click các nút trên đồ thị để bật/tắt vật cản. ESC để hủy.' : 'Click lên bản đồ. ESC để hủy.'}
 </p>
 </div>
 </div>
 )}

 <Section title="CONTROLS">
 <ControlBtn
 icon={<MapPin size={16} />}
 label="Select Start"
 active={selectMode === 'start'}
 completed={hasStart}
 onClick={() => setSelectMode('start')}
 badge={selectMode === 'start' ? 'CLICK MAP' : null}
 />
 <ControlBtn
 icon={<Flag size={16} />}
 label="Select Goal"
 active={selectMode === 'goal'}
 completed={hasGoal}
 onClick={() => setSelectMode(hasStart ? 'goal' : 'start')}
 badge={selectMode === 'goal' ? 'CLICK MAP' : null}
 />
 <ControlBtn
 icon={<XCircle size={16} />}
 label="Select Obstacles"
 active={selectMode === 'obstacle'}
 completed={dynamicObstacles && dynamicObstacles.size > 0}
 onClick={() => setSelectMode('obstacle')}
 badge={selectMode === 'obstacle' ? 'CLICK NODES' : null}
 />
 <ControlBtn
 icon={<RotateCcw size={16} />}
 label="Reset Selection"
 onClick={onReset}
 />
 </Section>

 <Section title="MAP LAYERS">
 <Toggle label="Buildings" value={layers.buildings} onChange={v => setLayers({ ...layers, buildings: v })} />
 <Toggle label="Parks" value={layers.parks} onChange={v => setLayers({ ...layers, parks: v })} />
 <Toggle label="Traffic Marks" value={layers.traffic} onChange={v => setLayers({ ...layers, traffic: v })} />
 <Toggle label="Grid" value={layers.grid} onChange={v => setLayers({ ...layers, grid: v })} />
 </Section>

 <Section title="ALGORITHM SETTINGS">
 <div>
 <p className="text-[11px] text-slate-400 mb-1.5">Algorithm</p>
 <div className="relative">
 <select
 value={variant}
 onChange={e => setVariant(e.target.value)}
 className="w-full appearance-none bg-paneldark border border-slate-700 rounded-md px-3 py-2 text-sm text-white pr-8 focus:outline-none focus:border-emerald-500"
 >
 <option>Standard A*</option>
 <option>D* Lite (Dynamic)</option>
 <option>Dijkstra</option>
 <option>BFS (Breadth-First)</option>
 </select>
 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[11px] text-slate-400">Movement</p>
 <span className="text-[11px] text-emerald-400 font-semibold">{movement} Directions</span>
 </div>
 <input
 type="range"
 min="4"
 max="8"
 value={movement}
 onChange={e => setMovement(Number(e.target.value))}
 className="w-full accent-emerald-500"
 />
 <div className="flex justify-between text-[10px] text-slate-500 mt-1">
 <span>4</span>
 <span>8</span>
 </div>
 <div className="pt-2 border-t border-slate-700 mt-2">
 <Toggle label="Goal là bãi đỗ xe" value={goalIsParkingLot} onChange={setGoalIsParkingLot} />
 </div>
 </div>
 </Section>

 <div className="space-y-2 pt-2">
 <button
 onClick={onRun}
 disabled={!readyToRun || running}
 className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition ${
 readyToRun && !running
 ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
 : 'bg-slate-700 text-slate-500 cursor-not-allowed'
 }`}
 >
 <Play size={16} fill="currentColor" />
 {running ? 'Running...' : readyToRun ? 'Run Algorithm' : 'Select Start & Goal First'}
 </button>
    <button
      onClick={onCompare}
      disabled={!readyToRun || running}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm transition border ${
        readyToRun && !running
          ? compareMode && start && goal
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700'
          : 'border-slate-800 text-slate-600 cursor-not-allowed'
      }`}
    >
      <GitCompare size={16} />
      {running && compareMode ? 'Comparing...' : 'Compare Algorithms'}
    </button>
 </div>
 </aside>
 )
}

export default LeftSidebar
