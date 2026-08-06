import { Region } from 'react-native-maps';
import { MapBounds, ServiceAreaConfig } from '../types/serviceArea.types';

export const DEFAULT_SERVICE_AREA: ServiceAreaConfig = {
  serviceAreaName: 'Mohali / Regional Service Area',
  center: { latitude: 30.6726, longitude: 76.7410 },
  boundary: {
    southWest: { latitude: 30.45, longitude: 76.45 },
    northEast: { latitude: 30.90, longitude: 77.00 },
  },
  minZoomLevel: 11,
  maxZoomLevel: 20,
};

/**
 * Checks if a given map region center or zoom delta is outside permitted bounds.
 */
export const isRegionOutOfBounds = (region: Region, boundary: MapBounds): boolean => {
  if (!region || !boundary || !boundary.southWest || !boundary.northEast) {
    return false;
  }

  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  const { southWest, northEast } = boundary;

  const minLat = Math.min(southWest.latitude, northEast.latitude);
  const maxLat = Math.max(southWest.latitude, northEast.latitude);
  const minLng = Math.min(southWest.longitude, northEast.longitude);
  const maxLng = Math.max(southWest.longitude, northEast.longitude);

  const maxAllowedLatDelta = Math.abs(maxLat - minLat) * 1.05;
  const maxAllowedLngDelta = Math.abs(maxLng - minLng) * 1.05;

  if (latitude < minLat || latitude > maxLat) return true;
  if (longitude < minLng || longitude > maxLng) return true;
  if (latitudeDelta > maxAllowedLatDelta) return true;
  if (longitudeDelta > maxAllowedLngDelta) return true;

  return false;
};

/**
 * Clamps a region's latitude, longitude, and deltas within allowed service area bounds.
 */
export const clampRegionToBounds = (
  region: Region,
  boundary: MapBounds
): { targetRegion: Region; isClamped: boolean } => {
  if (!region || !boundary || !boundary.southWest || !boundary.northEast) {
    return { targetRegion: region, isClamped: false };
  }

  const { southWest, northEast } = boundary;
  const minLat = Math.min(southWest.latitude, northEast.latitude);
  const maxLat = Math.max(southWest.latitude, northEast.latitude);
  const minLng = Math.min(southWest.longitude, northEast.longitude);
  const maxLng = Math.max(southWest.longitude, northEast.longitude);

  const maxAllowedLatDelta = Math.abs(maxLat - minLat) * 1.05;
  const maxAllowedLngDelta = Math.abs(maxLng - minLng) * 1.05;

  const clampedLat = Math.min(Math.max(region.latitude, minLat), maxLat);
  const clampedLng = Math.min(Math.max(region.longitude, minLng), maxLng);

  const clampedLatDelta = Math.min(region.latitudeDelta, maxAllowedLatDelta);
  const clampedLngDelta = Math.min(region.longitudeDelta, maxAllowedLngDelta);

  const LAT_TOLERANCE = 0.0001;
  const LNG_TOLERANCE = 0.0001;
  const DELTA_TOLERANCE = 0.001;

  const isClamped =
    Math.abs(clampedLat - region.latitude) > LAT_TOLERANCE ||
    Math.abs(clampedLng - region.longitude) > LNG_TOLERANCE ||
    Math.abs(clampedLatDelta - region.latitudeDelta) > DELTA_TOLERANCE ||
    Math.abs(clampedLngDelta - region.longitudeDelta) > DELTA_TOLERANCE;

  return {
    targetRegion: {
      latitude: clampedLat,
      longitude: clampedLng,
      latitudeDelta: clampedLatDelta,
      longitudeDelta: clampedLngDelta,
    },
    isClamped,
  };
};
