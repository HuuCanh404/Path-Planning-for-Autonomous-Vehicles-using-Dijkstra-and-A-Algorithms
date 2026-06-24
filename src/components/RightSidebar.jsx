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

function RightSidebar({ result, algorithm }) {
 const algoName = algorithm === 'astar' ? 'A* Search' : 'Dijkstra'
 const found = !!result?.path?.length

 // Data so sánh
 const data = [
 { name: 'Time (ms)', dijkstra: result?.compare?.dijkstra?.time ?? 10.47, astar: result?.compare?.astar?.time ?? 6.32 },
 { name: 'Visited', dijkstra: (result?.compare?.dijkstra?.visited ?? 4800) / 50, astar: (result?.compare?.astar?.visited ?? 124) / 50 },
 { name: 'Cost', dijkstra: result?.compare?.dijkstra?.cost ?? 270, astar: result?.compare?.astar?.cost ?? 258 }
 ]

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
 <td className="px-3 py-1.5 text-right font-mono text-slate-200">{(data[0].dijkstra).toFixed(2)}</td>
 <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{(data[0].astar).toFixed(2)}</td>
 </tr>
 <tr>
 <td className="px-3 py-1.5 text-slate-300">Visited Nodes</td>
 <td className="px-3 py-1.5 text-right font-mono text-slate-200">{Math.round(data[1].dijkstra * 50).toLocaleString()}</td>
 <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{Math.round(data[1].astar * 50).toLocaleString()}</td>
 </tr>
 <tr>
 <td className="px-3 py-1.5 text-slate-300">Path Length (km)</td>
 <td className="px-3 py-1.5 text-right font-mono text-slate-200">2.45</td>
 <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{result?.distance?.toFixed(2) ?? '2.32'}</td>
 </tr>
 <tr>
 <td className="px-3 py-1.5 text-slate-300">Path Cost</td>
 <td className="px-3 py-1.5 text-right font-mono text-slate-200">{Math.round(data[2].dijkstra)}</td>
 <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-semibold">{Math.round(data[2].astar)}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </Section>

 {/* Performance Chart */}
 <Section title="PERFORMANCE CHART">
 <div className="bg-paneldark border border-slate-700 rounded-md p-2">
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
 <Bar dataKey="dijkstra" fill="#3b82f6" name="Dijkstra" radius={[2, 2, 0, 0]} />
 <Bar dataKey="astar" fill="#22d3ee" name="A* Search" radius={[2, 2, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Section>

 {/* Path Details */}
 <Section title="PATH DETAILS">
 <div className="bg-paneldark border border-slate-700 rounded-md p-3 text-xs space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Start</span>
 <span className="text-emerald-400 font-mono">[{result?.path?.[0]?.[0] ?? 2}, {result?.path?.[0]?.[1] ?? 4}]</span>
 </div>
 <div className="flex items-center gap-1 text-slate-500">
 <span>↓</span>
 <span className="flex-1 border-t border-dashed border-slate-700"></span>
 <span>4 intermediary stops</span>
 <span className="flex-1 border-t border-dashed border-slate-700"></span>
 <span>↓</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Goal</span>
 <span className="text-red-400 font-mono">[{result?.path?.[result?.path?.length - 1]?.[0] ?? 17}, {result?.path?.[result?.path?.length - 1]?.[1] ?? 25}]</span>
 </div>
 <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-slate-400">
 <span>Total Steps</span>
 <span className="text-white font-mono font-semibold">{result?.path?.length ?? 0}</span>
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
