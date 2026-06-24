import { Network, Box, Eye, MapPin, Flag, Route, EyeOff, Ban, Map as MapIcon } from 'lucide-react'

function Legend({ color, label, icon }) {
 return (
 <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
 <span className="w-3 h-3 rounded-sm flex items-center justify-center" style={{ background: color }}>
 {icon}
 </span>
 {label}
 </div>
 )
}

function BottomBar({ view, setView }) {
 return (
 <footer className="bg-panel border-t border-slate-700 px-4 py-2.5 flex items-center justify-between shrink-0">
 {/* Legend */}
 <div className="flex items-center gap-4">
 <Legend color="#10b981" label="Start" icon={<span className="w-1.5 h-1.5 bg-white rounded-full" />} />
 <Legend color="#ef4444" label="Goal" icon={<span className="w-1.5 h-1.5 bg-white rounded-full" />} />
 <Legend color="#22d3ee" label="Path" />
 <Legend color="#22d3ee" label="Visited Node" icon={<span className="w-1.5 h-1.5 bg-white/70 rounded-sm" />} />
 <Legend color="#dc2626" label="Obstacle" icon={<Ban size={8} className="text-white" />} />
 <Legend color="#475569" label="Road" />
 </div>

 {/* View toggle + count */}
 <div className="flex items-center gap-2">
 <div className="flex bg-paneldark border border-slate-700 rounded-md p-0.5">
 <button
 onClick={() => setView('grid')}
 className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition ${
 view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
 }`}
 >
 <Network size={12} />
 Graph View
 </button>
 <button
 onClick={() => setView('3d')}
 className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition ${
 view === '3d' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
 }`}
 >
 <Box size={12} />
 3D View
 </button>
 </div>
 <button className="px-3 py-1 text-xs bg-paneldark border border-slate-700 rounded text-slate-300 hover:bg-slate-700 flex items-center gap-1.5">
 <Eye size={12} />
 10 View
 </button>
 </div>
 </footer>
 )
}

export default BottomBar
