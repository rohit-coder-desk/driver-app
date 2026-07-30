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
    console.log('[DEBUG-NAV] RouteService.getRoadRoute called with:', { origin, destination });
    if (!origin || !destination) {
      console.warn('[DEBUG-NAV] RouteService: origin or destination missing!');
      return [];
    }
    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      console.warn('[DEBUG-NAV] RouteService: invalid lat/lng numbers!', { origin, destination });
      return [];
    }

    const endpoints = [
      `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
    ];

    for (const osrmUrl of endpoints) {
      try {
        console.log('[DEBUG-NAV] Fetching OSRM from URL:', osrmUrl);
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

          console.log('[DEBUG-NAV] OSRM success! Returned polyline points count:', polylinePoints.length);
          if (polylinePoints.length >= 2) {
            return polylinePoints;
          }
        }
      } catch (error) {
        console.warn(`[DEBUG-NAV] OSRM Route mirror (${osrmUrl}) warning:`, error);
      }
    }

    console.warn('[DEBUG-NAV] OSRM failed/empty. Returning straight-line fallback [origin, destination]');
    return [
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ];
  }
}
