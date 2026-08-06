import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Platform,
  PermissionsAndroid,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Switch,
  StatusBar,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { ServiceAreaConfig } from '../../types/serviceArea.types';
import { DEFAULT_SERVICE_AREA, clampRegionToBounds, isRegionOutOfBounds } from '../../utils/mapBoundaryUtils';
import { DriverService } from '../../services/DriverService';
import { OrderService, OrderData, OrderOfferData } from '../../services/OrderService';
import { RouteService, LatLng } from '../../services/RouteService';
import { OrderRequestModal } from '../../components/orders/OrderRequestModal';
import { PaymentConfirmationModal } from '../../components/orders/PaymentConfirmationModal';
import { CustomerReviewModal } from '../../components/orders/CustomerReviewModal';
import { ActiveOrderCard } from '../../components/orders/ActiveOrderCard';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';
import { HomeIcon, ProfileIcon, EditIcon, OrdersIcon, DocumentsIcon, SupportIcon, EarningsIcon, LogoutIcon, LockShieldIcon, OfflineSignalIcon } from '../../components/common/Icons';
import { CustomDriverModal, DriverModalType } from '../../components/common/CustomDriverModal';
import { API_BASE_URL } from '../../config/env';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const GLOBAL_ROUTE_CACHE: Record<string, LatLng[]> = {};

