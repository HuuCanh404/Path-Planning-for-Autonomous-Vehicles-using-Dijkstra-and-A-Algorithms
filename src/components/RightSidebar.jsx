import { CheckCircle2, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function Section({ title, children }) {
 return (
 <div>
 <h3 className="text-[11px] font-semibold text-slate-400 tracking-wider mb-2.5">{title}</h3>
 {children}
 </div>
 )
}

function InfoRow({ label, value, highlight }) {
 return (
 <div className="flex items-center justify-between text-sm py-1">
 <span className="text-slate-400">{label}</span>
 <span className={`font-mono font-semibold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
 {value}
 </span>
 </div>
 )
}

function RightSidebar({ result, algorithm, compareMode }) {
 const algoName = algorithm === 'astar' ? 'A* Search' : 'Dijkstra'
 const found = !!result?.path?.length

  const isGraphResult = result?.path && typeof result.path[0] === 'number'
  const startLabel = isGraphResult
    ? `Node ${result.path[0]}`
    : result?.path?.[0]
    ? `[${result.path[0][0]}, ${result.path[0][1]}]`
    : '[2, 4]'
  const goalLabel = isGraphResult
    ? `Node ${result.path[result.path.length - 1]}`
    : result?.path?.[result.path.length - 1]
    ? `[${result.path[result.path.length - 1][0]}, ${result.path[result.path.length - 1][1]}]`
    : '[17, 25]'

  const hasPath = !!result?.path
  const startDetails = hasPath ? startLabel : '—'
  const goalDetails = hasPath ? goalLabel : '—'
  const intermediaryStops = hasPath ? Math.max(0, result.path.length - 2) : '—'
  const totalSteps = hasPath ? result.path.length : '—'

  const hasCompare = !!result?.compare
  const showDijkstra = hasCompare && (compareMode || algorithm === 'dijkstra')
  const showAStar = hasCompare && (compareMode || algorithm === 'astar')

  const dijkstraTime = showDijkstra ? result.compare.dijkstra.time.toFixed(2) : '—'
  const astarTime = showAStar ? result.compare.astar.time.toFixed(2) : '—'
  const dijkstraVisited = showDijkstra ? Math.round(result.compare.dijkstra.visited).toLocaleString() : '—'
  const astarVisited = showAStar ? Math.round(result.compare.astar.visited).toLocaleString() : '—'
  const dijkstraDist = showDijkstra ? (isGraphResult ? (result.compare.dijkstra.cost / 10).toFixed(2) : '2.45') : '—'
  const astarDist = showAStar ? (isGraphResult ? (result.compare.astar.cost / 10).toFixed(2) : '2.32') : '—'
  const dijkstraCost = showDijkstra ? Math.round(result.compare.dijkstra.cost) : '—'
  const astarCost = showAStar ? Math.round(result.compare.astar.cost) : '—'

  // Data so sánh cho biểu đồ
  const data = hasCompare ? [
    { name: 'Time (ms)', dijkstra: showDijkstra ? result.compare.dijkstra.time : 0, astar: showAStar ? result.compare.astar.time : 0 },
    { name: 'Visited', dijkstra: showDijkstra ? result.compare.dijkstra.visited / (isGraphResult ? 1 : 50) : 0, astar: showAStar ? result.compare.astar.visited / (isGraphResult ? 1 : 50) : 0 },
    { name: 'Cost', dijkstra: showDijkstra ? result.compare.dijkstra.cost : 0, astar: showAStar ? result.compare.astar.cost : 0 }
  ] : []

 return (
 <aside className="w-80 bg-panel border-l border-slate-700 p-4 space-y-5 overflow-y-auto shrink-0">
 {/* Current Status */}
 <Section title="CURRENT STATUS">
 <div className={`flex items-center gap-2 px-3 py-2.5 rounded-md border ${
 found
 ? 'bg-emerald-500/10 border-emerald-500/40'
 : 'bg-slate-800 border-slate-700'
 }`}>
 <CheckCircle2 size={16} className={found ? 'text-emerald-400' : 'text-slate-500'} />
 <div className="flex-1">
 <p className="text-sm font-semibold">{algoName}</p>
 <p className={`text-[11px] ${found ? 'text-emerald-400' : 'text-slate-500'}`}>
 Status: {found ? 'Path Found' : 'Not Run'}
 </p>
 </div>
 </div>
 </Section>

 {/* Algorithm Info */}
 <Section title="ALGORITHM INFO">
 <div className="space-y-0.5">
 <InfoRow label="Algorithm" value={algoName} />
 <InfoRow label="Distance" value={result ? `${result.distance.toFixed(2)} km` : '—'} highlight />
 <InfoRow label="Selected Nodes" value={result?.selected ?? '—'} />
 <InfoRow label="Path Length" value={result ? `${result.distance.toFixed(2)} km` : '—'} />
 <InfoRow label="Path Cost" value={result?.cost ?? '—'} highlight />
 </div>
 </Section>

 {/* Comparison */}
 <Section title="COMPARISON">
 <div className="bg-paneldark border border-slate-700 rounded-md overflow-hidden">
 <table className="w-full text-xs">
 <thead>
 <tr className="bg-slate-800 text-slate-400">
 <th className="text-left px-3 py-2 font-medium">Metric</th>
 <th className="text-right px-3 py-2 font-medium">Dijkstra</th>
 <th className="text-right px-3 py-2 font-medium text-emerald-400">A* Search</th>
 </tr>
 </thead>
  <tbody className="divide-y divide-slate-700">
  <tr>
  <td className="px-3 py-1.5 text-slate-300">Time (ms)</td>
  <td className="px-3 py-1.5 text-right font-mono text-slate-200">{dijkstraTime}</td>
  <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{astarTime}</td>
  </tr>
  <tr>
  <td className="px-3 py-1.5 text-slate-300">Visited Nodes</td>
  <td className="px-3 py-1.5 text-right font-mono text-slate-200">{dijkstraVisited}</td>
  <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{astarVisited}</td>
  </tr>
  <tr>
  <td className="px-3 py-1.5 text-slate-300">Path Length (km)</td>
  <td className="px-3 py-1.5 text-right font-mono text-slate-200">{dijkstraDist}</td>
  <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{astarDist}</td>
  </tr>
  <tr>
  <td className="px-3 py-1.5 text-slate-300">Path Cost</td>
  <td className="px-3 py-1.5 text-right font-mono text-slate-200">{dijkstraCost}</td>
  <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{astarCost}</td>
  </tr>
  </tbody>
 </table>
 </div>
 </Section>

  {/* Performance Chart */}
  <Section title="PERFORMANCE CHART">
  <div className="bg-paneldark border border-slate-700 rounded-md p-2 h-[176px] flex items-center justify-center">
    {hasCompare ? (
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="2 2" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 4, fontSize: 11 }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
          {showDijkstra && <Bar dataKey="dijkstra" fill="#3b82f6" name="Dijkstra" radius={[2, 2, 0, 0]} />}
          {showAStar && <Bar dataKey="astar" fill="#22d3ee" name="A* Search" radius={[2, 2, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="text-slate-500 text-xs text-center px-4 space-y-1 select-none">
        <p>📊 Biểu đồ so sánh hiệu năng</p>
        <p className="text-[10px] text-slate-600">Nhấn "Run Algorithm" để xem số liệu</p>
      </div>
    )}
  </div>
  </Section>

 {/* Path Details */}
 <Section title="PATH DETAILS">
 <div className="bg-paneldark border border-slate-700 rounded-md p-3 text-xs space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Start</span>
 <span className="text-emerald-400 font-mono">{startDetails}</span>
 </div>
 <div className="flex items-center gap-1 text-slate-500">
 <span>↓</span>
 <span className="flex-1 border-t border-dashed border-slate-700"></span>
 <span>{intermediaryStops} intermediary stops</span>
 <span className="flex-1 border-t border-dashed border-slate-700"></span>
 <span>↓</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Goal</span>
 <span className="text-red-400 font-mono">{goalDetails}</span>
 </div>
 <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-slate-400">
 <span>Total Steps</span>
 <span className="text-white font-mono font-semibold">{totalSteps}</span>
 </div>
 </div>
 <button className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 border border-slate-700 rounded-md">
 View Full Path <ChevronRight size={12} />
 </button>
 </Section>
 </aside>
 )
}

export default RightSidebar
