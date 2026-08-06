export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  southWest: LatLngPoint;
  northEast: LatLngPoint;
}

export interface ServiceAreaConfig {
  serviceAreaName: string;
  center: LatLngPoint;
  boundary: MapBounds;
  minZoomLevel: number;
  maxZoomLevel: number;
  activeZonesCount?: number;
}
