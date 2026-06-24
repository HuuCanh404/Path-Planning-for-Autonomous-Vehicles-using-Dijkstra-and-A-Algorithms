// Routing service - gọi OSRM API miễn phí để lấy route thật theo đường phố
// API: https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
// Trả về polyline các waypoints bám sát đường thật

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

/**
 * Lấy route thật giữa 2 điểm lat/lng theo đường phố
 * @param {[number, number]} start - [lat, lng]
 * @param {[number, number]} end - [lat, lng]
 * @returns {Promise<{coordinates: [number, number][], distance: number, duration: number}>}
 */
export async function getRoute(start, end) {
 try {
 const [lat1, lng1] = start
 const [lat2, lng2] = end
 const url = `${OSRM_BASE}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=false`

 const response = await fetch(url)
 if (!response.ok) {
 throw new Error(`OSRM error: ${response.status}`)
 }

 const data = await response.json()
 if (!data.routes || data.routes.length === 0) {
 throw new Error('No route found')
 }

 const route = data.routes[0]
 // GeoJSON coordinates: [lng, lat] -> chuyển thành [lat, lng]
 const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

 return {
 coordinates,
 distance: route.distance, // mét
 duration: route.duration, // giây
 waypoints: data.waypoints
 }
 } catch (err) {
 console.error('Routing failed:', err)
 throw err
 }
}

/**
 * Lấy route với fallback - nếu OSRM lỗi thì vẽ đường thẳng
 */
export async function getRouteWithFallback(start, end) {
 try {
 return await getRoute(start, end)
 } catch (err) {
 // Fallback: vẽ đường thẳng giữa 2 điểm
 return {
 coordinates: [start, end],
 distance: haversineDistance(start, end),
 duration: 0,
 fallback: true
 }
 }
}

// Khoảng cách Haversine (mét)
function haversineDistance([lat1, lng1], [lat2, lng2]) {
 const R = 6371000 // bán kính trái đất
 const dLat = toRad(lat2 - lat1)
 const dLng = toRad(lng2 - lng1)
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
 return R * c
}

function toRad(deg) {
 return (deg * Math.PI) / 180
}
