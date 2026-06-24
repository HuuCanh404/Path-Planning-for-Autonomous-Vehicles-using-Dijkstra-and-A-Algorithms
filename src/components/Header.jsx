import { Navigation, PlusCircle, Settings, MessageSquare } from 'lucide-react'

function Header({ algorithm, setAlgorithm }) {
 return (
 <header className="flex items-center justify-between px-6 py-3 bg-panel border-b border-slate-700 shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
 <Navigation className="text-emerald-400" size={22} />
 </div>
 <div>
 <h1 className="font-semibold text-sm">Autonomous Driving Path Planning</h1>
 <p className="text-[11px] text-slate-400">Dijkstra vs A* Algorithm</p>
 </div>
 </div>

 <div className="flex bg-paneldark rounded-lg p-1 border border-slate-700">
 <button
 onClick={() => setAlgorithm('dijkstra')}
 className={`px-4 py-1.5 text-sm rounded-md transition ${
 algorithm === 'dijkstra'
 ? 'bg-slate-700 text-white'
 : 'text-slate-400 hover:text-white'
 }`}
 >
 Dijkstra
 </button>
 <button
 onClick={() => setAlgorithm('astar')}
 className={`px-4 py-1.5 text-sm rounded-md transition flex items-center gap-2 ${
 algorithm === 'astar'
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
 : 'text-slate-400 hover:text-white'
 }`}
 >
 A* Search {algorithm === 'astar' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
 </button>
 </div>

 <div className="flex items-center gap-2">
 <button className="px-3 py-1.5 text-xs bg-paneldark border border-slate-700 rounded-md text-slate-300 hover:bg-slate-700 flex items-center gap-1.5">
 <PlusCircle size={14} />
 Comment
 </button>
 <button className="w-8 h-8 flex items-center justify-center rounded-md bg-paneldark border border-slate-700 text-slate-400 hover:bg-slate-700">
 <MessageSquare size={14} />
 </button>
 <button className="w-8 h-8 flex items-center justify-center rounded-md bg-paneldark border border-slate-700 text-slate-400 hover:bg-slate-700">
 <Settings size={14} />
 </button>
 </div>
 </header>
 )
}

export default Header
