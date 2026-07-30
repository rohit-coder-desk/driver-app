import axios from 'axios';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export class RouteService {
  /**
   * Fetches actual road polyline points connecting origin to destination.
   * Queries multiple OSRM routing mirrors with automatic failover.
   */
  static async getRoadRoute(
    origin: LatLng,
    destination: LatLng
  ): Promise<LatLng[]> {
    if (!origin || !destination) return [];
    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return [];
    }

    const endpoints = [
      `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
    ];

    for (const osrmUrl of endpoints) {
      try {
        const response = await axios.get(osrmUrl, { timeout: 8000 });
        if (
          response.data &&
          response.data.routes &&
          response.data.routes.length > 0 &&
          response.data.routes[0].geometry &&
          response.data.routes[0].geometry.coordinates
        ) {
          const coords: [number, number][] = response.data.routes[0].geometry.coordinates;
          const polylinePoints: LatLng[] = coords.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }));

          if (polylinePoints.length > 2) {
            return polylinePoints;
          }
        }
      } catch (error) {
        console.warn(`OSRM Route mirror (${osrmUrl}) warning:`, error);
      }
    }

    // Return empty array if road route cannot be fetched so straight line fallbacks are never drawn
    return [];
  }
}