export const HomeScreen = () => {
  const { driver, logout, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);
  const [onlineSeconds, setOnlineSeconds] = useState(0);

  // Order & Offer state
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<OrderOfferData | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [completedOrderForReview, setCompletedOrderForReview] = useState<OrderData | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const lastPromptedExpiryRef = useRef<string | null>(null);
  const shownSessionWarningStagesRef = useRef<Set<string>>(new Set());

  // Workflow Dialog Modal State
  const [driverModalConfig, setDriverModalConfig] = useState<{
    visible: boolean;
    type: DriverModalType;
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryAction?: () => void;
    secondaryButtonText?: string;
    onSecondaryAction?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDriverModal = (
    type: DriverModalType,
    title: string,
    message: string,
    primaryButtonText = 'OK',
    onPrimaryAction?: () => void,
    secondaryButtonText?: string,
    onSecondaryAction?: () => void
  ) => {
    setDriverModalConfig({
      visible: true,
      type,
      title,
      message,
      primaryButtonText,
      onPrimaryAction: () => {
        setDriverModalConfig((prev) => ({ ...prev, visible: false }));
        if (onPrimaryAction) onPrimaryAction();
      },
      secondaryButtonText,
      onSecondaryAction: onSecondaryAction
        ? () => {
          setDriverModalConfig((prev) => ({ ...prev, visible: false }));
          onSecondaryAction();
        }
        : undefined,
    });
  };

  // Default map center: Sector 83, Mohali, Punjab, India (WorldTech Square)
  const MOHALI_COORDS = {
    latitude: 30.6726,
    longitude: 76.7410,
  };

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviceArea, setServiceArea] = useState<ServiceAreaConfig>(DEFAULT_SERVICE_AREA);
  const isClampingRef = useRef<boolean>(false);

  const [region, setRegion] = useState({
    latitude: MOHALI_COORDS.latitude,
    longitude: MOHALI_COORDS.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  const mapRef = useRef<MapView | null>(null);
  // Animated Value for custom Drawer
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setShouldRenderDrawer(true);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Toggle Side Drawer Animation
  useEffect(() => {
    if (drawerOpen) {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (shouldRenderDrawer) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRenderDrawer(false);
        }
      });
    }
  }, [drawerOpen]);

  // Online ticking stopwatch logic
  useEffect(() => {
    let intervalId: any;
    if (isOnline) {
      setOnlineSeconds(0);
      intervalId = setInterval(() => {
        setOnlineSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setOnlineSeconds(0);
    }
    return () => clearInterval(intervalId);
  }, [isOnline]);

  // Keep isOnline & activeOrder refs updated to avoid stale closure issues in AppState listener
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const activeOrderRef = useRef(activeOrder);
  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  const isTogglingOfflineRef = useRef(false);

  // Automatically update driver status to Offline when app moves to background/inactive (unless handling an active delivery)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        (nextAppState === 'background' || nextAppState === 'inactive') &&
        isOnlineRef.current &&
        !activeOrderRef.current &&
        !isTogglingOfflineRef.current
      ) {
        isTogglingOfflineRef.current = true;
        try {
          // Immediately update local state to stop location watching & order polling
          setIsOnline(false);
          await DriverService.updateStatus('offline');
          await refreshProfile().catch(() => { });
        } catch (error) {
          console.warn('Auto offline on app background failed:', error);
        } finally {
          isTogglingOfflineRef.current = false;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const formatOnlineTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const hasPromptedLocationSettingsRef = useRef(false);

  const promptEnableLocationServices = () => {
    if (hasPromptedLocationSettingsRef.current) return;
    hasPromptedLocationSettingsRef.current = true;

    Alert.alert(
      'Location / GPS Disabled',
      'Location services are turned off on your device. Please turn on Location / GPS for live driver tracking.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setTimeout(() => {
              hasPromptedLocationSettingsRef.current = false;
            }, 10000);
          },
        },
        {
          text: 'Turn On GPS',
          onPress: () => {
            hasPromptedLocationSettingsRef.current = false;
            if (Platform.OS === 'android') {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
                Linking.openSettings();
              });
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  // Request Location Permissions & Subscribe to GPS tracking
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const fineGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        const coarseGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        if (fineGranted || coarseGranted) {
          return true; // Already granted! Do NOT trigger permission popup
        }
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
    return true; // iOS permissions
  };

  // Wait for live physical device GPS fix to set driver location state
  useEffect(() => {
    console.log('[LOCATION-DEBUG] [DRIVER-PROFILE-LOADED]:', { id: driver?.id, dbLat: driver?.latitude, dbLng: driver?.longitude });
  }, [driver?.id]);

  const syncDriverLocation = async (lat: number, lng: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    let finalLat = lat;
    let finalLng = lng;

    // Detect Android Emulator default Googleplex location (37.42199..., -122.084...)
    if (Math.abs(lat - 37.42199) < 0.05 && Math.abs(lng - (-122.084)) < 0.05) {
      finalLat = MOHALI_COORDS.latitude;
      finalLng = MOHALI_COORDS.longitude;
    }

    console.log(`[LOCATION-DEBUG] [GPS-SYNC-SUCCESS] Device Lat: ${finalLat}, Lng: ${finalLng}`);
    const nextLoc = { latitude: finalLat, longitude: finalLng };
    setLocation(nextLoc);

    try {
      await DriverService.updateLocation(finalLat, finalLng);
    } catch (e) {
      console.warn('Failed to sync location to backend database:', e);
    }
  };

  const centerMapOnDriver = () => {
    let targetLat = location?.latitude || (driver?.latitude ? Number(driver.latitude) : MOHALI_COORDS.latitude);
    let targetLng = location?.longitude || (driver?.longitude ? Number(driver.longitude) : MOHALI_COORDS.longitude);

    if (Math.abs(targetLat - 37.42199) < 0.05 && Math.abs(targetLng - (-122.084)) < 0.05) {
      targetLat = MOHALI_COORDS.latitude;
      targetLng = MOHALI_COORDS.longitude;
    }

    setLocation({ latitude: targetLat, longitude: targetLng });
    setRegion({
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.009,
    });

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: targetLat,
        longitude: targetLng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.009,
      }, 1000);
    }
  };

  useEffect(() => {
    let watchId: number;
    let pollIntervalId: any;

    const startTracking = async () => {
      const hasPermission = await requestLocationPermission();
      const isLinked = !!Geolocation && typeof Geolocation.getCurrentPosition === 'function';

      if (hasPermission && isLinked) {
        // Immediate GPS acquisition (forces fresh physical device GPS lock)
        Geolocation.getCurrentPosition(
          (position: any) => {
            if (position?.coords) {
              const { latitude, longitude } = position.coords;
              if (latitude && longitude) {
                syncDriverLocation(latitude, longitude);
              }
            }
          },
          (error: any) => {
            console.warn('Geolocation initial lock waiting for device GPS fix:', error);
            if (error?.code === 2 || error?.message?.includes('disabled')) {
              promptEnableLocationServices();
            }
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        // Continuous high-accuracy GPS watch stream for smooth real-time tracking
        try {
          watchId = Geolocation.watchPosition(
            (position: any) => {
              if (position?.coords) {
                const { latitude, longitude } = position.coords;
                if (latitude && longitude) {
                  syncDriverLocation(latitude, longitude);
                }
              }
            },
            (error: any) => {
              console.log('Location watch error:', error);
              if (error?.code === 2 || error?.message?.includes('disabled')) {
                promptEnableLocationServices();
              }
            },
            {
              enableHighAccuracy: true,
              distanceFilter: 3, // Real-time smooth updates on 3 meters movement
              interval: 3000,
              fastestInterval: 1500
            }
          );
        } catch (err) {
          console.warn('watchPosition failed:', err);
        }

        // Active background sync while online (polls every 5s if stationary)
        if (isOnline) {
          pollIntervalId = setInterval(() => {
            Geolocation.getCurrentPosition(
              (pos: any) => {
                if (pos?.coords) {
                  syncDriverLocation(pos.coords.latitude, pos.coords.longitude);
                }
              },
              (err: any) => {
                if (err?.code === 2 || err?.message?.includes('disabled')) {
                  promptEnableLocationServices();
                }
              },
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
          }, 5000);
        }
      }
    };

    startTracking();

    return () => {
      if (watchId !== undefined && Geolocation && Geolocation.clearWatch) {
        Geolocation.clearWatch(watchId);
      }
      if (pollIntervalId !== undefined) {
        clearInterval(pollIntervalId);
      }
    };
  }, [isOnline]);

  // Persistent global route cache across screen navigation transitions & unmounts
  const routeCacheRef = useRef<Record<string, LatLng[]>>(GLOBAL_ROUTE_CACHE);

  // Active order recovery on mount & driver change
  const checkActiveOrder = async () => {
    if (!driver) return;
    try {
      const active = await OrderService.getActiveOrderForDriver(driver.id);
      if (active) {
        setActiveOrder(active);
        const isPickedUp = active.status === 'picked_up' || active.status === 'near_destination';
        const targetLoc = isPickedUp ? active.dropoff : active.pickup;
        if (targetLoc?.lat && targetLoc?.lng && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: targetLoc.lat,
            longitude: targetLoc.lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.012,
          }, 1000);
        }
      } else {
        setActiveOrder(null);
        setRouteCoordinates([]);
      }
    } catch (err) {
      console.warn('Check active order failed:', err);
    }
  };

  useEffect(() => {
    if (driver) {
      checkActiveOrder();
    }
  }, [driver]);

  const isFocused = useIsFocused();

  // Re-check active order status when HomeScreen comes back into focus
  useEffect(() => {
    if (isFocused && driver) {
      checkActiveOrder();
    }
  }, [isFocused]);

  // Fetch and update actual road navigation route whenever driver moves or target changes
  useEffect(() => {
    let isMounted = true;

    if (!activeOrder) {
      setRouteCoordinates([]);
      return;
    }

    const isPickedUp = activeOrder.status === 'picked_up' || activeOrder.status === 'near_destination';
    const targetLat = activeOrder ? (isPickedUp ? activeOrder.dropoff?.lat : activeOrder.pickup?.lat) : null;
    const targetLng = activeOrder ? (isPickedUp ? activeOrder.dropoff?.lng : activeOrder.pickup?.lng) : null;

    if (!targetLat || !targetLng) {
      setRouteCoordinates([]);
      return;
    }

    const targetKey = `${activeOrder.id}_${isPickedUp ? 'dropoff' : 'pickup'}`;

    console.log('[ROUTE-EFFECT-DEBUG]', {
      isFocused,
      activeOrderId: activeOrder.id,
      targetKey,
      cachedLen: GLOBAL_ROUTE_CACHE[targetKey]?.length,
      hasLocation: !!location,
    });

    // Immediately restore detailed route from persistent cache if available
    if (GLOBAL_ROUTE_CACHE[targetKey] && GLOBAL_ROUTE_CACHE[targetKey].length >= 3) {
      setRouteCoordinates(GLOBAL_ROUTE_CACHE[targetKey]);
    }

    if (!location) {
      console.warn('[DEBUG-NAV] Route useEffect: location is missing/null!');
      return;
    }

    const origin: LatLng = { latitude: location.latitude, longitude: location.longitude };
    const destination: LatLng = { latitude: Number(targetLat), longitude: Number(targetLng) };

    console.log('[DEBUG-NAV] Calling RouteService.getRoadRoute with:', { origin, destination });

    RouteService.getRoadRoute(origin, destination)
      .then((coords) => {
        console.log('[DEBUG-NAV] RouteService returned coords length:', coords ? coords.length : 0);
        if (isMounted && coords && coords.length >= 2) {
          if (coords.length >= 3) {
            GLOBAL_ROUTE_CACHE[targetKey] = coords;
            routeCacheRef.current[targetKey] = coords;
            setRouteCoordinates(coords);
          } else {
            // Received 2-point fallback (straight line)
            // ONLY set state if we don't already have detailed points in cache or state
            if (!GLOBAL_ROUTE_CACHE[targetKey] || GLOBAL_ROUTE_CACHE[targetKey].length < 3) {
              setRouteCoordinates(coords);
            } else {
              console.log('[DEBUG-NAV] Preserving cached detailed route, ignoring 2-point straight line fallback.');
              setRouteCoordinates(GLOBAL_ROUTE_CACHE[targetKey]);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('[DEBUG-NAV] Failed to fetch road route:', err);
        if (GLOBAL_ROUTE_CACHE[targetKey] && GLOBAL_ROUTE_CACHE[targetKey].length >= 3) {
          setRouteCoordinates(GLOBAL_ROUTE_CACHE[targetKey]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    isFocused,
    location?.latitude,
    location?.longitude,
    activeOrder?.id,
    activeOrder?.status,
    activeOrder?.pickup?.lat,
    activeOrder?.pickup?.lng,
    activeOrder?.dropoff?.lat,
    activeOrder?.dropoff?.lng,
  ]);

  // Fit camera bounds when active order status or target changes
  useEffect(() => {
    if (mapRef.current && activeOrder && location) {
      const isPickedUp = activeOrder.status === 'picked_up' || activeOrder.status === 'near_destination';
      const targetLat = isPickedUp ? activeOrder.dropoff?.lat : activeOrder.pickup?.lat;
      const targetLng = isPickedUp ? activeOrder.dropoff?.lng : activeOrder.pickup?.lng;

      if (targetLat && targetLng) {
        const latDiff = Math.abs(location.latitude - Number(targetLat));
        const lngDiff = Math.abs(location.longitude - Number(targetLng));

        // If driver and target are virtually at the same coordinates (0 to 100 meters),
        // use animateToRegion with a comfortable default view delta to prevent 0-bounds extreme zoom bug.
        if (latDiff < 0.001 && lngDiff < 0.001) {
          mapRef.current.animateToRegion(
            {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.009,
            },
            1000
          );
        } else {
          mapRef.current.fitToCoordinates(
            [
              { latitude: location.latitude, longitude: location.longitude },
              { latitude: Number(targetLat), longitude: Number(targetLng) },
            ],
            {
              edgePadding: { top: 140, right: 60, bottom: 280, left: 60 },
              animated: true,
            }
          );
        }
      }
    }
  }, [activeOrder?.status, activeOrder?.id]);

  // Offer polling when driver is online and has no active order
  useEffect(() => {
    let offerInterval: any;

    if (isOnline && !activeOrder && !incomingOffer) {
      const fetchOffers = async () => {
        try {
          const offers = await OrderService.getDriverOffers();
          if (offers && offers.length > 0) {
            const latestOffer = offers[0];
            setIncomingOffer(latestOffer);
            setOfferModalVisible(true);
          }
        } catch (err) {
          console.warn('Error fetching driver offers:', err);
        }
      };

      fetchOffers();
      offerInterval = setInterval(fetchOffers, 4000);
    }

    return () => {
      if (offerInterval) clearInterval(offerInterval);
    };
  }, [isOnline, activeOrder, incomingOffer]);

  const handleAcceptOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    console.log('[DEBUG-NAV] handleAcceptOffer triggered for offer:', offer);
    try {
      await OrderService.acceptOffer(offer.id);
      setOfferModalVisible(false);
      setIncomingOffer(null);

      const orderData = offer.order;
      console.log('[DEBUG-NAV] Accept offer raw orderData:', {
        id: orderData?.id,
        pickup: orderData?.pickup,
        dropoff: orderData?.dropoff,
      });

      setActiveOrder({ ...orderData, status: 'assigned' });

      showDriverModal('order_accepted', 'Order Accepted!', 'Proceeding to pickup location.', "Let's Go");
    } catch (err: any) {
      showDriverModal('error', 'Accept Failed', err.toString() || 'Offer is no longer available.');
      setOfferModalVisible(false);
      setIncomingOffer(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    try {
      await OrderService.rejectOffer(offer.id);
    } catch (err: any) {
      console.warn('Reject offer error:', err);
    } finally {
      setOfferModalVisible(false);
      setIncomingOffer(null);
      setReviewModalVisible(false);
      setCompletedOrderForReview(null);
      setActionLoading(false);
    }
  };

  const handleReachedPickup = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'arrived');
      setActiveOrder((prev) => prev ? { ...prev, status: 'arrived' } : null);
      showDriverModal('arrived_pickup', 'Reached Pickup!', 'You have arrived at the pickup location.', 'Got It');
    } catch (err: any) {
      showDriverModal('error', 'Status Update Failed', err.toString() || 'Could not update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'picked_up');
      const updated = { ...activeOrder, status: 'picked_up' };
      setActiveOrder(updated);

      if (updated.dropoff?.lat && updated.dropoff?.lng && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: updated.dropoff.lat,
          longitude: updated.dropoff.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.012,
        }, 1000);
      }
      showDriverModal('picked_up', 'Pickup Confirmed!', 'Heading to delivery destination.', 'Start Delivery');
    } catch (err: any) {
      showDriverModal('error', 'Status Update Failed', err.toString() || 'Could not update pickup status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReachedDestination = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'near_destination');
      setActiveOrder((prev) => prev ? { ...prev, status: 'near_destination' } : null);
      showDriverModal('near_destination', 'Near Destination!', 'You have arrived near the customer delivery location.', 'Understood');
    } catch (err: any) {
      showDriverModal('error', 'Status Update Failed', err.toString() || 'Could not update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const handleConfirmDeliveryWithPayment = async (paymentMethod: string) => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'completed', paymentMethod);
      setPaymentModalVisible(false);
      setCompletedOrderForReview(activeOrder);
      setActiveOrder(null);
      setReviewModalVisible(true);
    } catch (err: any) {
      showDriverModal('error', 'Delivery Update Failed', err.toString() || 'Could not complete delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (rating: number, reviewText: string) => {
    if (!completedOrderForReview) {
      setReviewModalVisible(false);
      showDriverModal('delivered', 'Delivery Completed! 🎉', 'You are back online and waiting for new offers.', 'Awesome');
      return;
    }
    setReviewLoading(true);
    try {
      await OrderService.rateCustomer(completedOrderForReview.id, rating, reviewText);
    } catch (err) {
      console.warn('Failed to submit customer review:', err);
    } finally {
      setReviewLoading(false);
      setReviewModalVisible(false);
      setCompletedOrderForReview(null);
      showDriverModal('delivered', 'Delivery Completed! 🎉', 'Thank you for rating the customer. You are back online.', 'Done');
    }
  };

  const handleReviewSkip = () => {
    setReviewModalVisible(false);
    setCompletedOrderForReview(null);
    showDriverModal('delivered', 'Delivery Completed! 🎉', 'You are back online and waiting for new offers.', 'Awesome');
  };

  // Fetch Dynamic Service Area Boundary from Backend
  useEffect(() => {
    let isMounted = true;
    const fetchServiceAreaConfig = async () => {
      if (driver?.serviceArea) {
        setServiceArea(driver.serviceArea);
      }
      try {
        const areaConfig = await DriverService.getServiceArea();
        if (isMounted && areaConfig && areaConfig.boundary) {
          setServiceArea(areaConfig);
        }
      } catch (err) {
        console.warn('Could not fetch dynamic service area boundary:', err);
      }
    };
    fetchServiceAreaConfig();
    return () => {
      isMounted = false;
    };
  }, [driver?.id]);

  // Handle map region change and enforce camera boundaries & zoom restrictions
  const handleRegionChangeComplete = (newRegion: Region) => {
    if (isClampingRef.current) return;
    if (!serviceArea || !serviceArea.boundary) return;

    const { targetRegion, isClamped } = clampRegionToBounds(newRegion, serviceArea.boundary);

    if (isClamped && mapRef.current) {
      isClampingRef.current = true;
      mapRef.current.animateToRegion(targetRegion, 300);
      setTimeout(() => {
        isClampingRef.current = false;
      }, 350);
    }
  };

  // Sync profile details on mount & handle in-app expiry notifications
  useEffect(() => {
    const syncProfile = async () => {
      try {
        await refreshProfile();
      } catch (e) {
        console.warn('Sync profile failed:', e);
      }
    };
    syncProfile();
  }, []);

  // Show in-app modal notification when warning or blocking conditions exist
  useEffect(() => {
    if (!driver) return;
    const expiryInfo = driver.docExpiryInfo;

    // 1. Expired / Blocking condition: ALWAYS display blocking modal regardless of previous warning state
    if (expiryInfo?.hasExpiredDocs || (expiryInfo && !expiryInfo.canGoOnline)) {
      const expiredDoc = expiryInfo?.expiredDocuments?.[0] || expiryInfo?.rejectedDocuments?.[0];
      const targetDocKey = expiredDoc?.key || 'rc';
      const promptKey = `expired_${driver.id}_${driver.authorizationStatus}_${expiryInfo.onlineBlockReason}`;

      if (lastPromptedExpiryRef.current !== promptKey) {
        lastPromptedExpiryRef.current = promptKey;
        showDriverModal(
          'warning',
          'Account Restriction',
          expiryInfo.onlineBlockReason || driver.onlineBlockReason || 'Your document has expired. Please upload a renewed document.',
          'Upload Document',
          () => navigation.navigate(ROUTES.DOCUMENTS, { targetDocKey }),
          'Close'
        );
      }
    } 
    // 2. Warning condition: Display warning modal ONLY IF this stage has NOT been shown in current app session
    else if (expiryInfo?.warningBanner || driver.warningBanner) {
      const warningDoc = expiryInfo?.warningDocuments?.[0];
      const targetDocKey = warningDoc?.key || 'insurance';
      const stage = warningDoc?.warningStage || `${warningDoc?.daysRemaining}_days`;
      const sessionStageKey = `${targetDocKey}_${stage}`;

      const promptKey = `warn_${driver.id}_${sessionStageKey}`;

      if (!shownSessionWarningStagesRef.current.has(sessionStageKey) && lastPromptedExpiryRef.current !== promptKey) {
        shownSessionWarningStagesRef.current.add(sessionStageKey);
        lastPromptedExpiryRef.current = promptKey;

        showDriverModal(
          'info',
          'Document Expiry Warning',
          driver.warningBanner || expiryInfo?.warningBanner || 'Your document will expire soon. Please renew it to avoid account restrictions.',
          'Update Now',
          () => navigation.navigate(ROUTES.DOCUMENTS, { targetDocKey }),
          'Dismiss'
        );
      }
    } 
    // 3. Document renewed or approved: Clear session warning state
    else {
      shownSessionWarningStagesRef.current.clear();
      lastPromptedExpiryRef.current = null;
    }
  }, [driver?.id, driver?.authorizationStatus, driver?.docExpiryInfo, driver?.warningBanner, driver?.onlineBlockReason]);

  // Update Online Status
  useEffect(() => {
    if (driver) {
      setIsOnline(driver.status === 'online');
    }
  }, [driver]);

  const handleToggleOnline = async (value: boolean) => {
    if (!driver) return;

    if (!value && activeOrder) {
      showDriverModal(
        'warning',
        'Active Delivery in Progress',
        'You are currently handling an active delivery. Complete the current order before going offline.',

        'Got it'
      );
      return;
    }

    setLoading(true);
    try {
      if (value) {
        // Refresh profile state from backend directly to ensure we have the absolute latest approval & document expiry status
        const updatedProfile = await refreshProfile();
        const expiryInfo = updatedProfile?.docExpiryInfo || driver.docExpiryInfo;
        const canGoOnline = updatedProfile?.canGoOnline ?? expiryInfo?.canGoOnline ?? (updatedProfile?.authorizationStatus === 'approved');

        if (!canGoOnline) {
          const blockMessage = updatedProfile?.onlineBlockReason || expiryInfo?.onlineBlockReason || 'Your documents must be approved and not expired before you can go online.';
          showDriverModal(
            'warning',
            'Account Restriction',
            blockMessage,
            'Upload Document',
            () => navigation.navigate(ROUTES.DOCUMENTS),
            'Close'
          );
          setIsOnline(false);
          return;
        }

        // Location permission check before going online
        const hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          showDriverModal(
            'location_required',
            'Location Access Required',
            'Location permission is required for live tracking and receiving ride offers. Please enable location access to go online.',
            'Enable Location',
            () => {
              if (Platform.OS === 'android') {
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
                  Linking.openSettings();
                });
              } else {
                Linking.openSettings();
              }
            },
            'Cancel'
          );
          setIsOnline(false);
          return;
        }
      }

      const nextStatus = value ? 'online' : 'offline';
      await DriverService.updateStatus(nextStatus);
      const updatedProfile = await refreshProfile();
      setIsOnline(value);

      // Auto-center map on driver's real coordinates when going online
      if (value) {
        let lat = location?.latitude || (updatedProfile?.latitude ? Number(updatedProfile.latitude) : MOHALI_COORDS.latitude);
        let lng = location?.longitude || (updatedProfile?.longitude ? Number(updatedProfile.longitude) : MOHALI_COORDS.longitude);

        if (Math.abs(lat - 37.42199) < 0.05 && Math.abs(lng - (-122.084)) < 0.05) {
          lat = MOHALI_COORDS.latitude;
          lng = MOHALI_COORDS.longitude;
        }

        setLocation({ latitude: lat, longitude: lng });
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.009,
        });

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.012,
            longitudeDelta: 0.009,
          }, 500);
        }
      }
    } catch (err: any) {
      showDriverModal('error', 'Status Change Failed', err.toString() || 'Something went wrong.');
      setIsOnline(!value);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    if (activeOrder) {
      showDriverModal(
        'warning',
        'Active Delivery in Progress',
        'You are currently handling an active delivery. Complete the current order before logging out.',
        'Got it'
      );
      return;
    }
    logout();
  };

  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/');
    return `${API_BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const navigationRef = useRef<any>(null);
  const navigation = useNavigation<any>();
  navigationRef.current = navigation;

  // Render document upload missing notice if authorizationStatus is not approved
  const isProfileIncomplete =
    driver?.authorizationStatus !== 'approved' &&
    (!driver?.drivingLicencePhoto || !driver?.rcPhoto || !driver?.insurancePhoto || !driver?.avatarPhoto);

  const isApprovedAndReady = driver?.authorizationStatus === 'approved';
  console.log(`[STEP-15] [HOME SCREEN RENDER] authStatus="${driver?.authorizationStatus}", isApprovedAndReady=${isApprovedAndReady}`);

  return (
    <View style={[styles.container, !isApprovedAndReady && { backgroundColor: '#061A3A' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Loader visible={loading} message="Processing..." />

      {/* Full Screen Google Map (Active only when Driver is Approved by Admin AND Online) */}
      {isApprovedAndReady ? (
        isOnline ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            showsMyLocationButton={false}
            minZoomLevel={serviceArea.minZoomLevel || 11}
            maxZoomLevel={serviceArea.maxZoomLevel || 20}
            {...(serviceArea.boundary
              ? ({
                  cameraBoundary: {
                    southWest: serviceArea.boundary.southWest,
                    northEast: serviceArea.boundary.northEast,
                  },
                } as any)
              : {})}
            onRegionChangeComplete={handleRegionChangeComplete}
          >


            {location && (
              <Marker
                coordinate={location}
                title={driver?.name || 'Driver'}
                description="Online - Active"
                zIndex={99}
              >
                <View style={styles.driverMarkerContainer}>
                  <View style={styles.driverMarkerPulse} />
                  <View style={styles.driverMarkerBadge}>
                    <Text style={styles.driverMarkerEmoji}>🚘</Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* Active Order Pickup & Delivery Markers + Route Polyline */}
            {activeOrder && (() => {
              const pLat = Number(activeOrder.pickup?.lat || 0);
              const pLng = Number(activeOrder.pickup?.lng || 0);
              const dLat = Number(activeOrder.dropoff?.lat || 0);
              const dLng = Number(activeOrder.dropoff?.lng || 0);

              const isPickedUp = activeOrder.status === 'picked_up' || activeOrder.status === 'near_destination';
              const targetLat = Number(isPickedUp ? dLat : pLat);
              const targetLng = Number(isPickedUp ? dLng : pLng);
              const startLoc = location || (driver?.latitude && driver?.longitude ? { latitude: Number(driver.latitude), longitude: Number(driver.longitude) } : MOHALI_COORDS);

              const targetKey = `${activeOrder.id}_${isPickedUp ? 'dropoff' : 'pickup'}`;
              const cachedRoute = routeCacheRef.current[targetKey] || GLOBAL_ROUTE_CACHE[targetKey];

              const polylinePoints = (targetLat !== 0 && targetLng !== 0 && routeCoordinates.length >= 3)
                ? routeCoordinates
                : (targetLat !== 0 && targetLng !== 0 && cachedRoute && cachedRoute.length >= 3)
                  ? cachedRoute
                  : (targetLat !== 0 && targetLng !== 0 && routeCoordinates.length === 2)
                    ? routeCoordinates
                    : (targetLat !== 0 && targetLng !== 0)
                      ? [
                        { latitude: startLoc.latitude, longitude: startLoc.longitude },
                        { latitude: targetLat, longitude: targetLng }
                      ]
                      : [];

              return (
                <>
                  {/* Pickup Marker */}
                  {pLat !== 0 && pLng !== 0 && (
                    <Marker
                      coordinate={{ latitude: pLat, longitude: pLng }}
                      title="Pickup Location"
                      description={activeOrder.pickup?.address || 'Pickup'}
                      zIndex={999}
                    >
                      <View style={styles.pickupMarkerBadge}>
                        <Text style={styles.markerBadgeEmoji}>🏪</Text>
                      </View>
                    </Marker>
                  )}

                  {/* Delivery Marker */}
                  {dLat !== 0 && dLng !== 0 && (
                    <Marker
                      coordinate={{ latitude: dLat, longitude: dLng }}
                      title="Delivery Location"
                      description={activeOrder.dropoff?.address || 'Delivery'}
                      zIndex={999}
                    >
                      <View style={styles.deliveryMarkerBadge}>
                        <Text style={styles.markerBadgeEmoji}>🏁</Text>
                      </View>
                    </Marker>
                  )}

                  {/* Polyline */}
                  {polylinePoints.length >= 2 && (
                    <Polyline
                      key={`poly_${activeOrder.id}_${isPickedUp ? 'dropoff' : 'pickup'}_${polylinePoints.length}`}
                      coordinates={polylinePoints}
                      strokeColor="#2563eb"
                      strokeWidth={7}
                      lineCap="round"
                      lineJoin="round"
                      geodesic={true}
                      zIndex={9999}
                    />
                  )}
                </>
              );
            })()}
          </MapView>
        ) : (
          /* Clean White Offline Screen when Approved Driver is Offline */
          <View style={styles.offlineMapPlaceholder}>
            <View style={styles.offlineGlowCircle}>
              <OfflineSignalIcon size={56} color="#64748B" />
            </View>

            <Text style={styles.offlineTitle}>You're currently offline.</Text>
            <Text style={styles.offlineSubtitle}>
              Turn on your availability to get orders.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.unverifiedMapPlaceholder}>
          <View style={styles.unverifiedGlowCircle}>
            <LockShieldIcon size={46} color="#60A5FA" />
          </View>
          <Text style={styles.unverifiedTitle}>Map Navigation Locked</Text>
          <Text style={styles.unverifiedSubtitle}>
            {driver?.authorizationStatus === 'rejected'
              ? 'Your document submission was rejected. Please upload the requested documents to unlock GPS map navigation.'
              : driver?.authorizationStatus === 'pending' && !isProfileIncomplete
                ? 'Your documents are under review. Map navigation will automatically activate once approved by admin.'
                : 'Complete your profile and upload required documents to unlock GPS map navigation & receive ride offers.'}
          </Text>
        </View>
      )}

      {/* Top Header Card matching reference image */}
      <View style={styles.floatingHeaderCard}>
        {/* Hamburger Menu Trigger */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={openDrawer}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.hamburgerIconText}>☰</Text>
        </TouchableOpacity>

        {/* Driver Name & Phone / Vehicle Plate */}
        <View style={styles.headerInfoCol}>
          <Text style={styles.driverNameTitle} numberOfLines={1}>
            {'Welcome'}
          </Text>

          <Text style={styles.driverNameTitle} numberOfLines={1}>
            {driver?.name || 'Driver'}
          </Text>
          {driver?.phone ? (
            <Text style={styles.driverIdSubtitle} numberOfLines={1}>
              {driver.phone}
            </Text>
          ) : driver?.vehiclePlate ? (
            <Text style={styles.driverIdSubtitle} numberOfLines={1}>
              {driver.vehiclePlate}
            </Text>
          ) : null}
        </View>

        {/* Right Status Pill & Switch Toggle */}
        <View style={styles.headerRightControls}>
          <View style={[styles.headerStatusPill, isOnline ? styles.onlinePillBg : styles.offlinePillBg]}>
            <View style={[styles.headerStatusDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
            <Text style={styles.headerStatusPillText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <Switch
            trackColor={{ false: '#1E3A8A', true: '#0066FF' }}
            thumbColor={isOnline ? '#FFFFFF' : '#94A3B8'}
            ios_backgroundColor="#1E3A8A"
            onValueChange={handleToggleOnline}
            value={isOnline}
          />
        </View>
      </View>

      {/* Floating Expiry Warning Banner (30, 15, 7, 3, 1, 0 days) */}
      {(driver?.warningBanner || driver?.docExpiryInfo?.warningBanner) && (
        <TouchableOpacity
          style={styles.warningBannerContainer}
          onPress={() => {
            const warningDoc = driver?.docExpiryInfo?.warningDocuments?.[0];
            const targetDocKey = warningDoc?.key || 'insurance';
            navigation.navigate(ROUTES.DOCUMENTS, { targetDocKey });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.warningBannerText}>
            {driver?.warningBanner || driver?.docExpiryInfo?.warningBanner}
          </Text>
          <Text style={styles.warningBannerBtnText}>Update Now →</Text>
        </TouchableOpacity>
      )}

      {/* Floating GPS Recenter Button - Only visible when Online */}
      {isOnline && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={centerMapOnDriver}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.gpsTargetIcon}>🎯</Text>
        </TouchableOpacity>
      )}

      {/* Floating Bottom Overlay Card */}
      {activeOrder ? (
        <ActiveOrderCard
          order={activeOrder}
          onReachedPickup={handleReachedPickup}
          onConfirmPickup={handleConfirmPickup}
          onReachedDestination={handleReachedDestination}
          onCompleteDelivery={handleOpenPaymentModal}
          loading={actionLoading}
        />
      ) : (driver?.docExpiryInfo?.hasExpiredDocs || (driver?.docExpiryInfo && !driver.docExpiryInfo.canGoOnline)) ? (
        <TouchableOpacity
          style={styles.rejectedCard}
          onPress={() => navigation.navigate(ROUTES.DOCUMENTS)}
          activeOpacity={0.9}
        >
          <Text style={styles.rejectedTitle}>
            {driver?.docExpiryInfo?.hasExpiredDocs ? '❌ Document Expired' : '⚠️ Verification Required'}
          </Text>
          <Text style={styles.rejectedSubtitle}>
            {driver?.onlineBlockReason || driver?.docExpiryInfo?.onlineBlockReason || 'Your account is restricted. Please upload a valid document.'}
          </Text>
        </TouchableOpacity>
      ) : isProfileIncomplete ? (
        <TouchableOpacity
          style={styles.completeProfileCard}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.9}
        >
          <Text style={styles.completeProfileTitle}>⚠️ Complete Your Profile</Text>
          <Text style={styles.completeProfileSubtitle}>
            Please tap here to upload required vehicle documents (License, RC, Insurance, Photo) for admin review.
          </Text>
        </TouchableOpacity>
      ) : driver?.authorizationStatus === 'pending' ? (
        <View style={styles.submittedCard}>
          <Text style={styles.submittedTitle}>Documents Submitted</Text>
          <Text style={styles.submittedSubtitle}>Waiting for Approval</Text>
        </View>
      ) : driver?.authorizationStatus === 'rejected' ? (
        <TouchableOpacity
          style={styles.rejectedCard}
          onPress={() => navigation.navigate(ROUTES.DOCUMENTS)}
          activeOpacity={0.9}
        >
          <Text style={styles.rejectedTitle}>⚠️ Documents Rejected</Text>
          <Text style={styles.rejectedSubtitle}>
            {(() => {
              const docStatuses = driver?.documentStatuses as Record<string, any> | undefined;
              const rejectedList: string[] = [];
              const docKeys = [
                { key: 'avatarPhoto', label: 'Profile Photo' },
                { key: 'identityCardPhoto', label: 'Aadhaar Front' },
                { key: 'identityCardBackPhoto', label: 'Aadhaar Back' },
                { key: 'drivingLicencePhoto', label: 'License Front' },
                { key: 'drivingLicenceBackPhoto', label: 'License Back' },
                { key: 'rcPhoto', label: 'RC Document' },
                { key: 'insurancePhoto', label: 'Vehicle Insurance' },
                { key: 'vehiclePhoto', label: 'Vehicle Photo' },
              ];
              docKeys.forEach((item) => {
                const raw = docStatuses?.[item.key];
                const st = typeof raw === 'object' ? raw?.status : raw;
                if (st === 'rejected') {
                  rejectedList.push(item.label);
                }
              });
              if (rejectedList.length > 0) {
                return `Rejected: ${rejectedList.join(', ')}. Tap here to re-upload.`;
              }
              return 'Admin rejected your document submission. Tap here to review and re-upload.';
            })()}
          </Text>
        </TouchableOpacity>
      ) : isOnline ? (
        /* When approved and active online, show the status pill */
        <View style={styles.searchPill}>
          {/* <Text style={styles.searchPillIcon}>🔍</Text */}
          <Text style={styles.searchPillText}>Waiting for offers...</Text>
        </View>
      ) : (
        /* When approved and active offline, show the big "Go Online" button at the bottom */
        <TouchableOpacity
          style={styles.bigGoOnlineBtn}
          onPress={() => handleToggleOnline(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.bigGoOnlineText}>Go Online</Text>
        </TouchableOpacity>
      )}

      {/* Incoming Offer Request Modal */}
      <OrderRequestModal
        visible={offerModalVisible}
        offer={incomingOffer}
        onAccept={handleAcceptOffer}
        onReject={handleRejectOffer}
        loading={actionLoading}
      />

      {/* Payment Confirmation Modal for Order Completion */}
      <PaymentConfirmationModal
        visible={paymentModalVisible}
        onConfirm={handleConfirmDeliveryWithPayment}
        onCancel={() => setPaymentModalVisible(false)}
        loading={actionLoading}
      />

      {/* Customer Review Modal post ride completion */}
      <CustomerReviewModal
        visible={reviewModalVisible && Boolean(completedOrderForReview)}
        customerName={completedOrderForReview?.customerName || completedOrderForReview?.dropoff?.contactName}
        onSubmit={handleReviewSubmit}
        onSkip={handleReviewSkip}
        loading={reviewLoading}
      />

      {/* Driver Order Workflow Custom Dialog Modal */}
      <CustomDriverModal
        visible={driverModalConfig.visible}
        type={driverModalConfig.type}
        title={driverModalConfig.title}
        message={driverModalConfig.message}
        primaryButtonText={driverModalConfig.primaryButtonText || 'OK'}
        onPrimaryAction={driverModalConfig.onPrimaryAction}
        secondaryButtonText={driverModalConfig.secondaryButtonText}
        onSecondaryAction={driverModalConfig.onSecondaryAction}
      />


      {/* Backdrop for Custom Side Drawer */}
      {shouldRenderDrawer && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeDrawer}
          />

          {/* Custom Side Drawer Sidebar */}
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerMainContent}>
              {/* Drawer Header - Tapping opens My Profile */}
              <TouchableOpacity
                style={styles.drawerHeader}
                onPress={() => {
                  setDrawerOpen(false);
                  navigation.navigate(ROUTES.MY_PROFILE);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.avatarBorder}>
                  {driver?.avatarPhoto ? (
                    <Image source={{ uri: getFullUrl(driver.avatarPhoto) }} style={styles.drawerAvatar} />
                  ) : (
                    <Text style={styles.avatarInitialsText}>
                      {driver?.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                    </Text>
                  )}
                </View>
                <View style={styles.drawerHeaderDetails}>
                  <View style={styles.drawerNameRow}>
                    <Text style={styles.drawerNameText} numberOfLines={1}>
                      {driver?.name || 'Driver'}
                    </Text>
                  </View>
                  <Text style={styles.drawerPhoneText} numberOfLines={1}>
                    {driver?.phone || driver?.username || 'Driver Portal'}
                  </Text>
                  <View style={styles.drawerStatusBadge}>
                    <View style={[styles.drawerStatusDot, { backgroundColor: isOnline ? '#10b981' : '#64748b' }]} />
                    <Text style={styles.drawerStatusText}>
                      {isOnline ? 'ONLINE • READY' : 'OFFLINE'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Drawer Links */}
              <ScrollView
                style={styles.drawerMenu}
                contentContainerStyle={styles.drawerMenuContent}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={[styles.drawerItem, styles.activeDrawerItem]}
                  onPress={() => setDrawerOpen(false)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.drawerItemText, styles.activeDrawerItemText]}>Home</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.MY_PROFILE);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>My Profile</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.PROFILE);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>Edit Profile</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.MY_ORDERS);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>My Orders</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.DOCUMENTS);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>Documents</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.HELP_SUPPORT);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>Help & Support</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    navigation.navigate(ROUTES.EARNINGS);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.drawerItemText}>Earnings</Text>
                  <Text style={styles.drawerItemChevron}>›</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Drawer Bottom Logout Button - FIXED AT VERY BOTTOM */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 0,
  },
  offlineContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineCenterBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  offlineCircleIllustration: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  wifiIconBadge: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wifiIconEmoji: {
    fontSize: 46,
  },
  wifiCrossBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  wifiCrossText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  youreOfflineText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  offlineDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  bigGoOnlineBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  bigGoOnlineText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingHeaderCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 24) + 8,
    left: 14,
    right: 14,
    backgroundColor: '#0B2246',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  hamburgerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginRight: 12,
  },
  hamburgerIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  headerInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  driverNameTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginVertical: 1,
  },
  driverIdSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    backgroundColor: '#0D2A54',
  },
  onlinePillBg: {
    backgroundColor: '#0D2A54',
    borderColor: '#0066FF',
  },
  offlinePillBg: {
    backgroundColor: '#0D2A54',
    borderColor: '#1E3A8A',
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerStatusPillText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusTextCol: {
    alignItems: 'center',
  },
  onlineStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  statusTimer: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    marginTop: 1,
  },
  offlineTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  offlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  offlineStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 100 : 84,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  gpsTargetIcon: {
    fontSize: 24,
  },
  searchPill: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPillText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  completeProfileCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  completeProfileTitle: {
    color: '#d97706',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  completeProfileSubtitle: {
    color: '#475569',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    lineHeight: 20,
  },
  submittedCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
    alignItems: 'center',
  },
  submittedTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  submittedSubtitle: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  rejectedCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  rejectedTitle: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  rejectedSubtitle: {
    color: '#475569',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    left: -DRAWER_WIDTH,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#08162E',
    zIndex: 100,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
    borderRightWidth: 1,
    borderRightColor: '#16325B',
  },
  drawerMainContent: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: '#08162E',
    paddingTop: Platform.OS === 'ios' ? 56 : Math.max(StatusBar.currentHeight || 0, 24) + 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#0066FF',
    backgroundColor: '#0D2040',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drawerAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  drawerHeaderDetails: {
    flex: 1,
    marginLeft: 16,
  },
  drawerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drawerNameText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  verifiedBadge: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    backgroundColor: '#0D2040',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  drawerPhoneText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  drawerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2040',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#16325B',
  },
  drawerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  drawerStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  drawerMenu: {
    flex: 1,
  },
  drawerMenuContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 6,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 54,
    backgroundColor: 'transparent',
  },
  activeDrawerItem: {
    backgroundColor: '#0F2B5B',
    borderRadius: 14,
  },
  drawerItemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F2447',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16325B',
  },
  activeDrawerItemIconBox: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  drawerItemEmoji: {
    fontSize: 22,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginLeft: 8,
  },
  activeDrawerItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  drawerItemChevron: {
    fontSize: 20,
    color: '#64748B',
  },
  drawerSectionDivider: {
    height: 1,
    backgroundColor: '#16325B',
    marginVertical: 10,
    marginHorizontal: 8,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: '#16325B',
    backgroundColor: '#08162E',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnEmoji: {
    fontSize: 22,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  driverMarkerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  driverMarkerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  driverMarkerEmoji: {
    fontSize: 16,
  },
  pickupMarkerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  deliveryMarkerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerBadgeEmoji: {
    fontSize: 18,
  },
  debugBannerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 115 : 95,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  debugBannerTitle: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  debugBannerText: {
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginVertical: 2,
  },
  unverifiedMapPlaceholder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#061A3A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 140,
    zIndex: 1,
  },
  unverifiedGlowCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(15, 34, 70, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  unverifiedShieldIcon: {
    fontSize: 48,
  },
  unverifiedTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  unverifiedSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  offlineMapPlaceholder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 120,
    zIndex: 1,
  },
  offlineGlowCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  offlineSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  warningBannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginRight: 10,
  },
  warningBannerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#B45309',
    backgroundColor: '#FDE68A',
    borderRadius: 8,
  },
});

export default HomeScreen;
