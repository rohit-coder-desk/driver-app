import axios from 'axios';

export interface LatLng {
  latitude: number;
  longitude: number;
}

const GOOGLE_MAPS_API_KEY = '';

/**
 * Decodes an encoded Google Maps Polyline string into an array of LatLng points.
 */
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

const lastSuccessRouteCache = new Map<string, LatLng[]>();

function getCacheKey(origin: LatLng, destination: LatLng): string {
  const oLat = (Number(origin.latitude) || 0).toFixed(3);
  const oLng = (Number(origin.longitude) || 0).toFixed(3);
  const dLat = (Number(destination.latitude) || 0).toFixed(3);
  const dLng = (Number(destination.longitude) || 0).toFixed(3);
  return `${oLat},${oLng}->${dLat},${dLng}`;
}

export class RouteService {
  /**
   * Fetches official road navigation polyline points connecting origin to destination.
   * Uses Google Directions API as primary provider, with OSRM mirror failover.
   */
  static async getRoadRoute(
    origin: LatLng,
    destination: LatLng
  ): Promise<LatLng[]> {
    console.log('[DEBUG-NAV] RouteService.getRoadRoute called:', { origin, destination });
    if (
      !origin ||
      !destination ||
      typeof origin.latitude !== 'number' ||
      typeof origin.longitude !== 'number' ||
      typeof destination.latitude !== 'number' ||
      typeof destination.longitude !== 'number' ||
      isNaN(origin.latitude) ||
      isNaN(origin.longitude) ||
      isNaN(destination.latitude) ||
      isNaN(destination.longitude) ||
      (origin.latitude === 0 && origin.longitude === 0) ||
      (destination.latitude === 0 && destination.longitude === 0)
    ) {
      console.warn('[DEBUG-NAV] RouteService: Invalid origin or destination coordinates!', { origin, destination });
      return [];
    }

    const cacheKey = getCacheKey(origin, destination);
    if (lastSuccessRouteCache.has(cacheKey)) {
      const cached = lastSuccessRouteCache.get(cacheKey)!;
      if (cached && cached.length >= 3) {
        console.log(`[DEBUG-NAV] ✅ RouteService cache hit! Returning ${cached.length} road points.`);
        return cached;
      }
    }

    // 1. Primary Provider: Google Directions API (Official Google Navigation Route)
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
        console.log('[DEBUG-NAV] Requesting official Google Directions API route...');
        const response = await axios.get(googleUrl, { timeout: 6000 });

        if (
          response.data &&
          response.data.status === 'OK' &&
          response.data.routes &&
          response.data.routes.length > 0 &&
          response.data.routes[0].overview_polyline &&
          response.data.routes[0].overview_polyline.points
        ) {
          const encodedPolyline = response.data.routes[0].overview_polyline.points;
          const decodedPoints = decodePolyline(encodedPolyline);
          console.log(`[DEBUG-NAV] ✅ Google Directions success! Extracted ${decodedPoints.length} exact road points.`);
          if (decodedPoints.length >= 3) {
            lastSuccessRouteCache.set(cacheKey, decodedPoints);
            return decodedPoints;
          }
        } else {
          console.warn('[DEBUG-NAV] Google Directions returned non-OK status:', response.data?.status || 'EMPTY');
        }
      } catch (googleErr: any) {
        console.warn('[DEBUG-NAV] Google Directions request failed:', googleErr?.message || googleErr);
      }
    }


    // 2. Fallback Provider: OSRM Mirrors (Strict Driving Route)
    const osrmEndpoints = [
      `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&continue_straight=true`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&continue_straight=true`,
    ];

    for (const osrmUrl of osrmEndpoints) {
      try {
        console.log('[DEBUG-NAV] Fetching OSRM fallback from URL:', osrmUrl);
        const response = await axios.get(osrmUrl, { timeout: 6000 });
        if (
          response.data &&
          response.data.routes &&
          response.data.routes.length > 0 &&
          response.data.routes[0].geometry &&
          response.data.routes[0].geometry.coordinates
        ) {
          const coords: [number, number][] = response.data.routes[0].geometry.coordinates;
          const polylinePoints: LatLng[] = coords
            .map(([lng, lat]) => ({
              latitude: Number(lat),
              longitude: Number(lng),
            }))
            .filter(
              (p) =>
                !isNaN(p.latitude) &&
                !isNaN(p.longitude) &&
                !(p.latitude === 0 && p.longitude === 0)
            );

          console.log('[DEBUG-NAV] OSRM success! Polyline points count:', polylinePoints.length);
          if (polylinePoints.length >= 3) {
            lastSuccessRouteCache.set(cacheKey, polylinePoints);
            return polylinePoints;
          }
        }
      } catch (error) {
        console.warn(`[DEBUG-NAV] OSRM Route mirror (${osrmUrl}) warning:`, error);
      }
    }

    // 3. Fallback: If cache has any previous route for this destination, reuse it
    const destLatStr = (Number(destination.latitude) || 0).toFixed(3);
    const destLngStr = (Number(destination.longitude) || 0).toFixed(3);
    for (const [key, cachedPoints] of lastSuccessRouteCache.entries()) {
      if (key.endsWith(`->${destLatStr},${destLngStr}`)) {
        console.log('[DEBUG-NAV] Reusing previous cached route for destination:', key);
        return cachedPoints;
      }
    }

    // 4. Fallback 4: Direct Straight Line
    console.warn('[DEBUG-NAV] Fallback to direct origin-destination line');
    return [
      { latitude: Number(origin.latitude), longitude: Number(origin.longitude) },
      { latitude: Number(destination.latitude), longitude: Number(destination.longitude) },
    ];
  }
}
