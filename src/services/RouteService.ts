import axios from 'axios';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export class RouteService {
  /**
   * Fetches actual road polyline points connecting origin to destination.
   * Uses OSRM (Open Source Routing Machine) public driving API.
   */
  static async getRoadRoute(
    origin: LatLng,
    destination: LatLng
  ): Promise<LatLng[]> {
    if (!origin || !destination) return [];
    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return [];
    }

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      
      const response = await axios.get(osrmUrl, { timeout: 6000 });
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

        if (polylinePoints.length > 0) {
          return polylinePoints;
        }
      }
    } catch (error) {
      console.warn('OSRM Route fetch warning, using direct fallback:', error);
    }

    // Graceful fallback: return direct endpoints
    return [
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ];
  }
}
