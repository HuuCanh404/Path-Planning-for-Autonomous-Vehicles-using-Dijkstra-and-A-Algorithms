import { useEffect, useRef, useState } from 'react'
import { Polyline } from 'react-leaflet'
import { getRouteWithFallback } from '../utils/routing'

/**
 * Component vẽ route thật theo đường phố
 * - Gọi OSRM API để lấy polyline
 * - Vẽ từng đoạn một (animation)
 * - Không dùng grid, đường bám sát street network
 */
export default function RealRoute({ start, goal, isAnimating, onComplete, onError }) {
 const [routePoints, setRoutePoints] = useState([])
 const [routeInfo, setRouteInfo] = useState(null)
 const [drawnPoints, setDrawnPoints] = useState([])
 const animRef = useRef(null)
 const lastIndexRef = useRef(0)

 // Gọi OSRM khi start/goal thay đổi
 useEffect(() => {
 if (!start || !goal) return
 let cancelled = false

 const fetchRoute = async () => {
 try {
 const result = await getRouteWithFallback(start, goal)
 if (cancelled) return
 setRoutePoints(result.coordinates)
 setRouteInfo({
 distance: result.distance,
 duration: result.duration,
 fallback: result.fallback
 })
 setDrawnPoints([]) // reset
 lastIndexRef.current = 0
 } catch (err) {
 console.error('Route error:', err)
 onError?.(err)
 }
 }

 fetchRoute()
 return () => { cancelled = true }
 }, [start, goal, onError])

 // Animation: vẽ từng đoạn
 useEffect(() => {
 if (!routePoints || routePoints.length < 2) return
 if (!isAnimating) {
 setDrawnPoints(routePoints)
 return
 }

 setDrawnPoints([routePoints[0]])
 lastIndexRef.current = 0
 const startTime = performance.now()
 const DURATION = Math.min(6000, Math.max(2500, routePoints.length * 20))

 const animate = (now) => {
 if (cancelled) return
 const elapsed = now - startTime
 const t = Math.min(elapsed / DURATION, 1)
 const targetIndex = Math.min(
 routePoints.length - 1,
 Math.ceil(t * (routePoints.length - 1))
 )

 if (targetIndex > lastIndexRef.current) {
 const newPoints = []
 for (let i = lastIndexRef.current + 1; i <= targetIndex; i++) {
 newPoints.push(routePoints[i])
 }
 setDrawnPoints(prev => [...prev, ...newPoints])
 lastIndexRef.current = targetIndex
 }

 if (t < 1) {
 animRef.current = requestAnimationFrame(animate)
 } else {
 onComplete?.()
 }
 }

 let cancelled = false
 animRef.current = requestAnimationFrame(animate)

 return () => {
 cancelled = true
 if (animRef.current) cancelAnimationFrame(animRef.current)
 }
 }, [routePoints, isAnimating, onComplete])

 if (drawnPoints.length < 2) return null

 return (
 <>
 {/* Outer glow - đỏ nhạt giống Google Maps */}
 <Polyline
 positions={drawnPoints}
 pathOptions={{
 color: '#ef4444',
 weight: 16,
 opacity: 0.25,
 lineCap: 'round',
 lineJoin: 'round'
 }}
 />
 {/* Mid glow */}
 <Polyline
 positions={drawnPoints}
 pathOptions={{
 color: '#f87171',
 weight: 10,
 opacity: 0.5,
 lineCap: 'round',
 lineJoin: 'round'
 }}
 />
 {/* Main path - đỏ tươi */}
 <Polyline
 positions={drawnPoints}
 pathOptions={{
 color: '#dc2626',
 weight: 6,
 opacity: 1,
 lineCap: 'round',
 lineJoin: 'round'
 }}
 />
 {/* Inner highlight - sáng trắng */}
 <Polyline
 positions={drawnPoints}
 pathOptions={{
 color: '#fef2f2',
 weight: 2,
 opacity: 0.8,
 lineCap: 'round',
 lineJoin: 'round'
 }}
 />
 </>
 )
}
