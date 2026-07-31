import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const LocationService = {
  /**
   * Request location permissions on Android and iOS
   */
  requestLocationPermission: async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Location permission request error:', err);
        return false;
      }
    }
    return true; // iOS permission handled by app config / system prompt
  },

  /**
   * Get current position once
   */
  getCurrentPosition: (): Promise<LatLng> => {
    return new Promise((resolve, reject) => {
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        return reject(new Error('Geolocation service unavailable'));
      }

      Geolocation.getCurrentPosition(
        (position: any) => {
          if (position?.coords) {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          } else {
            reject(new Error('Invalid position coordinates'));
          }
        },
        (error: any) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
      );
    });
  },

  /**
   * Continuous high-accuracy GPS watch position stream
   */
  watchPosition: (
    onSuccess: (coords: LatLng) => void,
    onError?: (error: any) => void
  ): number | null => {
    if (!Geolocation || typeof Geolocation.watchPosition !== 'function') {
      if (onError) onError(new Error('Geolocation watch unavailable'));
      return null;
    }

    try {
      const watchId = Geolocation.watchPosition(
        (position: any) => {
          if (position?.coords) {
            onSuccess({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
        (error: any) => {
          if (onError) onError(error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 3, // Receive updates for movement >= 3 meters
          interval: 3000,
          fastestInterval: 1500,
        }
      );
      return watchId;
    } catch (err) {
      if (onError) onError(err);
      return null;
    }
  },

  /**
   * Stop location watching stream
   */
  clearWatch: (watchId?: number | null): void => {
    if (watchId !== undefined && watchId !== null && Geolocation && typeof Geolocation.clearWatch === 'function') {
      try {
        Geolocation.clearWatch(watchId);
      } catch (err) {
        console.warn('Error clearing location watch:', err);
      }
    }
  },

  /**
   * Calculate distance between two lat/lng coordinates in meters using the Haversine formula
   */
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};

